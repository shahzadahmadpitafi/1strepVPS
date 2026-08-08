import { Express, Request, Response } from 'express';
import { SquareClient, SquareEnvironment, SquareError } from 'square';
import crypto from 'crypto';
import { db } from './db';
import { eq, and, lt, sql, inArray } from 'drizzle-orm';
import { eposPendingPayments, pendingWebsiteCheckouts, customerOrders, customerOrderItems, resellers, commissions, products } from '../shared/schema';
import { storage } from './storage';
import { sendOrderConfirmation } from './email-service';
import { emitOrderEvent } from './socketServer';
import { requireAuth, requireReseller } from './middleware/auth';

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

// ─── Bring Your Own Square (BYOS) helpers ─────────────────────────────────────
function encryptOwnSquareToken(plaintext: string): string {
  const masterKey = crypto.scryptSync(process.env.SECRET_KEY || 'fallback-square-enc-key', 'byos-square-salt-v1', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function decryptOwnSquareToken(ciphertext: string): string {
  const masterKey = crypto.scryptSync(process.env.SECRET_KEY || 'fallback-square-enc-key', 'byos-square-salt-v1', 32);
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/** Create a Square client using a reseller's own credentials, or null if not set up */
function makeOwnSquareClient(reseller: any): SquareClient | null {
  if (!reseller.ownSquareAccessTokenEnc || !reseller.ownSquareLocationId) return null;
  try {
    const token = decryptOwnSquareToken(reseller.ownSquareAccessTokenEnc);
    return new SquareClient({ token, environment: SquareEnvironment.Production });
  } catch { return null; }
}

export function registerSquareRoutes(app: Express) {
  app.get('/api/square/config', (req: Request, res: Response) => {
    const applicationId = process.env.SQUARE_APPLICATION_ID;
    const locationId = process.env.SQUARE_LOCATION_ID;
    
    if (!applicationId || !locationId) {
      return res.status(500).json({ 
        error: 'Square not configured',
        configured: false 
      });
    }
    
    res.json({
      applicationId,
      locationId,
      configured: true,
      environment: 'production',
      terminalDeviceId: process.env.SQUARE_TERMINAL_DEVICE_ID || null,
    });
  });

  app.get('/api/square/location', async (req: Request, res: Response) => {
    try {
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square location not configured' });
      }

      const response = await squareClient.locations.get({ locationId });
      
      res.json({
        id: response.location?.id,
        name: response.location?.name,
        country: response.location?.country,
        currency: response.location?.currency,
        capabilities: response.location?.capabilities,
      });
    } catch (error) {
      console.error('Square location error:', error);
      res.status(500).json({ error: 'Failed to get location info' });
    }
  });

  app.post('/api/square/payment', async (req: Request, res: Response) => {
    try {
      const { sourceId, amount, currency = 'GBP', customerEmail, orderId, verificationToken } = req.body;
      
      if (!sourceId || !amount) {
        return res.status(400).json({ error: 'Missing required fields: sourceId, amount' });
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      const idempotencyKey = crypto.randomUUID();
      
      const paymentRequest: any = {
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency,
        },
        locationId,
        autocomplete: true,
      };

      if (customerEmail) {
        paymentRequest.buyerEmailAddress = customerEmail;
      }

      if (orderId) {
        paymentRequest.referenceId = orderId;
      }

      if (verificationToken) {
        paymentRequest.verificationToken = verificationToken;
      }

      const response = await squareClient.payments.create(paymentRequest);
      
      console.log('Square payment created:', response.payment?.id, 'status:', response.payment?.status);
      
      res.json({
        success: true,
        paymentId: response.payment?.id,
        status: response.payment?.status,
        receiptUrl: response.payment?.receiptUrl,
        orderId: response.payment?.orderId,
      });
    } catch (error) {
      console.error('Square payment error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Payment failed',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Payment processing failed' 
      });
    }
  });

  app.post('/api/square/create-checkout', async (req: Request, res: Response) => {
    try {
      const { amount, currency = 'GBP', customerEmail, orderId, lineItems, redirectUrl, discount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Missing required field: amount' });
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      const idempotencyKey = crypto.randomUUID();
      
      const orderLineItems = lineItems && lineItems.length > 0 ? lineItems.map((item: any) => ({
        name: item.name,
        quantity: String(item.quantity || 1),
        basePriceMoney: {
          amount: BigInt(item.basePriceMoney?.amount || Math.round(amount * 100)),
          currency: item.basePriceMoney?.currency || currency,
        },
      })) : [{
        name: '1stRep Order',
        quantity: '1',
        basePriceMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency,
        },
      }];

      // Apply discount as a negative line item (Square Payment Links supports this better)
      if (discount && discount.amount > 0) {
        const discountAmountPence = Math.round(discount.amount * 100);
        
        // Distribute the discount proportionally across all product line items
        // This is more reliable than using Square's discount API for payment links
        const productItems = orderLineItems.filter((item: any) => item.name !== 'Shipping');
        const totalProductValue = productItems.reduce((sum: number, item: any) => {
          return sum + (Number(item.basePriceMoney.amount) * Number(item.quantity));
        }, 0);
        
        if (totalProductValue > 0 && discountAmountPence <= totalProductValue) {
          // Apply discount proportionally to each product
          let remainingDiscount = discountAmountPence;
          
          for (let i = 0; i < productItems.length; i++) {
            const item = productItems[i];
            const itemTotal = Number(item.basePriceMoney.amount) * Number(item.quantity);
            const itemProportion = itemTotal / totalProductValue;
            
            // For last item, use remaining discount to avoid rounding issues
            const itemDiscount = (i === productItems.length - 1) 
              ? remainingDiscount 
              : Math.round(discountAmountPence * itemProportion);
            
            remainingDiscount -= itemDiscount;
            
            // Reduce the base price by the proportional discount
            const discountPerUnit = Math.round(itemDiscount / Number(item.quantity));
            const newPrice = Math.max(0, Number(item.basePriceMoney.amount) - discountPerUnit);
            item.basePriceMoney.amount = BigInt(newPrice);
            
            // Append discount info to item name
            item.name = `${item.name} (${discount.name || 'Discount'} applied)`;
          }
          
          console.log(`Applied discount to Square line items: ${discount.name} - £${discount.amount}`);
        } else {
          console.log(`Cannot apply discount - discount £${discount.amount} exceeds product total £${totalProductValue/100}`);
        }
      }
      
      // Build order object
      const orderObject: any = {
        locationId,
        lineItems: orderLineItems,
        referenceId: orderId || undefined,
      };

      const orderResponse = await squareClient.orders.create({
        idempotencyKey: crypto.randomUUID(),
        order: orderObject,
      });

      if (!orderResponse.order?.id) {
        throw new Error('Failed to create Square order');
      }

      const checkoutOptions: any = {
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: false,
          afterpayClearpay: false,
        },
        askForShippingAddress: false,
      };

      if (redirectUrl) {
        checkoutOptions.redirectUrl = redirectUrl;
      }

      if (customerEmail) {
        checkoutOptions.prePopulateBuyerEmail = customerEmail;
      }

      const checkoutResponse = await squareClient.checkout.paymentLinks.create({
        idempotencyKey,
        order: orderObject,
        checkoutOptions,
      });

      const paymentLinkId = checkoutResponse.paymentLink?.id;
      const squareOrderId = checkoutResponse.paymentLink?.orderId;
      console.log('Square checkout link created:', paymentLinkId);

      // ── Ghost-payment prevention ──────────────────────────────────────────
      // Persist the full order data server-side BEFORE the browser navigates
      // away to Square. If the browser crashes, is closed, or the user pays on
      // a different device we can still reconstruct the order on return.
      // Uses Drizzle ORM insert to avoid raw-SQL jsonb cast incompatibilities
      // with the Neon serverless driver.
      const { customerInfo, cartItems, subtotal, shipping, total, coupon, termsAcceptedAt, userId } = req.body;
      if (paymentLinkId && customerInfo && cartItems) {
        try {
          await db.insert(pendingWebsiteCheckouts).values({
            paymentLinkId,
            squareOrderId: squareOrderId ?? null,
            customerInfo: customerInfo as any,
            cartItems: cartItems as any,
            subtotal: subtotal != null ? String(subtotal) : null,
            shipping: shipping != null ? String(shipping) : null,
            total: total != null ? String(total) : null,
            coupon: coupon ?? null,
            termsAcceptedAt: termsAcceptedAt ?? null,
            userId: userId ?? null,
            status: 'pending',
          }).onConflictDoNothing();
          console.log(`💾 Website checkout saved server-side: ${paymentLinkId}`);
        } catch (saveErr) {
          // Non-fatal — log but don't block the checkout redirect
          console.error('Could not save pending website checkout to DB:', saveErr);
        }
      }

      res.json({
        success: true,
        checkoutUrl: checkoutResponse.paymentLink?.url,
        paymentLinkId,
        orderId: squareOrderId,
      });
    } catch (error) {
      console.error('Square checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to create checkout',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to create checkout session' 
      });
    }
  });

  // ── Server-side safety net: auto-create EPOS order when payment is confirmed ─
  // Called at every "COMPLETED" branch in verify-payment so the order is
  // guaranteed to exist even if the browser crashes/closes before calling
  // /api/reseller/epos/checkout.
  async function autoCreateEposOrderFromPending(opts: {
    referenceId?: string | null;
    paymentLinkId?: string | null;
    squarePaymentId: string;
  }): Promise<{ orderNumber: string; created: boolean } | null> {
    try {
      // 1. Find the pending record
      let pending: typeof eposPendingPayments.$inferSelect | null = null;
      if (opts.referenceId) {
        const rows = await db.select().from(eposPendingPayments)
          .where(eq(eposPendingPayments.referenceId, opts.referenceId))
          .limit(1);
        pending = rows[0] ?? null;
      }
      if (!pending && opts.paymentLinkId) {
        const rows = await db.select().from(eposPendingPayments)
          .where(eq(eposPendingPayments.paymentLinkId, opts.paymentLinkId))
          .limit(1);
        pending = rows[0] ?? null;
      }
      if (!pending) return null;

      // 2. Already completed — return existing order number (idempotency)
      if (pending.status === 'completed' && pending.orderNumber) {
        return { orderNumber: pending.orderNumber, created: false };
      }

      // 3. Check if an order already exists for this Square payment ref
      const existing = await db.select({ orderNumber: customerOrders.orderNumber })
        .from(customerOrders)
        .where(eq(customerOrders.paymentIntentId, opts.squarePaymentId))
        .limit(1);
      if (existing.length > 0) {
        await db.update(eposPendingPayments)
          .set({ status: 'completed', orderNumber: existing[0].orderNumber, squarePaymentId: opts.squarePaymentId, completedAt: new Date() })
          .where(eq(eposPendingPayments.id, pending.id));
        return { orderNumber: existing[0].orderNumber, created: false };
      }

      // 4. Create the order
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
      const orderNumber = `RSL-${ts}-${rand}`;
      const orderId = crypto.randomUUID();
      const items = (pending.items as any[]) || [];
      const isCollection = !pending.deliveryMethod || pending.deliveryMethod === 'collection';
      const deliveryAddr = pending.deliveryAddress as any;
      const total = parseFloat(pending.totalAmount || '0');
      const subtotal = parseFloat(pending.subtotal || pending.totalAmount || '0');
      const discount = parseFloat(pending.discountAmount || '0');

      // Determine channel: if ALL items are own-products → reseller_epos_own
      // Detection is two-tier:
      //   1. Explicit flag: i.isResellerProduct === true (set by newer EPOS versions)
      //   2. DB lookup: productId not found in the 1stRep products catalogue → own product
      const itemProductIds = items.map((i: any) => i.productId).filter(Boolean);
      let catalogueProductIds = new Set<string>();
      if (itemProductIds.length > 0) {
        try {
          const catalogueRows = await db.select({ id: products.id })
            .from(products)
            .where(inArray(products.id, itemProductIds));
          catalogueRows.forEach((r: any) => catalogueProductIds.add(r.id));
        } catch (lookupErr: any) {
          console.warn('autoCreateEposOrder: product catalogue lookup failed:', lookupErr?.message);
        }
      }
      const allOwnProducts = items.length > 0 && items.every((i: any) =>
        i.isResellerProduct === true ||
        (i.productId && !catalogueProductIds.has(i.productId))
      );
      const channel = allOwnProducts ? 'reseller_epos_own' : 'reseller_epos';

      await db.insert(customerOrders).values({
        id: orderId,
        orderNumber,
        status: 'processing',
        customerEmail: pending.customerEmail || 'no-email@epos.local',
        customerFirstName: pending.customerFirstName || 'EPOS',
        customerLastName: pending.customerLastName || 'Customer',
        customerPhone: pending.customerPhone || null,
        shippingAddress: isCollection ? 'Collect from Store' : (deliveryAddr?.address || 'Not provided'),
        shippingCity: isCollection ? 'Store Collection' : (deliveryAddr?.city || ''),
        shippingPostalCode: isCollection ? 'N/A' : (deliveryAddr?.postcode || ''),
        shippingCountry: isCollection ? 'UK' : (deliveryAddr?.country || 'United Kingdom'),
        subtotal: String(subtotal),
        shippingCost: '0',
        taxAmount: '0',
        totalAmount: String(total),
        discountAmount: String(discount),
        paymentMethod: 'card_qr',
        paymentIntentId: opts.squarePaymentId,
        isPaid: true,
        paidAt: new Date(),
        ownSquarePaid: pending.ownSquare === true,
        channel,
        resellerId: pending.resellerId || null,
        notes: `Auto-recovered: Square QR payment ${opts.squarePaymentId} confirmed server-side. Ref: ${pending.referenceId}`,
        orderDate: new Date(),
      } as any);

      // 5. Insert order items
      for (const item of items) {
        const unitPrice = parseFloat(item.unitPrice || item.price || '0');
        const qty = parseInt(item.quantity || '1', 10);
        // Use the DB-aware isOwnItem check (same logic used for channel detection above)
        const isOwnItem = item.isResellerProduct === true ||
          (item.productId && !catalogueProductIds.has(item.productId));
        await db.insert(customerOrderItems).values({
          id: crypto.randomUUID(),
          orderId,
          productId: isOwnItem ? null : (item.productId || null),
          vendorProductId: isOwnItem ? (item.vendorProductId || item.productId || null) : null,
          productName: item.name || 'Product',
          sku: item.sku || null,
          size: item.size || null,
          color: item.color || null,
          quantity: qty,
          unitPrice: String(unitPrice),
          totalPrice: String(unitPrice * qty),
          locationNote: 'In-store',
        } as any);
      }

      // 6. Auto-calculate commission for catalogue items (reseller_epos only — not own-product sales)
      if (pending.resellerId && channel === 'reseller_epos') {
        try {
          const resellerRows = await db.select().from(resellers)
            .where(eq(resellers.id, pending.resellerId))
            .limit(1);
          const resellerRow = resellerRows[0] ?? null;
          const commissionRate = resellerRow?.commissionRate ? parseFloat(resellerRow.commissionRate) : 10;

          // Only count catalogue items (non-own-product)
          const catalogueTotal = items
            .filter((i: any) => !i.isResellerProduct)
            .reduce((sum: number, i: any) => {
              const up = parseFloat(i.unitPrice || i.price || '0');
              const q = parseInt(i.quantity || '1', 10);
              return sum + up * q;
            }, 0);

          if (catalogueTotal > 0) {
            const commissionAmount = (catalogueTotal * commissionRate) / 100;
            await db.insert(commissions).values({
              id: crypto.randomUUID(),
              orderId,
              orderNumber,
              commissionType: 'reseller',
              resellerId: pending.resellerId,
              orderTotal: catalogueTotal.toFixed(2),
              commissionRate: commissionRate.toFixed(2),
              commissionAmount: commissionAmount.toFixed(2),
              status: 'pending',
            } as any);
            console.log(`💰 EPOS commission recorded: £${commissionAmount.toFixed(2)} (${commissionRate}%) for reseller ${pending.resellerId} on order ${orderNumber}`);
          }
        } catch (commissionErr: any) {
          console.warn('EPOS commission recording failed (non-critical):', commissionErr?.message);
        }
      }

      // 7. Mark pending record as completed
      await db.update(eposPendingPayments)
        .set({ status: 'completed', orderNumber, squarePaymentId: opts.squarePaymentId, completedAt: new Date() })
        .where(eq(eposPendingPayments.id, pending.id));

      console.log(`✅ Auto-created EPOS order ${orderNumber} from pending payment ${pending.referenceId} (Square: ${opts.squarePaymentId})`);

      // 8. Admin notification
      const customerName = `${pending.customerFirstName || 'EPOS'} ${pending.customerLastName || 'Customer'}`.trim();
      try {
        await storage.createAdminNotification({
          type: 'new_order',
          title: 'New EPOS Order Received',
          message: `EPOS order ${orderNumber} from ${customerName} for £${total.toFixed(2)}`,
          link: '/admin/orders',
          isRead: false,
        });
        console.log(`🔔 Admin notification created for EPOS order ${orderNumber}`);
      } catch (notifErr: any) {
        console.warn('⚠️ Could not create admin notification for EPOS order:', notifErr?.message);
      }

      // 9. WebSocket event for real-time admin dashboard
      try {
        emitOrderEvent({
          type: 'new_order',
          orderId,
          customerName,
          totalAmount: total,
          itemCount: items.length,
          source: 'epos',
          timestamp: new Date().toISOString(),
          items: items.map((i: any) => ({
            productName: i.name || 'Product',
            quantity: i.quantity || 1,
            size: i.size || undefined,
            color: i.color || undefined,
          })),
        });
      } catch (wsErr: any) {
        console.warn('⚠️ Could not emit EPOS order WebSocket event:', wsErr?.message);
      }

      // 10. Order confirmation email (non-blocking)
      if (pending.customerEmail && pending.customerEmail !== 'no-email@epos.local') {
        sendOrderConfirmation({
          customerName,
          customerEmail: pending.customerEmail,
          orderNumber,
          orderItems: items.map((i: any) => ({
            name: i.name || 'Product',
            quantity: parseInt(i.quantity || '1', 10),
            price: parseFloat(i.unitPrice || i.price || '0'),
          })),
          totalAmount: total,
          shippingAddress: isCollection ? 'Collect from Store' : (deliveryAddr?.address || 'Not provided'),
        }).catch((emailErr: any) => {
          console.warn(`⚠️ EPOS order confirmation email failed for ${orderNumber}:`, emailErr?.message);
        });
      }

      return { orderNumber, created: true };
    } catch (err: any) {
      console.error('autoCreateEposOrderFromPending error:', err?.message || err);
      return null;
    }
  }

  app.post('/api/square/verify-payment', async (req: Request, res: Response) => {
    try {
      const { transactionId, orderId, checkoutId, referenceId } = req.body;

      // ── BYOS: detect if this payment was made via the reseller's own Square ──
      // Look up the pending record by referenceId or paymentLinkId to check the own_square flag.
      let activeVerifyClient = squareClient;
      let activeVerifyLocationId = process.env.SQUARE_LOCATION_ID || '';
      try {
        let pendingRow: any = null;
        if (referenceId) {
          const rows = await db.select().from(eposPendingPayments)
            .where(eq(eposPendingPayments.referenceId, referenceId)).limit(1);
          pendingRow = rows[0] ?? null;
        }
        if (!pendingRow && checkoutId) {
          const rows = await db.select().from(eposPendingPayments)
            .where(eq(eposPendingPayments.paymentLinkId, checkoutId)).limit(1);
          pendingRow = rows[0] ?? null;
        }
        if (pendingRow?.ownSquare && pendingRow?.resellerId) {
          const resellerRows = await db.select().from(resellers)
            .where(eq(resellers.id, pendingRow.resellerId)).limit(1);
          const r = resellerRows[0] as any;
          const ownClient = r ? makeOwnSquareClient(r) : null;
          if (ownClient && r.ownSquareLocationId) {
            activeVerifyClient = ownClient;
            activeVerifyLocationId = r.ownSquareLocationId;
            console.log(`💳 BYOS verify: using reseller's own Square for pending ${pendingRow.referenceId}`);
          }
        }
      } catch (byosVerifyErr: any) {
        console.warn('BYOS verify detection failed, using platform Square:', byosVerifyErr?.message);
      }
      
      // Method 1: Check via payment link ID - this is the most reliable for QR payments
      if (checkoutId) {
        try {
          const linkResponse = await activeVerifyClient.checkout.paymentLinks.get({
            id: checkoutId,
          });
          const paymentLink = linkResponse.paymentLink;
          if (paymentLink?.orderId) {
            // Get the order associated with the payment link
            const paidOrderResponse = await activeVerifyClient.orders.get({
              orderId: paymentLink.orderId,
            });
            if (paidOrderResponse.order) {
              const paidOrder = paidOrderResponse.order;
              // Only trust COMPLETED state or a tender whose card was actually CAPTURED.
              // A failed/declined payment also creates a tender record — checking
              // tenders.length > 0 alone causes phantom orders when payment is declined.
              const isPaid = paidOrder.state === 'COMPLETED' ||
                (paidOrder.tenders && paidOrder.tenders.some(
                  (t: any) => t.cardDetails?.status === 'CAPTURED'
                ));
              if (isPaid) {
                const sqPayId = paidOrder.tenders?.find(
                  (t: any) => t.cardDetails?.status === 'CAPTURED'
                )?.id || paidOrder.tenders?.[0]?.id || paidOrder.id;
                console.log(`QR Payment verified via payment link: ${checkoutId} -> order ${paidOrder.id} COMPLETED`);
                const autoOrder = await autoCreateEposOrderFromPending({ referenceId, paymentLinkId: checkoutId, squarePaymentId: sqPayId });
                return res.json({
                  success: true,
                  verified: true,
                  paid: true,
                  status: 'COMPLETED',
                  orderId: paidOrder.id,
                  paymentId: sqPayId,
                  autoOrderNumber: autoOrder?.orderNumber ?? null,
                  autoOrderCreated: autoOrder?.created ?? false,
                });
              }
            }
          }
        } catch (linkErr: any) {
          console.log('Payment link lookup:', linkErr?.message || 'failed, trying other methods');
        }
      }

      // Method 2: Search for completed orders by referenceId (most reliable for payment links)
      if (referenceId) {
        try {
          if (activeVerifyLocationId) {
            const searchResponse = await activeVerifyClient.orders.search({
              locationIds: [activeVerifyLocationId],
              query: {
                filter: {
                  stateFilter: { states: ['COMPLETED'] },
                },
                sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
              },
              limit: 50,
            });

            if (searchResponse.orders) {
              for (const completedOrder of searchResponse.orders) {
                if (completedOrder.referenceId === referenceId) {
                  const hasTenders = completedOrder.tenders && completedOrder.tenders.length > 0;
                  if (hasTenders) {
                    const sqPayId2 = completedOrder.tenders?.[0]?.id || completedOrder.id;
                    console.log(`QR Payment verified via referenceId search: ${referenceId} -> order ${completedOrder.id} COMPLETED`);
                    const autoOrder = await autoCreateEposOrderFromPending({ referenceId, squarePaymentId: sqPayId2 });
                    return res.json({
                      success: true,
                      verified: true,
                      paid: true,
                      status: 'COMPLETED',
                      orderId: completedOrder.id,
                      paymentId: sqPayId2,
                      autoOrderNumber: autoOrder?.orderNumber ?? null,
                      autoOrderCreated: autoOrder?.created ?? false,
                    });
                  }
                }
              }
            }
          }
        } catch (searchErr: any) {
          console.log('Order search by referenceId:', searchErr?.message || 'failed');
        }
      }

      // Method 3: Search recent completed orders with tenders (paid orders) matching reference
      if (referenceId) {
        try {
          const method3LocationId = activeVerifyLocationId;
          if (!method3LocationId) throw new Error('No location ID configured');
          const now = new Date();
          const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
          
          const paidOrderSearch = await activeVerifyClient.orders.search({
            locationIds: [method3LocationId],
            query: {
              filter: {
                dateTimeFilter: {
                  createdAt: {
                    startAt: thirtyMinsAgo.toISOString(),
                    endAt: now.toISOString(),
                  },
                },
                stateFilter: {
                  states: ['COMPLETED'],
                },
              },
              sort: { sortField: 'CREATED_AT', sortOrder: 'DESC' },
            },
            limit: 50,
          });

          const paidOrders = paidOrderSearch?.orders || [];
          for (const order of paidOrders) {
            if (order.referenceId === referenceId && order.tenders && order.tenders.length > 0) {
              const tender = order.tenders[0];
              const sqPayId3 = tender.paymentId || tender.id;
              console.log(`QR Payment verified via paid order search: ${referenceId} -> order ${order.id} COMPLETED with tender ${tender.id}`);
              const autoOrder = await autoCreateEposOrderFromPending({ referenceId, squarePaymentId: sqPayId3 });
              return res.json({
                success: true,
                verified: true,
                paid: true,
                status: 'COMPLETED',
                orderId: order.id,
                paymentId: sqPayId3,
                autoOrderNumber: autoOrder?.orderNumber ?? null,
                autoOrderCreated: autoOrder?.created ?? false,
              });
            }
          }
        } catch (paySearchErr: any) {
          console.log('Paid order search:', paySearchErr?.message || 'failed');
        }
      }

      // Method 4: Direct order check (for non-payment-link orders)
      if (orderId) {
        try {
          const orderResponse = await activeVerifyClient.orders.get({
            orderId,
          });
          
          if (orderResponse.order) {
            const order = orderResponse.order;
            const isPaid = order.state === 'COMPLETED' ||
              (order.tenders && order.tenders.some(
                (t: any) => t.cardDetails?.status === 'CAPTURED'
              ));
            
            if (isPaid) {
              const sqPayId4 = order.tenders?.find(
                (t: any) => t.cardDetails?.status === 'CAPTURED'
              )?.id || order.tenders?.[0]?.id || order.id;
              const autoOrder = await autoCreateEposOrderFromPending({ referenceId, squarePaymentId: sqPayId4 });
              return res.json({
                success: true,
                verified: true,
                paid: true,
                status: 'COMPLETED',
                orderId: order.id,
                paymentId: sqPayId4,
                autoOrderNumber: autoOrder?.orderNumber ?? null,
                autoOrderCreated: autoOrder?.created ?? false,
              });
            }
          }
        } catch (orderErr) {
          // Order lookup failed
        }
      }
      
      // Method 5: Direct payment check
      if (transactionId) {
        try {
          const paymentResponse = await activeVerifyClient.payments.get({
            paymentId: transactionId,
          });
          
          if (paymentResponse.payment) {
            const payment = paymentResponse.payment;
            const isPaid = payment.status === 'COMPLETED';
            if (isPaid) {
              const autoOrder = await autoCreateEposOrderFromPending({ referenceId, squarePaymentId: payment.id });
              return res.json({
                success: true,
                verified: true,
                paid: true,
                status: payment.status,
                paymentId: payment.id,
                orderId: payment.orderId,
                autoOrderNumber: autoOrder?.orderNumber ?? null,
                autoOrderCreated: autoOrder?.created ?? false,
              });
            }
            return res.json({
              success: true,
              verified: false,
              paid: false,
              status: payment.status,
              paymentId: payment.id,
              orderId: payment.orderId,
            });
          }
        } catch {}
      }
      
      // Not paid yet
      res.json({
        success: true,
        verified: false,
        paid: false,
        status: 'OPEN',
        orderId: orderId || null,
      });
    } catch (error) {
      console.error('Square payment verification error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          paid: false,
          error: errors[0]?.detail || 'Payment verification failed',
        });
      }
      
      res.status(500).json({ 
        success: false,
        paid: false,
        error: 'Payment verification failed' 
      });
    }
  });

  // ── Recover pending website checkout by payment link ID ───────────────────
  // Called by CheckoutComplete when sessionStorage is empty (browser crash,
  // different device, private tab, etc.). Returns the saved order data so the
  // confirmation flow can proceed without any client-side state.
  app.get('/api/square/recover-pending-checkout', async (req: Request, res: Response) => {
    try {
      const { paymentLinkId } = req.query;
      if (!paymentLinkId || typeof paymentLinkId !== 'string') {
        return res.status(400).json({ error: 'paymentLinkId is required' });
      }
      const rows = await db.execute(sql`
        SELECT id, payment_link_id, square_order_id, customer_info, cart_items,
               subtotal, shipping, total, coupon, terms_accepted_at, status, order_number
        FROM pending_website_checkouts
        WHERE payment_link_id = ${paymentLinkId}
        LIMIT 1
      `);
      if (!rows.rows.length) {
        return res.status(404).json({ error: 'No pending checkout found for this payment link' });
      }
      const row = rows.rows[0] as any;
      if (row.status === 'completed') {
        return res.json({ alreadyCompleted: true, orderNumber: row.order_number });
      }
      return res.json({
        found: true,
        orderData: {
          customerInfo: row.customer_info,
          cartItems: row.cart_items,
          subtotal: parseFloat(row.subtotal),
          shipping: parseFloat(row.shipping),
          total: parseFloat(row.total),
          coupon: row.coupon,
          termsAcceptedAt: row.terms_accepted_at,
          paymentMethod: 'square',
          squareOrderId: row.square_order_id,
          squareCheckoutId: row.payment_link_id,
        },
      });
    } catch (err) {
      console.error('recover-pending-checkout error:', err);
      res.status(500).json({ error: 'Failed to recover pending checkout' });
    }
  });

  // ─── Own Square (BYOS) routes ──────────────────────────────────────────────

  app.get('/api/reseller/own-square/status', requireAuth, requireReseller, async (req: Request, res: Response) => {
    try {
      const reseller = await storage.getReseller((req as any).reseller.id);
      if (!reseller) return res.status(404).json({ error: 'Reseller not found' });
      res.json({
        isSetup: !!(reseller as any).ownSquareAccessTokenEnc && !!(reseller as any).ownSquareLocationId,
        locationId: (reseller as any).ownSquareLocationId || null,
        setupAt: (reseller as any).ownSquareSetupAt || null,
      });
    } catch (e: any) { res.status(500).json({ error: 'Failed to get own Square status' }); }
  });

  app.post('/api/reseller/own-square/setup', requireAuth, requireReseller, async (req: Request, res: Response) => {
    try {
      const { accessToken, locationId } = req.body;
      if (!accessToken || !locationId) {
        return res.status(400).json({ error: 'Both Access Token and Location ID are required' });
      }

      // Validate the token by calling Square API
      let locationName = '';
      try {
        const testClient = new SquareClient({ token: accessToken, environment: SquareEnvironment.Production });
        const locationResp = await testClient.locations.get({ locationId });
        locationName = locationResp.location?.name || '';
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid credentials — could not connect to your Square account. Check the Access Token and Location ID and try again.' });
      }

      const encryptedToken = encryptOwnSquareToken(accessToken);
      await storage.updateReseller((req as any).reseller.id, {
        ownSquareAccessTokenEnc: encryptedToken,
        ownSquareLocationId: locationId,
        ownSquareSetupAt: new Date(),
      } as any);

      res.json({ success: true, locationId, locationName, message: 'Your Square account has been connected. Own-product EPOS payments will go directly to your Square account.' });
    } catch (e: any) {
      console.error('Own Square setup error:', e);
      res.status(500).json({ error: e.message || 'Failed to save Square credentials' });
    }
  });

  app.delete('/api/reseller/own-square/remove', requireAuth, requireReseller, async (req: Request, res: Response) => {
    try {
      await storage.updateReseller((req as any).reseller.id, {
        ownSquareAccessTokenEnc: null,
        ownSquareLocationId: null,
        ownSquareSetupAt: null,
      } as any);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: 'Failed to remove Square credentials' }); }
  });

  // ─── Square OAuth — "Connect with Square" one-click flow ──────────────────

  app.get('/api/reseller/own-square/oauth/start', requireAuth, requireReseller, async (req: Request, res: Response) => {
    const appId = process.env.SQUARE_APPLICATION_ID;
    const appSecret = process.env.SQUARE_OAUTH_SECRET;
    if (!appId || !appSecret) {
      return res.redirect('/reseller/dashboard?tab=settings&square_error=not_configured');
    }
    const resellerId = (req as any).reseller.id;
    const state = Buffer.from(JSON.stringify({ resellerId, ts: Date.now() })).toString('base64url');
    const redirectUri = 'https://1strep.com/api/reseller/own-square/oauth/callback';
    const scope = 'MERCHANT_PROFILE_READ PAYMENTS_WRITE PAYMENTS_READ ORDERS_WRITE ORDERS_READ';
    const url = `https://connect.squareup.com/oauth2/authorize?client_id=${encodeURIComponent(appId)}&scope=${encodeURIComponent(scope)}&session=false&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    res.redirect(url);
  });

  app.get('/api/reseller/own-square/oauth/callback', async (req: Request, res: Response) => {
    try {
      const { code, error: oauthError, state } = req.query as any;
      if (oauthError) return res.redirect(`/reseller/dashboard?tab=settings&square_error=${encodeURIComponent(oauthError)}`);
      if (!code) return res.redirect('/reseller/dashboard?tab=settings&square_error=no_code');
      if (!state) return res.redirect('/reseller/dashboard?tab=settings&square_error=missing_state');

      // Extract resellerId from the state parameter (set during oauth/start)
      let resellerId: string;
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        resellerId = decoded.resellerId;
        if (!resellerId) throw new Error('no resellerId');
      } catch {
        return res.redirect('/reseller/dashboard?tab=settings&square_error=invalid_state');
      }

      const appId = process.env.SQUARE_APPLICATION_ID!;
      const appSecret = process.env.SQUARE_OAUTH_SECRET!;
      const redirectUri = 'https://1strep.com/api/reseller/own-square/oauth/callback';

      // Exchange code → access token
      const tokenResp = await fetch('https://connect.squareup.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Square-Version': '2024-01-17' },
        body: JSON.stringify({ client_id: appId, client_secret: appSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
      });
      const tokenData: any = await tokenResp.json();
      if (!tokenResp.ok || !tokenData.access_token) {
        console.error('Square OAuth token exchange failed:', tokenData);
        return res.redirect('/reseller/dashboard?tab=settings&square_error=token_exchange_failed');
      }

      // Auto-fetch first active location — no manual Location ID entry needed
      const accessToken: string = tokenData.access_token;
      const locClient = new SquareClient({ token: accessToken, environment: SquareEnvironment.Production });
      const locResp = await locClient.locations.list();
      const locations = (locResp as any).locations || [];
      const activeLocation = locations.find((l: any) => l.status === 'ACTIVE') || locations[0];
      if (!activeLocation?.id) return res.redirect('/reseller/dashboard?tab=settings&square_error=no_locations');

      const encryptedToken = encryptOwnSquareToken(accessToken);
      await storage.updateReseller(resellerId, {
        ownSquareAccessTokenEnc: encryptedToken,
        ownSquareLocationId: activeLocation.id,
        ownSquareSetupAt: new Date(),
      } as any);

      res.redirect('/reseller/dashboard?tab=settings&square_connected=1');
    } catch (e: any) {
      console.error('Square OAuth callback error:', e);
      res.redirect('/reseller/dashboard?tab=settings&square_error=callback_failed');
    }
  });

  // EPOS-specific Square checkout - for vendor, reseller, and storefront EPOS
  app.post('/api/square/create-epos-checkout', async (req: Request, res: Response) => {
    try {
      const { 
        amount, 
        currency = 'GBP', 
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
        orderType, // 'vendor_epos', 'reseller_epos', 'storefront_epos', 'wholesale'
        lineItems,
        cartItems,   // full cart items for server-side backup
        redirectUrl,
        metadata, // Additional order data to store
        discount, // { amount: number, name: string } - optional discount to apply
        subtotal,
        couponCode,
        couponId,
        discountAmount,
        deliveryMethod,
        deliveryAddress,
        resellerId,
      } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Missing required field: amount' });
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      // ── BYOS: detect own-product order → use reseller's own Square if set up ──
      let activeSquareClient = squareClient;
      let activeLocationId = locationId;
      let useOwnSquare = false;
      if (orderType === 'reseller_epos' && (cartItems || lineItems)) {
        try {
          const allItems = cartItems || lineItems || [];
          const allOwnProducts = allItems.length > 0 && allItems.every((i: any) => i.isResellerProduct === true || i.productType === 'own_product');
          if (allOwnProducts) {
            // Resolve resellerId to look up own Square credentials
            let lookupResellerId = resellerId || null;
            if (!lookupResellerId) {
              const eposSess = (req.session as any)?.resellerEposSession;
              if (eposSess?.resellerId) lookupResellerId = eposSess.resellerId;
            }
            if (!lookupResellerId && (req as any).user) {
              const rows = await db.select({ id: resellers.id })
                .from(resellers).where(eq(resellers.userId, (req as any).user.id)).limit(1);
              if (rows.length > 0) lookupResellerId = rows[0].id;
            }
            if (lookupResellerId) {
              const resellerRows = await db.select().from(resellers).where(eq(resellers.id, lookupResellerId)).limit(1);
              const r = resellerRows[0] as any;
              const ownClient = r ? makeOwnSquareClient(r) : null;
              if (ownClient && r.ownSquareLocationId) {
                activeSquareClient = ownClient;
                activeLocationId = r.ownSquareLocationId;
                useOwnSquare = true;
                console.log(`💳 BYOS: Using own Square for reseller ${lookupResellerId} (location: ${r.ownSquareLocationId})`);
              }
            }
          }
        } catch (byosErr: any) {
          console.warn('BYOS detection failed, falling back to platform Square:', byosErr?.message);
        }
      }

      // When using a reseller's own Square, fetch their location's actual currency
      let activeEposCurrency = currency;
      if (useOwnSquare) {
        try {
          const locResp = await activeSquareClient.locations.get({ locationId: activeLocationId });
          if (locResp.location?.currency) {
            activeEposCurrency = locResp.location.currency;
            console.log(`💱 BYOS EPOS: Using reseller location currency ${activeEposCurrency} (was ${currency})`);
          }
        } catch (currErr: any) {
          console.warn('BYOS EPOS: could not fetch location currency, defaulting to', currency, currErr?.message);
        }
      }

      const idempotencyKey = crypto.randomUUID();
      // Square requires reference_id to be max 40 characters
      const rawReferenceId = `EPOS-${(orderType || 'SALE').toUpperCase().slice(0, 15)}-${Date.now()}`;
      const referenceId = rawReferenceId.slice(0, 40);
      
      const orderLineItems = lineItems && lineItems.length > 0 ? lineItems.map((item: any) => ({
        name: item.name,
        quantity: String(item.quantity || 1),
        basePriceMoney: {
          amount: BigInt(item.basePriceMoney?.amount || Math.round((parseFloat(item.unitPrice) || 0) * 100)),
          currency: activeEposCurrency,
        },
        note: item.size || item.color ? `${item.size || ''} ${item.color || ''}`.trim() : undefined,
      })) : [{
        name: '1stRep EPOS Order',
        quantity: '1',
        basePriceMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency: activeEposCurrency,
        },
      }];

      // Apply discount if provided
      console.log('EPOS Checkout - Discount received:', JSON.stringify(discount));
      if (discount && discount.amount > 0 && orderLineItems.length > 0) {
        const discountAmountPence = Math.round(discount.amount * 100);
        
        // Calculate total product value before discount
        const totalProductValue = orderLineItems.reduce((sum: number, item: any) => {
          return sum + Number(item.basePriceMoney.amount) * Number(item.quantity);
        }, 0);
        
        if (totalProductValue > 0 && discountAmountPence <= totalProductValue) {
          // Apply discount proportionally across all items
          let remainingDiscount = discountAmountPence;
          
          orderLineItems.forEach((item: any, index: number) => {
            const itemTotal = Number(item.basePriceMoney.amount) * Number(item.quantity);
            const itemProportion = itemTotal / totalProductValue;
            
            const itemDiscount = index === orderLineItems.length - 1
              ? remainingDiscount
              : Math.round(discountAmountPence * itemProportion);
            
            remainingDiscount -= itemDiscount;
            
            const discountPerUnit = Math.round(itemDiscount / Number(item.quantity));
            const newPrice = Math.max(0, Number(item.basePriceMoney.amount) - discountPerUnit);
            item.basePriceMoney.amount = BigInt(newPrice);
            item.name = `${item.name} (${discount.name || 'Discount'})`;
          });
          
          console.log(`Applied discount to EPOS line items: ${discount.name} - £${discount.amount}`);
        }
      }
      
      const orderObject: any = {
        locationId: activeLocationId,
        lineItems: orderLineItems,
        referenceId,
      };

      const checkoutOptions: any = {
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: false,
          afterpayClearpay: false,
        },
        askForShippingAddress: false,
      };

      if (redirectUrl) {
        checkoutOptions.redirectUrl = redirectUrl;
      }

      if (customerEmail) {
        checkoutOptions.prePopulateBuyerEmail = customerEmail;
      }

      const checkoutResponse = await activeSquareClient.checkout.paymentLinks.create({
        idempotencyKey,
        order: orderObject,
        checkoutOptions,
      });

      console.log(`Square EPOS checkout link created: ${checkoutResponse.paymentLink?.id} type: ${orderType}${useOwnSquare ? ' [OWN SQUARE — payment direct to reseller]' : ''}`);

      // ── Server-side backup for reseller card payments ─────────────────────────
      if (orderType === 'reseller_epos' && (cartItems || lineItems)) {
        try {
          const backupItems = cartItems || lineItems || [];
          let resolvedResellerId = resellerId || null;
          if (!resolvedResellerId) {
            const eposSession = (req.session as any)?.resellerEposSession;
            if (eposSession?.resellerId) {
              resolvedResellerId = eposSession.resellerId;
            }
          }
          if (!resolvedResellerId && (req as any).user) {
            try {
              const rows = await db.select({ id: resellers.id })
                .from(resellers).where(eq(resellers.userId, (req as any).user.id)).limit(1);
              if (rows.length > 0) resolvedResellerId = rows[0].id;
            } catch (_) {}
          }
          await db.insert(eposPendingPayments).values({
            referenceId,
            paymentLinkId: checkoutResponse.paymentLink?.id || null,
            squareOrderId: checkoutResponse.paymentLink?.orderId || null,
            resellerId: resolvedResellerId,
            customerEmail: customerEmail || null,
            customerPhone: customerPhone || null,
            customerFirstName: customerFirstName || null,
            customerLastName: customerLastName || null,
            items: backupItems as any,
            totalAmount: String(amount),
            subtotal: String(subtotal ?? amount),
            discountAmount: discount?.amount ? String(discount.amount) : (discountAmount ? String(discountAmount) : '0'),
            couponCode: couponCode || null,
            couponId: couponId || null,
            deliveryMethod: deliveryMethod || 'collection',
            deliveryAddress: deliveryAddress || null,
            status: 'pending',
            ownSquare: useOwnSquare,
          } as any);
          console.log(`💾 Card EPOS pending payment saved: ${referenceId}${useOwnSquare ? ' [own Square]' : ''}`);
        } catch (dbErr: any) {
          console.warn('Could not persist card EPOS pending payment:', dbErr?.message);
        }
      }
      
      res.json({
        success: true,
        checkoutUrl: checkoutResponse.paymentLink?.url,
        paymentLinkId: checkoutResponse.paymentLink?.id,
        orderId: checkoutResponse.paymentLink?.orderId,
        referenceId,
        ownSquare: useOwnSquare,
      });
    } catch (error) {
      console.error('Square EPOS checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to create EPOS checkout',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to create EPOS checkout session' 
      });
    }
  });

  // Wholesale order Square checkout
  app.post('/api/square/create-wholesale-checkout', async (req: Request, res: Response) => {
    try {
      const { 
        amount, 
        currency = 'GBP', 
        customerEmail,
        orderId,
        businessName,
        lineItems,
        redirectUrl 
      } = req.body;
      
      if (!amount || !orderId) {
        return res.status(400).json({ error: 'Missing required fields: amount, orderId' });
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      const idempotencyKey = crypto.randomUUID();
      // Square requires reference_id to be max 40 characters - use short format
      const referenceId = `WS-${(orderId || '').slice(0, 30)}-${Date.now().toString().slice(-6)}`.slice(0, 40);
      
      const orderLineItems = lineItems && lineItems.length > 0 ? lineItems.map((item: any) => ({
        name: item.name,
        quantity: String(item.quantity || 1),
        basePriceMoney: {
          amount: BigInt(item.basePriceMoney?.amount || Math.round((parseFloat(item.unitPrice || item.price) || 0) * 100)),
          currency,
        },
        note: item.size || item.color ? `${item.size || ''} ${item.color || ''}`.trim() : undefined,
      })) : [{
        name: `Wholesale Order #${orderId}${businessName ? ` - ${businessName}` : ''}`,
        quantity: '1',
        basePriceMoney: {
          amount: BigInt(Math.round(amount * 100)),
          currency,
        },
      }];

      const orderObject: any = {
        locationId,
        lineItems: orderLineItems,
        referenceId,
      };

      const checkoutOptions: any = {
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: false,
          afterpayClearpay: false,
        },
        askForShippingAddress: false,
      };

      if (redirectUrl) {
        checkoutOptions.redirectUrl = redirectUrl;
      }

      if (customerEmail) {
        checkoutOptions.prePopulateBuyerEmail = customerEmail;
      }

      const checkoutResponse = await squareClient.checkout.paymentLinks.create({
        idempotencyKey,
        order: orderObject,
        checkoutOptions,
      });

      console.log('Square Wholesale checkout link created:', checkoutResponse.paymentLink?.id, 'for order:', orderId);
      
      res.json({
        success: true,
        checkoutUrl: checkoutResponse.paymentLink?.url,
        paymentLinkId: checkoutResponse.paymentLink?.id,
        squareOrderId: checkoutResponse.paymentLink?.orderId,
        referenceId,
      });
    } catch (error) {
      console.error('Square Wholesale checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to create wholesale checkout',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to create wholesale checkout session' 
      });
    }
  });

  // QR Code Payment - creates a Square checkout link optimized for QR scanning
  app.post('/api/square/create-qr-checkout', async (req: Request, res: Response) => {
    try {
      const { 
        items,
        totalAmount, 
        currency = 'GBP', 
        customerEmail,
        customerPhone,
        customerFirstName,
        customerLastName,
        resellerId: bodyResellerId,
        channel = 'epos_qr',
        deliveryMethod: bodyDeliveryMethod,
        deliveryAddress: bodyDeliveryAddress,
        discount,
      } = req.body;
      
      if (!totalAmount || !items || items.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: totalAmount, items' });
      }

      // Resolve resellerId: body value → resellerEposSession (PIN auth) → main user session
      let resellerId = bodyResellerId || null;

      // Fallback 1: EPOS PIN session (most reliable for EPOS flow)
      if (!resellerId) {
        const eposSession = (req.session as any)?.resellerEposSession;
        if (eposSession?.resellerId) {
          resellerId = eposSession.resellerId;
          console.log(`QR checkout: resolved resellerId ${resellerId} from resellerEposSession`);
        }
      }

      // Fallback 2: main auth session (req.user)
      if (!resellerId && (req as any).user) {
        try {
          const sessionUserId = (req as any).user.id;
          const rows = await db.select({ id: resellers.id, businessName: resellers.businessName })
            .from(resellers)
            .where(eq(resellers.userId, sessionUserId))
            .limit(1);
          if (rows.length > 0) {
            resellerId = rows[0].id;
            console.log(`QR checkout: resolved resellerId ${resellerId} (${rows[0].businessName}) from user session`);
          }
        } catch (lookupErr: any) {
          console.warn('QR checkout: could not resolve resellerId from session:', lookupErr?.message);
        }
      }

      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      // ── BYOS: detect own-product QR order → use reseller's own Square if set up ──
      let activeQrClient = squareClient;
      let activeQrLocationId = locationId;
      let useOwnSquareQr = false;
      if (resellerId && items && items.length > 0) {
        try {
          const allOwnQr = items.every((i: any) => i.isResellerProduct === true || i.productType === 'own_product');
          if (allOwnQr) {
            const resellerRows = await db.select().from(resellers).where(eq(resellers.id, resellerId)).limit(1);
            const r = resellerRows[0] as any;
            const ownClient = r ? makeOwnSquareClient(r) : null;
            if (ownClient && r.ownSquareLocationId) {
              activeQrClient = ownClient;
              activeQrLocationId = r.ownSquareLocationId;
              useOwnSquareQr = true;
              console.log(`💳 BYOS QR: Using own Square for reseller ${resellerId} (location: ${r.ownSquareLocationId})`);
            }
          }
        } catch (byosQrErr: any) {
          console.warn('BYOS QR detection failed, falling back to platform Square:', byosQrErr?.message);
        }
      }

      // When using a reseller's own Square, fetch their location's actual currency
      // (their account may be in AED, USD, etc. — not GBP)
      let activeCurrency = currency;
      if (useOwnSquareQr) {
        try {
          const locResp = await activeQrClient.locations.get({ locationId: activeQrLocationId });
          if (locResp.location?.currency) {
            activeCurrency = locResp.location.currency;
            console.log(`💱 BYOS QR: Using reseller location currency ${activeCurrency} (was ${currency})`);
          }
        } catch (currErr: any) {
          console.warn('BYOS QR: could not fetch location currency, defaulting to', currency, currErr?.message);
        }
      }

      const idempotencyKey = crypto.randomUUID();
      // Square requires reference_id to be max 40 characters
      const referenceId = `QR-${(channel || 'PAY').toUpperCase().slice(0, 10)}-${Date.now()}`.slice(0, 40);
      
      // Calculate per-item price from total amount distributed across items
      const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
      const pricePerItem = Math.round((totalAmount * 100) / totalQuantity);
      
      const orderLineItems = items.map((item: any, index: number) => {
        const qty = item.quantity || 1;
        let itemPricePence = item.price ? Math.round(item.price * 100) : pricePerItem;
        
        return {
          name: item.name || 'Product',
          quantity: String(qty),
          basePriceMoney: {
            amount: BigInt(itemPricePence),
            currency: activeCurrency,
          },
          note: [item.size, item.color].filter(Boolean).join(', ') || undefined,
        };
      });

      if (discount && discount.amount > 0) {
        const discountAmountPence = Math.round(discount.amount * 100);
        const productItems = orderLineItems;
        const totalProductValue = productItems.reduce((sum: number, item: any) => {
          return sum + (Number(item.basePriceMoney.amount) * Number(item.quantity));
        }, 0);

        if (totalProductValue > 0 && discountAmountPence <= totalProductValue) {
          let remainingDiscount = discountAmountPence;

          for (let i = 0; i < productItems.length; i++) {
            const item = productItems[i];
            const itemTotal = Number(item.basePriceMoney.amount) * Number(item.quantity);
            const itemProportion = itemTotal / totalProductValue;

            const itemDiscount = (i === productItems.length - 1)
              ? remainingDiscount
              : Math.round(discountAmountPence * itemProportion);

            remainingDiscount -= itemDiscount;

            const discountPerUnit = Math.round(itemDiscount / Number(item.quantity));
            const newPrice = Math.max(0, Number(item.basePriceMoney.amount) - discountPerUnit);
            item.basePriceMoney.amount = BigInt(newPrice);

            item.name = `${item.name} (${discount.name || 'Discount'} applied)`;
          }

          console.log(`Applied discount to QR checkout line items: ${discount.name} - £${discount.amount}`);
        } else {
          console.log(`Cannot apply QR discount - £${discount.amount} exceeds product total £${totalProductValue/100}`);
        }
      }

      const orderObject: any = {
        locationId: activeQrLocationId,
        lineItems: orderLineItems,
        referenceId,
      };

      const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const checkoutOptions: any = {
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: false,
          afterpayClearpay: false,
        },
        askForShippingAddress: false,
        redirectUrl: `${baseUrl}/payment-confirmed`,
      };

      const prePopulatedData: any = {};
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (customerEmail && emailRegex.test(customerEmail.trim())) {
        prePopulatedData.buyerEmail = customerEmail.trim().toLowerCase();
      } else if (customerEmail) {
        console.log(`QR checkout: email "${customerEmail}" failed validation, skipping pre-fill`);
      }
      if (customerPhone) {
        let formattedPhone = customerPhone.trim().replace(/\s+/g, '');
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+44' + formattedPhone.slice(1);
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+44' + formattedPhone;
        }
        prePopulatedData.buyerPhoneNumber = formattedPhone;
      }
      if (customerFirstName || customerLastName) {
        prePopulatedData.buyerAddress = {
          firstName: customerFirstName || undefined,
          lastName: customerLastName || undefined,
          country: 'GB',
        };
      }

      console.log('QR checkout pre-populated data:', JSON.stringify(prePopulatedData));

      let checkoutResponse;
      try {
        checkoutResponse = await activeQrClient.checkout.paymentLinks.create({
          idempotencyKey,
          order: orderObject,
          checkoutOptions,
          prePopulatedData: Object.keys(prePopulatedData).length > 0 ? prePopulatedData : undefined,
          description: `1stRep QR Payment - ${referenceId}`,
        });
      } catch (prePopErr: any) {
        const errField = prePopErr?.errors?.[0]?.field || '';
        if (errField.includes('pre_populated_data')) {
          console.log('Pre-populated data rejected by Square:', prePopErr.errors[0].detail, '- field:', errField);
          const fallbackData: any = { ...prePopulatedData };
          if (errField.includes('buyer_email')) delete fallbackData.buyerEmail;
          if (errField.includes('buyer_phone')) delete fallbackData.buyerPhoneNumber;
          if (errField.includes('buyer_address')) delete fallbackData.buyerAddress;
          
          checkoutResponse = await activeQrClient.checkout.paymentLinks.create({
            idempotencyKey: crypto.randomUUID(),
            order: orderObject,
            checkoutOptions,
            prePopulatedData: Object.keys(fallbackData).length > 0 ? fallbackData : undefined,
            description: `1stRep QR Payment - ${referenceId}`,
          });
        } else {
          throw prePopErr;
        }
      }

      console.log(`Square QR checkout link created: ${checkoutResponse.paymentLink?.id} for ${referenceId}${useOwnSquareQr ? ' [OWN SQUARE — payment direct to reseller]' : ''}`);

      // ── Persist session server-side so orders can be recovered if the tab closes ──
      try {
        await db.insert(eposPendingPayments).values({
          referenceId,
          paymentLinkId: checkoutResponse.paymentLink?.id || null,
          squareOrderId: checkoutResponse.paymentLink?.orderId || null,
          resellerId: resellerId || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          customerFirstName: customerFirstName || null,
          customerLastName: customerLastName || null,
          items: items as any,
          totalAmount: String(totalAmount),
          subtotal: String(totalAmount),
          discountAmount: discount?.amount ? String(discount.amount) : '0',
          deliveryMethod: bodyDeliveryMethod || 'collection',
          deliveryAddress: bodyDeliveryAddress || null,
          status: 'pending',
          ownSquare: useOwnSquareQr,
        } as any);
        console.log(`💾 QR pending payment saved: ${referenceId}${useOwnSquareQr ? ' [own Square]' : ''}`);
      } catch (dbErr: any) {
        // Non-fatal — order can still be created via frontend polling
        console.warn('Could not persist QR pending payment:', dbErr?.message);
      }

      res.json({
        success: true,
        checkoutUrl: checkoutResponse.paymentLink?.url,
        paymentLinkId: checkoutResponse.paymentLink?.id,
        orderId: checkoutResponse.paymentLink?.orderId,
        referenceId,
        ownSquare: useOwnSquareQr,
      });
    } catch (error) {
      console.error('Square QR checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to create QR checkout',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to create QR checkout session' 
      });
    }
  });

  // ============================================
  // SQUARE TERMINAL API - Physical Card Reader
  // ============================================

  // List paired devices (to find device_id)
  app.get('/api/square/terminal/devices', async (req: Request, res: Response) => {
    try {
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) {
        return res.status(500).json({ error: 'Square not configured' });
      }

      const devices: any[] = [];
      
      try {
        for await (const device of squareClient.devices.list({
          locationId,
          sortOrder: 'ASC',
        })) {
          devices.push(device);
        }
      } catch (devErr) {
        console.error('Error listing devices:', devErr);
      }

      let deviceCodes: any[] = [];
      try {
        for await (const code of squareClient.devices.codes.list({
          locationId,
        })) {
          deviceCodes.push(code);
        }
      } catch (codeErr) {
        console.error('Error listing device codes:', codeErr);
      }
      
      res.json({
        success: true,
        devices,
        deviceCodes,
      });
    } catch (error) {
      console.error('Square list devices error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to list devices' 
      });
    }
  });

  // Create terminal checkout (for physical card reader)
  app.post('/api/square/terminal/checkout', async (req: Request, res: Response) => {
    try {
      const { 
        amount, 
        currency = 'GBP', 
        deviceId, 
        referenceId,
        note,
        customerEmail 
      } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      // Get device ID from request or environment variable
      const terminalDeviceId = deviceId || process.env.SQUARE_TERMINAL_DEVICE_ID;
      
      if (!terminalDeviceId) {
        return res.status(400).json({ 
          error: 'No card reader device configured. Please set SQUARE_TERMINAL_DEVICE_ID or pair a device.' 
        });
      }

      const idempotencyKey = crypto.randomUUID();
      const amountInCents = BigInt(Math.round(amount * 100));
      
      // Truncate referenceId to 40 chars (Square limit)
      const truncatedRefId = referenceId ? referenceId.substring(0, 40) : undefined;

      const checkoutRequest: any = {
        idempotencyKey,
        checkout: {
          amountMoney: {
            amount: amountInCents,
            currency,
          },
          deviceOptions: {
            deviceId: terminalDeviceId,
            skipReceiptScreen: false,
            collectSignature: false,
            showItemizedCart: false,
          },
          referenceId: truncatedRefId,
          note: note || 'Card payment',
        },
      };

      console.log('Creating terminal checkout for device:', terminalDeviceId, 'amount:', amount);
      
      const response = await squareClient.terminal.checkouts.create(checkoutRequest);
      
      console.log('Terminal checkout created:', response.checkout?.id, 'status:', response.checkout?.status);
      
      res.json({
        success: true,
        checkoutId: response.checkout?.id,
        status: response.checkout?.status,
        deviceId: terminalDeviceId,
      });
    } catch (error) {
      console.error('Square terminal checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to create terminal checkout',
          code: errors[0]?.code,
          errors,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to create terminal checkout' 
      });
    }
  });

  // Get terminal checkout status
  app.get('/api/square/terminal/checkout/:checkoutId', async (req: Request, res: Response) => {
    try {
      const { checkoutId } = req.params;
      
      if (!checkoutId) {
        return res.status(400).json({ error: 'Checkout ID is required' });
      }

      const response = await squareClient.terminal.checkouts.get({ checkoutId });
      
      res.json({
        success: true,
        checkoutId: response.checkout?.id,
        status: response.checkout?.status,
        paymentIds: response.checkout?.paymentIds,
        cancelReason: response.checkout?.cancelReason,
      });
    } catch (error) {
      console.error('Square get terminal checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to get checkout status',
          code: errors[0]?.code,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to get checkout status' 
      });
    }
  });

  // Cancel terminal checkout
  app.post('/api/square/terminal/checkout/:checkoutId/cancel', async (req: Request, res: Response) => {
    try {
      const { checkoutId } = req.params;
      
      if (!checkoutId) {
        return res.status(400).json({ error: 'Checkout ID is required' });
      }

      const response = await squareClient.terminal.checkouts.cancel({ checkoutId });
      
      res.json({
        success: true,
        checkoutId: response.checkout?.id,
        status: response.checkout?.status,
      });
    } catch (error) {
      console.error('Square cancel terminal checkout error:', error);
      
      if (error instanceof SquareError) {
        const errors = error.errors || [];
        return res.status(400).json({
          success: false,
          error: errors[0]?.detail || 'Failed to cancel checkout',
          code: errors[0]?.code,
        });
      }
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to cancel checkout' 
      });
    }
  });

  console.log('Square payment routes registered');
}
