import { Server as SocketIOServer } from "socket.io";
import { Server } from "http";

let io: SocketIOServer | null = null;

export interface InventoryUpdateEvent {
  type: 'stock_increase' | 'stock_decrease' | 'purchase' | 'transfer' | 'adjustment';
  variantId: number;
  productName: string;
  sku: string;
  color?: string;
  size?: string;
  quantityChange: number;
  newQuantity: number;
  source: 'epos' | 'online' | 'admin' | 'warehouse' | 'sync';
  timestamp: string;
  orderId?: number;
  customerName?: string;
}

export interface OrderEvent {
  type: 'new_order' | 'order_updated' | 'order_completed';
  orderId: number;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  source: 'epos' | 'online' | 'reseller';
  timestamp: string;
  items: {
    productName: string;
    quantity: number;
    sku: string;
  }[];
}

export function initializeSocketServer(httpServer: Server): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    socket.on("join:competition", (competitionId: string) => {
      socket.join(`competition:${competitionId}`);
    });

    socket.on("join:admin", () => {
      socket.join("admin");
      console.log(`📊 Admin client joined: ${socket.id}`);
    });

    socket.on("join:epos", () => {
      socket.join("epos");
      console.log(`🛒 EPOS client joined: ${socket.id}`);
    });

    // Reseller room joining for real-time updates
    socket.on("join:reseller", (resellerId: string) => {
      if (resellerId) {
        socket.join(`reseller_${resellerId}`);
        console.log(`🏪 Reseller joined: reseller_${resellerId} (${socket.id})`);
      }
    });

    // Customer ticket portal room joining - requires valid access token
    socket.on("join_ticket_room", async (data: { ticketId: string; accessToken: string }) => {
      if (!data.ticketId || !data.accessToken) {
        console.log(`❌ Invalid ticket room join request: ${socket.id}`);
        return;
      }
      
      try {
        // Verify the access token matches the ticket ID
        const { storage } = await import('./storage');
        const ticket = await storage.getSupportTicketByAccessToken(data.accessToken);
        
        if (ticket && ticket.id === data.ticketId) {
          socket.join(`ticket_${data.ticketId}`);
          console.log(`💬 Customer joined ticket room: ticket_${data.ticketId} (${socket.id})`);
        } else {
          console.log(`❌ Invalid access token for ticket room: ${socket.id}`);
        }
      } catch (error) {
        console.error(`Error verifying ticket access token:`, error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 WebSocket server initialized");
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}

export function emitInventoryUpdate(event: InventoryUpdateEvent): void {
  if (!io) return;
  
  io.to("admin").emit("inventory:update", event);
  io.to("epos").emit("inventory:update", event);
  
  console.log(`📡 Inventory update broadcast: ${event.type} - ${event.productName} (${event.quantityChange > 0 ? '+' : ''}${event.quantityChange})`);
}

export function emitOrderEvent(event: OrderEvent): void {
  if (!io) return;
  
  io.to("admin").emit("order:update", event);
  io.to("epos").emit("order:update", event);
  
  console.log(`📡 Order event broadcast: ${event.type} - Order #${event.orderId}`);

  // Fire web push notification for new orders so admins get an alert on mobile
  if (event.type === "new_order") {
    const source = event.source === "epos" ? "EPOS" : event.source === "reseller" ? "Reseller" : "Online";
    import("./pushService").then(({ sendAdminPushNotification }) => {
      sendAdminPushNotification({
        title: `New Order — £${event.totalAmount.toFixed(2)}`,
        body: `${event.customerName} · ${event.itemCount} item${event.itemCount !== 1 ? "s" : ""} · ${source}`,
        url: "/admin/orders",
        tag: `order-${event.orderId}`,
      }).catch((err) => console.error("[Push] Order push failed:", err));
    }).catch(() => {});
  }
}

export function emitStockAlert(variantId: number, productName: string, currentStock: number, threshold: number): void {
  if (!io) return;
  
  io.to("admin").emit("stock:alert", {
    variantId,
    productName,
    currentStock,
    threshold,
    timestamp: new Date().toISOString()
  });
  
  console.log(`⚠️ Low stock alert: ${productName} - ${currentStock} remaining (threshold: ${threshold})`);
}

export interface ResellerLicenceEvent {
  type: 'trial_approved' | 'trial_rejected' | 'licence_activated' | 'licence_expired';
  resellerId: string;
  status: string;
  trialEndsAt?: string;
  tier?: string;
  timestamp: string;
}

export function emitResellerLicenceEvent(event: ResellerLicenceEvent): void {
  if (!io) return;
  
  io.to(`reseller_${event.resellerId}`).emit("licence:update", event);
  
  console.log(`📡 Reseller licence event: ${event.type} - reseller ${event.resellerId}`);
}

export function getIo(): SocketIOServer | null {
  return io;
}

