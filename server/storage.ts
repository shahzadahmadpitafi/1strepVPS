import { 
  users,
  authIdentities,
  passwordResetTokens,
  passwordResetOTPs,
  userMeasurements,
  resellers, 
  products,
  productImages,
  productVariants,
  productReviews,
  resellerInventory, 
  orders, 
  orderItems, 
  stockAlerts,
  pricingTiers,
  customerOrders,
  customerOrderItems,
  customerInteractions,
  customerNotes,
  customerMetrics,
  supportTickets,
  ticketMessages,
  productViews,
  productRecommendations,
  wishlists,
  messages,
  orderStatusHistory,
  shipmentDetails,
  notifications,
  resellerActivityLog,
  coupons,
  couponRedemptions,
  siteSettings,
  heroVideos,
  heroImages,
  resellerStorefronts,
  resellerProducts,
  resellerCustomerOrders,
  resellerCustomerOrderItems,
  vendorPartnerProducts,
  commissionRules,
  commissionPayments,
  payoutRequests,
  type User, 
  type InsertUser,
  type AuthIdentity,
  type InsertAuthIdentity,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type PasswordResetOTP,
  type InsertPasswordResetOTP,
  type Reseller,
  type InsertReseller,
  type Product,
  type InsertProduct,
  type ProductImage,
  type InsertProductImage,
  type ProductVariant,
  type InsertProductVariant,
  type ProductReview,
  type InsertProductReview,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ResellerInventory,
  type InsertInventory,
  type StockAlert,
  type PricingTier,
  type CustomerOrder,
  type CustomerMetric,
  type CustomerInteraction,
  type InsertCustomerInteraction,
  type CustomerNote,
  type InsertCustomerNote,
  type SupportTicket,
  type InsertSupportTicket,
  type TicketMessage,
  type InsertTicketMessage,
  type ProductView,
  type InsertProductView,
  type ProductRecommendation,
  type Wishlist,
  type InsertWishlist,
  type Message,
  type InsertMessage,
  type OrderStatusHistory,
  type InsertOrderStatusHistory,
  type ShipmentDetails,
  type InsertShipmentDetails,
  type Notification,
  type InsertNotification,
  type ResellerActivityLog,
  type InsertResellerActivityLog,
  type Coupon,
  type InsertCoupon,
  type CouponRedemption,
  type InsertCouponRedemption,
  type SiteSettings,
  type HeroVideo,
  type InsertHeroVideo,
  type HeroImage,
  type InsertHeroImage,
  type ResellerStorefront,
  type InsertResellerStorefront,
  type ResellerProduct,
  type InsertResellerProduct,
  type ResellerCustomerOrder,
  type InsertResellerCustomerOrder,
  type ResellerCustomerOrderItem,
  type InsertResellerCustomerOrderItem,
  type CommissionRule,
  type InsertCommissionRule,
  type CommissionPayment,
  type InsertCommissionPayment,
  type PayoutRequest,
  type InsertPayoutRequest,
  announcementBanner,
  type AnnouncementBanner,
  type InsertAnnouncementBanner,
  sectionAnalytics,
  type SectionAnalytics,
  type InsertSectionAnalytics,
  chatbotKnowledge,
  chatbotConversations,
  chatbotMessages,
  chatbotUnansweredQueries,
  type ChatbotKnowledge,
  type InsertChatbotKnowledge,
  type ChatbotConversation,
  type InsertChatbotConversation,
  type ChatbotMessage,
  type InsertChatbotMessage,
  type ChatbotUnansweredQuery,
  type InsertChatbotUnansweredQuery,
  savedPaymentMethods,
  type SavedPaymentMethod,
  type InsertSavedPaymentMethod,
  loyaltyPoints,
  loyaltyTransactions,
  b2bAccountUsers,
  type B2bAccountUser,
  type InsertB2bAccountUser,
  adminTeamMembers,
  type AdminTeamMember,
  type InsertAdminTeamMember,
  loyaltyRewards,
  loyaltyRedemptions,
  type LoyaltyPoints,
  type InsertLoyaltyPoints,
  type LoyaltyTransaction,
  type InsertLoyaltyTransaction,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  type LoyaltyRedemption,
  type InsertLoyaltyRedemption,
  stockAlertSubscriptions,
  type StockAlertSubscription,
  type InsertStockAlertSubscription,
  abandonedCarts,
  type AbandonedCart,
  type InsertAbandonedCart,
  b2bInvoices,
  type B2bInvoice,
  type InsertB2bInvoice,
  b2bInvoicePayments,
  type B2bInvoicePayment,
  type InsertB2bInvoicePayment,
  carts,
  cartItems,
  type Cart,
  type InsertCart,
  type CartItem,
  type InsertCartItem,
  inventoryTransactions,
  inventoryBatches,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type InventoryBatch,
  type InsertInventoryBatch,
  vendors,
  vendorProducts,
  vendorProductVariants,
  type Vendor,
  type InsertVendor,
  type VendorProduct,
  type InsertVendorProduct,
  type VendorProductVariant,
  type InsertVendorProductVariant,
  vendorResellerPermissions,
  type VendorResellerPermission,
  type InsertVendorResellerPermission,
  categories,
  type Category,
  type InsertCategory,
  productSections,
  type ProductSection,
  type InsertProductSection,
  productActivityTypes,
  type ProductActivityType,
  type InsertProductActivityType,
  warehouseInventory,
  warehouses,
  type WarehouseInventory,
  type InsertWarehouseInventory,
  type Warehouse,
  customerSegments,
  customerSegmentMembers,
  loyaltyTierBenefits,
  emailTemplates,
  emailCampaigns,
  emailCampaignSends,
  marketingAutomations,
  automationSteps,
  automationEnrollments,
  emailUnsubscribes,
  newsletterSubscriptions,
  marketingTags,
  customerTags,
  type LoyaltyTierBenefits,
  type InsertLoyaltyTierBenefits,
  type EmailTemplate,
  type InsertEmailTemplate,
  type EmailCampaign,
  type InsertEmailCampaign,
  type EmailCampaignSend,
  type InsertEmailCampaignSend,
  type MarketingAutomation,
  type InsertMarketingAutomation,
  type AutomationStep,
  type InsertAutomationStep,
  type AutomationEnrollment,
  type InsertAutomationEnrollment,
  type EmailUnsubscribe,
  type InsertEmailUnsubscribe,
  type NewsletterSubscription,
  type InsertNewsletterSubscription,
  type MarketingTag,
  type InsertMarketingTag,
  type CustomerTag,
  type InsertCustomerTag,
  referralProgramSettings,
  referralCodes,
  referrals,
  referralRewards,
  referralInvitations,
  type ReferralProgramSettings,
  type InsertReferralProgramSettings,
  type ReferralCode,
  type InsertReferralCode,
  type Referral,
  type InsertReferral,
  type ReferralReward,
  type InsertReferralReward,
  type ReferralInvitation,
  type InsertReferralInvitation,
  adminNotifications,
  type AdminNotification,
  type InsertAdminNotification,
  commissionTiers,
  partnerSalesSummary,
  commissionTierHistory,
  type CommissionTier,
  type InsertCommissionTier,
  type PartnerSalesSummary,
  type InsertPartnerSalesSummary,
  type CommissionTierHistory,
  type InsertCommissionTierHistory,
  payoutAuditLogs,
  type PayoutAuditLog,
  type InsertPayoutAuditLog,
  licenseSettings,
  resellerLicenseRequests,
  vendorWholesaleRequests,
  b2bPartnerCapabilities,
  type LicenseSettings,
  type InsertLicenseSettings,
  subscriptionTierPricing,
  type SubscriptionTierPricing,
  type ResellerLicenseRequest,
  type InsertResellerLicenseRequest,
  type VendorWholesaleRequest,
  type InsertVendorWholesaleRequest,
  resellerLicences,
  resellerProducts,
  type ResellerLicence,
  type InsertResellerLicence,
  popupMessages,
  type PopupMessage,
  type InsertPopupMessage,
  teamDocuments,
  type TeamDocument,
  type InsertTeamDocument,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, isNotNull, isNull, or, inArray } from "drizzle-orm";

// Storage interface for all operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllAdmins(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;
  upsertSocialUser(user: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; provider: string }): Promise<User>;
  
  // Password reset operations
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;

  // OTP operations
  createPasswordResetOTP(otp: InsertPasswordResetOTP): Promise<PasswordResetOTP>;
  getPasswordResetOTP(email: string, otp: string): Promise<PasswordResetOTP | undefined>;
  verifyPasswordResetOTP(email: string, otp: string): Promise<boolean>;
  deletePasswordResetOTP(email: string, otp: string): Promise<void>;
  deleteExpiredPasswordResetOTPs(): Promise<void>;
  
  // Reseller operations
  getReseller(id: string): Promise<Reseller | undefined>;
  getResellerByUserId(userId: string): Promise<Reseller | undefined>;
  createReseller(reseller: InsertReseller): Promise<Reseller>;
  updateReseller(id: string, updates: Partial<Reseller>): Promise<Reseller | undefined>;
  getAllResellers(): Promise<Reseller[]>;
  getPendingResellers(): Promise<Reseller[]>;
  approveReseller(id: string, approvedByUserId: string, commissionRate?: string): Promise<Reseller | undefined>;
  rejectReseller(id: string, rejectionReason: string): Promise<Reseller | undefined>;
  updateResellerCommissionRate(id: string, commissionRate: string): Promise<Reseller | undefined>;

  // Vendor operations
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined>;
  getAllVendors(): Promise<Vendor[]>;
  getPendingVendors(): Promise<Vendor[]>;
  approveVendor(id: string, approvedByUserId: string, commissionRate?: string): Promise<Vendor | undefined>;
  rejectVendor(id: string, rejectionReason: string): Promise<Vendor | undefined>;
  updateVendorCommissionRate(id: string, commissionRate: string): Promise<Vendor | undefined>;
  createVendorProduct(product: InsertVendorProduct): Promise<VendorProduct>;
  getVendorProducts(vendorId: string): Promise<VendorProduct[]>;
  getVendorProduct(id: string): Promise<VendorProduct | undefined>;
  updateVendorProduct(id: string, updates: Partial<VendorProduct>): Promise<VendorProduct | undefined>;
  deleteVendorProduct(id: string): Promise<boolean>;
  getAllActiveVendorProducts(): Promise<VendorProduct[]>;

  // Vendor Product Variant operations
  getVendorProductVariants(vendorProductId: string): Promise<VendorProductVariant[]>;
  getVendorProductVariantsByVendorProductIds(vendorProductIds: string[]): Promise<VendorProductVariant[]>;
  getVendorProductVariant(id: string): Promise<VendorProductVariant | undefined>;
  createVendorProductVariant(variant: InsertVendorProductVariant): Promise<VendorProductVariant>;
  updateVendorProductVariant(id: string, updates: Partial<VendorProductVariant>): Promise<VendorProductVariant | undefined>;
  deleteVendorProductVariant(id: string): Promise<boolean>;

  // Vendor Reseller Permissions operations
  grantVendorResellerPermission(permission: InsertVendorResellerPermission): Promise<VendorResellerPermission>;
  revokeVendorResellerPermission(vendorId: string, resellerId: string, vendorProductId: string): Promise<void>;
  getVendorResellerPermissions(vendorId: string): Promise<VendorResellerPermission[]>;
  getResellerVendorPermissions(resellerId: string): Promise<VendorResellerPermission[]>;
  approveVendorResellerPermission(vendorId: string, resellerId: string, vendorProductId: string): Promise<VendorResellerPermission | undefined>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  getActiveCategories(): Promise<Category[]>;
  getGlobalCategories(): Promise<Category[]>;
  getVendorCategories(vendorId: string): Promise<Category[]>;
  getCategoriesForVendor(vendorId: string): Promise<Category[]>; // Global + vendor's own
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Product Section operations
  getAllProductSections(): Promise<ProductSection[]>;
  getActiveProductSections(): Promise<ProductSection[]>;
  getProductSection(id: string): Promise<ProductSection | undefined>;
  getProductSectionBySlug(slug: string): Promise<ProductSection | undefined>;
  createProductSection(section: InsertProductSection): Promise<ProductSection>;
  updateProductSection(id: string, updates: Partial<ProductSection>): Promise<ProductSection | undefined>;
  deleteProductSection(id: string): Promise<boolean>;

  // Product Activity Type operations
  getAllProductActivityTypes(): Promise<ProductActivityType[]>;
  getActiveProductActivityTypes(): Promise<ProductActivityType[]>;
  getProductActivityType(id: string): Promise<ProductActivityType | undefined>;
  getProductActivityTypeBySlug(slug: string): Promise<ProductActivityType | undefined>;
  createProductActivityType(activityType: InsertProductActivityType): Promise<ProductActivityType>;
  updateProductActivityType(id: string, updates: Partial<ProductActivityType>): Promise<ProductActivityType | undefined>;
  deleteProductActivityType(id: string): Promise<boolean>;
  
  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  getAllProductsForExport(): Promise<Product[]>;
  getDeletedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  updateProductCategoriesByName(oldCategory: string, newCategory: string): Promise<number>;
  
  // Product image operations
  getProductImages(productId: string): Promise<ProductImage[]>;
  getProductImage(id: string): Promise<ProductImage | undefined>;
  getProductColorImages(productId: string): Promise<ProductImage[]>;
  createProductImage(image: InsertProductImage): Promise<ProductImage>;
  updateProductImage(id: string, updates: Partial<ProductImage>): Promise<ProductImage | undefined>;
  deleteProductImage(id: string): Promise<boolean>;
  deleteProductColorImages(productId: string): Promise<void>;
  setPrimaryImage(productId: string, imageId: string): Promise<void>;
  
  // Product variant operations
  getProductVariants(productId: string): Promise<ProductVariant[]>;
  getProductVariantsByProductIds(productIds: string[]): Promise<ProductVariant[]>;
  getAllProductVariantsWithProducts(): Promise<any[]>;
  getProductVariant(id: string): Promise<ProductVariant | undefined>;
  getProductVariantByDetails(productId: string, size: string, color?: string): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant): Promise<ProductVariant>;
  updateProductVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: string): Promise<boolean>;
  reduceProductVariantStock(id: string, quantityToReduce: number): Promise<{ success: boolean; variant?: ProductVariant; error?: string }>;
  
  // Product review operations
  createOrUpdateReview(review: InsertProductReview): Promise<ProductReview>;
  getProductReviews(productId: string): Promise<any[]>;
  getUserReviewForProduct(userId: string, productId: string): Promise<ProductReview | undefined>;
  updateProductRatingStats(productId: string): Promise<void>;
  checkUserPurchasedProduct(userId: string, productId: string): Promise<boolean>;
  
  // Inventory operations
  getResellerInventory(resellerId: string): Promise<ResellerInventory[]>;
  getResellerInventoryWithProducts(resellerId: string): Promise<any[]>;
  getInventoryItem(resellerId: string, productId: string, size?: string, color?: string): Promise<ResellerInventory | undefined>;
  updateInventory(resellerId: string, productId: string, quantity: number, size?: string, color?: string): Promise<ResellerInventory>;
  createInventoryItem(inventory: InsertInventory): Promise<ResellerInventory>;
  
  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getResellerOrders(resellerId: string): Promise<Order[]>;
  getAllOrders(): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<void>;
  
  // Order item operations
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  
  // Stock alert operations
  getStockAlerts(resellerId: string): Promise<StockAlert[]>;
  getStockAlertsWithProducts(resellerId: string): Promise<any[]>;
  createStockAlert(resellerId: string, productId: string, currentQuantity: number, reorderLevel: number, size?: string, color?: string): Promise<StockAlert>;
  resolveStockAlert(id: string): Promise<StockAlert | undefined>;
  
  // Pricing operations
  getProductPricing(productId: string, tier: string): Promise<PricingTier | undefined>;
  
  // CRM operations
  getAllCustomers(): Promise<User[]>;
  getCustomerMetrics(userId: string): Promise<CustomerMetric | undefined>;
  getAllCustomerMetrics(): Promise<CustomerMetric[]>;
  updateCustomerVipStatus(userId: string, isVip: boolean): Promise<boolean>;
  getCustomerOrders(userId: string): Promise<any[]>;
  getCustomerInteractions(userId: string): Promise<any[]>;
  createCustomerInteraction(interaction: InsertCustomerInteraction): Promise<CustomerInteraction>;
  getCustomerNotes(userId: string): Promise<CustomerNote[]>;
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  updateCustomerNote(id: string, note: string): Promise<CustomerNote | undefined>;
  deleteCustomerNote(id: string): Promise<boolean>;
  getDashboardMetrics(): Promise<{
    totalCustomers: number;
    totalRevenue: number;
    avgOrderValue: number;
    vipCustomers: number;
  }>;
  
  // Reseller-aware CRM operations
  getResellerCustomers(resellerId: string): Promise<User[]>;
  getResellerCustomerInteractions(resellerId: string): Promise<any[]>;
  getSupportTicketsByReseller(resellerId: string): Promise<any[]>;
  
  // Support ticket operations
  getAllSupportTickets(): Promise<any[]>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined>;
  getTicketMessages(ticketId: string): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Personalization operations
  trackProductView(view: InsertProductView): Promise<ProductView>;
  getRecommendations(userId: string, limit?: number): Promise<any[]>;
  calculateRecommendations(userId: string): Promise<void>;
  
  // Wishlist operations
  getWishlist(userId: string): Promise<any[]>;
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
  
  // Cart operations
  getCart(userId: string | null, sessionId: string | null): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  getCartItems(cartId: string): Promise<any[]>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: string): Promise<void>;
  clearCart(cartId: string): Promise<void>;
  
  // Saved payment methods operations
  getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]>;
  getSavedPaymentMethod(id: string): Promise<SavedPaymentMethod | undefined>;
  createSavedPaymentMethod(method: InsertSavedPaymentMethod): Promise<SavedPaymentMethod>;
  deleteSavedPaymentMethod(id: string): Promise<void>;
  setDefaultPaymentMethod(userId: string, methodId: string): Promise<void>;
  
  // Loyalty program operations
  getLoyaltyPoints(userId: string): Promise<LoyaltyPoints | undefined>;
  createLoyaltyPoints(points: InsertLoyaltyPoints): Promise<LoyaltyPoints>;
  updateLoyaltyPoints(userId: string, updates: Partial<LoyaltyPoints>): Promise<LoyaltyPoints | undefined>;
  addLoyaltyPoints(userId: string, points: number, description: string, relatedOrderId?: string): Promise<{ balance: LoyaltyPoints; transaction: LoyaltyTransaction }>;
  deductLoyaltyPoints(userId: string, points: number, description: string): Promise<{ balance: LoyaltyPoints; transaction: LoyaltyTransaction }>;
  getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;
  getLoyaltyRewards(): Promise<LoyaltyReward[]>;
  getAllLoyaltyRewards(): Promise<LoyaltyReward[]>;
  getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;
  updateLoyaltyReward(id: string, updates: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward | undefined>;
  deleteLoyaltyReward(id: string): Promise<void>;
  redeemLoyaltyReward(userId: string, rewardId: string): Promise<LoyaltyRedemption>;
  getLoyaltyRedemptions(userId: string): Promise<any[]>;
  
  // Back-in-stock alert operations
  subscribeToStockAlert(subscription: InsertStockAlertSubscription): Promise<StockAlertSubscription>;
  getStockAlertSubscription(userId: string, productId: string, variantId?: string): Promise<StockAlertSubscription | undefined>;
  getUserStockAlertSubscriptions(userId: string): Promise<any[]>;
  deleteStockAlertSubscription(id: string): Promise<void>;
  getStockAlertSubscriptionsByProduct(productId: string, variantId?: string): Promise<StockAlertSubscription[]>;
  markStockAlertNotificationSent(id: string): Promise<void>;
  
  // Abandoned cart recovery operations
  createAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart>;
  getAbandonedCartByCartId(cartId: string): Promise<AbandonedCart | undefined>;
  getAbandonedCarts(filters?: { recovered?: boolean }): Promise<any[]>;
  markAbandonedCartRecovered(id: string): Promise<void>;
  updateAbandonedCartReminder(id: string, stage: 'first' | 'second' | 'final'): Promise<void>;
  getAbandonedCartsForReminders(stage: 'first' | 'second' | 'final'): Promise<any[]>;
  
  // B2B Net Terms / Invoicing operations
  createB2bInvoice(invoice: InsertB2bInvoice): Promise<B2bInvoice>;
  getB2bInvoice(id: string): Promise<any | undefined>;
  getB2bInvoices(filters?: { resellerId?: string; status?: string }): Promise<any[]>;
  updateB2bInvoiceStatus(id: string, status: string): Promise<void>;
  recordB2bInvoicePayment(payment: InsertB2bInvoicePayment): Promise<B2bInvoicePayment>;
  getB2bInvoicePayments(invoiceId: string): Promise<B2bInvoicePayment[]>;
  updateB2bInvoiceAmounts(invoiceId: string, amountPaid: string, amountDue: string, status: string): Promise<void>;
  
  // User measurements operations (for virtual try-on)
  getUserMeasurements(userId: string): Promise<any | undefined>;
  saveUserMeasurements(userId: string, measurements: any): Promise<any>;
  
  // Messaging operations
  createMessage(message: InsertMessage): Promise<Message>;
  getResellerMessages(resellerId: string): Promise<Message[]>;
  getUnreadMessages(resellerId: string): Promise<Message[]>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  
  // Order status history operations
  createOrderStatusHistory(history: InsertOrderStatusHistory): Promise<OrderStatusHistory>;
  getOrderHistory(orderId: string): Promise<OrderStatusHistory[]>;
  
  // Shipment operations
  createShipment(shipment: InsertShipmentDetails): Promise<ShipmentDetails>;
  getShipmentByOrderId(orderId: string): Promise<ShipmentDetails | undefined>;
  updateShipment(orderId: string, updates: Partial<ShipmentDetails>): Promise<ShipmentDetails | undefined>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getResellerNotifications(resellerId: string): Promise<Notification[]>;
  getUnreadNotifications(resellerId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsAsRead(resellerId: string): Promise<void>;
  
  // Activity log operations
  createActivityLog(log: InsertResellerActivityLog): Promise<ResellerActivityLog>;
  getResellerActivityLogs(resellerId: string): Promise<ResellerActivityLog[]>;
  
  // EPOS Activity log operations
  createEposActivityLog(log: {
    userId: string;
    vendorId?: string;
    resellerId?: string;
    activityType: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any>;
  getEposActivityLogs(partnerId: string, partnerType: "vendor" | "reseller"): Promise<any[]>;
  
  // Coupon operations
  getCoupons(): Promise<Coupon[]>;
  getCoupon(id: string): Promise<Coupon | undefined>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | undefined>;
  deleteCoupon(id: string): Promise<void>;
  validateCoupon(code: string, subtotal: number, userId?: string, cartItems?: Array<{ productId: string; quantity: number }>): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
    discountAmount?: number;
    shippingDiscountAmount?: number;
    productRestricted?: boolean;
    restrictedProductId?: string;
    restrictedProductName?: string;
  }>;
  redeemCoupon(redemption: InsertCouponRedemption): Promise<CouponRedemption>;
  getCouponUsage(couponId: string): Promise<{
    totalRedemptions: number;
    totalDiscountAmount: number;
    recentRedemptions: any[];
  }>;
  
  // Site settings operations
  getSiteSettings(): Promise<SiteSettings | undefined>;
  updateSiteSettings(updates: { 
    activeTheme?: string; 
    chatbotVisible?: boolean;
    freeShippingEnabled?: boolean;
    freeShippingThreshold?: string;
    standardShippingCost?: string;
    heroSlideDuration?: number;
    minimumPayoutAmount?: string;
    showHeroProducts?: boolean;
  }, updatedBy?: string): Promise<SiteSettings>;
  
  // Announcement banner operations
  getAnnouncementBanner(): Promise<AnnouncementBanner | undefined>;
  updateAnnouncementBanner(data: Partial<InsertAnnouncementBanner> & { updatedBy?: string }): Promise<AnnouncementBanner>;
  
  // Popup message operations
  getPopupMessages(): Promise<PopupMessage[]>;
  getActivePopupMessage(): Promise<PopupMessage | undefined>;
  getPopupMessage(id: string): Promise<PopupMessage | undefined>;
  createPopupMessage(popup: InsertPopupMessage): Promise<PopupMessage>;
  updatePopupMessage(id: string, updates: Partial<PopupMessage>): Promise<PopupMessage | undefined>;
  deletePopupMessage(id: string): Promise<boolean>;
  
  // Section analytics operations
  trackSectionView(sectionName: string): Promise<void>;
  trackSectionClick(sectionName: string): Promise<void>;
  getSectionRankings(): Promise<{ sectionName: string; score: number }[]>;
  resetSectionAnalytics(): Promise<void>;
  
  // Reseller storefront operations
  getStorefrontBySlug(slug: string): Promise<ResellerStorefront | undefined>;
  getStorefrontByResellerId(resellerId: string): Promise<ResellerStorefront | undefined>;
  createStorefront(storefront: InsertResellerStorefront): Promise<ResellerStorefront>;
  updateStorefront(id: string, updates: Partial<ResellerStorefront>): Promise<ResellerStorefront | undefined>;
  
  // Reseller product operations
  getResellerProducts(resellerId: string): Promise<any[]>;
  getResellerProductsWithDetails(resellerId: string): Promise<any[]>;
  addProductToStorefront(product: InsertResellerProduct): Promise<ResellerProduct>;
  removeProductFromStorefront(id: string): Promise<boolean>;
  updateResellerProduct(id: string, updates: Partial<ResellerProduct>): Promise<ResellerProduct | undefined>;
  
  // Commission rule operations
  getAllCommissionRules(): Promise<CommissionRule[]>;
  getActiveCommissionRules(): Promise<CommissionRule[]>;
  getCommissionRule(id: string): Promise<CommissionRule | undefined>;
  getCommissionRulesForReseller(resellerId: string): Promise<CommissionRule[]>;
  getCommissionRulesForProduct(productId: string): Promise<CommissionRule[]>;
  createCommissionRule(rule: InsertCommissionRule): Promise<CommissionRule>;
  updateCommissionRule(id: string, updates: Partial<CommissionRule>): Promise<CommissionRule | undefined>;
  deleteCommissionRule(id: string): Promise<boolean>;
  
  // Commission payment operations
  getCommissionPayment(id: string): Promise<CommissionPayment | undefined>;
  getCommissionPaymentsByReseller(resellerId: string): Promise<CommissionPayment[]>;
  getPendingCommissionPayments(): Promise<CommissionPayment[]>;
  createCommissionPayment(payment: InsertCommissionPayment): Promise<CommissionPayment>;
  updateCommissionPayment(id: string, updates: Partial<CommissionPayment>): Promise<CommissionPayment | undefined>;
  
  // Payout request operations
  getPayoutRequest(id: string): Promise<PayoutRequest | undefined>;
  getPayoutRequestsByReseller(resellerId: string): Promise<PayoutRequest[]>;
  getAllPayoutRequests(): Promise<PayoutRequest[]>;
  getPendingPayoutRequests(): Promise<PayoutRequest[]>;
  createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest>;
  updatePayoutRequest(id: string, updates: Partial<PayoutRequest>): Promise<PayoutRequest | undefined>;
  getResellerEarningsBalance(resellerId: string): Promise<{ totalEarned: number; totalPaidOut: number; pendingPayout: number; availableBalance: number; catalogueCommission: number; ownProductsRevenue: number }>;
  getResellersWithBalances(): Promise<Array<{
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    stripeAccountId: string | null;
    stripeOnboardingStatus: string | null;
    stripeChargesEnabled: boolean | null;
    totalEarned: number;
    totalPaidOut: number;
    pendingPayout: number;
    availableBalance: number;
    catalogueCommission: number;
    ownProductsRevenue: number;
  }>>;
  getVendorsWithBalances(): Promise<Array<{
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    stripeAccountId: string | null;
    stripeOnboardingStatus: string | null;
    stripeChargesEnabled: boolean | null;
    totalEarned: number;
    totalPaidOut: number;
    pendingPayout: number;
    availableBalance: number;
  }>>;
  
  // Payout audit log operations
  createPayoutAuditLog(log: InsertPayoutAuditLog): Promise<PayoutAuditLog>;
  getPayoutAuditLogs(payoutId: string): Promise<PayoutAuditLog[]>;
  
  // Chatbot operations
  getChatbotKnowledge(): Promise<ChatbotKnowledge[]>;
  getActiveChatbotKnowledge(): Promise<ChatbotKnowledge[]>;
  getChatbotKnowledgeById(id: string): Promise<ChatbotKnowledge | undefined>;
  createChatbotKnowledge(knowledge: InsertChatbotKnowledge & { createdBy?: string }): Promise<ChatbotKnowledge>;
  updateChatbotKnowledge(id: string, updates: Partial<ChatbotKnowledge>): Promise<ChatbotKnowledge | undefined>;
  deleteChatbotKnowledge(id: string): Promise<boolean>;
  getOrCreateConversation(sessionId: string, userId?: string): Promise<ChatbotConversation>;
  getConversationMessages(conversationId: string): Promise<ChatbotMessage[]>;
  saveChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage>;
  createUnansweredQuery(query: InsertChatbotUnansweredQuery): Promise<ChatbotUnansweredQuery>;
  getUnansweredQueries(): Promise<ChatbotUnansweredQuery[]>;
  resolveUnansweredQuery(id: string, resolvedBy: string): Promise<ChatbotUnansweredQuery | undefined>;
  markQueryEmailSent(id: string): Promise<void>;
  getUserById(userId: string): Promise<User | undefined>;
  getProducts(): Promise<Product[]>;
  
  // Inventory management operations
  getAllProductVariantsWithInventory(): Promise<any[]>;
  searchProductVariantByBarcode(query: string): Promise<any | undefined>;
  addInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  updateProductVariantStock(variantId: string, quantityChange: number): Promise<void>;
  getInventoryTransactions(variantId?: string, limit?: number): Promise<InventoryTransaction[]>;
  
  // Hero video operations
  getHeroVideos(): Promise<HeroVideo[]>;
  getActiveHeroVideos(): Promise<HeroVideo[]>;
  getHeroVideo(id: string): Promise<HeroVideo | undefined>;
  createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo>;
  updateHeroVideo(id: string, updates: Partial<HeroVideo>): Promise<HeroVideo | undefined>;
  deleteHeroVideo(id: string): Promise<boolean>;
  reorderHeroVideos(videoIds: string[]): Promise<void>;
  
  // Hero image operations
  getHeroImages(): Promise<HeroImage[]>;
  getActiveHeroImages(includeHeroProducts?: boolean): Promise<HeroImage[]>;
  getHeroImage(id: string): Promise<HeroImage | undefined>;
  createHeroImage(image: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: string, updates: Partial<HeroImage>): Promise<HeroImage | undefined>;
  deleteHeroImage(id: string): Promise<boolean>;
  reorderHeroImages(imageIds: string[]): Promise<void>;
  
  // ============================================================================
  // CRM & MARKETING OPERATIONS
  // ============================================================================
  
  // Loyalty tier benefits operations
  getLoyaltyTierBenefits(): Promise<LoyaltyTierBenefits[]>;
  getLoyaltyTierBenefit(tier: string): Promise<LoyaltyTierBenefits | undefined>;
  upsertLoyaltyTierBenefits(benefits: InsertLoyaltyTierBenefits): Promise<LoyaltyTierBenefits>;
  
  // Customer segments operations
  getCustomerSegments(): Promise<any[]>;
  getCustomerSegment(id: string): Promise<any | undefined>;
  createCustomerSegment(segment: { name: string; description?: string; criteria: string }): Promise<any>;
  updateCustomerSegment(id: string, updates: Partial<any>): Promise<any | undefined>;
  deleteCustomerSegment(id: string): Promise<boolean>;
  getSegmentMembers(segmentId: string): Promise<any[]>;
  addCustomerToSegment(segmentId: string, userId: string): Promise<void>;
  removeCustomerFromSegment(segmentId: string, userId: string): Promise<void>;
  refreshSegmentMembers(segmentId: string): Promise<number>;
  
  // Email template operations
  getEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;
  
  // Email campaign operations
  getEmailCampaigns(): Promise<EmailCampaign[]>;
  getEmailCampaign(id: string): Promise<EmailCampaign | undefined>;
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined>;
  deleteEmailCampaign(id: string): Promise<boolean>;
  sendEmailCampaign(campaignId: string): Promise<{ success: boolean; sent: number; failed: number }>;
  getCampaignSends(campaignId: string): Promise<EmailCampaignSend[]>;
  recordCampaignOpen(sendId: string): Promise<void>;
  recordCampaignClick(sendId: string): Promise<void>;
  
  // Marketing automation operations
  getMarketingAutomations(): Promise<MarketingAutomation[]>;
  getMarketingAutomation(id: string): Promise<MarketingAutomation | undefined>;
  createMarketingAutomation(automation: InsertMarketingAutomation): Promise<MarketingAutomation>;
  updateMarketingAutomation(id: string, updates: Partial<MarketingAutomation>): Promise<MarketingAutomation | undefined>;
  deleteMarketingAutomation(id: string): Promise<boolean>;
  getAutomationSteps(automationId: string): Promise<AutomationStep[]>;
  createAutomationStep(step: InsertAutomationStep): Promise<AutomationStep>;
  updateAutomationStep(id: string, updates: Partial<AutomationStep>): Promise<AutomationStep | undefined>;
  deleteAutomationStep(id: string): Promise<boolean>;
  
  // Marketing tags operations
  getMarketingTags(): Promise<MarketingTag[]>;
  createMarketingTag(tag: InsertMarketingTag): Promise<MarketingTag>;
  updateMarketingTag(id: string, data: Partial<InsertMarketingTag>): Promise<MarketingTag | null>;
  deleteMarketingTag(id: string): Promise<boolean>;
  getCustomerTags(userId: string): Promise<any[]>;
  addTagToCustomer(userId: string, tagId: string, addedBy?: string): Promise<CustomerTag>;
  removeTagFromCustomer(userId: string, tagId: string): Promise<void>;
  
  // Email unsubscribe operations
  isEmailUnsubscribed(email: string): Promise<boolean>;
  unsubscribeEmail(data: InsertEmailUnsubscribe): Promise<EmailUnsubscribe>;
  resubscribeEmail(email: string): Promise<void>;
  
  // Newsletter subscription operations
  subscribeToNewsletter(data: InsertNewsletterSubscription): Promise<NewsletterSubscription>;
  getNewsletterSubscription(email: string): Promise<NewsletterSubscription | undefined>;
  getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;
  unsubscribeFromNewsletter(email: string): Promise<void>;
  
  // Marketing dashboard stats
  getMarketingDashboardStats(): Promise<{
    totalSubscribers: number;
    unsubscribes: number;
    totalCampaigns: number;
    sentCampaigns: number;
    avgOpenRate: number;
    avgClickRate: number;
    totalAutomations: number;
    activeAutomations: number;
    recentCampaigns: EmailCampaign[];
  }>;

  // Referral program operations
  getReferralProgramSettings(): Promise<ReferralProgramSettings | undefined>;
  updateReferralProgramSettings(updates: Partial<ReferralProgramSettings>): Promise<ReferralProgramSettings>;
  getReferralCode(userId: string): Promise<ReferralCode | undefined>;
  getReferralCodeByCode(code: string): Promise<ReferralCode | undefined>;
  createReferralCode(userId: string): Promise<ReferralCode>;
  updateReferralCode(userId: string, updates: Partial<ReferralCode>): Promise<ReferralCode | undefined>;
  createReferral(data: InsertReferral): Promise<Referral>;
  getReferral(id: string): Promise<Referral | undefined>;
  getReferralByRefereeEmail(email: string): Promise<Referral | undefined>;
  getReferralsByReferrer(userId: string): Promise<Referral[]>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined>;
  convertReferral(referralId: string, orderId: string, orderAmount: number): Promise<Referral>;
  rewardReferrer(referralId: string, rewardType: string, rewardAmount: number): Promise<ReferralReward>;
  getReferralRewards(userId: string): Promise<ReferralReward[]>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    referralCode: string;
  }>;
  sendReferralInvitation(data: InsertReferralInvitation): Promise<ReferralInvitation>;
  getReferralInvitations(userId: string): Promise<ReferralInvitation[]>;
  getAdminReferralStats(): Promise<{
    totalReferralCodes: number;
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsGiven: number;
    topReferrers: any[];
  }>;

  // Commission Tier operations
  getAllCommissionTiers(): Promise<CommissionTier[]>;
  getCommissionTiersByPartnerType(partnerType: 'reseller' | 'vendor'): Promise<CommissionTier[]>;
  getCommissionTier(id: string): Promise<CommissionTier | undefined>;
  createCommissionTier(tier: InsertCommissionTier): Promise<CommissionTier>;
  updateCommissionTier(id: string, updates: Partial<CommissionTier>): Promise<CommissionTier | undefined>;
  deleteCommissionTier(id: string): Promise<boolean>;

  // Partner Sales Summary operations
  getPartnerSalesSummary(partnerType: 'reseller' | 'vendor', partnerId: string): Promise<PartnerSalesSummary | undefined>;
  createOrUpdatePartnerSalesSummary(summary: InsertPartnerSalesSummary): Promise<PartnerSalesSummary>;
  updatePartnerSalesAndCheckTierUpgrade(partnerType: 'reseller' | 'vendor', partnerId: string, saleAmount: number): Promise<{ upgraded: boolean; newTier?: CommissionTier }>;

  // Commission Tier History operations
  getCommissionTierHistory(partnerType: 'reseller' | 'vendor', partnerId: string): Promise<CommissionTierHistory[]>;
  createCommissionTierHistory(history: InsertCommissionTierHistory): Promise<CommissionTierHistory>;

  // License Settings operations
  getLicenseSettings(): Promise<LicenseSettings[]>;
  getLicenseSettingByType(licenseType: string): Promise<LicenseSettings | undefined>;
  updateLicenseSettings(id: string, updates: Partial<LicenseSettings>): Promise<LicenseSettings | undefined>;

  // Subscription Tier Pricing operations
  getAllSubscriptionTiers(): Promise<SubscriptionTierPricing[]>;
  getSubscriptionTierByName(tierName: string): Promise<SubscriptionTierPricing | undefined>;
  updateSubscriptionTier(id: string, updates: Partial<SubscriptionTierPricing>): Promise<SubscriptionTierPricing | undefined>;
  initializeDefaultTiers(): Promise<void>;

  // Reseller License Request operations
  createResellerLicenseRequest(request: InsertResellerLicenseRequest): Promise<ResellerLicenseRequest>;
  getResellerLicenseRequest(id: string): Promise<ResellerLicenseRequest | undefined>;
  getResellerLicenseRequests(resellerId: string): Promise<ResellerLicenseRequest[]>;
  getAllResellerLicenseRequests(filters?: { status?: string }): Promise<ResellerLicenseRequest[]>;
  updateResellerLicenseRequest(id: string, updates: Partial<ResellerLicenseRequest>): Promise<ResellerLicenseRequest | undefined>;
  approveResellerLicenseRequest(id: string, adminUserId: string, notes?: string): Promise<ResellerLicenseRequest | undefined>;
  rejectResellerLicenseRequest(id: string, adminUserId: string, reason: string): Promise<ResellerLicenseRequest | undefined>;

  // Vendor Wholesale Request operations
  createVendorWholesaleRequest(request: InsertVendorWholesaleRequest): Promise<VendorWholesaleRequest>;
  getVendorWholesaleRequest(id: string): Promise<VendorWholesaleRequest | undefined>;
  getVendorWholesaleRequests(vendorId: string): Promise<VendorWholesaleRequest[]>;
  getAllVendorWholesaleRequests(filters?: { status?: string }): Promise<VendorWholesaleRequest[]>;
  updateVendorWholesaleRequest(id: string, updates: Partial<VendorWholesaleRequest>): Promise<VendorWholesaleRequest | undefined>;
  approveVendorWholesaleRequest(id: string, adminUserId: string, notes?: string): Promise<VendorWholesaleRequest | undefined>;
  rejectVendorWholesaleRequest(id: string, adminUserId: string, reason: string): Promise<VendorWholesaleRequest | undefined>;

  // Reseller Licence Tier operations
  getResellerLicence(resellerId: string): Promise<ResellerLicence | undefined>;
  createResellerLicence(resellerId: string): Promise<ResellerLicence>;
  updateResellerLicence(id: string, updates: Partial<ResellerLicence>): Promise<ResellerLicence | undefined>;
  activateResellerLicence(resellerId: string, tier: 'bronze' | 'silver' | 'gold', stripeSubscriptionId?: string): Promise<ResellerLicence | undefined>;
  cancelResellerLicence(resellerId: string, reason?: string): Promise<ResellerLicence | undefined>;
  getResellerProductCount(resellerId: string): Promise<number>;
  canResellerAddProduct(resellerId: string): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number | null }>;
  getAllResellerLicences(): Promise<ResellerLicence[]>;
  approveResellerTrialRequest(licenceId: string, adminUserId: string, trialDays?: number): Promise<ResellerLicence | undefined>;
  rejectResellerTrialRequest(licenceId: string): Promise<ResellerLicence | undefined>;
  getPendingTrialRequests(): Promise<ResellerLicence[]>;
  
  // Reseller Analytics (for admin)
  getResellerSalesFromOwnProducts(resellerId: string): Promise<{ totalSales: number; orderCount: number }>;
  getAllResellersWithAnalytics(): Promise<Array<{
    reseller: any;
    licence: ResellerLicence | null;
    productCount: number;
    salesTotal: number;
    orderCount: number;
  }>>;
  
  // Active licensed resellers with full metrics
  getActiveLicensedResellersWithMetrics(): Promise<Array<{
    reseller: any;
    licence: ResellerLicence;
    trialDaysPassed: number | null;
    trialDaysRemaining: number | null;
    isOnTrial: boolean;
    subscriptionTier: string | null;
    productCount: number;
    ownProductsRevenue: number;
    orderCount: number;
  }>>;

  // Team documents
  getTeamDocuments(category?: string): Promise<TeamDocument[]>;
  getTeamDocument(id: string): Promise<TeamDocument | undefined>;
  createTeamDocument(doc: InsertTeamDocument): Promise<TeamDocument>;
  deleteTeamDocument(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getAllAdmins(): Promise<User[]> {
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    return admins;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async upsertSocialUser(userData: { id: string; email: string | null; firstName: string | null; lastName: string | null; profileImageUrl: string | null; provider: string }): Promise<User> {
    // Extract provider user ID and provider name
    const providerUserId = userData.id;
    const provider = userData.provider; // Use the actual provider (google, github, x, apple)

    // Step 1: Check if this social identity already exists
    const [existingIdentity] = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId)
        )
      );

    if (existingIdentity) {
      // Identity exists, get and update the linked user
      const user = await this.getUser(existingIdentity.userId);
      if (user) {
        const [updated] = await db
          .update(users)
          .set({
            firstName: userData.firstName || user.firstName,
            lastName: userData.lastName || user.lastName,
            profileImageUrl: userData.profileImageUrl || user.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
        return updated;
      }
    }

    // Step 2: Check if a user with this email already exists
    let userId: string;
    if (userData.email) {
      const existingUser = await this.getUserByEmail(userData.email);
      if (existingUser) {
        // Link this social provider to existing user
        userId = existingUser.id;
        
        // Update user profile with social data if better
        await db
          .update(users)
          .set({
            firstName: userData.firstName || existingUser.firstName,
            lastName: userData.lastName || existingUser.lastName,
            profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        // Create new user with UUID (let database generate it)
        const [newUser] = await db
          .insert(users)
          .values({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            role: 'customer',
          })
          .returning();
        userId = newUser.id;
      }
    } else {
      // No email provided, create user with generated email
      const [newUser] = await db
        .insert(users)
        .values({
          email: `user-${providerUserId.replace(/[^a-zA-Z0-9]/g, '-')}@social.local`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: 'customer',
        })
        .returning();
      userId = newUser.id;
    }

    // Step 3: Create auth identity linking this provider to the user
    await db
      .insert(authIdentities)
      .values({
        userId,
        provider,
        providerUserId,
        email: userData.email,
        profileImageUrl: userData.profileImageUrl,
      })
      .onConflictDoNothing();

    // Return the user
    const user = await this.getUser(userId);
    return user!;
  }

  // Password reset operations
  async createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values(token)
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async deletePasswordResetToken(token: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  // OTP operations
  async createPasswordResetOTP(otp: InsertPasswordResetOTP): Promise<PasswordResetOTP> {
    // Delete any existing OTPs for this email first
    await db.delete(passwordResetOTPs).where(eq(passwordResetOTPs.email, otp.email));
    
    const [newOTP] = await db
      .insert(passwordResetOTPs)
      .values(otp)
      .returning();
    return newOTP;
  }

  async getPasswordResetOTP(email: string, otp: string): Promise<PasswordResetOTP | undefined> {
    const [resetOTP] = await db
      .select()
      .from(passwordResetOTPs)
      .where(and(eq(passwordResetOTPs.email, email), eq(passwordResetOTPs.otp, otp)));
    return resetOTP || undefined;
  }

  async verifyPasswordResetOTP(email: string, otp: string): Promise<boolean> {
    const [resetOTP] = await db
      .select()
      .from(passwordResetOTPs)
      .where(and(eq(passwordResetOTPs.email, email), eq(passwordResetOTPs.otp, otp)));
    
    if (!resetOTP) return false;
    if (new Date() > new Date(resetOTP.expiresAt)) {
      await db.delete(passwordResetOTPs).where(eq(passwordResetOTPs.id, resetOTP.id));
      return false;
    }

    // Mark as verified
    await db
      .update(passwordResetOTPs)
      .set({ isVerified: true })
      .where(eq(passwordResetOTPs.id, resetOTP.id));

    return true;
  }

  async deletePasswordResetOTP(email: string, otp: string): Promise<void> {
    await db
      .delete(passwordResetOTPs)
      .where(and(eq(passwordResetOTPs.email, email), eq(passwordResetOTPs.otp, otp)));
  }

  async deleteExpiredPasswordResetOTPs(): Promise<void> {
    await db
      .delete(passwordResetOTPs)
      .where(sql`${passwordResetOTPs.expiresAt} < NOW()`);
  }

  // Reseller operations
  async getReseller(id: string): Promise<Reseller | undefined> {
    const [reseller] = await db.select().from(resellers).where(eq(resellers.id, id));
    return reseller || undefined;
  }

  async getResellerByUserId(userId: string): Promise<Reseller | undefined> {
    const [reseller] = await db.select().from(resellers).where(eq(resellers.userId, userId));
    return reseller || undefined;
  }

  async createReseller(insertReseller: InsertReseller): Promise<Reseller> {
    const [reseller] = await db
      .insert(resellers)
      .values(insertReseller)
      .returning();
    return reseller;
  }

  async updateReseller(id: string, updates: Partial<Reseller>): Promise<Reseller | undefined> {
    const [reseller] = await db
      .update(resellers)
      .set(updates)
      .where(eq(resellers.id, id))
      .returning();
    return reseller || undefined;
  }

  async getAllResellers(): Promise<Reseller[]> {
    const results = await db
      .select({
        id: resellers.id,
        userId: resellers.userId,
        businessName: resellers.businessName,
        contactPerson: resellers.contactPerson,
        phoneNumber: resellers.phoneNumber,
        businessAddress: resellers.businessAddress,
        tier: resellers.tier,
        discountPercentage: resellers.discountPercentage,
        creditLimit: resellers.creditLimit,
        currentCredit: resellers.currentCredit,
        approvalStatus: resellers.approvalStatus,
        isActive: resellers.isActive,
        registrationDate: resellers.registrationDate,
        approvedBy: resellers.approvedBy,
        approvedAt: resellers.approvedAt,
        rejectionReason: resellers.rejectionReason,
        lastOrderDate: resellers.lastOrderDate,
        email: users.email,
        // Timestamp only — never select ownSquareAccessTokenEnc for a list
        // endpoint like this one; the frontend only needs to know whether
        // it's connected, not the credential itself.
        ownSquareSetupAt: resellers.ownSquareSetupAt,
      })
      .from(resellers)
      .leftJoin(users, eq(resellers.userId, users.id))
      .orderBy(desc(resellers.registrationDate));
    return results as any;
  }

  async getPendingResellers(): Promise<Reseller[]> {
    const results = await db
      .select({
        id: resellers.id,
        userId: resellers.userId,
        businessName: resellers.businessName,
        contactPerson: resellers.contactPerson,
        phoneNumber: resellers.phoneNumber,
        businessAddress: resellers.businessAddress,
        tier: resellers.tier,
        discountPercentage: resellers.discountPercentage,
        creditLimit: resellers.creditLimit,
        currentCredit: resellers.currentCredit,
        approvalStatus: resellers.approvalStatus,
        registrationDate: resellers.registrationDate,
        approvedBy: resellers.approvedBy,
        approvedAt: resellers.approvedAt,
        rejectionReason: resellers.rejectionReason,
        lastOrderDate: resellers.lastOrderDate,
        email: users.email,
      })
      .from(resellers)
      .leftJoin(users, eq(resellers.userId, users.id))
      .where(eq(resellers.approvalStatus, "pending"))
      .orderBy(desc(resellers.registrationDate));
    return results as any;
  }

  async approveReseller(id: string, approvedByUserId: string, commissionRate?: string): Promise<Reseller | undefined> {
    const updateData: any = {
      approvalStatus: "approved",
      approvedBy: approvedByUserId,
      approvedAt: new Date(),
      rejectionReason: null
    };
    if (commissionRate !== undefined) {
      updateData.commissionRate = commissionRate;
    }
    const [reseller] = await db
      .update(resellers)
      .set(updateData)
      .where(eq(resellers.id, id))
      .returning();
    
    if (reseller) {
      // Auto-add all 1stRep products to the reseller's storefront and EPOS
      try {
        const allProducts = await db.select({ id: products.id }).from(products).where(eq(products.isActive, true));
        
        // Check which products are already added
        const existingProducts = await db.select({ productId: resellerProducts.productId })
          .from(resellerProducts)
          .where(eq(resellerProducts.resellerId, id));
        const existingProductIds = new Set(existingProducts.map(p => p.productId));
        
        // Add products that aren't already added
        const productsToAdd = allProducts.filter(p => !existingProductIds.has(p.id));
        if (productsToAdd.length > 0) {
          await db.insert(resellerProducts).values(
            productsToAdd.map((product, index) => ({
              resellerId: id,
              productId: product.id,
              isActive: true,
              displayOrder: index
            }))
          );
          console.log(`Auto-added ${productsToAdd.length} 1stRep products to reseller ${reseller.businessName}`);
        }
      } catch (error) {
        console.error('Failed to auto-add products to reseller:', error);
        // Don't fail the approval if product sync fails
      }
    }
    
    return reseller || undefined;
  }

  async updateResellerCommissionRate(id: string, commissionRate: string): Promise<Reseller | undefined> {
    const [reseller] = await db
      .update(resellers)
      .set({ commissionRate })
      .where(eq(resellers.id, id))
      .returning();
    return reseller || undefined;
  }

  async rejectReseller(id: string, rejectionReason: string): Promise<Reseller | undefined> {
    const [reseller] = await db
      .update(resellers)
      .set({
        approvalStatus: "rejected",
        rejectionReason,
        approvedBy: null,
        approvedAt: null
      })
      .where(eq(resellers.id, id))
      .returning();
    return reseller || undefined;
  }

  // Vendor operations
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor || undefined;
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db
      .insert(vendors)
      .values(insertVendor)
      .returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set(updates)
      .where(eq(vendors.id, id))
      .returning();
    return vendor || undefined;
  }

  async getAllVendors(): Promise<any[]> {
    const vendorList = await db.select().from(vendors).orderBy(desc(vendors.registrationDate));
    const vendorsWithUserData = await Promise.all(
      vendorList.map(async (vendor) => {
        const user = await this.getUser(vendor.userId);
        return {
          ...vendor,
          email: user?.email || '',
          contactPerson: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.firstName || user?.lastName || user?.username || 'N/A',
        };
      })
    );
    return vendorsWithUserData;
  }

  async getPendingVendors(): Promise<any[]> {
    const vendorList = await db.select().from(vendors).where(eq(vendors.approvalStatus, "pending")).orderBy(desc(vendors.registrationDate));
    const vendorsWithUserData = await Promise.all(
      vendorList.map(async (vendor) => {
        const user = await this.getUser(vendor.userId);
        return {
          ...vendor,
          email: user?.email || '',
          contactPerson: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.firstName || user?.lastName || user?.username || 'N/A',
        };
      })
    );
    return vendorsWithUserData;
  }

  async approveVendor(id: string, approvedByUserId: string, commissionRate?: string): Promise<Vendor | undefined> {
    const updateData: any = {
      approvalStatus: "approved",
      approvedBy: approvedByUserId,
      approvedAt: new Date(),
      rejectionReason: null
    };
    if (commissionRate !== undefined) {
      updateData.commissionRate = commissionRate;
    }
    const [vendor] = await db
      .update(vendors)
      .set(updateData)
      .where(eq(vendors.id, id))
      .returning();
    
    if (vendor) {
      // Auto-add all 1stRep products to the vendor's partner products for EPOS and storefront
      try {
        const allProducts = await db.select({ id: products.id }).from(products).where(eq(products.isActive, true));
        
        // Check which products are already added
        const existingProducts = await db.select({ productId: vendorPartnerProducts.productId })
          .from(vendorPartnerProducts)
          .where(eq(vendorPartnerProducts.vendorId, id));
        const existingProductIds = new Set(existingProducts.map(p => p.productId));
        
        // Add products that aren't already added
        const productsToAdd = allProducts.filter(p => !existingProductIds.has(p.id));
        if (productsToAdd.length > 0) {
          await db.insert(vendorPartnerProducts).values(
            productsToAdd.map((product, index) => ({
              vendorId: id,
              productId: product.id,
              isActive: true,
              displayOrder: index
            }))
          );
          console.log(`Auto-added ${productsToAdd.length} 1stRep products to vendor ${vendor.businessName}`);
        }
      } catch (error) {
        console.error('Failed to auto-add products to vendor:', error);
        // Don't fail the approval if product sync fails
      }
    }
    
    return vendor || undefined;
  }

  async updateVendorCommissionRate(id: string, commissionRate: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ commissionRate })
      .where(eq(vendors.id, id))
      .returning();
    return vendor || undefined;
  }

  async rejectVendor(id: string, rejectionReason: string): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({
        approvalStatus: "rejected",
        rejectionReason,
        approvedBy: null,
        approvedAt: null
      })
      .where(eq(vendors.id, id))
      .returning();
    return vendor || undefined;
  }

  async createVendorProduct(insertProduct: InsertVendorProduct): Promise<VendorProduct> {
    const [product] = await db
      .insert(vendorProducts)
      .values(insertProduct)
      .returning();
    return product;
  }

  async getVendorProducts(vendorId: string): Promise<VendorProduct[]> {
    return await db.select().from(vendorProducts).where(eq(vendorProducts.vendorId, vendorId));
  }

  async getVendorProduct(id: string): Promise<VendorProduct | undefined> {
    const [product] = await db.select().from(vendorProducts).where(eq(vendorProducts.id, id));
    return product || undefined;
  }

  async updateVendorProduct(id: string, updates: Partial<VendorProduct>): Promise<VendorProduct | undefined> {
    const [product] = await db
      .update(vendorProducts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorProducts.id, id))
      .returning();
    return product || undefined;
  }

  async deleteVendorProduct(id: string): Promise<boolean> {
    const result = await db.delete(vendorProducts).where(eq(vendorProducts.id, id));
    return true;
  }

  async getAllActiveVendorProducts(): Promise<VendorProduct[]> {
    return await db.select().from(vendorProducts).where(eq(vendorProducts.isActive, true)).orderBy(desc(vendorProducts.createdAt));
  }

  // Vendor Product Variant operations
  async getVendorProductVariants(vendorProductId: string): Promise<VendorProductVariant[]> {
    return await db.select().from(vendorProductVariants).where(eq(vendorProductVariants.vendorProductId, vendorProductId));
  }

  async getVendorProductVariantsByVendorProductIds(vendorProductIds: string[]): Promise<VendorProductVariant[]> {
    if (vendorProductIds.length === 0) return [];
    return await db.select().from(vendorProductVariants).where(inArray(vendorProductVariants.vendorProductId, vendorProductIds));
  }

  async getVendorProductVariant(id: string): Promise<VendorProductVariant | undefined> {
    const [variant] = await db.select().from(vendorProductVariants).where(eq(vendorProductVariants.id, id));
    return variant || undefined;
  }

  async createVendorProductVariant(insertVariant: InsertVendorProductVariant): Promise<VendorProductVariant> {
    const [variant] = await db
      .insert(vendorProductVariants)
      .values(insertVariant)
      .returning();
    return variant;
  }

  async updateVendorProductVariant(id: string, updates: Partial<VendorProductVariant>): Promise<VendorProductVariant | undefined> {
    const [variant] = await db
      .update(vendorProductVariants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorProductVariants.id, id))
      .returning();
    return variant || undefined;
  }

  async deleteVendorProductVariant(id: string): Promise<boolean> {
    await db.delete(vendorProductVariants).where(eq(vendorProductVariants.id, id));
    return true;
  }

  // Vendor Reseller Permissions operations
  async grantVendorResellerPermission(insertPermission: InsertVendorResellerPermission): Promise<VendorResellerPermission> {
    const [permission] = await db
      .insert(vendorResellerPermissions)
      .values(insertPermission)
      .onConflictDoUpdate({
        target: [vendorResellerPermissions.vendorId, vendorResellerPermissions.resellerId, vendorResellerPermissions.vendorProductId],
        set: { updatedAt: new Date() }
      })
      .returning();
    return permission;
  }

  async revokeVendorResellerPermission(vendorId: string, resellerId: string, vendorProductId: string): Promise<void> {
    await db
      .delete(vendorResellerPermissions)
      .where(and(
        eq(vendorResellerPermissions.vendorId, vendorId),
        eq(vendorResellerPermissions.resellerId, resellerId),
        eq(vendorResellerPermissions.vendorProductId, vendorProductId)
      ));
  }

  async getVendorResellerPermissions(vendorId: string): Promise<VendorResellerPermission[]> {
    return await db
      .select()
      .from(vendorResellerPermissions)
      .where(eq(vendorResellerPermissions.vendorId, vendorId))
      .orderBy(desc(vendorResellerPermissions.createdAt));
  }

  async getResellerVendorPermissions(resellerId: string): Promise<VendorResellerPermission[]> {
    return await db
      .select()
      .from(vendorResellerPermissions)
      .where(eq(vendorResellerPermissions.resellerId, resellerId))
      .orderBy(desc(vendorResellerPermissions.createdAt));
  }

  async approveVendorResellerPermission(vendorId: string, resellerId: string, vendorProductId: string): Promise<VendorResellerPermission | undefined> {
    const [permission] = await db
      .update(vendorResellerPermissions)
      .set({ isApproved: true, approvedAt: new Date() })
      .where(and(
        eq(vendorResellerPermissions.vendorId, vendorId),
        eq(vendorResellerPermissions.resellerId, resellerId),
        eq(vendorResellerPermissions.vendorProductId, vendorProductId)
      ))
      .returning();
    return permission || undefined;
  }

  // Category operations
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.displayOrder);
  }

  async getActiveCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.displayOrder);
  }

  async getGlobalCategories(): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.scope, 'global')).orderBy(categories.displayOrder);
  }

  async getVendorCategories(vendorId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.vendorId, vendorId)).orderBy(categories.displayOrder);
  }

  async getCategoriesForVendor(vendorId: string): Promise<Category[]> {
    // Get both global categories and vendor's own categories
    const result = await db.select().from(categories).where(
      sql`${categories.scope} = 'global' OR ${categories.vendorId} = ${vendorId}`
    ).orderBy(categories.displayOrder);
    return result;
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const [updatedCategory] = await db.update(categories).set({ ...updates, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
    return updatedCategory || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Product Section operations
  async getAllProductSections(): Promise<ProductSection[]> {
    return db.select().from(productSections).orderBy(productSections.displayOrder);
  }

  async getActiveProductSections(): Promise<ProductSection[]> {
    return db.select().from(productSections).where(eq(productSections.isActive, true)).orderBy(productSections.displayOrder);
  }

  async getProductSection(id: string): Promise<ProductSection | undefined> {
    const [section] = await db.select().from(productSections).where(eq(productSections.id, id));
    return section || undefined;
  }

  async getProductSectionBySlug(slug: string): Promise<ProductSection | undefined> {
    const [section] = await db.select().from(productSections).where(eq(productSections.slug, slug));
    return section || undefined;
  }

  async createProductSection(section: InsertProductSection): Promise<ProductSection> {
    const [newSection] = await db.insert(productSections).values(section).returning();
    return newSection;
  }

  async updateProductSection(id: string, updates: Partial<ProductSection>): Promise<ProductSection | undefined> {
    const [updatedSection] = await db.update(productSections).set({ ...updates, updatedAt: new Date() }).where(eq(productSections.id, id)).returning();
    return updatedSection || undefined;
  }

  async deleteProductSection(id: string): Promise<boolean> {
    const result = await db.delete(productSections).where(eq(productSections.id, id)).returning();
    return result.length > 0;
  }

  // Product Activity Type operations
  async getAllProductActivityTypes(): Promise<ProductActivityType[]> {
    return db.select().from(productActivityTypes).orderBy(productActivityTypes.displayOrder);
  }

  async getActiveProductActivityTypes(): Promise<ProductActivityType[]> {
    return db.select().from(productActivityTypes).where(eq(productActivityTypes.isActive, true)).orderBy(productActivityTypes.displayOrder);
  }

  async getProductActivityType(id: string): Promise<ProductActivityType | undefined> {
    const [activityType] = await db.select().from(productActivityTypes).where(eq(productActivityTypes.id, id));
    return activityType || undefined;
  }

  async getProductActivityTypeBySlug(slug: string): Promise<ProductActivityType | undefined> {
    const [activityType] = await db.select().from(productActivityTypes).where(eq(productActivityTypes.slug, slug));
    return activityType || undefined;
  }

  async createProductActivityType(activityType: InsertProductActivityType): Promise<ProductActivityType> {
    const [newActivityType] = await db.insert(productActivityTypes).values(activityType).returning();
    return newActivityType;
  }

  async updateProductActivityType(id: string, updates: Partial<ProductActivityType>): Promise<ProductActivityType | undefined> {
    const [updatedActivityType] = await db.update(productActivityTypes).set({ ...updates, updatedAt: new Date() }).where(eq(productActivityTypes.id, id)).returning();
    return updatedActivityType || undefined;
  }

  async deleteProductActivityType(id: string): Promise<boolean> {
    const result = await db.delete(productActivityTypes).where(eq(productActivityTypes.id, id)).returning();
    return result.length > 0;
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.sku, sku));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    // Only return active products that are NOT soft-deleted
    return await db.select().from(products).where(
      and(
        eq(products.isActive, true),
        eq(products.isDeleted, false)
      )
    );
  }

  async getAllProductsForExport(): Promise<Product[]> {
    // Get ALL products regardless of active status for export (but exclude deleted)
    return await db.select().from(products).where(eq(products.isDeleted, false));
  }
  
  async getDeletedProducts(): Promise<Product[]> {
    // Get soft-deleted products for admin recovery
    return await db.select().from(products).where(eq(products.isDeleted, true));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async updateProductCategoriesByName(oldCategory: string, newCategory: string): Promise<number> {
    // Update all products with the old category name to use the new category name
    const result = await db
      .update(products)
      .set({ category: newCategory, updatedAt: new Date() })
      .where(eq(products.category, oldCategory))
      .returning();
    return result.length;
  }

  // Product image operations
  async getProductImages(productId: string): Promise<ProductImage[]> {
    return await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder);
  }

  async getProductImage(id: string): Promise<ProductImage | undefined> {
    const [image] = await db
      .select()
      .from(productImages)
      .where(eq(productImages.id, id));
    return image || undefined;
  }

  async createProductImage(image: InsertProductImage): Promise<ProductImage> {
    const [newImage] = await db.insert(productImages).values(image).returning();
    return newImage;
  }

  async updateProductImage(id: string, updates: Partial<ProductImage>): Promise<ProductImage | undefined> {
    const [image] = await db
      .update(productImages)
      .set(updates)
      .where(eq(productImages.id, id))
      .returning();
    return image || undefined;
  }

  async deleteProductImage(id: string): Promise<boolean> {
    const result = await db.delete(productImages).where(eq(productImages.id, id)).returning();
    return result.length > 0;
  }

  async getProductColorImages(productId: string): Promise<ProductImage[]> {
    return await db
      .select()
      .from(productImages)
      .where(and(
        eq(productImages.productId, productId),
        isNotNull(productImages.color)
      ))
      .orderBy(productImages.sortOrder);
  }

  async deleteProductColorImages(productId: string): Promise<void> {
    await db
      .delete(productImages)
      .where(and(
        eq(productImages.productId, productId),
        isNotNull(productImages.color)
      ));
  }

  async setPrimaryImage(productId: string, imageId: string): Promise<void> {
    // First, set all images for this product to non-primary
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));
    
    // Then set the specified image as primary
    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imageId));
  }

  // Product variant operations
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async getProductVariantsByProductIds(productIds: string[]): Promise<ProductVariant[]> {
    if (productIds.length === 0) return [];
    return await db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
  }

  async getAllProductVariantsWithProducts(): Promise<any[]> {
    return await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        size: productVariants.size,
        color: productVariants.color,
        sku: productVariants.sku,
        barcodeDescriptor: productVariants.barcodeDescriptor,
        locationNote: productVariants.locationNote,
        stockQuantity: productVariants.stockQuantity,
        retailPrice: productVariants.retailPrice,
        wholesalePrice: productVariants.wholesalePrice,
        isActive: productVariants.isActive,
        productName: products.name,
        productSku: products.sku,
        productImage: products.imageUrl,
        category: products.category,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(
        eq(productVariants.isActive, true),
        or(eq(products.isDeleted, false), isNull(products.isDeleted)),
        or(eq(products.isActive, true), isNull(products.isActive))
      ))
      .orderBy(products.name, productVariants.size);
  }

  async getProductVariant(id: string): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, id));
    return variant || undefined;
  }

  async getProductVariantByDetails(
    productId: string, 
    size: string, 
    color?: string
  ): Promise<ProductVariant | undefined> {
    // Color name to hex mapping for common colors
    const colorNameToHex: { [key: string]: string } = {
      'black': '#000000',
      'charcoal': '#1a1a1a',
      'white': '#ffffff',
      'off white': '#f5f5f5',
      'navy': '#1e3a8a',
      'blue': '#1e40af',
      'red': '#dc2626',
      'green': '#16a34a',
      'purple': '#a855f7',
      'amber': '#f59e0b',
      'gray': '#6b7280',
      'grey': '#808080',
      'default': '',
    };
    
    // First, try to match with the color as provided
    const colorValue = color || '';
    let [variant] = await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.productId, productId),
        eq(productVariants.size, size),
        eq(productVariants.color, colorValue)
      ));
    
    // If not found and color looks like a name (not a hex code), try converting to hex
    if (!variant && colorValue && !colorValue.startsWith('#')) {
      const hexColor = colorNameToHex[colorValue.toLowerCase()];
      if (hexColor !== undefined) {
        [variant] = await db
          .select()
          .from(productVariants)
          .where(and(
            eq(productVariants.productId, productId),
            eq(productVariants.size, size),
            eq(productVariants.color, hexColor)
          ));
      }
    }
    
    return variant || undefined;
  }

  async createProductVariant(variant: InsertProductVariant): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async updateProductVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .update(productVariants)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productVariants.id, id))
      .returning();
    return variant || undefined;
  }

  async deleteProductVariant(id: string): Promise<boolean> {
    const result = await db.delete(productVariants).where(eq(productVariants.id, id)).returning();
    return result.length > 0;
  }

  // Atomic stock reduction with conditional check to prevent overselling
  async reduceProductVariantStock(id: string, quantityToReduce: number): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
    try {
      // Use a conditional update: only reduce stock if current stock >= quantityToReduce
      const [updatedVariant] = await db
        .update(productVariants)
        .set({ 
          stockQuantity: sql`${productVariants.stockQuantity} - ${quantityToReduce}`,
          updatedAt: new Date()
        })
        .where(and(
          eq(productVariants.id, id),
          sql`${productVariants.stockQuantity} >= ${quantityToReduce}`
        ))
        .returning();

      if (!updatedVariant) {
        // Update failed - either variant doesn't exist or insufficient stock
        const variant = await this.getProductVariant(id);
        if (!variant) {
          return { success: false, error: 'Variant not found' };
        }
        return { 
          success: false, 
          error: `Insufficient stock. Available: ${variant.stockQuantity}, Requested: ${quantityToReduce}`,
          variant
        };
      }

      return { success: true, variant: updatedVariant };
    } catch (error) {
      console.error('Error reducing product variant stock:', error);
      return { success: false, error: 'Database error during stock reduction' };
    }
  }

  // Product review operations
  async createOrUpdateReview(review: InsertProductReview): Promise<ProductReview> {
    const [newReview] = await db
      .insert(productReviews)
      .values(review)
      .onConflictDoUpdate({
        target: [productReviews.productId, productReviews.userId],
        set: {
          rating: review.rating,
          comment: review.comment,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    await this.updateProductRatingStats(review.productId);
    return newReview;
  }

  async getProductReviews(productId: string): Promise<any[]> {
    const reviews = await db
      .select({
        id: productReviews.id,
        productId: productReviews.productId,
        userId: productReviews.userId,
        rating: productReviews.rating,
        comment: productReviews.comment,
        isVerifiedPurchase: productReviews.isVerifiedPurchase,
        createdAt: productReviews.createdAt,
        updatedAt: productReviews.updatedAt,
        userName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        userFirstName: users.firstName,
        userLastName: users.lastName,
      })
      .from(productReviews)
      .innerJoin(users, eq(productReviews.userId, users.id))
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
    
    return reviews;
  }

  async getUserReviewForProduct(userId: string, productId: string): Promise<ProductReview | undefined> {
    const [review] = await db
      .select()
      .from(productReviews)
      .where(and(
        eq(productReviews.userId, userId),
        eq(productReviews.productId, productId)
      ));
    return review || undefined;
  }

  async updateProductRatingStats(productId: string): Promise<void> {
    const reviews = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId));
    
    const reviewCount = reviews.length;
    const averageRating = reviewCount > 0
      ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviewCount
      : 0;
    
    await db
      .update(products)
      .set({
        averageRating: averageRating.toFixed(2),
        reviewCount,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }

  async checkUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const [order] = await db
      .select()
      .from(customerOrderItems)
      .innerJoin(customerOrders, eq(customerOrderItems.orderId, customerOrders.id))
      .where(and(
        eq(customerOrders.userId, userId),
        eq(customerOrderItems.productId, productId),
        sql`${customerOrders.isPaid} = true`
      ))
      .limit(1);
    
    return !!order;
  }

  // Inventory operations
  async getResellerInventory(resellerId: string): Promise<ResellerInventory[]> {
    return await db
      .select()
      .from(resellerInventory)
      .where(eq(resellerInventory.resellerId, resellerId));
  }

  async getResellerInventoryWithProducts(resellerId: string): Promise<any[]> {
    return await db
      .select({
        id: resellerInventory.id,
        productId: resellerInventory.productId,
        size: resellerInventory.size,
        color: resellerInventory.color,
        quantity: resellerInventory.quantity,
        reservedQuantity: resellerInventory.reservedQuantity,
        reorderLevel: resellerInventory.reorderLevel,
        lastUpdated: resellerInventory.lastUpdated,
        productName: products.name,
        sku: products.sku,
        wholesalePrice: products.wholesalePrice,
        retailPrice: products.retailPrice,
        imageUrl: products.imageUrl
      })
      .from(resellerInventory)
      .innerJoin(products, eq(resellerInventory.productId, products.id))
      .where(eq(resellerInventory.resellerId, resellerId));
  }

  async getInventoryItem(resellerId: string, productId: string, size?: string, color?: string): Promise<ResellerInventory | undefined> {
    const conditions = [
      eq(resellerInventory.resellerId, resellerId),
      eq(resellerInventory.productId, productId)
    ];
    
    if (size) conditions.push(eq(resellerInventory.size, size));
    if (color) conditions.push(eq(resellerInventory.color, color));

    const [item] = await db
      .select()
      .from(resellerInventory)
      .where(and(...conditions));
    
    return item || undefined;
  }

  async updateInventory(resellerId: string, productId: string, quantity: number, size?: string, color?: string): Promise<ResellerInventory> {
    const existing = await this.getInventoryItem(resellerId, productId, size, color);
    
    if (existing) {
      const [updated] = await db
        .update(resellerInventory)
        .set({ 
          quantity, 
          lastUpdated: new Date() 
        })
        .where(eq(resellerInventory.id, existing.id))
        .returning();
      return updated;
    } else {
      return await this.createInventoryItem({
        resellerId,
        productId,
        size,
        color,
        quantity,
        reorderLevel: 5
      });
    }
  }

  async createInventoryItem(insertInventory: InsertInventory): Promise<ResellerInventory> {
    const [inventory] = await db
      .insert(resellerInventory)
      .values(insertInventory)
      .returning();
    return inventory;
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getResellerOrders(resellerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.resellerId, resellerId))
      .orderBy(desc(orders.orderDate));
  }

  async getAllOrders(): Promise<any[]> {
    // Get all B2B orders with reseller information
    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        resellerId: orders.resellerId,
        totalAmount: orders.totalAmount,
        discountAmount: orders.discountAmount,
        finalAmount: orders.finalAmount,
        paymentMethod: orders.paymentMethod,
        status: orders.status,
        shippingAddress: orders.shippingAddress,
        orderDate: orders.orderDate,
        confirmedDate: orders.confirmedDate,
        shippedDate: orders.shippedDate,
        deliveredDate: orders.deliveredDate,
        userId: resellers.userId,
        businessName: resellers.businessName,
        tier: resellers.tier,
      })
      .from(orders)
      .leftJoin(resellers, eq(orders.resellerId, resellers.id))
      .orderBy(desc(orders.orderDate));

    return allOrders;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const updates: any = { status };
    
    // Set timestamps based on status
    if (status === 'confirmed') updates.confirmedDate = new Date();
    if (status === 'shipped') updates.shippedDate = new Date();
    if (status === 'delivered') updates.deliveredDate = new Date();
    
    const [order] = await db
      .update(orders)
      .set(updates)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async deleteOrder(id: string): Promise<void> {
    // First delete all order items
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    // Then delete the order
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Order item operations
  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItems)
      .values(insertOrderItem)
      .returning();
    return orderItem;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  // Stock alert operations
  async getStockAlerts(resellerId: string): Promise<StockAlert[]> {
    return await db
      .select()
      .from(stockAlerts)
      .where(and(
        eq(stockAlerts.resellerId, resellerId),
        eq(stockAlerts.isResolved, false)
      ))
      .orderBy(desc(stockAlerts.createdAt));
  }

  async getStockAlertsWithProducts(resellerId: string): Promise<any[]> {
    return await db
      .select({
        id: stockAlerts.id,
        productId: stockAlerts.productId,
        size: stockAlerts.size,
        color: stockAlerts.color,
        currentQuantity: stockAlerts.currentQuantity,
        reorderLevel: stockAlerts.reorderLevel,
        isResolved: stockAlerts.isResolved,
        createdAt: stockAlerts.createdAt,
        productName: products.name,
        sku: products.sku
      })
      .from(stockAlerts)
      .innerJoin(products, eq(stockAlerts.productId, products.id))
      .where(and(
        eq(stockAlerts.resellerId, resellerId),
        eq(stockAlerts.isResolved, false)
      ))
      .orderBy(desc(stockAlerts.createdAt));
  }

  async createStockAlert(resellerId: string, productId: string, currentQuantity: number, reorderLevel: number, size?: string, color?: string): Promise<StockAlert> {
    const [alert] = await db
      .insert(stockAlerts)
      .values({
        resellerId,
        productId,
        size,
        color,
        currentQuantity,
        reorderLevel
      })
      .returning();
    return alert;
  }

  async resolveStockAlert(id: string): Promise<StockAlert | undefined> {
    const [alert] = await db
      .update(stockAlerts)
      .set({ isResolved: true })
      .where(eq(stockAlerts.id, id))
      .returning();
    return alert || undefined;
  }

  // Pricing operations
  async getProductPricing(productId: string, tier: string): Promise<PricingTier | undefined> {
    const [pricing] = await db
      .select()
      .from(pricingTiers)
      .where(and(
        eq(pricingTiers.productId, productId),
        eq(pricingTiers.tier, tier as any)
      ));
    return pricing || undefined;
  }

  // CRM operations
  async getAllCustomers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "customer"))
      .orderBy(desc(users.createdAt));
  }

  async getCustomerMetrics(userId: string): Promise<CustomerMetric | undefined> {
    const [metrics] = await db
      .select()
      .from(customerMetrics)
      .where(eq(customerMetrics.userId, userId));
    return metrics || undefined;
  }

  async getAllCustomerMetrics(): Promise<CustomerMetric[]> {
    // Get all customers
    const allCustomers = await db.select().from(users).where(eq(users.role, 'customer'));
    
    // Calculate metrics dynamically from actual orders (matching by userId OR email)
    const calculatedMetrics: CustomerMetric[] = [];
    
    for (const customer of allCustomers) {
      // Get orders by userId OR by email match (for guest orders)
      const orders = await db
        .select({
          id: customerOrders.id,
          totalAmount: customerOrders.totalAmount,
          orderDate: customerOrders.orderDate,
        })
        .from(customerOrders)
        .where(or(
          eq(customerOrders.userId, customer.id),
          sql`LOWER(${customerOrders.customerEmail}) = LOWER(${customer.email})`
        ));
      
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
      const lastOrder = orders.sort((a, b) => 
        new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
      )[0];
      
      // Check if there's existing metrics for VIP status
      const existingMetrics = await db
        .select()
        .from(customerMetrics)
        .where(eq(customerMetrics.userId, customer.id))
        .limit(1);
      
      calculatedMetrics.push({
        id: existingMetrics[0]?.id || customer.id,
        userId: customer.id,
        totalOrders,
        totalSpent: totalSpent.toFixed(2),
        averageOrderValue: averageOrderValue.toFixed(2),
        lifetimeValue: totalSpent.toFixed(2),
        lastPurchaseDate: lastOrder?.orderDate || null,
        acquisitionDate: customer.createdAt,
        acquisitionResellerId: existingMetrics[0]?.acquisitionResellerId || null,
        isVip: existingMetrics[0]?.isVip || false,
        churnRisk: existingMetrics[0]?.churnRisk || null,
        rfmSegment: existingMetrics[0]?.rfmSegment || null,
      });
    }
    
    return calculatedMetrics.sort((a, b) => parseFloat(b.totalSpent) - parseFloat(a.totalSpent));
  }

  async updateCustomerVipStatus(userId: string, isVip: boolean): Promise<boolean> {
    try {
      // Check if customer metrics exist
      const existingMetrics = await this.getCustomerMetrics(userId);
      
      if (existingMetrics) {
        // Update existing metrics
        await db
          .update(customerMetrics)
          .set({ isVip })
          .where(eq(customerMetrics.userId, userId));
      } else {
        // Create new metrics with VIP status
        await db.insert(customerMetrics).values({
          userId,
          isVip,
          totalOrders: 0,
          totalSpent: "0.00",
          averageOrderValue: "0.00",
          lifetimeValue: "0.00",
          lastPurchaseDate: null,
          acquisitionDate: new Date(),
          acquisitionResellerId: null,
        });
      }
      
      return true;
    } catch (error) {
      console.error("Update VIP status error:", error);
      return false;
    }
  }

  async getCustomerOrders(userId: string): Promise<any[]> {
    // First get the user's email to also match guest orders placed with same email
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const userEmail = user[0]?.email;
    
    // Match orders by userId OR by customer email (for guest orders)
    const whereCondition = userEmail 
      ? or(
          eq(customerOrders.userId, userId),
          sql`LOWER(${customerOrders.customerEmail}) = LOWER(${userEmail})`
        )
      : eq(customerOrders.userId, userId);
    
    const ordersWithItems = await db
      .select({
        id: customerOrders.id,
        orderNumber: customerOrders.orderNumber,
        status: customerOrders.status,
        totalAmount: customerOrders.totalAmount,
        orderDate: customerOrders.orderDate,
        itemCount: sql<number>`count(${customerOrderItems.id})::int`
      })
      .from(customerOrders)
      .leftJoin(customerOrderItems, eq(customerOrders.id, customerOrderItems.orderId))
      .where(whereCondition)
      .groupBy(customerOrders.id)
      .orderBy(desc(customerOrders.orderDate));
    
    return ordersWithItems;
  }

  async getCustomerInteractions(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(customerInteractions)
      .where(eq(customerInteractions.userId, userId))
      .orderBy(desc(customerInteractions.createdAt));
  }

  async createCustomerInteraction(interaction: InsertCustomerInteraction): Promise<CustomerInteraction> {
    const [newInteraction] = await db
      .insert(customerInteractions)
      .values(interaction)
      .returning();
    return newInteraction;
  }

  async getCustomerNotes(userId: string): Promise<CustomerNote[]> {
    return await db
      .select()
      .from(customerNotes)
      .where(eq(customerNotes.userId, userId))
      .orderBy(desc(customerNotes.createdAt));
  }

  async createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote> {
    const [newNote] = await db
      .insert(customerNotes)
      .values(note)
      .returning();
    return newNote;
  }

  async updateCustomerNote(id: string, noteText: string): Promise<CustomerNote | undefined> {
    const [updated] = await db
      .update(customerNotes)
      .set({ 
        note: noteText,
        updatedAt: new Date()
      })
      .where(eq(customerNotes.id, id))
      .returning();
    return updated;
  }

  async deleteCustomerNote(id: string): Promise<boolean> {
    const result = await db
      .delete(customerNotes)
      .where(eq(customerNotes.id, id))
      .returning();
    return result.length > 0;
  }

  async getDashboardMetrics(): Promise<{
    totalCustomers: number;
    totalRevenue: number;
    avgOrderValue: number;
    vipCustomers: number;
  }> {
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.role, "customer"));

    const [revenueStats] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(total_amount), 0)::numeric`,
        avgOrderValue: sql<number>`COALESCE(AVG(total_amount), 0)::numeric`,
      })
      .from(customerOrders)
      .where(
        and(
          notInArray(customerOrders.channel, ['reseller_storefront', 'reseller_epos', 'vendor_storefront', 'vendor_epos']),
          isNull(customerOrders.resellerId),
          isNull(customerOrders.vendorId),
          ne(customerOrders.status, 'cancelled')
        )
      );

    const [vipCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customerMetrics)
      .where(eq(customerMetrics.isVip, true));

    return {
      totalCustomers: customerCount?.count || 0,
      totalRevenue: parseFloat(revenueStats?.totalRevenue?.toString() || "0"),
      avgOrderValue: parseFloat(revenueStats?.avgOrderValue?.toString() || "0"),
      vipCustomers: vipCount?.count || 0,
    };
  }

  // Reseller-aware CRM operations
  async getResellerCustomers(resellerId: string): Promise<User[]> {
    // Get all unique customers who have ordered from this reseller's storefront
    const customerIds = await db
      .selectDistinct({ userId: resellerCustomerOrders.customerId })
      .from(resellerCustomerOrders)
      .where(eq(resellerCustomerOrders.resellerId, resellerId));

    if (customerIds.length === 0) {
      return [];
    }

    const customers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "customer"),
          sql`${users.id} IN (${sql.join(customerIds.map(c => sql`${c.userId}`), sql`, `)})`
        )
      )
      .orderBy(desc(users.createdAt));

    return customers;
  }

  async getResellerCustomerInteractions(resellerId: string): Promise<any[]> {
    // Get interactions for customers acquired by this reseller
    const interactions = await db
      .select({
        id: customerInteractions.id,
        userId: customerInteractions.userId,
        customerEmail: customerInteractions.customerEmail,
        interactionType: customerInteractions.interactionType,
        subject: customerInteractions.subject,
        content: customerInteractions.content,
        orderId: customerInteractions.orderId,
        resellerId: customerInteractions.resellerId,
        createdAt: customerInteractions.createdAt,
        createdBy: customerInteractions.createdBy,
      })
      .from(customerInteractions)
      .where(eq(customerInteractions.resellerId, resellerId))
      .orderBy(desc(customerInteractions.createdAt));

    return interactions;
  }

  async getSupportTicketsByReseller(resellerId: string): Promise<any[]> {
    // Get support tickets for customers acquired by this reseller
    const tickets = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        userId: supportTickets.userId,
        customerEmail: supportTickets.customerEmail,
        customerName: supportTickets.customerName,
        subject: supportTickets.subject,
        description: supportTickets.description,
        status: supportTickets.status,
        priority: supportTickets.priority,
        orderId: supportTickets.orderId,
        resellerId: supportTickets.resellerId,
        assignedTo: supportTickets.assignedTo,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
      })
      .from(supportTickets)
      .where(eq(supportTickets.resellerId, resellerId))
      .orderBy(desc(supportTickets.createdAt));

    return tickets;
  }

  // Support ticket operations
  async getAllSupportTickets(): Promise<any[]> {
    return await db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    // Generate unique ticket number
    const ticketCount = await db.select({ count: sql<number>`count(*)::int` }).from(supportTickets);
    const ticketNumber = `TICKET-${String((ticketCount[0]?.count || 0) + 1).padStart(6, '0')}`;
    
    // Generate secure access token for customer portal
    const accessToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    
    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        ...ticket,
        ticketNumber,
        accessToken,
      })
      .returning();
    return newTicket;
  }
  
  async getSupportTicketByAccessToken(accessToken: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.accessToken, accessToken));
    return ticket || undefined;
  }

  async updateSupportTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | undefined> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // If status is being changed to resolved, set resolvedAt
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket || undefined;
  }

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    return await db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db
      .insert(ticketMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  // Personalization operations
  async trackProductView(view: InsertProductView): Promise<ProductView> {
    const [productView] = await db
      .insert(productViews)
      .values(view)
      .returning();
    return productView;
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<any[]> {
    // Get user's recommendations with product details
    const recommendations = await db
      .select({
        id: productRecommendations.id,
        productId: productRecommendations.productId,
        score: productRecommendations.score,
        reason: productRecommendations.reason,
        product: products,
      })
      .from(productRecommendations)
      .innerJoin(products, eq(productRecommendations.productId, products.id))
      .where(eq(productRecommendations.userId, userId))
      .orderBy(desc(productRecommendations.score))
      .limit(limit);

    return recommendations;
  }

  async calculateRecommendations(userId: string): Promise<void> {
    // Get user's recently viewed products and categories
    const recentViews = await db
      .select({
        productId: productViews.productId,
        category: productViews.category,
        viewCount: sql<number>`count(*)::int`,
      })
      .from(productViews)
      .where(eq(productViews.userId, userId))
      .groupBy(productViews.productId, productViews.category)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Get user's wishlist products and their categories
    const wishlistItems = await db
      .select({
        productId: wishlists.productId,
        category: products.category,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId));

    // If user has no views and no wishlist, no recommendations
    if (recentViews.length === 0 && wishlistItems.length === 0) return;

    // Combine categories from views and wishlist
    const viewedCategories = Array.from(new Set(recentViews.map(v => v.category)));
    const wishlistCategories = Array.from(new Set(wishlistItems.map(w => w.category)));
    const allCategories = Array.from(new Set([...viewedCategories, ...wishlistCategories]));

    // Combine product IDs to exclude (viewed + wishlisted)
    const viewedProductIds = recentViews.map(v => v.productId);
    const wishlistProductIds = wishlistItems.map(w => w.productId);
    const excludedProductIds = Array.from(new Set([...viewedProductIds, ...wishlistProductIds]));

    // Delete existing recommendations
    await db
      .delete(productRecommendations)
      .where(eq(productRecommendations.userId, userId));

    if (excludedProductIds.length === 0 || allCategories.length === 0) return;

    // Find products in the same categories (excluding already viewed/wishlisted)
    const similarProducts = await db
      .select()
      .from(products)
      .where(
        and(
          sql`${products.category} IN (${sql.join(allCategories.map(c => sql`${c}`), sql`, `)})`,
          sql`${products.id} NOT IN (${sql.join(excludedProductIds.map(id => sql`${id}`), sql`, `)})`
        )
      )
      .limit(20);

    // Create recommendations with scores
    // Products matching wishlist categories get higher scores
    const newRecommendations = similarProducts.map((product, index) => {
      const isWishlistCategory = wishlistCategories.includes(product.category);
      const baseScore = 100 - index * 4;
      const score = isWishlistCategory ? baseScore + 10 : baseScore; // Boost wishlist-related items
      const reason = isWishlistCategory 
        ? `Based on items in your wishlist (${product.category})`
        : `Based on your interest in ${product.category}`;
      
      return {
        userId,
        productId: product.id,
        score: Math.min(110, score).toFixed(2), // Cap at 110
        reason,
      };
    });

    if (newRecommendations.length > 0) {
      await db.insert(productRecommendations).values(newRecommendations);
    }
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<any[]> {
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: products,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));
    
    return wishlistItems;
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const [wishlistItem] = await db
      .insert(wishlists)
      .values({ userId, productId })
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db
      .delete(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ));
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlists)
      .where(and(
        eq(wishlists.userId, userId),
        eq(wishlists.productId, productId)
      ))
      .limit(1);
    return !!item;
  }

  // User measurements operations (for virtual try-on)
  async getUserMeasurements(userId: string): Promise<any | undefined> {
    const [measurements] = await db
      .select()
      .from(userMeasurements)
      .where(eq(userMeasurements.userId, userId))
      .limit(1);
    return measurements;
  }

  async saveUserMeasurements(userId: string, measurements: any): Promise<any> {
    // Check if measurements exist for this user
    const existing = await this.getUserMeasurements(userId);
    
    if (existing) {
      // Update existing measurements
      const [updated] = await db
        .update(userMeasurements)
        .set({
          heightCm: measurements.heightCm,
          chestCm: measurements.chestCm,
          waistCm: measurements.waistCm,
          hipsCm: measurements.hipsCm,
          shoulderWidthCm: measurements.shoulderWidthCm,
          inseamCm: measurements.inseamCm,
          preferredSize: measurements.preferredSize,
          updatedAt: new Date(),
        })
        .where(eq(userMeasurements.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new measurements
      const [created] = await db
        .insert(userMeasurements)
        .values({
          userId,
          heightCm: measurements.heightCm,
          chestCm: measurements.chestCm,
          waistCm: measurements.waistCm,
          hipsCm: measurements.hipsCm,
          shoulderWidthCm: measurements.shoulderWidthCm,
          inseamCm: measurements.inseamCm,
          preferredSize: measurements.preferredSize,
        })
        .returning();
      return created;
    }
  }

  // Messaging operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getResellerMessages(resellerId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.resellerId, resellerId))
      .orderBy(desc(messages.createdAt));
  }

  async getUnreadMessages(resellerId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.resellerId, resellerId),
        eq(messages.isRead, false)
      ))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  // Order status history operations
  async createOrderStatusHistory(insertHistory: InsertOrderStatusHistory): Promise<OrderStatusHistory> {
    const [history] = await db
      .insert(orderStatusHistory)
      .values(insertHistory)
      .returning();
    return history;
  }

  async getOrderHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return await db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, orderId))
      .orderBy(desc(orderStatusHistory.createdAt));
  }

  // Shipment operations
  async createShipment(insertShipment: InsertShipmentDetails): Promise<ShipmentDetails> {
    const [shipment] = await db
      .insert(shipmentDetails)
      .values(insertShipment)
      .returning();
    return shipment;
  }

  async getShipmentByOrderId(orderId: string): Promise<ShipmentDetails | undefined> {
    const [shipment] = await db
      .select()
      .from(shipmentDetails)
      .where(eq(shipmentDetails.orderId, orderId));
    return shipment || undefined;
  }

  async updateShipment(orderId: string, updates: Partial<ShipmentDetails>): Promise<ShipmentDetails | undefined> {
    const [shipment] = await db
      .update(shipmentDetails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shipmentDetails.orderId, orderId))
      .returning();
    return shipment || undefined;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getResellerNotifications(resellerId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.resellerId, resellerId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotifications(resellerId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.resellerId, resellerId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsAsRead(resellerId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.resellerId, resellerId),
        eq(notifications.isRead, false)
      ));
  }

  // Activity log operations
  async createActivityLog(insertLog: InsertResellerActivityLog): Promise<ResellerActivityLog> {
    const [log] = await db
      .insert(resellerActivityLog)
      .values(insertLog)
      .returning();
    return log;
  }

  async getResellerActivityLogs(resellerId: string): Promise<ResellerActivityLog[]> {
    return await db
      .select()
      .from(resellerActivityLog)
      .where(eq(resellerActivityLog.resellerId, resellerId))
      .orderBy(desc(resellerActivityLog.createdAt));
  }

  // EPOS Activity log operations
  async createEposActivityLog(log: {
    userId: string;
    vendorId?: string;
    resellerId?: string;
    activityType: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO epos_activity_log (user_id, vendor_id, reseller_id, activity_type, details, ip_address, user_agent)
      VALUES (${log.userId}, ${log.vendorId || null}, ${log.resellerId || null}, ${log.activityType}, ${log.details || null}, ${log.ipAddress || null}, ${log.userAgent || null})
      RETURNING *
    `);
    return result.rows?.[0] || result;
  }

  async getEposActivityLogs(partnerId: string, partnerType: "vendor" | "reseller"): Promise<any[]> {
    if (partnerType === "vendor") {
      const result = await db.execute(sql`
        SELECT * FROM epos_activity_log 
        WHERE vendor_id = ${partnerId}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return result.rows as any[];
    } else {
      const result = await db.execute(sql`
        SELECT * FROM epos_activity_log 
        WHERE reseller_id = ${partnerId}
        ORDER BY created_at DESC
        LIMIT 100
      `);
      return result.rows as any[];
    }
  }

  // Coupon operations
  async getCoupons(): Promise<(Coupon & { vendorName?: string; productName?: string; productNames?: string[] })[]> {
    const results = await db
      .select({
        coupon: coupons,
        vendorName: vendors.businessName,
        productName: products.name,
      })
      .from(coupons)
      .leftJoin(vendors, eq(coupons.vendorId, vendors.id))
      .leftJoin(products, eq(coupons.productId, products.id))
      .orderBy(desc(coupons.createdAt));

    // For coupons that have productIds (multi-product), resolve names in a batch
    const allProductIds = [...new Set(results.flatMap(r => (r.coupon as any).productIds || []))].filter(Boolean) as string[];
    const productMap: Record<string, string> = {};
    if (allProductIds.length > 0) {
      const prodsRaw = await db.execute(
        sql`SELECT id, name FROM products WHERE id IN (${sql.join(allProductIds.map(id => sql`${id}`), sql`, `)})`
      );
      prodsRaw.rows.forEach((p: any) => { productMap[p.id] = p.name; });
    }

    return results.map(r => {
      const couponAny = r.coupon as any;
      const multiIds: string[] = Array.isArray(couponAny.productIds) && couponAny.productIds.length > 0 ? couponAny.productIds : [];
      const productNames = multiIds.length > 0 ? multiIds.map((id: string) => productMap[id]).filter(Boolean) : undefined;
      return {
        ...r.coupon,
        vendorName: r.vendorName || undefined,
        productName: r.productName || undefined,
        productNames,
      };
    });
  }

  async getCoupon(id: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, id));
    return coupon || undefined;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(coupons)
      .where(sql`LOWER(${coupons.code}) = LOWER(${code})`);
    return coupon || undefined;
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db
      .insert(coupons)
      .values(insertCoupon)
      .returning();
    return coupon;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | undefined> {
    const [coupon] = await db
      .update(coupons)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning();
    return coupon || undefined;
  }

  async deleteCoupon(id: string): Promise<void> {
    // Remove child rows that reference this coupon before deleting the parent
    await db.delete(couponRedemptions).where(eq(couponRedemptions.couponId, id));
    await db.update(customerOrders).set({ couponId: null }).where(eq(customerOrders.couponId, id));
    await db.delete(coupons).where(eq(coupons.id, id));
  }

  async validateCoupon(code: string, subtotal: number, userId?: string, cartItems?: Array<{ productId: string; quantity: number }>): Promise<{
    valid: boolean;
    coupon?: Coupon;
    error?: string;
    discountAmount?: number;
    shippingDiscountAmount?: number;
    productRestricted?: boolean;
    restrictedProductId?: string;
    restrictedProductName?: string;
  }> {
    // Get coupon by code (case-insensitive)
    const coupon = await this.getCouponByCode(code);
    
    if (!coupon) {
      return { valid: false, error: "Invalid coupon code" };
    }

    // Check if active
    if (!coupon.isActive) {
      return { valid: false, error: "This coupon is no longer active" };
    }

    // Check date validity
    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return { valid: false, error: "This coupon is not yet valid" };
    }
    if (now > new Date(coupon.endDate)) {
      return { valid: false, error: "This coupon has expired" };
    }

    // Check minimum order value
    const minimumTotal = parseFloat(coupon.minimumOrderTotal || "0");
    if (subtotal < minimumTotal) {
      return { 
        valid: false, 
        error: `Minimum order value of £${minimumTotal.toFixed(2)} required` 
      };
    }

    // Check global usage limit
    if (coupon.maxGlobalUses !== null && coupon.currentUses >= coupon.maxGlobalUses) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }

    // Check per-customer usage limit (if user is logged in)
    if (userId && coupon.maxUsesPerCustomer) {
      const [usageCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(couponRedemptions)
        .where(and(
          eq(couponRedemptions.couponId, coupon.id),
          eq(couponRedemptions.userId, userId)
        ));
      
      if (usageCount && usageCount.count >= coupon.maxUsesPerCustomer) {
        return { valid: false, error: "You have already used this coupon" };
      }
    }

    // Check first order only restriction
    if (coupon.firstOrderOnly && userId) {
      const [orderCount] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customerOrders)
        .where(eq(customerOrders.userId, userId));
      
      if (orderCount && orderCount.count > 0) {
        return { valid: false, error: "This coupon is only valid for first-time customers" };
      }
    }

    // Check wholesaler-specific restriction
    if (coupon.vendorId) {
      // This coupon is restricted to a specific wholesaler
      // Check if the current user is the vendor who owns this coupon
      if (!userId) {
        return { valid: false, error: "This coupon is exclusive to a specific wholesaler" };
      }
      
      const [vendor] = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, coupon.vendorId));
      
      if (!vendor || vendor.userId !== userId) {
        return { valid: false, error: "This coupon is exclusive to a specific wholesaler" };
      }
    }

    // Check product-specific restriction
    let productRestricted = false;
    let restrictedProductId: string | undefined;
    let restrictedProductName: string | undefined;
    let effectiveSubtotal = subtotal;

    // Resolve the set of restricted product IDs — new multi-product array takes precedence over legacy single ID
    const couponAny = coupon as any;
    const restrictedIds: string[] = (Array.isArray(couponAny.productIds) && couponAny.productIds.length > 0)
      ? couponAny.productIds
      : (couponAny.productId ? [couponAny.productId] : []);

    if (restrictedIds.length > 0) {
      productRestricted = true;

      // Fetch all restricted product details
      const restrictedProducts = await Promise.all(
        restrictedIds.map(pid =>
          db.select({ id: products.id, name: products.name, retailPrice: products.retailPrice })
            .from(products).where(eq(products.id, pid)).then(r => r[0] || null)
        )
      );
      const validProducts = restrictedProducts.filter(Boolean) as { id: string; name: string; retailPrice: string }[];
      const productNames = validProducts.map(p => p.name).join(", ");

      if (cartItems && cartItems.length > 0) {
        // Check the cart contains at least one of the restricted products
        const matchingItems = cartItems.filter(item => restrictedIds.includes(item.productId));
        if (!matchingItems.length) {
          return {
            valid: false,
            error: productNames
              ? `This coupon is only valid for: ${productNames}`
              : "This coupon is only valid for specific products not in your basket"
          };
        }
        // Calculate discount base = sum of matching product line totals
        let base = 0;
        for (const item of matchingItems) {
          const prod = validProducts.find(p => p.id === item.productId);
          if (prod?.retailPrice) base += parseFloat(prod.retailPrice) * item.quantity;
        }
        if (base > 0) effectiveSubtotal = base;
      } else {
        effectiveSubtotal = 0;
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let shippingDiscountAmount = 0;
    const couponValue = parseFloat(coupon.value);

    if (coupon.type === "percentage") {
      discountAmount = (effectiveSubtotal * couponValue) / 100;
    } else if (coupon.type === "fixed_amount") {
      discountAmount = Math.min(couponValue, effectiveSubtotal); // Don't discount more than the applicable subtotal
    } else if (coupon.type === "free_shipping") {
      shippingDiscountAmount = 100; // Will be applied to shipping cost
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      shippingDiscountAmount,
      productRestricted,
      restrictedProductId,
      restrictedProductName,
    };
  }

  async redeemCoupon(insertRedemption: InsertCouponRedemption): Promise<CouponRedemption> {
    // Create redemption record
    const [redemption] = await db
      .insert(couponRedemptions)
      .values(insertRedemption)
      .returning();

    // Increment coupon usage counter
    await db
      .update(coupons)
      .set({ 
        currentUses: sql`${coupons.currentUses} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(coupons.id, insertRedemption.couponId));

    return redemption;
  }

  async getCouponUsage(couponId: string): Promise<{
    totalRedemptions: number;
    totalDiscountAmount: number;
    recentRedemptions: any[];
  }> {
    // Get total stats
    const [stats] = await db
      .select({
        totalRedemptions: sql<number>`COUNT(*)`,
        totalDiscountAmount: sql<number>`SUM(${couponRedemptions.discountAmount})`
      })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, couponId));

    // Get recent redemptions with customer info
    const recentRedemptions = await db
      .select({
        id: couponRedemptions.id,
        customerEmail: couponRedemptions.customerEmail,
        discountAmount: couponRedemptions.discountAmount,
        shippingDiscountAmount: couponRedemptions.shippingDiscountAmount,
        redeemedAt: couponRedemptions.redeemedAt,
        orderId: couponRedemptions.orderId
      })
      .from(couponRedemptions)
      .where(eq(couponRedemptions.couponId, couponId))
      .orderBy(desc(couponRedemptions.redeemedAt))
      .limit(10);

    return {
      totalRedemptions: stats?.totalRedemptions || 0,
      totalDiscountAmount: parseFloat(String(stats?.totalDiscountAmount || 0)),
      recentRedemptions
    };
  }

  // Site settings operations
  async getSiteSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings).limit(1);
    return settings || undefined;
  }

  async updateSiteSettings(updates: { 
    activeTheme?: string; 
    chatbotVisible?: boolean;
    freeShippingEnabled?: boolean;
    freeShippingThreshold?: string;
    standardShippingCost?: string;
    heroSlideDuration?: number;
    minimumPayoutAmount?: string;
    showHeroProducts?: boolean;
  }, updatedBy?: string): Promise<SiteSettings> {
    // Check if settings exist
    const existing = await this.getSiteSettings();
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy
    };

    if (updates.activeTheme !== undefined) {
      updateData.activeTheme = updates.activeTheme;
    }
    if (updates.chatbotVisible !== undefined) {
      updateData.chatbotVisible = updates.chatbotVisible;
    }
    if (updates.freeShippingEnabled !== undefined) {
      updateData.freeShippingEnabled = updates.freeShippingEnabled;
    }
    if (updates.freeShippingThreshold !== undefined) {
      updateData.freeShippingThreshold = updates.freeShippingThreshold;
    }
    if (updates.standardShippingCost !== undefined) {
      updateData.standardShippingCost = updates.standardShippingCost;
    }
    if (updates.heroSlideDuration !== undefined) {
      updateData.heroSlideDuration = updates.heroSlideDuration;
    }
    if (updates.minimumPayoutAmount !== undefined) {
      updateData.minimumPayoutAmount = updates.minimumPayoutAmount;
    }
    if (updates.showHeroProducts !== undefined) {
      updateData.showHeroProducts = updates.showHeroProducts;
    }
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(siteSettings)
        .set(updateData)
        .where(eq(siteSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [created] = await db
        .insert(siteSettings)
        .values({ 
          activeTheme: (updates.activeTheme as any) || 'tactical_dark',
          chatbotVisible: updates.chatbotVisible ?? true,
          freeShippingEnabled: updates.freeShippingEnabled ?? true,
          freeShippingThreshold: updates.freeShippingThreshold || '75.00',
          standardShippingCost: updates.standardShippingCost || '4.99',
          heroSlideDuration: updates.heroSlideDuration ?? 6,
          minimumPayoutAmount: updates.minimumPayoutAmount || '50.00',
          updatedBy 
        })
        .returning();
      return created;
    }
  }

  // Announcement banner operations
  async getAnnouncementBanner(): Promise<AnnouncementBanner | undefined> {
    const [banner] = await db.select().from(announcementBanner).limit(1);
    return banner || undefined;
  }

  async updateAnnouncementBanner(data: Partial<InsertAnnouncementBanner> & { updatedBy?: string }): Promise<AnnouncementBanner> {
    const existing = await this.getAnnouncementBanner();
    
    if (existing) {
      const [updated] = await db
        .update(announcementBanner)
        .set({ 
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(announcementBanner.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(announcementBanner)
        .values({ 
          message: data.message || '',
          isVisible: data.isVisible ?? false,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
          updatedBy: data.updatedBy,
        })
        .returning();
      return created;
    }
  }

  // Popup message operations
  async getPopupMessages(): Promise<PopupMessage[]> {
    return await db
      .select()
      .from(popupMessages)
      .orderBy(desc(popupMessages.priority), desc(popupMessages.createdAt));
  }

  async getActivePopupMessage(): Promise<PopupMessage | undefined> {
    const now = new Date();
    const [popup] = await db
      .select()
      .from(popupMessages)
      .where(
        and(
          eq(popupMessages.isActive, true),
          or(
            isNull(popupMessages.startDate),
            sql`${popupMessages.startDate} <= ${now}`
          ),
          or(
            isNull(popupMessages.endDate),
            sql`${popupMessages.endDate} >= ${now}`
          )
        )
      )
      .orderBy(desc(popupMessages.priority), desc(popupMessages.createdAt))
      .limit(1);
    return popup || undefined;
  }

  async getPopupMessage(id: string): Promise<PopupMessage | undefined> {
    const [popup] = await db
      .select()
      .from(popupMessages)
      .where(eq(popupMessages.id, id));
    return popup || undefined;
  }

  async createPopupMessage(popup: InsertPopupMessage): Promise<PopupMessage> {
    const [created] = await db
      .insert(popupMessages)
      .values(popup)
      .returning();
    return created;
  }

  async updatePopupMessage(id: string, updates: Partial<PopupMessage>): Promise<PopupMessage | undefined> {
    const [updated] = await db
      .update(popupMessages)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(popupMessages.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePopupMessage(id: string): Promise<boolean> {
    const result = await db
      .delete(popupMessages)
      .where(eq(popupMessages.id, id))
      .returning();
    return result.length > 0;
  }

  // Section analytics operations
  async trackSectionView(sectionName: string): Promise<void> {
    const existing = await db
      .select()
      .from(sectionAnalytics)
      .where(eq(sectionAnalytics.sectionName, sectionName))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(sectionAnalytics)
        .set({
          viewCount: sql`${sectionAnalytics.viewCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(sectionAnalytics.sectionName, sectionName));
    } else {
      await db.insert(sectionAnalytics).values({
        sectionName,
        viewCount: 1,
        clickCount: 0,
      });
    }
  }

  async trackSectionClick(sectionName: string): Promise<void> {
    const existing = await db
      .select()
      .from(sectionAnalytics)
      .where(eq(sectionAnalytics.sectionName, sectionName))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(sectionAnalytics)
        .set({
          clickCount: sql`${sectionAnalytics.clickCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(sectionAnalytics.sectionName, sectionName));
    } else {
      await db.insert(sectionAnalytics).values({
        sectionName,
        viewCount: 0,
        clickCount: 1,
      });
    }
  }

  async getSectionRankings(): Promise<{ sectionName: string; score: number }[]> {
    // Check if any section needs weekly reset (7 days old)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldSections = await db
      .select()
      .from(sectionAnalytics)
      .where(sql`${sectionAnalytics.lastResetDate} < ${sevenDaysAgo}`);

    if (oldSections.length > 0) {
      await this.resetSectionAnalytics();
    }

    // Calculate scores: clicks worth 2x more than views
    const sections = await db
      .select({
        sectionName: sectionAnalytics.sectionName,
        viewCount: sectionAnalytics.viewCount,
        clickCount: sectionAnalytics.clickCount,
      })
      .from(sectionAnalytics);

    return sections
      .map((section) => ({
        sectionName: section.sectionName,
        score: (section.viewCount || 0) + (section.clickCount || 0) * 2,
      }))
      .sort((a, b) => b.score - a.score);
  }

  async resetSectionAnalytics(): Promise<void> {
    await db
      .update(sectionAnalytics)
      .set({
        viewCount: 0,
        clickCount: 0,
        lastResetDate: new Date(),
      });
  }

  // Reseller storefront operations
  async getStorefrontBySlug(slug: string): Promise<ResellerStorefront | undefined> {
    const [storefront] = await db
      .select()
      .from(resellerStorefronts)
      .where(eq(resellerStorefronts.slug, slug));
    return storefront || undefined;
  }

  async getStorefrontByResellerId(resellerId: string): Promise<ResellerStorefront | undefined> {
    const [storefront] = await db
      .select()
      .from(resellerStorefronts)
      .where(eq(resellerStorefronts.resellerId, resellerId));
    return storefront || undefined;
  }

  async createStorefront(insertStorefront: InsertResellerStorefront): Promise<ResellerStorefront> {
    const [storefront] = await db
      .insert(resellerStorefronts)
      .values(insertStorefront)
      .returning();
    return storefront;
  }

  async updateStorefront(id: string, updates: Partial<ResellerStorefront>): Promise<ResellerStorefront | undefined> {
    const [storefront] = await db
      .update(resellerStorefronts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerStorefronts.id, id))
      .returning();
    return storefront || undefined;
  }

  // Reseller product operations
  async getResellerProducts(resellerId: string): Promise<any[]> {
    return await db
      .select()
      .from(resellerProducts)
      .where(eq(resellerProducts.resellerId, resellerId))
      .orderBy(resellerProducts.displayOrder);
  }

  async getResellerProductsWithDetails(resellerId: string): Promise<any[]> {
    return await db
      .select({
        id: resellerProducts.id,
        resellerId: resellerProducts.resellerId,
        productId: resellerProducts.productId,
        customPrice: resellerProducts.customPrice,
        isActive: resellerProducts.isActive,
        displayOrder: resellerProducts.displayOrder,
        addedAt: resellerProducts.addedAt,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          detailedDescription: products.detailedDescription,
          retailPrice: products.retailPrice,
          wholesalePrice: products.wholesalePrice,
          category: products.category,
          imageUrl: products.imageUrl,
          videoUrl: products.videoUrl,
          sizes: products.sizes,
          colors: products.colors,
          sku: products.sku,
          availabilityStatus: products.availabilityStatus,
          materials: products.materials,
          careInstructions: products.careInstructions,
          features: products.features,
          isActive: products.isActive
        }
      })
      .from(resellerProducts)
      .leftJoin(products, eq(resellerProducts.productId, products.id))
      .where(and(
        eq(resellerProducts.resellerId, resellerId),
        eq(resellerProducts.isActive, true),
        eq(products.isActive, true)
      ))
      .orderBy(resellerProducts.displayOrder);
  }

  async addProductToStorefront(insertProduct: InsertResellerProduct): Promise<ResellerProduct> {
    const [product] = await db
      .insert(resellerProducts)
      .values(insertProduct)
      .returning();
    return product;
  }

  async removeProductFromStorefront(id: string): Promise<boolean> {
    const result = await db
      .delete(resellerProducts)
      .where(eq(resellerProducts.id, id))
      .returning();
    return result.length > 0;
  }

  async updateResellerProduct(id: string, updates: Partial<ResellerProduct>): Promise<ResellerProduct | undefined> {
    const [product] = await db
      .update(resellerProducts)
      .set(updates)
      .where(eq(resellerProducts.id, id))
      .returning();
    return product || undefined;
  }

  // Commission rule operations
  async getAllCommissionRules(): Promise<CommissionRule[]> {
    return await db
      .select()
      .from(commissionRules)
      .orderBy(desc(commissionRules.priority));
  }

  async getActiveCommissionRules(): Promise<CommissionRule[]> {
    return await db
      .select()
      .from(commissionRules)
      .where(eq(commissionRules.isActive, true))
      .orderBy(desc(commissionRules.priority));
  }

  async getCommissionRule(id: string): Promise<CommissionRule | undefined> {
    const [rule] = await db
      .select()
      .from(commissionRules)
      .where(eq(commissionRules.id, id));
    return rule || undefined;
  }

  async getCommissionRulesForReseller(resellerId: string): Promise<CommissionRule[]> {
    return await db
      .select()
      .from(commissionRules)
      .where(and(
        eq(commissionRules.isActive, true),
        eq(commissionRules.resellerId, resellerId)
      ))
      .orderBy(desc(commissionRules.priority));
  }

  async getCommissionRulesForProduct(productId: string): Promise<CommissionRule[]> {
    return await db
      .select()
      .from(commissionRules)
      .where(and(
        eq(commissionRules.isActive, true),
        eq(commissionRules.productId, productId)
      ))
      .orderBy(desc(commissionRules.priority));
  }

  async createCommissionRule(insertRule: InsertCommissionRule): Promise<CommissionRule> {
    const [rule] = await db
      .insert(commissionRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async updateCommissionRule(id: string, updates: Partial<CommissionRule>): Promise<CommissionRule | undefined> {
    const [rule] = await db
      .update(commissionRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commissionRules.id, id))
      .returning();
    return rule || undefined;
  }

  async deleteCommissionRule(id: string): Promise<boolean> {
    const result = await db
      .delete(commissionRules)
      .where(eq(commissionRules.id, id))
      .returning();
    return result.length > 0;
  }

  // Commission payment operations
  async getCommissionPayment(id: string): Promise<CommissionPayment | undefined> {
    const [payment] = await db
      .select()
      .from(commissionPayments)
      .where(eq(commissionPayments.id, id));
    return payment || undefined;
  }

  async getCommissionPaymentsByReseller(resellerId: string): Promise<CommissionPayment[]> {
    return await db
      .select()
      .from(commissionPayments)
      .where(eq(commissionPayments.resellerId, resellerId))
      .orderBy(desc(commissionPayments.createdAt));
  }

  async getPendingCommissionPayments(): Promise<CommissionPayment[]> {
    return await db
      .select()
      .from(commissionPayments)
      .where(eq(commissionPayments.status, 'pending'))
      .orderBy(desc(commissionPayments.createdAt));
  }

  async createCommissionPayment(insertPayment: InsertCommissionPayment): Promise<CommissionPayment> {
    const [payment] = await db
      .insert(commissionPayments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updateCommissionPayment(id: string, updates: Partial<CommissionPayment>): Promise<CommissionPayment | undefined> {
    const [payment] = await db
      .update(commissionPayments)
      .set(updates)
      .where(eq(commissionPayments.id, id))
      .returning();
    return payment || undefined;
  }

  // Payout request operations
  async getPayoutRequest(id: string): Promise<PayoutRequest | undefined> {
    const [request] = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.id, id));
    return request || undefined;
  }

  async getPayoutRequestsByReseller(resellerId: string): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.resellerId, resellerId))
      .orderBy(desc(payoutRequests.createdAt));
  }

  async getAllPayoutRequests(): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .orderBy(desc(payoutRequests.createdAt));
  }

  async getPendingPayoutRequests(): Promise<PayoutRequest[]> {
    return await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.status, 'pending'))
      .orderBy(desc(payoutRequests.createdAt));
  }

  async createPayoutRequest(request: InsertPayoutRequest): Promise<PayoutRequest> {
    const [newRequest] = await db
      .insert(payoutRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updatePayoutRequest(id: string, updates: Partial<PayoutRequest>): Promise<PayoutRequest | undefined> {
    const [request] = await db
      .update(payoutRequests)
      .set(updates)
      .where(eq(payoutRequests.id, id))
      .returning();
    return request || undefined;
  }

  async createPayoutAuditLog(log: InsertPayoutAuditLog): Promise<PayoutAuditLog> {
    const [newLog] = await db
      .insert(payoutAuditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getPayoutAuditLogs(payoutId: string): Promise<PayoutAuditLog[]> {
    return await db
      .select()
      .from(payoutAuditLogs)
      .where(eq(payoutAuditLogs.payoutId, payoutId))
      .orderBy(desc(payoutAuditLogs.createdAt));
  }

  async getResellerEarningsBalance(resellerId: string): Promise<{ 
    totalEarned: number; 
    totalPaidOut: number; 
    pendingPayout: number; 
    availableBalance: number;
    catalogueCommission: number;
    ownProductsRevenue: number;
  }> {
    // Get all completed storefront orders for this reseller (catalogue commission)
    const storefrontOrders = await db
      .select()
      .from(resellerCustomerOrders)
      .where(
        and(
          eq(resellerCustomerOrders.resellerId, resellerId),
          eq(resellerCustomerOrders.status, 'delivered')
        )
      );
    
    const catalogueCommission = storefrontOrders.reduce((sum, order) => {
      return sum + parseFloat(order.resellerEarnings || '0');
    }, 0);
    
    // Also get EPOS orders for this reseller with catalogue products
    const [reseller] = await db.select().from(resellers).where(eq(resellers.id, resellerId));
    let eposCatalogueCommission = 0;
    let ownProductsRevenue = 0;
    
    if (reseller) {
      // Get reseller's commission rate
      const commissionRate = parseFloat(reseller.commissionRate || '10') / 100;
      
      // Get EPOS orders for this reseller
      const eposOrders = await db.select().from(customerOrders)
        .where(eq(customerOrders.resellerId, resellerId));
      
      // Get vendor product IDs if reseller has vendor access
      let vendorProductIds: string[] = [];
      if (reseller.userId) {
        const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, reseller.userId));
        if (vendor) {
          const vendorProductsList = await db.select({ id: vendorProducts.id })
            .from(vendorProducts)
            .where(eq(vendorProducts.vendorId, vendor.id));
          vendorProductIds = vendorProductsList.map(p => p.id);
        }
      }
      
      // Process EPOS orders
      // EPOS = point-of-sale: goods are handed over immediately at payment,
      // so all non-cancelled orders count towards earnings (no need to wait for 'delivered')
      const eposCancelledStatuses = ['cancelled', 'refunded', 'failed'];
      for (const order of eposOrders) {
        if (!eposCancelledStatuses.includes(order.status || '')) {
          const items = await db.select().from(customerOrderItems)
            .where(eq(customerOrderItems.orderId, order.id));
          
          for (const item of items) {
            const itemTotal = parseFloat(item.totalPrice || '0');
            
            if (item.vendorProductId && vendorProductIds.includes(item.vendorProductId)) {
              // Own product - 100% revenue to reseller (already received via EPOS)
              ownProductsRevenue += itemTotal;
            } else if (!item.vendorProductId) {
              // Catalogue product - reseller earns commission (needs payout)
              eposCatalogueCommission += itemTotal * commissionRate;
            }
          }
        }
      }
    }
    
    // Total commission from BOTH storefront and EPOS catalogue sales
    const totalCatalogueCommission = catalogueCommission + eposCatalogueCommission;
    
    // Both catalogue commission AND own products revenue go into payout system.
    // When a customer pays online/by card for a reseller's own product, the funds
    // land in 1stRep's account — the reseller must request a payout to receive them.
    const totalEarned = totalCatalogueCommission + ownProductsRevenue;

    // Get all paid payout requests
    const paidPayouts = await db
      .select()
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.resellerId, resellerId),
          eq(payoutRequests.status, 'paid')
        )
      );
    
    const totalPaidOut = paidPayouts.reduce((sum, payout) => {
      return sum + parseFloat(payout.amount || '0');
    }, 0);

    // Get pending/processing payout requests
    const pendingPayouts = await db
      .select()
      .from(payoutRequests)
      .where(
        and(
          eq(payoutRequests.resellerId, resellerId),
          or(
            eq(payoutRequests.status, 'pending'),
            eq(payoutRequests.status, 'approved'),
            eq(payoutRequests.status, 'processing')
          )
        )
      );
    
    const pendingPayout = pendingPayouts.reduce((sum, payout) => {
      return sum + parseFloat(payout.amount || '0');
    }, 0);

    // Available balance = total earned (catalogue commission + online own product revenue) minus already paid/pending
    const availableBalance = totalEarned - totalPaidOut - pendingPayout;

    return {
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      pendingPayout: Math.round(pendingPayout * 100) / 100,
      availableBalance: Math.round(availableBalance * 100) / 100,
      catalogueCommission: Math.round(totalCatalogueCommission * 100) / 100,
      ownProductsRevenue: Math.round(ownProductsRevenue * 100) / 100,
    };
  }

  async getResellersWithBalances(): Promise<Array<{
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    stripeAccountId: string | null;
    stripeOnboardingStatus: string | null;
    stripeChargesEnabled: boolean | null;
    totalEarned: number;
    totalPaidOut: number;
    pendingPayout: number;
    availableBalance: number;
  }>> {
    // Get all approved resellers
    const approvedResellers = await db
      .select({
        id: resellers.id,
        businessName: resellers.businessName,
        contactPerson: resellers.contactPerson,
        stripeAccountId: resellers.stripeAccountId,
        stripeOnboardingStatus: resellers.stripeOnboardingStatus,
        stripeChargesEnabled: resellers.stripeChargesEnabled,
        email: users.email,
      })
      .from(resellers)
      .leftJoin(users, eq(resellers.userId, users.id))
      .where(eq(resellers.approvalStatus, 'approved'));

    // Get balances for each reseller
    const resellersWithBalances = await Promise.all(
      approvedResellers.map(async (reseller) => {
        const balance = await this.getResellerEarningsBalance(reseller.id);
        return {
          id: reseller.id,
          businessName: reseller.businessName,
          contactPerson: reseller.contactPerson,
          email: reseller.email || '',
          stripeAccountId: reseller.stripeAccountId,
          stripeOnboardingStatus: reseller.stripeOnboardingStatus,
          stripeChargesEnabled: reseller.stripeChargesEnabled,
          ...balance
        };
      })
    );

    return resellersWithBalances;
  }

  async getVendorsWithBalances(): Promise<Array<{
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    stripeAccountId: string | null;
    stripeOnboardingStatus: string | null;
    stripeChargesEnabled: boolean | null;
    totalEarned: number;
    totalPaidOut: number;
    pendingPayout: number;
    availableBalance: number;
  }>> {
    // Get all approved vendors
    const approvedVendors = await db
      .select({
        id: vendors.id,
        businessName: vendors.businessName,
        stripeAccountId: vendors.stripeAccountId,
        stripeOnboardingStatus: vendors.stripeOnboardingStatus,
        stripeChargesEnabled: vendors.stripeChargesEnabled,
        userId: vendors.userId,
      })
      .from(vendors)
      .where(eq(vendors.approvalStatus, 'approved'));

    // Get vendor balances (for now, vendors don't have earnings tracking like resellers)
    // Calculate from vendor payout requests (if any) - since vendors may receive admin-initiated payments
    const vendorsWithBalances = await Promise.all(
      approvedVendors.map(async (vendor) => {
        const user = await this.getUser(vendor.userId);
        
        // Get vendor's paid payouts
        const paidPayouts = await db
          .select()
          .from(payoutRequests)
          .where(
            and(
              eq(payoutRequests.vendorId, vendor.id),
              eq(payoutRequests.status, 'paid')
            )
          );
        
        const totalPaidOut = paidPayouts.reduce((sum, payout) => {
          return sum + parseFloat(payout.amount || '0');
        }, 0);

        // Get pending payouts
        const pendingPayouts = await db
          .select()
          .from(payoutRequests)
          .where(
            and(
              eq(payoutRequests.vendorId, vendor.id),
              or(
                eq(payoutRequests.status, 'pending'),
                eq(payoutRequests.status, 'approved'),
                eq(payoutRequests.status, 'processing')
              )
            )
          );

        const pendingPayout = pendingPayouts.reduce((sum, payout) => {
          return sum + parseFloat(payout.amount || '0');
        }, 0);

        return {
          id: vendor.id,
          businessName: vendor.businessName,
          contactPerson: user?.firstName && user?.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user?.firstName || user?.lastName || user?.username || 'N/A',
          email: user?.email || '',
          stripeAccountId: vendor.stripeAccountId,
          stripeOnboardingStatus: vendor.stripeOnboardingStatus,
          stripeChargesEnabled: vendor.stripeChargesEnabled,
          totalEarned: 0, // Vendors don't have earnings tracking like resellers (yet)
          totalPaidOut: Math.round(totalPaidOut * 100) / 100,
          pendingPayout: Math.round(pendingPayout * 100) / 100,
          availableBalance: 0 // Vendors don't have the same balance model
        };
      })
    );

    return vendorsWithBalances;
  }

  // Reseller customer order operations
  async getResellerCustomerOrders(resellerId: string): Promise<ResellerCustomerOrder[]> {
    return await db
      .select()
      .from(resellerCustomerOrders)
      .where(eq(resellerCustomerOrders.resellerId, resellerId))
      .orderBy(desc(resellerCustomerOrders.orderDate));
  }

  async getResellerCustomerOrder(orderId: string): Promise<ResellerCustomerOrder | undefined> {
    const [order] = await db
      .select()
      .from(resellerCustomerOrders)
      .where(eq(resellerCustomerOrders.id, orderId));
    return order || undefined;
  }

  async getResellerCustomerOrderItems(orderId: string): Promise<ResellerCustomerOrderItem[]> {
    return await db
      .select()
      .from(resellerCustomerOrderItems)
      .where(eq(resellerCustomerOrderItems.orderId, orderId));
  }

  async createResellerCustomerOrder(insertOrder: InsertResellerCustomerOrder): Promise<ResellerCustomerOrder> {
    const [order] = await db
      .insert(resellerCustomerOrders)
      .values(insertOrder)
      .returning();
    return order;
  }

  async createResellerCustomerOrderItem(insertItem: InsertResellerCustomerOrderItem): Promise<ResellerCustomerOrderItem> {
    const [item] = await db
      .insert(resellerCustomerOrderItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async updateResellerCustomerOrder(orderId: string, updates: Partial<ResellerCustomerOrder>): Promise<ResellerCustomerOrder | undefined> {
    const [order] = await db
      .update(resellerCustomerOrders)
      .set(updates)
      .where(eq(resellerCustomerOrders.id, orderId))
      .returning();
    return order || undefined;
  }

  async getResellerOrderStats(resellerId: string): Promise<{
    totalOrders: number;
    totalRevenue: string;
    totalEarnings: string;
    pendingOrders: number;
  }> {
    const orders = await this.getResellerCustomerOrders(resellerId);
    
    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: "0.00",
        totalEarnings: "0.00",
        pendingOrders: 0
      };
    }
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0).toFixed(2);
    // Only count earnings from delivered orders - matches the balance/payout calculation
    const deliveredOrders = orders.filter(order => order.status === "delivered");
    const totalEarnings = deliveredOrders.reduce((sum, order) => sum + parseFloat(order.resellerEarnings), 0).toFixed(2);
    const pendingOrders = orders.filter(order => order.status === "pending" || order.status === "processing").length;

    return {
      totalOrders,
      totalRevenue,
      totalEarnings,
      pendingOrders
    };
  }

  // Admin reseller order monitoring
  async getAllResellerCustomerOrders(): Promise<ResellerCustomerOrder[]> {
    return await db
      .select()
      .from(resellerCustomerOrders)
      .orderBy(desc(resellerCustomerOrders.orderDate));
  }

  async getResellerCustomerOrdersWithResellerInfo(): Promise<any[]> {
    const orders = await db
      .select({
        order: resellerCustomerOrders,
        reseller: {
          id: resellers.id,
          businessName: resellers.businessName,
          contactPerson: resellers.contactPerson,
          tier: resellers.tier
        }
      })
      .from(resellerCustomerOrders)
      .leftJoin(resellers, eq(resellerCustomerOrders.resellerId, resellers.id))
      .orderBy(desc(resellerCustomerOrders.orderDate));
    
    return orders.map(row => ({
      ...row.order,
      reseller: row.reseller
    }));
  }

  async getAllResellerOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: string;
    totalPlatformCommission: string;
    totalResellerEarnings: string;
  }> {
    const orders = await this.getAllResellerCustomerOrders();
    
    if (orders.length === 0) {
      return {
        totalOrders: 0,
        totalRevenue: "0.00",
        totalPlatformCommission: "0.00",
        totalResellerEarnings: "0.00"
      };
    }
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0).toFixed(2);
    const totalPlatformCommission = orders.reduce((sum, order) => sum + parseFloat(order.platformCommission), 0).toFixed(2);
    const totalResellerEarnings = orders.reduce((sum, order) => sum + parseFloat(order.resellerEarnings), 0).toFixed(2);

    return {
      totalOrders,
      totalRevenue,
      totalPlatformCommission,
      totalResellerEarnings
    };
  }

  // Analytics Methods
  async getResellerAnalytics(resellerId: string, startDate?: Date, endDate?: Date): Promise<{
    summary: {
      totalOrders: number;
      totalRevenue: string;
      totalEarnings: string;
      averageOrderValue: string;
      uniqueCustomers: number;
    };
    salesTrend: Array<{
      date: string;
      orders: number;
      revenue: string;
      earnings: string;
    }>;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalSold: number;
      revenue: string;
      earnings: string;
    }>;
    commissionBreakdown: {
      totalCommission: string;
      averageCommissionRate: string;
      highestCommissionOrder: string;
    };
  }> {
    // Fetch the reseller's commission rate for EPOS earnings calculation
    const resellerData = await db.select({ commissionRate: resellers.commissionRate, discountPercentage: resellers.discountPercentage })
      .from(resellers)
      .where(eq(resellers.id, resellerId))
      .limit(1);
    const catalogueCommissionRate = resellerData.length > 0 && resellerData[0].commissionRate
      ? parseFloat(resellerData[0].commissionRate)
      : (resellerData.length > 0 && resellerData[0].discountPercentage ? parseFloat(resellerData[0].discountPercentage) : 10);

    let storefrontOrders = await this.getResellerCustomerOrders(resellerId);
    
    // Also get EPOS orders from main customerOrders table
    let eposOrders = await db.select().from(customerOrders)
      .where(eq(customerOrders.resellerId, resellerId))
      .orderBy(desc(customerOrders.orderDate));
    
    // Filter by date range if provided
    if (startDate) {
      storefrontOrders = storefrontOrders.filter(order => new Date(order.orderDate) >= startDate);
      eposOrders = eposOrders.filter(order => new Date(order.orderDate) >= startDate);
    }
    if (endDate) {
      storefrontOrders = storefrontOrders.filter(order => new Date(order.orderDate) <= endDate);
      eposOrders = eposOrders.filter(order => new Date(order.orderDate) <= endDate);
    }

    // Pre-calculate EPOS earnings per order by looking at items
    // Own products (vendor_product_id set) → 100% earnings; catalogue items → commission rate %
    const eposEarningsMap = new Map<string, number>();
    for (const order of eposOrders) {
      const items = await db.select().from(customerOrderItems)
        .where(eq(customerOrderItems.orderId, order.id));
      let orderEarnings = 0;
      for (const item of items) {
        const itemRevenue = parseFloat(item.unitPrice) * item.quantity;
        if (item.vendorProductId) {
          orderEarnings += itemRevenue; // own product: keep 100%
        } else {
          orderEarnings += itemRevenue * (catalogueCommissionRate / 100); // catalogue: commission %
        }
      }
      // If no items found, fall back to commission rate on full order amount
      if (items.length === 0) {
        orderEarnings = parseFloat(order.totalAmount) * (catalogueCommissionRate / 100);
      }
      eposEarningsMap.set(order.id, orderEarnings);
    }

    // Create unified order records for analytics
    const unifiedOrders: Array<{ id: string; totalAmount: string; resellerEarnings: string; customerEmail: string; orderDate: Date; source: string }> = [];
    
    for (const order of storefrontOrders) {
      unifiedOrders.push({
        id: order.id,
        totalAmount: order.totalAmount,
        resellerEarnings: order.resellerEarnings || '0',
        customerEmail: order.customerEmail,
        orderDate: order.orderDate,
        source: 'storefront',
      });
    }
    
    for (const order of eposOrders) {
      const earnings = eposEarningsMap.get(order.id) ?? 0;
      unifiedOrders.push({
        id: order.id,
        totalAmount: order.totalAmount,
        resellerEarnings: earnings.toFixed(2),
        customerEmail: order.customerEmail || 'epos@customer',
        orderDate: order.orderDate,
        source: 'epos',
      });
    }

    if (unifiedOrders.length === 0) {
      return {
        summary: {
          totalOrders: 0,
          totalRevenue: "0.00",
          totalEarnings: "0.00",
          averageOrderValue: "0.00",
          uniqueCustomers: 0
        },
        salesTrend: [],
        topProducts: [],
        commissionBreakdown: {
          totalCommission: "0.00",
          averageCommissionRate: "0.00",
          highestCommissionOrder: "0.00"
        }
      };
    }

    // Summary metrics
    const totalOrders = unifiedOrders.length;
    const totalRevenue = unifiedOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
    const totalEarnings = unifiedOrders.reduce((sum, order) => sum + parseFloat(order.resellerEarnings), 0);
    const averageOrderValue = totalRevenue / totalOrders;
    const uniqueCustomers = new Set(unifiedOrders.map(o => o.customerEmail)).size;

    // Sales trend (group by date)
    const salesByDate = new Map<string, { orders: number; revenue: number; earnings: number }>();
    for (const order of unifiedOrders) {
      const dateKey = new Date(order.orderDate).toISOString().split('T')[0];
      const existing = salesByDate.get(dateKey) || { orders: 0, revenue: 0, earnings: 0 };
      salesByDate.set(dateKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + parseFloat(order.totalAmount),
        earnings: existing.earnings + parseFloat(order.resellerEarnings)
      });
    }

    const salesTrend = Array.from(salesByDate.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue.toFixed(2),
        earnings: data.earnings.toFixed(2)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products - from storefront orders
    const productSales = new Map<string, { name: string; sold: number; revenue: number; earnings: number }>();
    for (const order of storefrontOrders) {
      const items = await this.getResellerCustomerOrderItems(order.id);
      for (const item of items) {
        const existing = productSales.get(item.productId) || { 
          name: item.productName, 
          sold: 0, 
          revenue: 0,
          earnings: 0
        };
        const itemRevenue = parseFloat(item.unitPrice) * item.quantity;
        const orderEarnings = parseFloat(order.resellerEarnings || '0');
        const orderTotal = parseFloat(order.totalAmount);
        const itemEarnings = orderTotal > 0 ? orderEarnings * (itemRevenue / orderTotal) : 0;
        productSales.set(item.productId, {
          name: item.productName,
          sold: existing.sold + item.quantity,
          revenue: existing.revenue + itemRevenue,
          earnings: existing.earnings + itemEarnings
        });
      }
    }
    // Also include EPOS order items in top products
    for (const order of eposOrders) {
      const items = await db.select().from(customerOrderItems)
        .where(eq(customerOrderItems.orderId, order.id));
      for (const item of items) {
        const productKey = item.vendorProductId || item.productId?.toString() || 'unknown';
        const existing = productSales.get(productKey) || { 
          name: item.productName, 
          sold: 0, 
          revenue: 0,
          earnings: 0
        };
        const itemRevenue = parseFloat(item.unitPrice) * item.quantity;
        // Own product (vendor_product_id set) → 100% earnings; catalogue item → commission %
        const itemEarnings = item.vendorProductId
          ? itemRevenue
          : itemRevenue * (catalogueCommissionRate / 100);
        productSales.set(productKey, {
          name: item.productName,
          sold: existing.sold + item.quantity,
          revenue: existing.revenue + itemRevenue,
          earnings: existing.earnings + itemEarnings
        });
      }
    }

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalSold: data.sold,
        revenue: data.revenue.toFixed(2),
        earnings: data.earnings.toFixed(2)
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    // Commission breakdown
    const totalCommission = totalEarnings;
    const averageCommissionRate = totalRevenue > 0 ? ((totalEarnings / totalRevenue) * 100).toFixed(2) : "0.00";
    const highestCommissionOrder = unifiedOrders.length > 0 ? Math.max(...unifiedOrders.map(o => parseFloat(o.resellerEarnings))).toFixed(2) : "0.00";

    return {
      summary: {
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        averageOrderValue: averageOrderValue.toFixed(2),
        uniqueCustomers
      },
      salesTrend,
      topProducts,
      commissionBreakdown: {
        totalCommission: totalCommission.toFixed(2),
        averageCommissionRate,
        highestCommissionOrder
      }
    };
  }

  async getAllResellersAnalytics(startDate?: Date, endDate?: Date): Promise<Array<{
    resellerId: string;
    businessName: string;
    tier: string;
    totalOrders: number;
    totalRevenue: string;
    totalEarnings: string;
    platformCommission: string;
    uniqueCustomers: number;
    averageOrderValue: string;
  }>> {
    const allResellers = await db.select().from(resellers);
    const results = [];

    for (const reseller of allResellers) {
      let sfOrders = await this.getResellerCustomerOrders(reseller.id);
      let epOrders = await db.select().from(customerOrders)
        .where(eq(customerOrders.resellerId, reseller.id));
      
      // Filter by date range
      if (startDate) {
        sfOrders = sfOrders.filter(order => new Date(order.orderDate) >= startDate);
        epOrders = epOrders.filter(order => new Date(order.orderDate) >= startDate);
      }
      if (endDate) {
        sfOrders = sfOrders.filter(order => new Date(order.orderDate) <= endDate);
        epOrders = epOrders.filter(order => new Date(order.orderDate) <= endDate);
      }

      if (sfOrders.length === 0 && epOrders.length === 0) continue;

      const totalOrders = sfOrders.length + epOrders.length;
      const sfRevenue = sfOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const epRevenue = epOrders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0);
      const totalRevenue = sfRevenue + epRevenue;
      const totalEarnings = sfOrders.reduce((sum, order) => sum + parseFloat(order.resellerEarnings), 0);
      const platformCommission = sfOrders.reduce((sum, order) => sum + parseFloat(order.platformCommission), 0);
      const allEmails = [...sfOrders.map(o => o.customerEmail), ...epOrders.map(o => o.customerEmail || 'epos')];
      const uniqueCustomers = new Set(allEmails).size;
      const averageOrderValue = totalRevenue / totalOrders;

      results.push({
        resellerId: reseller.id,
        businessName: reseller.businessName,
        tier: reseller.tier,
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        platformCommission: platformCommission.toFixed(2),
        uniqueCustomers,
        averageOrderValue: averageOrderValue.toFixed(2)
      });
    }

    return results.sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));
  }

  // B2B Account Users operations
  async getB2bAccountUsers(resellerId: string): Promise<(B2bAccountUser & { user: { email: string; firstName: string; lastName: string } })[]> {
    const accountUsers = await db
      .select({
        accountUser: b2bAccountUsers,
        user: {
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(b2bAccountUsers)
      .innerJoin(users, eq(b2bAccountUsers.userId, users.id))
      .where(eq(b2bAccountUsers.resellerId, resellerId))
      .orderBy(desc(b2bAccountUsers.createdAt));

    return accountUsers.map(row => ({
      ...row.accountUser,
      user: row.user
    }));
  }

  async getB2bAccountUser(id: string): Promise<B2bAccountUser | undefined> {
    const [accountUser] = await db
      .select()
      .from(b2bAccountUsers)
      .where(eq(b2bAccountUsers.id, id));
    return accountUser || undefined;
  }

  async createB2bAccountUser(data: InsertB2bAccountUser): Promise<B2bAccountUser> {
    const [accountUser] = await db
      .insert(b2bAccountUsers)
      .values(data)
      .returning();
    return accountUser;
  }

  async updateB2bAccountUser(id: string, updates: Partial<B2bAccountUser>): Promise<B2bAccountUser | undefined> {
    const [accountUser] = await db
      .update(b2bAccountUsers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(b2bAccountUsers.id, id))
      .returning();
    return accountUser || undefined;
  }

  async deleteB2bAccountUser(id: string): Promise<boolean> {
    const result = await db
      .delete(b2bAccountUsers)
      .where(eq(b2bAccountUsers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async checkUserInB2bAccount(userId: string, resellerId: string): Promise<B2bAccountUser | undefined> {
    const [accountUser] = await db
      .select()
      .from(b2bAccountUsers)
      .where(and(
        eq(b2bAccountUsers.userId, userId),
        eq(b2bAccountUsers.resellerId, resellerId)
      ));
    return accountUser || undefined;
  }

  // Admin Team Members operations
  async getAdminTeamMembers(): Promise<(AdminTeamMember & { user: { email: string; firstName: string; lastName: string } })[]> {
    const teamMembers = await db
      .select({
        teamMember: adminTeamMembers,
        user: {
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(adminTeamMembers)
      .leftJoin(users, eq(adminTeamMembers.userId, users.id))
      .orderBy(desc(adminTeamMembers.createdAt));

    return teamMembers.map((row) => ({
      ...row.teamMember,
      user: row.user as { email: string; firstName: string; lastName: string },
    }));
  }

  async getAdminTeamMember(id: string): Promise<AdminTeamMember | undefined> {
    const [teamMember] = await db
      .select()
      .from(adminTeamMembers)
      .where(eq(adminTeamMembers.id, id));
    return teamMember || undefined;
  }

  async createAdminTeamMember(data: InsertAdminTeamMember): Promise<AdminTeamMember> {
    const [teamMember] = await db
      .insert(adminTeamMembers)
      .values(data)
      .returning();
    return teamMember;
  }

  async updateAdminTeamMember(id: string, updates: Partial<AdminTeamMember>): Promise<AdminTeamMember | undefined> {
    const [teamMember] = await db
      .update(adminTeamMembers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(adminTeamMembers.id, id))
      .returning();
    return teamMember || undefined;
  }

  async deleteAdminTeamMember(id: string): Promise<boolean> {
    const result = await db
      .delete(adminTeamMembers)
      .where(eq(adminTeamMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAdminTeamMemberByUserId(userId: string): Promise<AdminTeamMember | undefined> {
    const [teamMember] = await db
      .select()
      .from(adminTeamMembers)
      .where(eq(adminTeamMembers.userId, userId));
    return teamMember || undefined;
  }

  async getTeamMembersForNotification(notificationType: 'newOrders' | 'shipping' | 'delivery' | 'lowStock' | 'supportTickets'): Promise<string[]> {
    const columnMap = {
      newOrders: adminTeamMembers.notifyNewOrders,
      shipping: adminTeamMembers.notifyShipping,
      delivery: adminTeamMembers.notifyDelivery,
      lowStock: adminTeamMembers.notifyLowStock,
      supportTickets: adminTeamMembers.notifySupportTickets,
    };
    
    const teamMembers = await db
      .select({
        email: users.email,
      })
      .from(adminTeamMembers)
      .leftJoin(users, eq(adminTeamMembers.userId, users.id))
      .where(and(
        eq(adminTeamMembers.isActive, true),
        eq(columnMap[notificationType], true)
      ));
    
    return teamMembers
      .filter(tm => tm.email)
      .map(tm => tm.email as string);
  }

  // Chatbot operations
  async getChatbotKnowledge(): Promise<ChatbotKnowledge[]> {
    return await db.select().from(chatbotKnowledge).orderBy(desc(chatbotKnowledge.priority), desc(chatbotKnowledge.createdAt));
  }

  async getActiveChatbotKnowledge(): Promise<ChatbotKnowledge[]> {
    return await db.select().from(chatbotKnowledge)
      .where(eq(chatbotKnowledge.isActive, true))
      .orderBy(desc(chatbotKnowledge.priority));
  }

  async getChatbotKnowledgeById(id: string): Promise<ChatbotKnowledge | undefined> {
    const [knowledge] = await db.select().from(chatbotKnowledge).where(eq(chatbotKnowledge.id, id));
    return knowledge || undefined;
  }

  async createChatbotKnowledge(knowledge: InsertChatbotKnowledge & { createdBy?: string }): Promise<ChatbotKnowledge> {
    const [created] = await db.insert(chatbotKnowledge).values(knowledge).returning();
    return created;
  }

  async updateChatbotKnowledge(id: string, updates: Partial<ChatbotKnowledge>): Promise<ChatbotKnowledge | undefined> {
    const [updated] = await db
      .update(chatbotKnowledge)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbotKnowledge.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteChatbotKnowledge(id: string): Promise<boolean> {
    const result = await db.delete(chatbotKnowledge).where(eq(chatbotKnowledge.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getOrCreateConversation(sessionId: string, userId?: string): Promise<ChatbotConversation> {
    // Try to find existing active conversation
    const [existing] = await db.select().from(chatbotConversations)
      .where(and(
        eq(chatbotConversations.sessionId, sessionId),
        eq(chatbotConversations.isActive, true)
      ));

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [conversation] = await db.insert(chatbotConversations).values({
      sessionId,
      userId,
      isActive: true,
    }).returning();

    return conversation;
  }

  async getConversationMessages(conversationId: string): Promise<ChatbotMessage[]> {
    return await db.select().from(chatbotMessages)
      .where(eq(chatbotMessages.conversationId, conversationId))
      .orderBy(chatbotMessages.timestamp);
  }

  async saveChatbotMessage(message: InsertChatbotMessage): Promise<ChatbotMessage> {
    const [saved] = await db.insert(chatbotMessages).values(message).returning();
    return saved;
  }

  async createUnansweredQuery(query: InsertChatbotUnansweredQuery): Promise<ChatbotUnansweredQuery> {
    const [created] = await db.insert(chatbotUnansweredQueries).values(query).returning();
    return created;
  }

  async getUnansweredQueries(): Promise<ChatbotUnansweredQuery[]> {
    return await db.select().from(chatbotUnansweredQueries)
      .orderBy(desc(chatbotUnansweredQueries.createdAt));
  }

  async resolveUnansweredQuery(id: string, resolvedBy: string): Promise<ChatbotUnansweredQuery | undefined> {
    const [resolved] = await db
      .update(chatbotUnansweredQueries)
      .set({
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy,
      })
      .where(eq(chatbotUnansweredQueries.id, id))
      .returning();
    return resolved || undefined;
  }

  async markQueryEmailSent(id: string): Promise<void> {
    await db
      .update(chatbotUnansweredQueries)
      .set({ emailSent: true })
      .where(eq(chatbotUnansweredQueries.id, id));
  }

  async getUserById(userId: string): Promise<User | undefined> {
    return this.getUser(userId);
  }

  async getProducts(): Promise<Product[]> {
    return this.getAllProducts();
  }

  // Cart operations
  async getCart(userId: string | null, sessionId: string | null): Promise<Cart | undefined> {
    // First try to find by userId
    if (userId) {
      const [cart] = await db.select().from(carts).where(eq(carts.userId, userId));
      if (cart) return cart;
    }
    
    // If no cart found by userId, also check sessionId
    // This handles the case where user was a guest and then logged in
    if (sessionId) {
      const [sessionCart] = await db.select().from(carts).where(eq(carts.sessionId, sessionId));
      if (sessionCart) {
        // If user is logged in and cart exists for session, update cart to link to user
        if (userId && !sessionCart.userId) {
          const [updated] = await db
            .update(carts)
            .set({ userId, updatedAt: new Date() })
            .where(eq(carts.id, sessionCart.id))
            .returning();
          return updated || sessionCart;
        }
        return sessionCart;
      }
    }
    
    return undefined;
  }

  async createCart(cart: InsertCart): Promise<Cart> {
    const [created] = await db.insert(carts).values(cart).returning();
    return created;
  }

  async getCartItems(cartId: string): Promise<any[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
  }

  async addCartItem(item: InsertCartItem): Promise<CartItem> {
    const [created] = await db.insert(cartItems).values(item).returning();
    return created;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updated || undefined;
  }

  async removeCartItem(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(cartId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  }

  // Saved payment methods operations
  async getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    return await db.select().from(savedPaymentMethods)
      .where(eq(savedPaymentMethods.userId, userId))
      .orderBy(desc(savedPaymentMethods.isDefault), desc(savedPaymentMethods.createdAt));
  }

  async getSavedPaymentMethod(id: string): Promise<SavedPaymentMethod | undefined> {
    const [method] = await db.select().from(savedPaymentMethods).where(eq(savedPaymentMethods.id, id));
    return method;
  }

  async createSavedPaymentMethod(method: InsertSavedPaymentMethod): Promise<SavedPaymentMethod> {
    const [newMethod] = await db.insert(savedPaymentMethods).values(method).returning();
    return newMethod;
  }

  async deleteSavedPaymentMethod(id: string): Promise<void> {
    await db.delete(savedPaymentMethods).where(eq(savedPaymentMethods.id, id));
  }

  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.update(savedPaymentMethods)
        .set({ isDefault: false })
        .where(eq(savedPaymentMethods.userId, userId));
      
      await tx.update(savedPaymentMethods)
        .set({ isDefault: true })
        .where(and(eq(savedPaymentMethods.id, methodId), eq(savedPaymentMethods.userId, userId)));
    });
  }

  // Loyalty program operations
  async getLoyaltyPoints(userId: string): Promise<LoyaltyPoints | undefined> {
    const [points] = await db.select().from(loyaltyPoints).where(eq(loyaltyPoints.userId, userId));
    return points;
  }

  async createLoyaltyPoints(points: InsertLoyaltyPoints): Promise<LoyaltyPoints> {
    const [created] = await db.insert(loyaltyPoints).values(points).returning();
    return created;
  }

  async updateLoyaltyPoints(userId: string, updates: Partial<LoyaltyPoints>): Promise<LoyaltyPoints | undefined> {
    const [updated] = await db.update(loyaltyPoints)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyPoints.userId, userId))
      .returning();
    return updated;
  }

  async addLoyaltyPoints(userId: string, points: number, description: string, relatedOrderId?: string): Promise<{ balance: LoyaltyPoints; transaction: LoyaltyTransaction }> {
    return await db.transaction(async (tx) => {
      const [balance] = await tx.select().from(loyaltyPoints).where(eq(loyaltyPoints.userId, userId));
      
      let currentBalance = balance;
      if (!currentBalance) {
        const [created] = await tx.insert(loyaltyPoints)
          .values({
            userId,
            currentPoints: 0,
            lifetimePoints: 0,
            tier: "bronze",
          })
          .returning();
        currentBalance = created;
      }

      const newCurrentPoints = currentBalance.currentPoints + points;
      const newLifetimePoints = currentBalance.lifetimePoints + points;

      let newTier = currentBalance.tier;
      if (newLifetimePoints >= 10000) newTier = "vip";
      else if (newLifetimePoints >= 5000) newTier = "platinum";
      else if (newLifetimePoints >= 2500) newTier = "gold";
      else if (newLifetimePoints >= 1000) newTier = "silver";
      else newTier = "bronze";

      const [updatedBalance] = await tx.update(loyaltyPoints)
        .set({
          currentPoints: newCurrentPoints,
          lifetimePoints: newLifetimePoints,
          tier: newTier,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyPoints.userId, userId))
        .returning();

      const [transaction] = await tx.insert(loyaltyTransactions)
        .values({
          userId,
          points,
          type: "earned",
          description,
          relatedOrderId,
        })
        .returning();

      return { balance: updatedBalance, transaction };
    });
  }

  async deductLoyaltyPoints(userId: string, points: number, description: string): Promise<{ balance: LoyaltyPoints; transaction: LoyaltyTransaction }> {
    return await db.transaction(async (tx) => {
      const [balance] = await tx.select().from(loyaltyPoints).where(eq(loyaltyPoints.userId, userId));
      
      if (!balance) {
        throw new Error("User has no loyalty points");
      }

      if (balance.currentPoints < points) {
        throw new Error("Insufficient points");
      }

      const newCurrentPoints = balance.currentPoints - points;

      const [updatedBalance] = await tx.update(loyaltyPoints)
        .set({
          currentPoints: newCurrentPoints,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyPoints.userId, userId))
        .returning();

      const [transaction] = await tx.insert(loyaltyTransactions)
        .values({
          userId,
          points: -points,
          type: "redeemed",
          description,
        })
        .returning();

      return { balance: updatedBalance, transaction };
    });
  }

  async getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    return await db.select().from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt));
  }

  async getLoyaltyRewards(): Promise<LoyaltyReward[]> {
    return await db.select().from(loyaltyRewards)
      .where(eq(loyaltyRewards.isActive, true))
      .orderBy(loyaltyRewards.pointsCost);
  }

  async getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined> {
    const [reward] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, id));
    return reward;
  }

  async createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const [created] = await db.insert(loyaltyRewards).values(reward).returning();
    return created;
  }

  async getAllLoyaltyRewards(): Promise<LoyaltyReward[]> {
    return await db.select().from(loyaltyRewards)
      .orderBy(desc(loyaltyRewards.createdAt));
  }

  async updateLoyaltyReward(id: string, updates: Partial<InsertLoyaltyReward>): Promise<LoyaltyReward | undefined> {
    const [updated] = await db.update(loyaltyRewards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyRewards.id, id))
      .returning();
    return updated;
  }

  async deleteLoyaltyReward(id: string): Promise<void> {
    await db.delete(loyaltyRewards).where(eq(loyaltyRewards.id, id));
  }

  async redeemLoyaltyReward(userId: string, rewardId: string): Promise<LoyaltyRedemption> {
    return await db.transaction(async (tx) => {
      const [reward] = await tx.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, rewardId));
      if (!reward) {
        throw new Error("Reward not found");
      }

      if (!reward.isActive) {
        throw new Error("Reward is no longer available");
      }

      const [balance] = await tx.select().from(loyaltyPoints).where(eq(loyaltyPoints.userId, userId));
      if (!balance) {
        throw new Error("User has no loyalty points");
      }

      if (balance.currentPoints < reward.pointsCost) {
        throw new Error("Insufficient points");
      }

      const newCurrentPoints = balance.currentPoints - reward.pointsCost;

      await tx.update(loyaltyPoints)
        .set({
          currentPoints: newCurrentPoints,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyPoints.userId, userId));

      await tx.insert(loyaltyTransactions)
        .values({
          userId,
          points: -reward.pointsCost,
          type: "redeemed",
          description: `Redeemed: ${reward.name}`,
        });

      const [redemption] = await tx.insert(loyaltyRedemptions)
        .values({
          userId,
          rewardId,
          pointsUsed: reward.pointsCost,
          status: "pending",
        })
        .returning();

      return redemption;
    });
  }

  async getLoyaltyRedemptions(userId: string): Promise<any[]> {
    return await db.select({
      id: loyaltyRedemptions.id,
      userId: loyaltyRedemptions.userId,
      rewardId: loyaltyRedemptions.rewardId,
      pointsUsed: loyaltyRedemptions.pointsUsed,
      status: loyaltyRedemptions.status,
      redeemedAt: loyaltyRedemptions.redeemedAt,
      fulfilledAt: loyaltyRedemptions.fulfilledAt,
      rewardName: loyaltyRewards.name,
      rewardDescription: loyaltyRewards.description,
      rewardType: loyaltyRewards.type,
      rewardValue: loyaltyRewards.value,
    })
    .from(loyaltyRedemptions)
    .leftJoin(loyaltyRewards, eq(loyaltyRedemptions.rewardId, loyaltyRewards.id))
    .where(eq(loyaltyRedemptions.userId, userId))
    .orderBy(desc(loyaltyRedemptions.redeemedAt));
  }

  // Back-in-stock alert operations
  async subscribeToStockAlert(subscription: InsertStockAlertSubscription): Promise<StockAlertSubscription> {
    const [created] = await db.insert(stockAlertSubscriptions).values(subscription).returning();
    return created;
  }

  async getStockAlertSubscription(userId: string, productId: string, variantId?: string): Promise<StockAlertSubscription | undefined> {
    if (variantId) {
      const [subscription] = await db.select().from(stockAlertSubscriptions)
        .where(and(
          eq(stockAlertSubscriptions.userId, userId),
          eq(stockAlertSubscriptions.productId, productId),
          eq(stockAlertSubscriptions.variantId, variantId)
        ));
      return subscription;
    } else {
      const [subscription] = await db.select().from(stockAlertSubscriptions)
        .where(and(
          eq(stockAlertSubscriptions.userId, userId),
          eq(stockAlertSubscriptions.productId, productId),
          sql`${stockAlertSubscriptions.variantId} IS NULL`
        ));
      return subscription;
    }
  }

  async getUserStockAlertSubscriptions(userId: string): Promise<any[]> {
    return await db.select({
      id: stockAlertSubscriptions.id,
      userId: stockAlertSubscriptions.userId,
      productId: stockAlertSubscriptions.productId,
      variantId: stockAlertSubscriptions.variantId,
      notificationSent: stockAlertSubscriptions.notificationSent,
      createdAt: stockAlertSubscriptions.createdAt,
      productName: products.name,
      productImage: products.mainImageUrl,
    })
    .from(stockAlertSubscriptions)
    .leftJoin(products, eq(stockAlertSubscriptions.productId, products.id))
    .where(eq(stockAlertSubscriptions.userId, userId))
    .orderBy(desc(stockAlertSubscriptions.createdAt));
  }

  async deleteStockAlertSubscription(id: string): Promise<void> {
    await db.delete(stockAlertSubscriptions).where(eq(stockAlertSubscriptions.id, id));
  }

  async getStockAlertSubscriptionsByProduct(productId: string, variantId?: string): Promise<StockAlertSubscription[]> {
    if (variantId) {
      return await db.select().from(stockAlertSubscriptions)
        .where(and(
          eq(stockAlertSubscriptions.productId, productId),
          eq(stockAlertSubscriptions.variantId, variantId),
          eq(stockAlertSubscriptions.notificationSent, false)
        ));
    } else {
      return await db.select().from(stockAlertSubscriptions)
        .where(and(
          eq(stockAlertSubscriptions.productId, productId),
          sql`${stockAlertSubscriptions.variantId} IS NULL`,
          eq(stockAlertSubscriptions.notificationSent, false)
        ));
    }
  }

  async markStockAlertNotificationSent(id: string): Promise<void> {
    await db.update(stockAlertSubscriptions)
      .set({ notificationSent: true })
      .where(eq(stockAlertSubscriptions.id, id));
  }

  // Abandoned cart recovery operations
  async createAbandonedCart(cart: InsertAbandonedCart): Promise<AbandonedCart> {
    const [created] = await db.insert(abandonedCarts).values(cart).returning();
    return created;
  }

  async getAbandonedCartByCartId(cartId: string): Promise<AbandonedCart | undefined> {
    const [cart] = await db.select().from(abandonedCarts)
      .where(eq(abandonedCarts.cartId, cartId));
    return cart;
  }

  async getAbandonedCarts(filters?: { recovered?: boolean }): Promise<any[]> {
    let query = db.select({
      id: abandonedCarts.id,
      cartId: abandonedCarts.cartId,
      userId: abandonedCarts.userId,
      email: abandonedCarts.email,
      firstName: abandonedCarts.firstName,
      totalValue: abandonedCarts.totalValue,
      itemCount: abandonedCarts.itemCount,
      firstReminderSent: abandonedCarts.firstReminderSent,
      firstReminderSentAt: abandonedCarts.firstReminderSentAt,
      secondReminderSent: abandonedCarts.secondReminderSent,
      secondReminderSentAt: abandonedCarts.secondReminderSentAt,
      finalReminderSent: abandonedCarts.finalReminderSent,
      finalReminderSentAt: abandonedCarts.finalReminderSentAt,
      recovered: abandonedCarts.recovered,
      recoveredAt: abandonedCarts.recoveredAt,
      createdAt: abandonedCarts.createdAt,
    })
    .from(abandonedCarts)
    .$dynamic();

    if (filters?.recovered !== undefined) {
      query = query.where(eq(abandonedCarts.recovered, filters.recovered));
    }

    return await query.orderBy(desc(abandonedCarts.createdAt));
  }

  async markAbandonedCartRecovered(id: string): Promise<void> {
    await db.update(abandonedCarts)
      .set({ 
        recovered: true,
        recoveredAt: new Date()
      })
      .where(eq(abandonedCarts.id, id));
  }

  async updateAbandonedCartReminder(id: string, stage: 'first' | 'second' | 'final'): Promise<void> {
    const now = new Date();
    const updates: any = {};
    
    if (stage === 'first') {
      updates.firstReminderSent = true;
      updates.firstReminderSentAt = now;
    } else if (stage === 'second') {
      updates.secondReminderSent = true;
      updates.secondReminderSentAt = now;
    } else if (stage === 'final') {
      updates.finalReminderSent = true;
      updates.finalReminderSentAt = now;
    }

    await db.update(abandonedCarts)
      .set(updates)
      .where(eq(abandonedCarts.id, id));
  }

  async getAbandonedCartsForReminders(stage: 'first' | 'second' | 'final'): Promise<any[]> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    let query = db.select({
      id: abandonedCarts.id,
      cartId: abandonedCarts.cartId,
      userId: abandonedCarts.userId,
      email: abandonedCarts.email,
      firstName: abandonedCarts.firstName,
      totalValue: abandonedCarts.totalValue,
      itemCount: abandonedCarts.itemCount,
      createdAt: abandonedCarts.createdAt,
    })
    .from(abandonedCarts)
    .where(eq(abandonedCarts.recovered, false))
    .$dynamic();

    if (stage === 'first') {
      query = query.where(and(
        eq(abandonedCarts.firstReminderSent, false),
        sql`${abandonedCarts.createdAt} <= ${oneDayAgo}`
      ));
    } else if (stage === 'second') {
      query = query.where(and(
        eq(abandonedCarts.firstReminderSent, true),
        eq(abandonedCarts.secondReminderSent, false),
        sql`${abandonedCarts.createdAt} <= ${twoDaysAgo}`
      ));
    } else if (stage === 'final') {
      query = query.where(and(
        eq(abandonedCarts.secondReminderSent, true),
        eq(abandonedCarts.finalReminderSent, false),
        sql`${abandonedCarts.createdAt} <= ${threeDaysAgo}`
      ));
    }

    return await query;
  }

  // B2B Net Terms / Invoicing operations
  async createB2bInvoice(invoice: InsertB2bInvoice): Promise<B2bInvoice> {
    const [created] = await db.insert(b2bInvoices).values(invoice).returning();
    return created;
  }

  async getB2bInvoice(id: string): Promise<any | undefined> {
    const [invoice] = await db.select({
      id: b2bInvoices.id,
      invoiceNumber: b2bInvoices.invoiceNumber,
      resellerId: b2bInvoices.resellerId,
      orderId: b2bInvoices.orderId,
      status: b2bInvoices.status,
      paymentTerms: b2bInvoices.paymentTerms,
      subtotal: b2bInvoices.subtotal,
      taxAmount: b2bInvoices.taxAmount,
      totalAmount: b2bInvoices.totalAmount,
      amountPaid: b2bInvoices.amountPaid,
      amountDue: b2bInvoices.amountDue,
      issueDate: b2bInvoices.issueDate,
      dueDate: b2bInvoices.dueDate,
      paidDate: b2bInvoices.paidDate,
      notes: b2bInvoices.notes,
      createdAt: b2bInvoices.createdAt,
      updatedAt: b2bInvoices.updatedAt,
      resellerBusinessName: resellers.businessName,
      resellerEmail: resellers.email,
    })
    .from(b2bInvoices)
    .leftJoin(resellers, eq(b2bInvoices.resellerId, resellers.id))
    .where(eq(b2bInvoices.id, id));
    
    return invoice;
  }

  async getB2bInvoices(filters?: { resellerId?: string; status?: string }): Promise<any[]> {
    let query = db.select({
      id: b2bInvoices.id,
      invoiceNumber: b2bInvoices.invoiceNumber,
      resellerId: b2bInvoices.resellerId,
      orderId: b2bInvoices.orderId,
      status: b2bInvoices.status,
      paymentTerms: b2bInvoices.paymentTerms,
      subtotal: b2bInvoices.subtotal,
      taxAmount: b2bInvoices.taxAmount,
      totalAmount: b2bInvoices.totalAmount,
      amountPaid: b2bInvoices.amountPaid,
      amountDue: b2bInvoices.amountDue,
      issueDate: b2bInvoices.issueDate,
      dueDate: b2bInvoices.dueDate,
      paidDate: b2bInvoices.paidDate,
      notes: b2bInvoices.notes,
      createdAt: b2bInvoices.createdAt,
      updatedAt: b2bInvoices.updatedAt,
      resellerBusinessName: resellers.businessName,
      resellerEmail: resellers.email,
    })
    .from(b2bInvoices)
    .leftJoin(resellers, eq(b2bInvoices.resellerId, resellers.id))
    .$dynamic();

    const conditions = [];
    if (filters?.resellerId) {
      conditions.push(eq(b2bInvoices.resellerId, filters.resellerId));
    }
    if (filters?.status) {
      conditions.push(eq(b2bInvoices.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(b2bInvoices.createdAt));
  }

  async updateB2bInvoiceStatus(id: string, status: string): Promise<void> {
    await db.update(b2bInvoices)
      .set({ 
        status,
        ...(status === 'paid' ? { paidDate: new Date() } : {})
      })
      .where(eq(b2bInvoices.id, id));
  }

  async recordB2bInvoicePayment(payment: InsertB2bInvoicePayment): Promise<B2bInvoicePayment> {
    const [created] = await db.insert(b2bInvoicePayments).values(payment).returning();
    return created;
  }

  async getB2bInvoicePayments(invoiceId: string): Promise<B2bInvoicePayment[]> {
    return await db.select()
      .from(b2bInvoicePayments)
      .where(eq(b2bInvoicePayments.invoiceId, invoiceId))
      .orderBy(desc(b2bInvoicePayments.paidAt));
  }

  async updateB2bInvoiceAmounts(invoiceId: string, amountPaid: string, amountDue: string, status: string): Promise<void> {
    await db.update(b2bInvoices)
      .set({ 
        amountPaid,
        amountDue,
        status,
        ...(status === 'paid' ? { paidDate: new Date() } : {})
      })
      .where(eq(b2bInvoices.id, invoiceId));
  }

  // Inventory Management Operations
  async getAllProductVariantsWithInventory(): Promise<any[]> {
    const variants = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stockQuantity: productVariants.stockQuantity,
        retailPrice: productVariants.retailPrice,
        costPrice: productVariants.costPrice,
        productName: products.name,
        productCategory: products.category,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(
        or(eq(products.isDeleted, false), isNull(products.isDeleted)),
        or(eq(products.isActive, true), isNull(products.isActive))
      ))
      .orderBy(products.name, productVariants.size);
    
    return variants;
  }

  async searchProductVariantByBarcode(query: string): Promise<any | undefined> {
    // Filter to exclude deleted and inactive products
    const notDeletedFilter = and(
      or(eq(products.isDeleted, false), isNull(products.isDeleted)),
      or(eq(products.isActive, true), isNull(products.isActive))
    );
    
    // First try exact match on SKU
    let [variant] = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stockQuantity: productVariants.stockQuantity,
        retailPrice: productVariants.retailPrice,
        costPrice: productVariants.costPrice,
        barcodeDescriptor: productVariants.barcodeDescriptor,
        packQuantity: productVariants.packQuantity,
        productName: products.name,
        productCategory: products.category,
        productBarcodeDescriptor: products.barcodeDescriptor,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(productVariants.sku, query), notDeletedFilter))
      .limit(1);
    
    if (variant) return variant;
    
    // Try searching by variant barcode descriptor
    [variant] = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stockQuantity: productVariants.stockQuantity,
        retailPrice: productVariants.retailPrice,
        costPrice: productVariants.costPrice,
        barcodeDescriptor: productVariants.barcodeDescriptor,
        packQuantity: productVariants.packQuantity,
        productName: products.name,
        productCategory: products.category,
        productBarcodeDescriptor: products.barcodeDescriptor,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(productVariants.barcodeDescriptor, query), notDeletedFilter))
      .limit(1);
    
    if (variant) return variant;
    
    // Try searching by product barcode descriptor (fallback)
    [variant] = await db
      .select({
        id: productVariants.id,
        productId: productVariants.productId,
        sku: productVariants.sku,
        size: productVariants.size,
        color: productVariants.color,
        stockQuantity: productVariants.stockQuantity,
        retailPrice: productVariants.retailPrice,
        costPrice: productVariants.costPrice,
        barcodeDescriptor: productVariants.barcodeDescriptor,
        packQuantity: productVariants.packQuantity,
        productName: products.name,
        productCategory: products.category,
        productBarcodeDescriptor: products.barcodeDescriptor,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(and(eq(products.barcodeDescriptor, query), notDeletedFilter))
      .limit(1);
    
    return variant || undefined;
  }

  async addInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [created] = await db
      .insert(inventoryTransactions)
      .values(transaction)
      .returning();
    return created;
  }

  async updateProductVariantStock(variantId: string, quantityChange: number): Promise<void> {
    await db
      .update(productVariants)
      .set({
        stockQuantity: sql`${productVariants.stockQuantity} + ${quantityChange}`,
        updatedAt: new Date()
      })
      .where(eq(productVariants.id, variantId));
  }

  async getInventoryTransactions(variantId?: string, limit: number = 50): Promise<InventoryTransaction[]> {
    let query = db
      .select()
      .from(inventoryTransactions)
      .orderBy(desc(inventoryTransactions.createdAt))
      .limit(limit)
      .$dynamic();

    if (variantId) {
      query = query.where(eq(inventoryTransactions.variantId, variantId));
    }

    return await query;
  }

  // Hero Video Operations
  async getHeroVideos(): Promise<HeroVideo[]> {
    return await db
      .select()
      .from(heroVideos)
      .orderBy(heroVideos.displayOrder);
  }

  async getActiveHeroVideos(): Promise<HeroVideo[]> {
    return await db
      .select()
      .from(heroVideos)
      .where(eq(heroVideos.isActive, true))
      .orderBy(heroVideos.displayOrder);
  }

  async getHeroVideo(id: string): Promise<HeroVideo | undefined> {
    const [video] = await db
      .select()
      .from(heroVideos)
      .where(eq(heroVideos.id, id));
    return video || undefined;
  }

  async createHeroVideo(video: InsertHeroVideo): Promise<HeroVideo> {
    const [created] = await db
      .insert(heroVideos)
      .values(video)
      .returning();
    return created;
  }

  async updateHeroVideo(id: string, updates: Partial<HeroVideo>): Promise<HeroVideo | undefined> {
    const [updated] = await db
      .update(heroVideos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(heroVideos.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHeroVideo(id: string): Promise<boolean> {
    const result = await db
      .delete(heroVideos)
      .where(eq(heroVideos.id, id))
      .returning();
    return result.length > 0;
  }

  async reorderHeroVideos(videoIds: string[]): Promise<void> {
    for (let i = 0; i < videoIds.length; i++) {
      await db
        .update(heroVideos)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(heroVideos.id, videoIds[i]));
    }
  }

  // Hero Image Operations
  async getHeroImages(): Promise<HeroImage[]> {
    return await db
      .select()
      .from(heroImages)
      .orderBy(heroImages.displayOrder);
  }

  async getActiveHeroImages(includeHeroProducts: boolean = true): Promise<HeroImage[]> {
    // Get regular hero images
    const regularHeroImages = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.isActive, true))
      .orderBy(heroImages.displayOrder);
    
    // If hero products are disabled, only return regular hero images
    if (!includeHeroProducts) {
      return regularHeroImages;
    }
    
    // Get hero products (products marked as is_hero_product = true)
    const heroProducts = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
      })
      .from(products)
      .where(
        and(
          eq(products.isHeroProduct, true),
          eq(products.isActive, true),
          or(eq(products.isDeleted, false), isNull(products.isDeleted))
        )
      );
    
    // Convert hero products to hero image format - prioritize at the beginning
    const heroProductImages: HeroImage[] = heroProducts
      .filter(p => p.imageUrl) // Only include products with images
      .map((product, index) => ({
        id: `hero-product-${product.id}`,
        title: product.name,
        imageUrl: product.imageUrl!,
        displayOrder: -1000 + index, // Place BEFORE regular hero images (negative order)
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    
    // Combine and sort by display order (hero products first due to negative values)
    return [...regularHeroImages, ...heroProductImages].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getHeroImage(id: string): Promise<HeroImage | undefined> {
    const [image] = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.id, id));
    return image || undefined;
  }

  async createHeroImage(image: InsertHeroImage): Promise<HeroImage> {
    const [created] = await db
      .insert(heroImages)
      .values(image)
      .returning();
    return created;
  }

  async updateHeroImage(id: string, updates: Partial<HeroImage>): Promise<HeroImage | undefined> {
    const [updated] = await db
      .update(heroImages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(heroImages.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHeroImage(id: string): Promise<boolean> {
    const result = await db
      .delete(heroImages)
      .where(eq(heroImages.id, id))
      .returning();
    return result.length > 0;
  }

  async reorderHeroImages(imageIds: string[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(heroImages)
        .set({ displayOrder: i, updatedAt: new Date() })
        .where(eq(heroImages.id, imageIds[i]));
    }
  }

  // Warehouse Inventory Operations
  async createWarehouseInventory(data: { 
    warehouseId: string; 
    productId: string; 
    quantity: number; 
    location?: string | null; 
    minStockLevel?: number;
  }): Promise<WarehouseInventory> {
    const [created] = await db
      .insert(warehouseInventory)
      .values({
        warehouseId: data.warehouseId,
        productId: data.productId,
        quantity: data.quantity,
        location: data.location || null,
        minStockLevel: data.minStockLevel || 10,
      })
      .returning();
    return created;
  }

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventory[]> {
    return await db
      .select()
      .from(warehouseInventory)
      .where(eq(warehouseInventory.warehouseId, warehouseId));
  }

  async updateWarehouseInventory(id: string, updates: Partial<WarehouseInventory>): Promise<WarehouseInventory | undefined> {
    const [updated] = await db
      .update(warehouseInventory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(warehouseInventory.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteWarehouseInventoryByProduct(productId: string): Promise<void> {
    await db
      .delete(warehouseInventory)
      .where(eq(warehouseInventory.productId, productId));
  }

  // ============================================================================
  // CRM & MARKETING OPERATIONS IMPLEMENTATION
  // ============================================================================

  // Loyalty Tier Benefits Operations
  async getLoyaltyTierBenefits(): Promise<LoyaltyTierBenefits[]> {
    return await db.select().from(loyaltyTierBenefits).orderBy(loyaltyTierBenefits.tier);
  }

  async getLoyaltyTierBenefit(tier: string): Promise<LoyaltyTierBenefits | undefined> {
    const [benefit] = await db.select().from(loyaltyTierBenefits).where(eq(loyaltyTierBenefits.tier, tier as any));
    return benefit || undefined;
  }

  async upsertLoyaltyTierBenefits(benefits: InsertLoyaltyTierBenefits): Promise<LoyaltyTierBenefits> {
    const existing = await this.getLoyaltyTierBenefit(benefits.tier);
    if (existing) {
      const [updated] = await db
        .update(loyaltyTierBenefits)
        .set({ ...benefits, updatedAt: new Date() })
        .where(eq(loyaltyTierBenefits.tier, benefits.tier as any))
        .returning();
      return updated;
    }
    const [created] = await db.insert(loyaltyTierBenefits).values(benefits).returning();
    return created;
  }

  // Customer Segments Operations
  async getCustomerSegments(): Promise<any[]> {
    return await db.select().from(customerSegments).orderBy(desc(customerSegments.createdAt));
  }

  async getCustomerSegment(id: string): Promise<any | undefined> {
    const [segment] = await db.select().from(customerSegments).where(eq(customerSegments.id, id));
    return segment || undefined;
  }

  async createCustomerSegment(segment: { name: string; description?: string; criteria: string }): Promise<any> {
    const [created] = await db.insert(customerSegments).values({
      name: segment.name,
      description: segment.description || null,
      criteria: segment.criteria,
      customerCount: 0,
      isActive: true,
    }).returning();
    return created;
  }

  async updateCustomerSegment(id: string, updates: Partial<any>): Promise<any | undefined> {
    const [updated] = await db
      .update(customerSegments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerSegments.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCustomerSegment(id: string): Promise<boolean> {
    await db.delete(customerSegmentMembers).where(eq(customerSegmentMembers.segmentId, id));
    const result = await db.delete(customerSegments).where(eq(customerSegments.id, id)).returning();
    return result.length > 0;
  }

  async getSegmentMembers(segmentId: string): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        addedAt: customerSegmentMembers.addedAt,
      })
      .from(customerSegmentMembers)
      .innerJoin(users, eq(customerSegmentMembers.userId, users.id))
      .where(eq(customerSegmentMembers.segmentId, segmentId));
  }

  async addCustomerToSegment(segmentId: string, userId: string): Promise<void> {
    await db.insert(customerSegmentMembers).values({
      segmentId,
      userId,
    }).onConflictDoNothing();
    await db.update(customerSegments)
      .set({ customerCount: sql`${customerSegments.customerCount} + 1` })
      .where(eq(customerSegments.id, segmentId));
  }

  async removeCustomerFromSegment(segmentId: string, userId: string): Promise<void> {
    await db.delete(customerSegmentMembers)
      .where(and(
        eq(customerSegmentMembers.segmentId, segmentId),
        eq(customerSegmentMembers.userId, userId)
      ));
    await db.update(customerSegments)
      .set({ customerCount: sql`GREATEST(${customerSegments.customerCount} - 1, 0)` })
      .where(eq(customerSegments.id, segmentId));
  }

  async refreshSegmentMembers(segmentId: string): Promise<number> {
    const segment = await this.getCustomerSegment(segmentId);
    if (!segment) return 0;
    
    try {
      const criteria = JSON.parse(segment.criteria);
      let matchingUsers: any[] = [];
      
      if (criteria.type === 'vip') {
        matchingUsers = await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(customerMetrics, eq(users.id, customerMetrics.userId))
          .where(eq(customerMetrics.isVip, true));
      } else if (criteria.type === 'high_spender' && criteria.minSpend) {
        matchingUsers = await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(customerMetrics, eq(users.id, customerMetrics.userId))
          .where(sql`CAST(${customerMetrics.totalSpent} AS DECIMAL) >= ${criteria.minSpend}`);
      } else if (criteria.type === 'loyalty_tier' && criteria.tier) {
        matchingUsers = await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(loyaltyPoints, eq(users.id, loyaltyPoints.userId))
          .where(eq(loyaltyPoints.tier, criteria.tier));
      } else if (criteria.type === 'inactive' && criteria.daysSinceLastPurchase) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - criteria.daysSinceLastPurchase);
        matchingUsers = await db
          .select({ id: users.id })
          .from(users)
          .innerJoin(customerMetrics, eq(users.id, customerMetrics.userId))
          .where(sql`${customerMetrics.lastPurchaseDate} < ${cutoffDate}`);
      } else {
        matchingUsers = await db.select({ id: users.id }).from(users).where(eq(users.role, 'customer'));
      }
      
      await db.delete(customerSegmentMembers).where(eq(customerSegmentMembers.segmentId, segmentId));
      
      for (const user of matchingUsers) {
        await db.insert(customerSegmentMembers).values({
          segmentId,
          userId: user.id,
        }).onConflictDoNothing();
      }
      
      await db.update(customerSegments)
        .set({ customerCount: matchingUsers.length, updatedAt: new Date() })
        .where(eq(customerSegments.id, segmentId));
      
      return matchingUsers.length;
    } catch (e) {
      console.error('Error refreshing segment members:', e);
      return 0;
    }
  }

  // Email Template Operations
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values(template).returning();
    return created;
  }

  async updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmailTemplate(id: string): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(eq(emailTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Email Campaign Operations
  async getEmailCampaigns(): Promise<EmailCampaign[]> {
    return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
  }

  async getEmailCampaign(id: string): Promise<EmailCampaign | undefined> {
    const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
    return campaign || undefined;
  }

  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [created] = await db.insert(emailCampaigns).values(campaign).returning();
    return created;
  }

  async updateEmailCampaign(id: string, updates: Partial<EmailCampaign>): Promise<EmailCampaign | undefined> {
    const [updated] = await db
      .update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEmailCampaign(id: string): Promise<boolean> {
    await db.delete(emailCampaignSends).where(eq(emailCampaignSends.campaignId, id));
    const result = await db.delete(emailCampaigns).where(eq(emailCampaigns.id, id)).returning();
    return result.length > 0;
  }

  async sendEmailCampaign(campaignId: string): Promise<{ success: boolean; sent: number; failed: number }> {
    const campaign = await this.getEmailCampaign(campaignId);
    if (!campaign) return { success: false, sent: 0, failed: 0 };
    
    let recipients: { id: string; email: string }[] = [];
    
    if (campaign.segmentId) {
      const members = await this.getSegmentMembers(campaign.segmentId);
      recipients = members.map(m => ({ id: m.id, email: m.email }));
    } else {
      const allCustomers = await db.select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.role, 'customer'));
      recipients = allCustomers;
    }
    
    const unsubscribed = await db.select({ email: emailUnsubscribes.email }).from(emailUnsubscribes);
    const unsubscribedSet = new Set(unsubscribed.map(u => u.email.toLowerCase()));
    recipients = recipients.filter(r => !unsubscribedSet.has(r.email.toLowerCase()));
    
    let sent = 0;
    let failed = 0;
    
    for (const recipient of recipients) {
      try {
        await db.insert(emailCampaignSends).values({
          campaignId,
          userId: recipient.id,
          email: recipient.email,
          status: 'sent',
          sentAt: new Date(),
        });
        sent++;
      } catch (e) {
        failed++;
      }
    }
    
    await db.update(emailCampaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        totalRecipients: recipients.length,
        totalSent: sent,
        updatedAt: new Date(),
      })
      .where(eq(emailCampaigns.id, campaignId));
    
    return { success: true, sent, failed };
  }

  async getCampaignSends(campaignId: string): Promise<EmailCampaignSend[]> {
    return await db.select().from(emailCampaignSends)
      .where(eq(emailCampaignSends.campaignId, campaignId))
      .orderBy(desc(emailCampaignSends.createdAt));
  }

  async recordCampaignOpen(sendId: string): Promise<void> {
    const [send] = await db.select().from(emailCampaignSends).where(eq(emailCampaignSends.id, sendId));
    if (!send) return;
    
    const isFirstOpen = !send.openedAt;
    await db.update(emailCampaignSends)
      .set({
        openedAt: send.openedAt || new Date(),
        openCount: send.openCount + 1,
      })
      .where(eq(emailCampaignSends.id, sendId));
    
    if (isFirstOpen) {
      await db.update(emailCampaigns)
        .set({
          totalOpens: sql`${emailCampaigns.totalOpens} + 1`,
          uniqueOpens: sql`${emailCampaigns.uniqueOpens} + 1`,
        })
        .where(eq(emailCampaigns.id, send.campaignId));
    } else {
      await db.update(emailCampaigns)
        .set({ totalOpens: sql`${emailCampaigns.totalOpens} + 1` })
        .where(eq(emailCampaigns.id, send.campaignId));
    }
  }

  async recordCampaignClick(sendId: string): Promise<void> {
    const [send] = await db.select().from(emailCampaignSends).where(eq(emailCampaignSends.id, sendId));
    if (!send) return;
    
    const isFirstClick = !send.clickedAt;
    await db.update(emailCampaignSends)
      .set({
        clickedAt: send.clickedAt || new Date(),
        clickCount: send.clickCount + 1,
      })
      .where(eq(emailCampaignSends.id, sendId));
    
    if (isFirstClick) {
      await db.update(emailCampaigns)
        .set({
          totalClicks: sql`${emailCampaigns.totalClicks} + 1`,
          uniqueClicks: sql`${emailCampaigns.uniqueClicks} + 1`,
        })
        .where(eq(emailCampaigns.id, send.campaignId));
    } else {
      await db.update(emailCampaigns)
        .set({ totalClicks: sql`${emailCampaigns.totalClicks} + 1` })
        .where(eq(emailCampaigns.id, send.campaignId));
    }
  }

  // Marketing Automation Operations
  async getMarketingAutomations(): Promise<MarketingAutomation[]> {
    return await db.select().from(marketingAutomations).orderBy(desc(marketingAutomations.createdAt));
  }

  async getMarketingAutomation(id: string): Promise<MarketingAutomation | undefined> {
    const [automation] = await db.select().from(marketingAutomations).where(eq(marketingAutomations.id, id));
    return automation || undefined;
  }

  async createMarketingAutomation(automation: InsertMarketingAutomation): Promise<MarketingAutomation> {
    const [created] = await db.insert(marketingAutomations).values(automation).returning();
    return created;
  }

  async updateMarketingAutomation(id: string, updates: Partial<MarketingAutomation>): Promise<MarketingAutomation | undefined> {
    const [updated] = await db
      .update(marketingAutomations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketingAutomations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMarketingAutomation(id: string): Promise<boolean> {
    await db.delete(automationEnrollments).where(eq(automationEnrollments.automationId, id));
    await db.delete(automationSteps).where(eq(automationSteps.automationId, id));
    const result = await db.delete(marketingAutomations).where(eq(marketingAutomations.id, id)).returning();
    return result.length > 0;
  }

  async getAutomationSteps(automationId: string): Promise<AutomationStep[]> {
    return await db.select().from(automationSteps)
      .where(eq(automationSteps.automationId, automationId))
      .orderBy(automationSteps.stepOrder);
  }

  async createAutomationStep(step: InsertAutomationStep): Promise<AutomationStep> {
    const [created] = await db.insert(automationSteps).values(step).returning();
    return created;
  }

  async updateAutomationStep(id: string, updates: Partial<AutomationStep>): Promise<AutomationStep | undefined> {
    const [updated] = await db.update(automationSteps).set(updates).where(eq(automationSteps.id, id)).returning();
    return updated || undefined;
  }

  async deleteAutomationStep(id: string): Promise<boolean> {
    const result = await db.delete(automationSteps).where(eq(automationSteps.id, id)).returning();
    return result.length > 0;
  }

  // Marketing Tags Operations
  async getMarketingTags(): Promise<MarketingTag[]> {
    return await db.select().from(marketingTags).orderBy(marketingTags.name);
  }

  async createMarketingTag(tag: InsertMarketingTag): Promise<MarketingTag> {
    const [created] = await db.insert(marketingTags).values(tag).returning();
    return created;
  }

  async updateMarketingTag(id: string, data: Partial<InsertMarketingTag>): Promise<MarketingTag | null> {
    const [updated] = await db.update(marketingTags).set(data).where(eq(marketingTags.id, id)).returning();
    return updated || null;
  }

  async deleteMarketingTag(id: string): Promise<boolean> {
    await db.delete(customerTags).where(eq(customerTags.tagId, id));
    const result = await db.delete(marketingTags).where(eq(marketingTags.id, id)).returning();
    return result.length > 0;
  }

  async getCustomerTags(userId: string): Promise<any[]> {
    return await db
      .select({
        id: customerTags.id,
        tagId: customerTags.tagId,
        name: marketingTags.name,
        color: marketingTags.color,
        addedAt: customerTags.addedAt,
      })
      .from(customerTags)
      .innerJoin(marketingTags, eq(customerTags.tagId, marketingTags.id))
      .where(eq(customerTags.userId, userId));
  }

  async addTagToCustomer(userId: string, tagId: string, addedBy?: string): Promise<CustomerTag> {
    const [created] = await db.insert(customerTags).values({
      userId,
      tagId,
      addedBy: addedBy || null,
    }).returning();
    return created;
  }

  async removeTagFromCustomer(userId: string, tagId: string): Promise<void> {
    await db.delete(customerTags)
      .where(and(eq(customerTags.userId, userId), eq(customerTags.tagId, tagId)));
  }

  // Email Unsubscribe Operations
  async isEmailUnsubscribed(email: string): Promise<boolean> {
    const [result] = await db.select().from(emailUnsubscribes)
      .where(eq(emailUnsubscribes.email, email.toLowerCase()));
    return !!result;
  }

  async unsubscribeEmail(data: InsertEmailUnsubscribe): Promise<EmailUnsubscribe> {
    const [created] = await db.insert(emailUnsubscribes).values({
      ...data,
      email: data.email.toLowerCase(),
    }).returning();
    return created;
  }

  async resubscribeEmail(email: string): Promise<void> {
    await db.delete(emailUnsubscribes).where(eq(emailUnsubscribes.email, email.toLowerCase()));
  }

  // Newsletter Subscription Operations
  async subscribeToNewsletter(data: InsertNewsletterSubscription): Promise<NewsletterSubscription> {
    const [created] = await db.insert(newsletterSubscriptions).values({
      ...data,
      email: data.email.toLowerCase(),
    }).returning();
    return created;
  }

  async getNewsletterSubscription(email: string): Promise<NewsletterSubscription | undefined> {
    const [subscription] = await db.select().from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.email, email.toLowerCase()));
    return subscription || undefined;
  }

  async getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return await db.select().from(newsletterSubscriptions)
      .where(eq(newsletterSubscriptions.isActive, true))
      .orderBy(desc(newsletterSubscriptions.createdAt));
  }

  async unsubscribeFromNewsletter(email: string): Promise<void> {
    await db.update(newsletterSubscriptions)
      .set({ isActive: false, unsubscribedAt: new Date() })
      .where(eq(newsletterSubscriptions.email, email.toLowerCase()));
  }

  // Marketing Dashboard Stats
  async getMarketingDashboardStats(): Promise<{
    totalSubscribers: number;
    unsubscribes: number;
    totalCampaigns: number;
    sentCampaigns: number;
    avgOpenRate: number;
    avgClickRate: number;
    totalAutomations: number;
    activeAutomations: number;
    recentCampaigns: EmailCampaign[];
  }> {
    const [customerCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.role, 'customer'));
    const [unsubCount] = await db.select({ count: sql<number>`count(*)::int` }).from(emailUnsubscribes);
    const campaigns = await db.select().from(emailCampaigns);
    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    const automations = await db.select().from(marketingAutomations);
    const activeAutomations = automations.filter(a => a.isActive);
    
    let totalOpenRate = 0;
    let totalClickRate = 0;
    for (const c of sentCampaigns) {
      if (c.totalSent > 0) {
        totalOpenRate += (c.uniqueOpens / c.totalSent) * 100;
        totalClickRate += (c.uniqueClicks / c.totalSent) * 100;
      }
    }
    
    const recentCampaigns = await db.select().from(emailCampaigns)
      .orderBy(desc(emailCampaigns.createdAt))
      .limit(5);
    
    return {
      totalSubscribers: customerCount?.count || 0,
      unsubscribes: unsubCount?.count || 0,
      totalCampaigns: campaigns.length,
      sentCampaigns: sentCampaigns.length,
      avgOpenRate: sentCampaigns.length > 0 ? totalOpenRate / sentCampaigns.length : 0,
      avgClickRate: sentCampaigns.length > 0 ? totalClickRate / sentCampaigns.length : 0,
      totalAutomations: automations.length,
      activeAutomations: activeAutomations.length,
      recentCampaigns,
    };
  }

  // ==================== REFERRAL PROGRAM OPERATIONS ====================

  async getReferralProgramSettings(): Promise<ReferralProgramSettings | undefined> {
    const [settings] = await db.select().from(referralProgramSettings).limit(1);
    return settings || undefined;
  }

  async updateReferralProgramSettings(updates: Partial<ReferralProgramSettings>): Promise<ReferralProgramSettings> {
    const existing = await this.getReferralProgramSettings();
    if (existing) {
      const [updated] = await db
        .update(referralProgramSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(referralProgramSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(referralProgramSettings)
        .values(updates as any)
        .returning();
      return created;
    }
  }

  async getReferralCode(userId: string): Promise<ReferralCode | undefined> {
    const [code] = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId));
    return code || undefined;
  }

  async getReferralCodeByCode(code: string): Promise<ReferralCode | undefined> {
    const [result] = await db.select().from(referralCodes)
      .where(or(eq(referralCodes.code, code.toUpperCase()), eq(referralCodes.customCode, code.toUpperCase())));
    return result || undefined;
  }

  async createReferralCode(userId: string): Promise<ReferralCode> {
    const code = this.generateReferralCode();
    const [created] = await db.insert(referralCodes).values({
      userId,
      code,
      isActive: true,
    }).returning();
    return created;
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async updateReferralCode(userId: string, updates: Partial<ReferralCode>): Promise<ReferralCode | undefined> {
    const [updated] = await db
      .update(referralCodes)
      .set(updates)
      .where(eq(referralCodes.userId, userId))
      .returning();
    return updated || undefined;
  }

  async createReferral(data: InsertReferral): Promise<Referral> {
    const [created] = await db.insert(referrals).values(data).returning();
    await db
      .update(referralCodes)
      .set({ totalReferrals: sql`total_referrals + 1` })
      .where(eq(referralCodes.id, data.referralCodeId));
    return created;
  }

  async getReferral(id: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || undefined;
  }

  async getReferralByRefereeEmail(email: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals)
      .where(and(eq(referrals.refereeEmail, email.toLowerCase()), eq(referrals.status, 'pending')));
    return referral || undefined;
  }

  async getReferralsByReferrer(userId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerUserId, userId))
      .orderBy(desc(referrals.createdAt));
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals).set(updates).where(eq(referrals.id, id)).returning();
    return updated || undefined;
  }

  async convertReferral(referralId: string, orderId: string, orderAmount: number): Promise<Referral> {
    const referral = await this.getReferral(referralId);
    if (!referral) throw new Error('Referral not found');

    const [updated] = await db
      .update(referrals)
      .set({
        status: 'converted',
        refereeOrderId: orderId,
        refereeOrderAmount: orderAmount.toString(),
        convertedAt: new Date(),
      })
      .where(eq(referrals.id, referralId))
      .returning();

    await db
      .update(referralCodes)
      .set({ successfulReferrals: sql`successful_referrals + 1` })
      .where(eq(referralCodes.id, referral.referralCodeId));

    return updated;
  }

  async rewardReferrer(referralId: string, rewardType: string, rewardAmount: number): Promise<ReferralReward> {
    const referral = await this.getReferral(referralId);
    if (!referral) throw new Error('Referral not found');

    let loyaltyTransactionId: string | undefined;

    if (rewardType === 'points') {
      const result = await this.addLoyaltyPoints(
        referral.referrerUserId,
        rewardAmount,
        `Referral reward for referring a friend`
      );
      loyaltyTransactionId = result.transaction.id;
    }

    const [reward] = await db.insert(referralRewards).values({
      referralId,
      userId: referral.referrerUserId,
      rewardType,
      rewardValue: rewardAmount.toString(),
      description: `Referral reward: ${rewardAmount} ${rewardType}`,
      loyaltyTransactionId,
    }).returning();

    await db
      .update(referrals)
      .set({
        status: 'rewarded',
        referrerRewarded: true,
        referrerRewardedAt: new Date(),
        referrerRewardAmount: rewardAmount.toString(),
        referrerRewardType: rewardType,
      })
      .where(eq(referrals.id, referralId));

    await db
      .update(referralCodes)
      .set({ totalEarned: sql`total_earned + ${rewardAmount}` })
      .where(eq(referralCodes.id, referral.referralCodeId));

    return reward;
  }

  async getReferralRewards(userId: string): Promise<ReferralReward[]> {
    return await db.select().from(referralRewards)
      .where(eq(referralRewards.userId, userId))
      .orderBy(desc(referralRewards.createdAt));
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    successfulReferrals: number;
    pendingReferrals: number;
    totalEarned: number;
    referralCode: string;
  }> {
    let referralCode = await this.getReferralCode(userId);
    if (!referralCode) {
      referralCode = await this.createReferralCode(userId);
    }

    const allReferrals = await this.getReferralsByReferrer(userId);
    const pendingReferrals = allReferrals.filter(r => r.status === 'pending').length;

    return {
      totalReferrals: referralCode.totalReferrals,
      successfulReferrals: referralCode.successfulReferrals,
      pendingReferrals,
      totalEarned: parseFloat(referralCode.totalEarned) || 0,
      referralCode: referralCode.customCode || referralCode.code,
    };
  }

  async sendReferralInvitation(data: InsertReferralInvitation): Promise<ReferralInvitation> {
    const [created] = await db.insert(referralInvitations).values({
      ...data,
      recipientEmail: data.recipientEmail.toLowerCase(),
    }).returning();
    return created;
  }

  async getReferralInvitations(userId: string): Promise<ReferralInvitation[]> {
    return await db.select().from(referralInvitations)
      .where(eq(referralInvitations.senderUserId, userId))
      .orderBy(desc(referralInvitations.sentAt));
  }

  async getAdminReferralStats(): Promise<{
    totalReferralCodes: number;
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsGiven: number;
    topReferrers: any[];
  }> {
    const [codesCount] = await db.select({ count: sql<number>`count(*)::int` }).from(referralCodes);
    const [referralsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(referrals);
    const [successfulCount] = await db.select({ count: sql<number>`count(*)::int` }).from(referrals)
      .where(or(eq(referrals.status, 'converted'), eq(referrals.status, 'rewarded')));
    const [rewardsSum] = await db.select({ total: sql<number>`COALESCE(SUM(reward_value::numeric), 0)::numeric` }).from(referralRewards);

    const topReferrers = await db
      .select({
        userId: referralCodes.userId,
        code: referralCodes.code,
        successfulReferrals: referralCodes.successfulReferrals,
        totalEarned: referralCodes.totalEarned,
      })
      .from(referralCodes)
      .orderBy(desc(referralCodes.successfulReferrals))
      .limit(10);

    const topReferrersWithUsers = await Promise.all(
      topReferrers.map(async (r) => {
        const user = await this.getUser(r.userId);
        return {
          ...r,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Unknown',
          userEmail: user?.email || '',
        };
      })
    );

    return {
      totalReferralCodes: codesCount?.count || 0,
      totalReferrals: referralsCount?.count || 0,
      successfulReferrals: successfulCount?.count || 0,
      totalRewardsGiven: parseFloat(rewardsSum?.total?.toString() || '0') || 0,
      topReferrers: topReferrersWithUsers,
    };
  }

  // Admin Notifications
  async getAdminNotifications(limit: number = 50): Promise<AdminNotification[]> {
    try {
      return await db.select().from(adminNotifications)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(limit);
    } catch (error: any) {
      // Graceful fallback if is_recovered column hasn't migrated yet
      if (error?.code === '42703') {
        const result = await pool.query(
          `SELECT id, type, title, message, order_id, is_read, created_at, false as is_recovered
           FROM admin_notifications ORDER BY created_at DESC LIMIT $1`,
          [limit]
        );
        return result.rows.map((r: any) => ({ ...r, isRead: r.is_read, orderId: r.order_id, isRecovered: false, createdAt: r.created_at })) as unknown as AdminNotification[];
      }
      throw error;
    }
  }

  async getUnreadAdminNotifications(): Promise<AdminNotification[]> {
    try {
      return await db.select().from(adminNotifications)
        .where(eq(adminNotifications.isRead, false))
        .orderBy(desc(adminNotifications.createdAt));
    } catch (error: any) {
      if (error?.code === '42703') {
        const result = await pool.query(
          `SELECT id, type, title, message, order_id, is_read, created_at, false as is_recovered
           FROM admin_notifications WHERE is_read = false ORDER BY created_at DESC`
        );
        return result.rows.map((r: any) => ({ ...r, isRead: r.is_read, orderId: r.order_id, isRecovered: false, createdAt: r.created_at })) as unknown as AdminNotification[];
      }
      throw error;
    }
  }

  async getUnreadNotificationCount(): Promise<number> {
    try {
      const [result] = await db.select({ count: sql<number>`count(*)::int` })
        .from(adminNotifications)
        .where(eq(adminNotifications.isRead, false));
      return result?.count || 0;
    } catch (error: any) {
      if (error?.code === '42703') {
        const result = await pool.query(
          `SELECT COUNT(*)::int as count FROM admin_notifications WHERE is_read = false`
        );
        return result.rows[0]?.count || 0;
      }
      throw error;
    }
  }

  async createAdminNotification(data: InsertAdminNotification): Promise<AdminNotification> {
    const [notification] = await db.insert(adminNotifications).values(data).returning();
    return notification;
  }

  async markNotificationRead(id: string): Promise<AdminNotification | undefined> {
    const [notification] = await db.update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.id, id))
      .returning();
    return notification || undefined;
  }

  async markAllNotificationsRead(): Promise<void> {
    await db.update(adminNotifications)
      .set({ isRead: true })
      .where(eq(adminNotifications.isRead, false));
  }

  async markNotificationRecovered(id: string, orderNumber?: string): Promise<AdminNotification | undefined> {
    // Fetch existing metadata so we can merge in the recovered order number
    const existing = await db.select({ metadata: adminNotifications.metadata })
      .from(adminNotifications)
      .where(eq(adminNotifications.id, id))
      .limit(1);
    let mergedMetadata: string | undefined;
    if (orderNumber) {
      const current = existing[0]?.metadata;
      let metaObj: Record<string, unknown> = {};
      if (current) {
        try { metaObj = JSON.parse(current); } catch {}
      }
      metaObj.recoveredOrderNumber = orderNumber;
      mergedMetadata = JSON.stringify(metaObj);
    }
    const [notification] = await db.update(adminNotifications)
      .set({
        isRecovered: true,
        isRead: true,
        ...(mergedMetadata !== undefined ? { metadata: mergedMetadata } : {}),
      })
      .where(eq(adminNotifications.id, id))
      .returning();
    return notification || undefined;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
  }

  // Commission Tier operations
  async getAllCommissionTiers(): Promise<CommissionTier[]> {
    return await db.select().from(commissionTiers).orderBy(commissionTiers.minSalesAmount);
  }

  async getCommissionTiersByPartnerType(partnerType: 'reseller' | 'vendor'): Promise<CommissionTier[]> {
    return await db.select().from(commissionTiers)
      .where(eq(commissionTiers.partnerType, partnerType))
      .orderBy(commissionTiers.minSalesAmount);
  }

  async getCommissionTier(id: string): Promise<CommissionTier | undefined> {
    const [tier] = await db.select().from(commissionTiers).where(eq(commissionTiers.id, id));
    return tier || undefined;
  }

  async createCommissionTier(tier: InsertCommissionTier): Promise<CommissionTier> {
    const [created] = await db.insert(commissionTiers).values(tier).returning();
    return created;
  }

  async updateCommissionTier(id: string, updates: Partial<CommissionTier>): Promise<CommissionTier | undefined> {
    const [updated] = await db.update(commissionTiers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(commissionTiers.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCommissionTier(id: string): Promise<boolean> {
    const result = await db.delete(commissionTiers).where(eq(commissionTiers.id, id));
    return true;
  }

  // Partner Sales Summary operations
  async getPartnerSalesSummary(partnerType: 'reseller' | 'vendor', partnerId: string): Promise<PartnerSalesSummary | undefined> {
    const condition = partnerType === 'reseller' 
      ? eq(partnerSalesSummary.resellerId, partnerId)
      : eq(partnerSalesSummary.vendorId, partnerId);
    const [summary] = await db.select().from(partnerSalesSummary)
      .where(and(eq(partnerSalesSummary.partnerType, partnerType), condition));
    return summary || undefined;
  }

  async createOrUpdatePartnerSalesSummary(summary: InsertPartnerSalesSummary): Promise<PartnerSalesSummary> {
    const partnerId = summary.partnerType === 'reseller' ? summary.resellerId : summary.vendorId;
    if (!partnerId) throw new Error('Partner ID is required');
    
    const existing = await this.getPartnerSalesSummary(summary.partnerType, partnerId);
    if (existing) {
      const [updated] = await db.update(partnerSalesSummary)
        .set({
          totalSalesAmount: summary.totalSalesAmount,
          currentTierId: summary.currentTierId,
          updatedAt: new Date()
        })
        .where(eq(partnerSalesSummary.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(partnerSalesSummary).values(summary).returning();
    return created;
  }

  async updatePartnerSalesAndCheckTierUpgrade(
    partnerType: 'reseller' | 'vendor', 
    partnerId: string, 
    saleAmount: number
  ): Promise<{ upgraded: boolean; newTier?: CommissionTier }> {
    // Defensive handling: skip if saleAmount is invalid
    if (isNaN(saleAmount) || saleAmount <= 0) {
      console.warn(`Skipping tier upgrade check: invalid sale amount ${saleAmount} for ${partnerType} ${partnerId}`);
      return { upgraded: false };
    }

    let summary = await this.getPartnerSalesSummary(partnerType, partnerId);
    const currentTotal = parseFloat(summary?.totalSalesAmount || '0');
    const newTotal = isNaN(currentTotal) ? saleAmount : currentTotal + saleAmount;

    if (!summary) {
      const insertData: InsertPartnerSalesSummary = {
        partnerType,
        totalSalesAmount: newTotal.toFixed(2),
        currentTierId: null,
        ...(partnerType === 'reseller' ? { resellerId: partnerId } : { vendorId: partnerId })
      };
      summary = await this.createOrUpdatePartnerSalesSummary(insertData);
    } else {
      await db.update(partnerSalesSummary)
        .set({ 
          totalSalesAmount: newTotal.toFixed(2),
          updatedAt: new Date()
        })
        .where(eq(partnerSalesSummary.id, summary.id));
    }

    const tiers = await this.getCommissionTiersByPartnerType(partnerType);
    let newTier: CommissionTier | undefined;
    
    for (const tier of tiers) {
      const minAmount = parseFloat(tier.minSalesAmount);
      const maxAmount = tier.maxSalesAmount ? parseFloat(tier.maxSalesAmount) : Infinity;
      
      if (newTotal >= minAmount && newTotal <= maxAmount) {
        newTier = tier;
        break;
      }
    }

    if (!newTier) {
      const highestTier = tiers[tiers.length - 1];
      if (highestTier && newTotal >= parseFloat(highestTier.minSalesAmount)) {
        newTier = highestTier;
      }
    }

    const currentTierId = summary.currentTierId;
    const upgraded = newTier && newTier.id !== currentTierId;

    if (upgraded && newTier) {
      await db.update(partnerSalesSummary)
        .set({ currentTierId: newTier.id, updatedAt: new Date() })
        .where(eq(partnerSalesSummary.id, summary.id));

      const historyData: InsertCommissionTierHistory = {
        partnerType,
        previousTierId: currentTierId || null,
        newTierId: newTier.id,
        salesAmountAtChange: newTotal.toFixed(2),
        reason: 'auto_upgrade',
        ...(partnerType === 'reseller' ? { resellerId: partnerId } : { vendorId: partnerId })
      };
      await this.createCommissionTierHistory(historyData);

      if (partnerType === 'reseller') {
        await db.update(resellers)
          .set({ commissionRate: newTier.commissionRate })
          .where(eq(resellers.id, partnerId));
      } else {
        await db.update(vendors)
          .set({ commissionRate: newTier.commissionRate })
          .where(eq(vendors.id, partnerId));
      }
    }

    return { upgraded: !!upgraded, newTier };
  }

  // Commission Tier History operations
  async getCommissionTierHistory(partnerType: 'reseller' | 'vendor', partnerId: string): Promise<CommissionTierHistory[]> {
    const condition = partnerType === 'reseller'
      ? eq(commissionTierHistory.resellerId, partnerId)
      : eq(commissionTierHistory.vendorId, partnerId);
    return await db.select().from(commissionTierHistory)
      .where(and(eq(commissionTierHistory.partnerType, partnerType), condition))
      .orderBy(desc(commissionTierHistory.createdAt));
  }

  async createCommissionTierHistory(history: InsertCommissionTierHistory): Promise<CommissionTierHistory> {
    const [created] = await db.insert(commissionTierHistory).values(history).returning();
    return created;
  }

  // License Settings operations
  async getLicenseSettings(): Promise<LicenseSettings[]> {
    return await db.select().from(licenseSettings);
  }

  async getLicenseSettingByType(licenseType: string): Promise<LicenseSettings | undefined> {
    const [setting] = await db.select().from(licenseSettings)
      .where(sql`${licenseSettings.licenseType} = ${licenseType}`);
    return setting || undefined;
  }

  async updateLicenseSettings(id: string, updates: Partial<LicenseSettings>): Promise<LicenseSettings | undefined> {
    const [updated] = await db.update(licenseSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(licenseSettings.id, id))
      .returning();
    return updated || undefined;
  }

  // Subscription Tier Pricing operations
  async getAllSubscriptionTiers(): Promise<SubscriptionTierPricing[]> {
    return await db.select().from(subscriptionTierPricing).orderBy(subscriptionTierPricing.displayOrder);
  }

  async getSubscriptionTierByName(tierName: string): Promise<SubscriptionTierPricing | undefined> {
    const [tier] = await db.select().from(subscriptionTierPricing)
      .where(eq(subscriptionTierPricing.tierName, tierName));
    return tier || undefined;
  }

  async updateSubscriptionTier(id: string, updates: Partial<SubscriptionTierPricing>): Promise<SubscriptionTierPricing | undefined> {
    const [updated] = await db.update(subscriptionTierPricing)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptionTierPricing.id, id))
      .returning();
    return updated || undefined;
  }

  async initializeDefaultTiers(): Promise<void> {
    const existingTiers = await this.getAllSubscriptionTiers();
    if (existingTiers.length > 0) return;
    
    const defaultTiers = [
      { tierName: 'trial', displayName: 'Trial', pricePerMonth: '0.00', productLimit: 5, description: '30-day free trial with limited products', displayOrder: 0 },
      { tierName: 'bronze', displayName: 'Bronze', pricePerMonth: '29.99', productLimit: 25, description: 'Starter tier for new resellers', displayOrder: 1 },
      { tierName: 'silver', displayName: 'Silver', pricePerMonth: '49.99', productLimit: 100, description: 'Growing reseller tier', displayOrder: 2 },
      { tierName: 'gold', displayName: 'Gold', pricePerMonth: '99.99', productLimit: null, description: 'Premium tier with unlimited products', displayOrder: 3 },
    ];
    
    for (const tier of defaultTiers) {
      await db.insert(subscriptionTierPricing).values(tier);
    }
  }

  // Reseller License Request operations
  async createResellerLicenseRequest(request: InsertResellerLicenseRequest): Promise<ResellerLicenseRequest> {
    const [created] = await db.insert(resellerLicenseRequests).values(request).returning();
    return created;
  }

  async getResellerLicenseRequest(id: string): Promise<ResellerLicenseRequest | undefined> {
    const [request] = await db.select().from(resellerLicenseRequests)
      .where(eq(resellerLicenseRequests.id, id));
    return request || undefined;
  }

  async getResellerLicenseRequests(resellerId: string): Promise<ResellerLicenseRequest[]> {
    return await db.select().from(resellerLicenseRequests)
      .where(eq(resellerLicenseRequests.resellerId, resellerId))
      .orderBy(desc(resellerLicenseRequests.createdAt));
  }

  async getAllResellerLicenseRequests(filters?: { status?: string }): Promise<ResellerLicenseRequest[]> {
    if (filters?.status) {
      return await db.select().from(resellerLicenseRequests)
        .where(sql`${resellerLicenseRequests.status} = ${filters.status}`)
        .orderBy(desc(resellerLicenseRequests.createdAt));
    }
    return await db.select().from(resellerLicenseRequests)
      .orderBy(desc(resellerLicenseRequests.createdAt));
  }

  async updateResellerLicenseRequest(id: string, updates: Partial<ResellerLicenseRequest>): Promise<ResellerLicenseRequest | undefined> {
    const [updated] = await db.update(resellerLicenseRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerLicenseRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async approveResellerLicenseRequest(id: string, adminUserId: string, notes?: string): Promise<ResellerLicenseRequest | undefined> {
    const request = await this.getResellerLicenseRequest(id);
    if (!request) return undefined;

    // Update the request to approved status
    const [updated] = await db.update(resellerLicenseRequests)
      .set({
        status: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(resellerLicenseRequests.id, id))
      .returning();

    // Grant the add_own_products capability to the reseller
    if (updated) {
      const reseller = await this.getReseller(request.resellerId);
      if (reseller) {
        await db.insert(b2bPartnerCapabilities).values({
          partnerType: 'reseller',
          partnerId: request.resellerId,
          capability: 'add_own_products',
          enabled: true,
          grantedBy: adminUserId,
          notes: `Granted via license request ${id}`
        }).onConflictDoNothing();
      }
    }

    return updated || undefined;
  }

  async rejectResellerLicenseRequest(id: string, adminUserId: string, reason: string): Promise<ResellerLicenseRequest | undefined> {
    const [updated] = await db.update(resellerLicenseRequests)
      .set({
        status: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(resellerLicenseRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Vendor Wholesale Request operations
  async createVendorWholesaleRequest(request: InsertVendorWholesaleRequest): Promise<VendorWholesaleRequest> {
    const [created] = await db.insert(vendorWholesaleRequests).values(request).returning();
    return created;
  }

  async getVendorWholesaleRequest(id: string): Promise<VendorWholesaleRequest | undefined> {
    const [request] = await db.select().from(vendorWholesaleRequests)
      .where(eq(vendorWholesaleRequests.id, id));
    return request || undefined;
  }

  async getVendorWholesaleRequests(vendorId: string): Promise<VendorWholesaleRequest[]> {
    return await db.select().from(vendorWholesaleRequests)
      .where(eq(vendorWholesaleRequests.vendorId, vendorId))
      .orderBy(desc(vendorWholesaleRequests.createdAt));
  }

  async getAllVendorWholesaleRequests(filters?: { status?: string }): Promise<VendorWholesaleRequest[]> {
    if (filters?.status) {
      return await db.select().from(vendorWholesaleRequests)
        .where(sql`${vendorWholesaleRequests.status} = ${filters.status}`)
        .orderBy(desc(vendorWholesaleRequests.createdAt));
    }
    return await db.select().from(vendorWholesaleRequests)
      .orderBy(desc(vendorWholesaleRequests.createdAt));
  }

  async updateVendorWholesaleRequest(id: string, updates: Partial<VendorWholesaleRequest>): Promise<VendorWholesaleRequest | undefined> {
    const [updated] = await db.update(vendorWholesaleRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendorWholesaleRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async approveVendorWholesaleRequest(id: string, adminUserId: string, notes?: string): Promise<VendorWholesaleRequest | undefined> {
    const request = await this.getVendorWholesaleRequest(id);
    if (!request) return undefined;

    // Update the request to approved status
    const [updated] = await db.update(vendorWholesaleRequests)
      .set({
        status: 'approved',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        approvedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date()
      })
      .where(eq(vendorWholesaleRequests.id, id))
      .returning();

    // Grant the sell_wholesale capability to the vendor
    if (updated) {
      await db.insert(b2bPartnerCapabilities).values({
        partnerType: 'vendor',
        partnerId: request.vendorId,
        capability: 'sell_wholesale',
        enabled: true,
        grantedBy: adminUserId,
        notes: `Granted via wholesale request ${id}`
      }).onConflictDoNothing();
    }

    return updated || undefined;
  }

  async rejectVendorWholesaleRequest(id: string, adminUserId: string, reason: string): Promise<VendorWholesaleRequest | undefined> {
    const [updated] = await db.update(vendorWholesaleRequests)
      .set({
        status: 'rejected',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      })
      .where(eq(vendorWholesaleRequests.id, id))
      .returning();
    return updated || undefined;
  }

  // Reseller Licence Tier operations
  async getResellerLicence(resellerId: string): Promise<ResellerLicence | undefined> {
    const [licence] = await db.select().from(resellerLicences)
      .where(eq(resellerLicences.resellerId, resellerId));
    return licence || undefined;
  }

  async createResellerLicence(resellerId: string): Promise<ResellerLicence> {
    const now = new Date();
    
    // Create licence with pending_trial status - awaiting admin approval
    const [licence] = await db.insert(resellerLicences).values({
      resellerId,
      status: 'pending_trial',
      tier: null, // No tier during trial
      productLimit: null, // Unlimited during trial (once approved)
      trialRequestedAt: now,
      trialStartedAt: null, // Set when admin approves
      trialEndsAt: null // Set when admin approves
    } as any).returning();
    
    return licence;
  }

  async approveResellerTrialRequest(licenceId: string, adminUserId: string, trialDays: number = 30): Promise<ResellerLicence | undefined> {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    
    const [updated] = await db.update(resellerLicences)
      .set({
        status: 'trial',
        productLimit: 5, // Trial limit of 5 products
        trialApprovedAt: now,
        trialApprovedBy: adminUserId,
        trialStartedAt: now,
        trialEndsAt: trialEnds,
        updatedAt: now
      } as any)
      .where(eq(resellerLicences.id, licenceId))
      .returning();
    
    // Grant ALL vendor capabilities to the reseller (same access as vendors)
    if (updated) {
      const vendorCapabilities = [
        'add_own_products',
        'request_stock', 
        'manage_storefront',
        'view_analytics',
        'process_epos'
      ];
      
      for (const capability of vendorCapabilities) {
        // Check if capability already exists
        const [existing] = await db.select().from(b2bPartnerCapabilities)
          .where(and(
            eq(b2bPartnerCapabilities.partnerId, updated.resellerId),
            eq(b2bPartnerCapabilities.capability, capability)
          ));
        
        if (existing) {
          // Update existing capability
          await db.update(b2bPartnerCapabilities)
            .set({ enabled: true, grantedBy: adminUserId, notes: `Granted via 30-day trial licence ${licenceId}` })
            .where(eq(b2bPartnerCapabilities.id, existing.id));
        } else {
          // Insert new capability
          await db.insert(b2bPartnerCapabilities).values({
            partnerType: 'reseller',
            partnerId: updated.resellerId,
            capability,
            enabled: true,
            grantedBy: adminUserId,
            notes: `Granted via 30-day trial licence ${licenceId}`
          });
        }
      }
      
      // Create vendor profile for reseller to enable full vendor access
      // Get reseller info first to get the user_id
      const [resellerInfo] = await db.select().from(resellers)
        .where(eq(resellers.id, updated.resellerId));
      
      if (resellerInfo) {
        // Check if vendor profile exists for this user
        const existingVendor = await db.select().from(vendors)
          .where(eq(vendors.userId, resellerInfo.userId))
          .limit(1);
        
        if (existingVendor.length === 0) {
          // Create new vendor profile with approved status for vendor access
          await db.insert(vendors).values({
            userId: resellerInfo.userId,
            businessName: resellerInfo.businessName,
            canAddOwnProducts: true,
            isActive: true,
            approvalStatus: 'approved' // Required for vendor middleware access
          } as any);
          console.log(`✅ Wholesaler profile created for reseller ${resellerInfo.businessName}`);
        } else {
          // Update existing vendor profile with approved status
          await db.update(vendors)
            .set({ canAddOwnProducts: true, isActive: true, approvalStatus: 'approved' })
            .where(eq(vendors.userId, resellerInfo.userId));
          console.log(`✅ Wholesaler profile updated for reseller ${resellerInfo.businessName}`);
        }
      }
    }
    
    return updated || undefined;
  }

  async rejectResellerTrialRequest(licenceId: string): Promise<ResellerLicence | undefined> {
    // Get the licence first to get resellerId
    const [licence] = await db.select().from(resellerLicences)
      .where(eq(resellerLicences.id, licenceId));
    
    const [updated] = await db.update(resellerLicences)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: 'Trial request rejected',
        updatedAt: new Date()
      })
      .where(eq(resellerLicences.id, licenceId))
      .returning();
    
    // Revoke ALL vendor capabilities if they exist
    if (updated && licence) {
      const vendorCapabilities = [
        'add_own_products',
        'request_stock', 
        'manage_storefront',
        'view_analytics',
        'process_epos'
      ];
      
      for (const capability of vendorCapabilities) {
        await db.update(b2bPartnerCapabilities)
          .set({ enabled: false })
          .where(
            and(
              eq(b2bPartnerCapabilities.partnerId, licence.resellerId),
              eq(b2bPartnerCapabilities.capability, capability)
            )
          );
      }
      
      // Deactivate vendor profile if it exists
      await db.update(vendors)
        .set({ canAddOwnProducts: false, isActive: false, updatedAt: new Date() })
        .where(eq(vendors.resellerId, licence.resellerId));
    }
    
    return updated || undefined;
  }

  async getPendingTrialRequests(): Promise<ResellerLicence[]> {
    return db.select().from(resellerLicences)
      .where(eq(resellerLicences.status, 'pending_trial'));
  }

  async updateResellerLicence(id: string, updates: Partial<ResellerLicence>): Promise<ResellerLicence | undefined> {
    const [updated] = await db.update(resellerLicences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(resellerLicences.id, id))
      .returning();
    return updated || undefined;
  }

  async activateResellerLicence(resellerId: string, tier: 'bronze' | 'silver' | 'gold', stripeSubscriptionId?: string, adminUserId?: string): Promise<ResellerLicence | undefined> {
    const tierLimits = {
      bronze: { limit: 10, price: '55.00' },
      silver: { limit: 20, price: '85.00' },
      gold: { limit: null, price: '110.00' } // null = unlimited
    };
    
    const { limit, price } = tierLimits[tier];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const [updated] = await db.update(resellerLicences)
      .set({
        tier,
        status: 'active',
        productLimit: limit,
        activatedAt: now,
        expiresAt,
        priceAmount: price,
        currency: 'GBP',
        stripeSubscriptionId: stripeSubscriptionId || null,
        updatedAt: now
      })
      .where(eq(resellerLicences.resellerId, resellerId))
      .returning();
    
    // Grant ALL vendor capabilities to the reseller (same access as vendors)
    if (updated) {
      const vendorCapabilities = [
        'add_own_products',
        'request_stock', 
        'manage_storefront',
        'view_analytics',
        'process_epos'
      ];
      
      for (const capability of vendorCapabilities) {
        await db.insert(b2bPartnerCapabilities).values({
          partnerType: 'reseller',
          partnerId: resellerId,
          capability,
          enabled: true,
          grantedBy: adminUserId || null,
          notes: `Granted via ${tier} licence activation`
        }).onConflictDoUpdate({
          target: [b2bPartnerCapabilities.partnerId, b2bPartnerCapabilities.capability],
          set: { enabled: true, grantedBy: adminUserId || null, notes: `Granted via ${tier} licence activation` }
        });
      }
      
      // Create vendor profile for reseller to enable full vendor access
      const existingVendor = await db.select().from(vendors)
        .where(eq(vendors.resellerId, resellerId))
        .limit(1);
      
      if (existingVendor.length === 0) {
        // Get reseller info for vendor profile
        const [resellerInfo] = await db.select().from(resellers)
          .where(eq(resellers.id, resellerId));
        
        if (resellerInfo) {
          await db.insert(vendors).values({
            userId: resellerInfo.userId,
            resellerId: resellerId,
            businessName: resellerInfo.businessName,
            contactEmail: resellerInfo.contactEmail || resellerInfo.email,
            canAddOwnProducts: true,
            isActive: true,
            createdAt: now,
            updatedAt: now
          } as any);
        }
      } else {
        // Update existing vendor profile
        await db.update(vendors)
          .set({ canAddOwnProducts: true, isActive: true, updatedAt: now })
          .where(eq(vendors.resellerId, resellerId));
      }
    }
    
    return updated || undefined;
  }

  async cancelResellerLicence(resellerId: string, reason?: string): Promise<ResellerLicence | undefined> {
    const [updated] = await db.update(resellerLicences)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || null,
        updatedAt: new Date()
      })
      .where(eq(resellerLicences.resellerId, resellerId))
      .returning();
    
    // Revoke ALL vendor capabilities when licence is cancelled
    if (updated) {
      const vendorCapabilities = [
        'add_own_products',
        'request_stock', 
        'manage_storefront',
        'view_analytics',
        'process_epos'
      ];
      
      for (const capability of vendorCapabilities) {
        await db.update(b2bPartnerCapabilities)
          .set({ enabled: false })
          .where(
            and(
              eq(b2bPartnerCapabilities.partnerId, resellerId),
              eq(b2bPartnerCapabilities.capability, capability)
            )
          );
      }
      
      // Deactivate vendor profile
      await db.update(vendors)
        .set({ canAddOwnProducts: false, isActive: false, updatedAt: new Date() })
        .where(eq(vendors.resellerId, resellerId));
    }
    
    return updated || undefined;
  }

  async getResellerProductCount(resellerId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(resellerProducts)
      .where(and(
        eq(resellerProducts.resellerId, resellerId),
        eq(resellerProducts.isActive, true)
      ));
    return Number(result[0]?.count || 0);
  }

  // Count vendor products (reseller's OWN products they created, not 1stRep products they resell)
  async getResellerOwnProductCount(resellerId: string): Promise<number> {
    // Get the reseller's associated user
    const reseller = await this.getReseller(resellerId);
    if (!reseller) return 0;
    
    // Get the vendor associated with this user (resellers with add_own_products capability have a vendor profile)
    const vendor = await this.getVendorByUserId(reseller.userId);
    if (!vendor) return 0;
    
    // Count vendor products (their own created products)
    const vendorProductsList = await this.getVendorProducts(vendor.id);
    return vendorProductsList.filter(p => p.isActive).length;
  }

  async canResellerAddProduct(resellerId: string): Promise<{ allowed: boolean; reason?: string; currentCount: number; limit: number | null }> {
    const licence = await this.getResellerLicence(resellerId);
    // Count reseller's OWN products, not 1stRep products they resell
    const currentCount = await this.getResellerOwnProductCount(resellerId);
    
    // No licence yet
    if (!licence) {
      return { allowed: false, reason: 'No licence found. Please contact support.', currentCount, limit: 0 };
    }
    
    // Trial period - check if still valid
    if (licence.status === 'trial') {
      const now = new Date();
      const trialLimit = licence.productLimit ?? 5; // Default to 5 for trial
      
      if (now > new Date(licence.trialEndsAt)) {
        // Trial expired
        return { allowed: false, reason: 'Your free trial has ended. Please select a subscription tier to continue.', currentCount, limit: trialLimit };
      }
      
      // Check against trial limit
      if (currentCount >= trialLimit) {
        return { 
          allowed: false, 
          reason: `You have reached your trial product limit of ${trialLimit}. Upgrade to add more products.`, 
          currentCount, 
          limit: trialLimit 
        };
      }
      
      // Trial still active with room for more products
      return { allowed: true, currentCount, limit: trialLimit };
    }
    
    // Active subscription
    if (licence.status === 'active') {
      // Check expiry
      if (licence.expiresAt && new Date() > new Date(licence.expiresAt)) {
        return { allowed: false, reason: 'Your subscription has expired. Please renew to continue.', currentCount, limit: licence.productLimit };
      }
      
      // Unlimited (gold tier)
      if (licence.productLimit === null) {
        return { allowed: true, currentCount, limit: null };
      }
      
      // Check against limit
      if (currentCount >= licence.productLimit) {
        return { 
          allowed: false, 
          reason: `You have reached your product limit of ${licence.productLimit}. Upgrade your tier to add more products.`, 
          currentCount, 
          limit: licence.productLimit 
        };
      }
      
      return { allowed: true, currentCount, limit: licence.productLimit };
    }
    
    // Expired or cancelled
    return { allowed: false, reason: 'Your licence is not active. Please renew your subscription.', currentCount, limit: licence.productLimit };
  }

  async getAllResellerLicences(): Promise<ResellerLicence[]> {
    return await db.select().from(resellerLicences)
      .orderBy(desc(resellerLicences.createdAt));
  }

  async getResellerSalesFromOwnProducts(resellerId: string): Promise<{ totalSales: number; orderCount: number }> {
    // Get products owned by this reseller
    const resellerOwnedProducts = await db.select({ productId: resellerProducts.productId })
      .from(resellerProducts)
      .where(eq(resellerProducts.resellerId, resellerId));
    
    if (resellerOwnedProducts.length === 0) {
      return { totalSales: 0, orderCount: 0 };
    }
    
    const productIds = resellerOwnedProducts.map(p => p.productId);
    
    // Get sales from orders containing these products
    // Use proper SQL array syntax for PostgreSQL
    const result = await db.execute(sql`
      SELECT 
        COALESCE(SUM(oi.total_price), 0) as total_sales,
        COUNT(DISTINCT o.id) as order_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ANY(${sql.raw(`ARRAY[${productIds.map(id => `'${id}'`).join(',')}]::text[]`)})
        AND o.status != 'cancelled'
    `);
    
    const row = result.rows[0] as any;
    return {
      totalSales: Number(row?.total_sales || 0),
      orderCount: Number(row?.order_count || 0)
    };
  }

  async getAllResellersWithAnalytics(): Promise<Array<{
    reseller: any;
    licence: ResellerLicence | null;
    productCount: number;
    salesTotal: number;
    orderCount: number;
  }>> {
    const allResellers = await this.getAllResellers();
    const results = [];
    
    for (const reseller of allResellers) {
      const licence = await this.getResellerLicence(reseller.id);
      // Count own products (vendor products created by reseller, not storefront products)
      const productCount = await this.getResellerOwnProductCount(reseller.id);
      const { totalSales, orderCount } = await this.getResellerSalesFromOwnProducts(reseller.id);
      
      results.push({
        reseller,
        licence: licence || null,
        productCount,
        salesTotal: totalSales,
        orderCount
      });
    }
    
    return results;
  }

  async getActiveLicensedResellersWithMetrics(): Promise<Array<{
    reseller: any;
    licence: ResellerLicence;
    trialDaysPassed: number | null;
    trialDaysRemaining: number | null;
    isOnTrial: boolean;
    subscriptionTier: string | null;
    productCount: number;
    ownProductsRevenue: number;
    orderCount: number;
  }>> {
    // Get all licences that are active (trial or paid subscription)
    // Status values: "pending_trial", "trial", "active", "expired", "cancelled"
    const activeLicences = await db.select().from(resellerLicences)
      .where(
        sql`${resellerLicences.status} IN ('trial', 'active')`
      )
      .orderBy(desc(resellerLicences.trialStartedAt));
    
    const results = [];
    const now = new Date();
    
    for (const licence of activeLicences) {
      const reseller = await this.getReseller(licence.resellerId);
      if (!reseller) continue;
      
      // Get user data for display (email, name)
      const user = await this.getUser(reseller.userId);
      const resellerWithUser = {
        ...reseller,
        email: user?.email || null,
        firstName: user?.firstName || null,
        lastName: user?.lastName || null
      };
      
      // Calculate trial metrics
      let trialDaysPassed: number | null = null;
      let trialDaysRemaining: number | null = null;
      const isOnTrial = licence.status === 'trial';
      
      if (isOnTrial && licence.trialStartedAt) {
        const trialStart = new Date(licence.trialStartedAt);
        const msPerDay = 24 * 60 * 60 * 1000;
        trialDaysPassed = Math.floor((now.getTime() - trialStart.getTime()) / msPerDay);
        
        if (licence.trialEndsAt) {
          const trialEnd = new Date(licence.trialEndsAt);
          trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay));
        }
      }
      
      // Get own product count (vendor products created by reseller, not storefront products)
      const productCount = await this.getResellerOwnProductCount(licence.resellerId);
      const { totalSales, orderCount } = await this.getResellerSalesFromOwnProducts(licence.resellerId);
      
      results.push({
        reseller: resellerWithUser,
        licence,
        trialDaysPassed,
        trialDaysRemaining,
        isOnTrial,
        subscriptionTier: licence.tier || null,
        productCount,
        ownProductsRevenue: totalSales,
        orderCount
      });
    }
    
    return results;
  }

  // Team document operations
  async getTeamDocuments(category?: string): Promise<TeamDocument[]> {
    if (category && category !== 'all') {
      return db.select().from(teamDocuments)
        .where(eq(teamDocuments.category, category))
        .orderBy(desc(teamDocuments.createdAt));
    }
    return db.select().from(teamDocuments).orderBy(desc(teamDocuments.createdAt));
  }

  async getTeamDocument(id: string): Promise<TeamDocument | undefined> {
    const [doc] = await db.select().from(teamDocuments).where(eq(teamDocuments.id, id));
    return doc || undefined;
  }

  async createTeamDocument(doc: InsertTeamDocument): Promise<TeamDocument> {
    const [created] = await db.insert(teamDocuments).values(doc).returning();
    return created;
  }

  async deleteTeamDocument(id: string): Promise<boolean> {
    const result = await db.delete(teamDocuments).where(eq(teamDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();