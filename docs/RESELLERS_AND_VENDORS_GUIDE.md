# Resellers and Vendors System Guide

## Overview

1stRep operates a dual B2B partner system with two distinct partner types: **Resellers** and **Vendors**. Both partners sell 1stRep products and earn commission, but vendors have additional capabilities to add their own products and purchase physical wholesale stock.

---

## Quick Comparison

| Feature | Reseller | Vendor |
|---------|----------|--------|
| **Sell 1stRep Products** | Yes | Yes |
| **Earn Commission on 1stRep Sales** | Yes | Yes |
| **Add Own Products** | No | Yes |
| **EPOS Access** | Yes (1stRep products only) | Yes (1stRep + own products) |
| **Branded Website** | Yes | Yes |
| **Request Wholesale Stock** | No | Yes |
| **Payout Requests** | Yes (after threshold) | Yes (after threshold) |

---

## Resellers

### What is a Reseller?

A reseller is a B2B partner who sells 1stRep products through their EPOS system and branded 1stRep website. They earn a preset commission on every product they sell.

### How Resellers Work

1. **Application & Approval**
   - Business applies through the reseller registration page
   - Admin reviews and approves the application
   - Upon approval, reseller gains access to their dashboard

2. **Selling Products**
   - Reseller lists 1stRep products on their EPOS system
   - Reseller lists 1stRep products on their branded website
   - Customers purchase products through the reseller

3. **Earning Commission**
   - Each product has a preset commission rate
   - Commission is earned when a sale is completed
   - Commission accumulates in the reseller's balance

4. **Requesting Payouts**
   - Once balance reaches the minimum threshold, reseller can request payout
   - Admin reviews and approves the payout request
   - Payment is sent via bank transfer, PayPal, or Stripe Connect

### Reseller Dashboard Features

- **EPOS**: Point of sale system for selling 1stRep products
- **Orders**: View and manage all customer orders
- **Products**: Browse 1stRep product catalog with commission rates
- **Earnings**: Track commission balance and request payouts
- **Website**: Manage branded 1stRep storefront
- **Customers**: Manage customer database
- **Analytics**: Sales reports and performance insights

### What Resellers Cannot Do

- Cannot add their own products
- Cannot purchase wholesale stock
- Can only sell products from the 1stRep catalog

---

## Vendors

### What is a Vendor?

A vendor is an advanced B2B partner who can sell 1stRep products AND add their own products to sell. Vendors have all reseller capabilities plus the ability to create products and order wholesale stock.

### How Vendors Work

1. **Application & Approval**
   - Business applies through vendor registration
   - Admin reviews business details
   - Upon approval, vendor gains access to their dashboard

2. **Selling 1stRep Products**
   - Vendor lists 1stRep products on their EPOS system
   - Vendor lists 1stRep products on their branded website
   - Earns preset commission on every 1stRep product sold

3. **Adding Own Products**
   - Vendor can create and add their own products
   - Sets prices, descriptions, images for their products
   - Manages inventory for their own products
   - Own products appear alongside 1stRep products in EPOS

4. **Requesting Wholesale Stock**
   - Vendor can order physical 1stRep stock at wholesale prices
   - Stock is delivered to vendor's location
   - Vendor manages their own inventory
   - Useful for vendors with physical stores

5. **Earning & Payouts**
   - Earns commission on 1stRep product sales
   - Keeps full revenue from own product sales
   - Can request payout when balance reaches threshold

### Vendor Dashboard Features

- **EPOS**: Point of sale for 1stRep products + own products
- **Products**: Create and manage own products
- **1stRep Catalog**: Browse 1stRep products with commission rates
- **Stock Requests**: Order wholesale stock at discounted prices
- **Orders**: View and manage all orders
- **Earnings**: Track commission balance and request payouts
- **Website**: Manage branded storefront
- **Inventory**: Track stock levels for own products
- **Analytics**: Sales performance and insights

### What Makes Vendors Different

- CAN add their own products to EPOS and website
- CAN request physical wholesale stock from 1stRep
- CAN earn from both 1stRep commissions AND own product sales

---

## Commission System

### How Commission Works

Both resellers and vendors earn commission when selling 1stRep products:

**Commission Calculation:**
```
Commission = Product Commission Rate (preset per product)
Example: Product A has 15% commission, sells for £100 = £15 commission earned
```

### Commission Per Product

- Each 1stRep product has a preset commission rate
- Commission rates are set by admin
- Rates may vary by product category or individual product
- Partners can view commission rates in the product catalog

### Commission Status Flow

1. **Pending** - Commission recorded when sale is made
2. **Confirmed** - Order delivered, commission confirmed
3. **Available** - Ready to be included in payout request
4. **Requested** - Partner has requested payout
5. **Approved** - Admin approved the payout
6. **Paid** - Payment sent to partner

### Payout Threshold

- Partners must reach a minimum balance before requesting payout
- Threshold amount is set by admin (e.g., £50 minimum)
- Once threshold is reached, payout request button becomes available

### Payout Methods

- **Bank Transfer** - Direct transfer to partner's bank account
- **PayPal** - Send to partner's PayPal email
- **Stripe Connect** - Automatic transfer (requires Stripe setup)

---

## EPOS System

### What is EPOS?

EPOS (Electronic Point of Sale) is the system partners use to process in-person sales at physical locations like retail stores, markets, or events.

### EPOS Features for Resellers

- Browse and select 1stRep products
- Process customer payments
- Generate receipts
- Track daily sales
- View commission earned

### EPOS Features for Vendors

All reseller features PLUS:
- Add own products to EPOS catalog
- Mix 1stRep and own products in same transaction
- Manage inventory for own products
- Track performance by product type

---

## Wholesale Stock (Vendors Only)

### How Wholesale Ordering Works

Vendors can order physical 1stRep stock to keep at their location:

1. **Browse Wholesale Catalog** - View products with wholesale prices
2. **Place Stock Request** - Select products and quantities
3. **Admin Approval** - Admin reviews and approves order
4. **Payment** - Vendor pays wholesale price
5. **Delivery** - Stock shipped to vendor's location
6. **Inventory** - Vendor tracks stock in their dashboard

### Wholesale Pricing

- Wholesale prices are lower than retail prices
- Discount percentage based on vendor tier
- Larger orders may qualify for additional discounts

### Why Order Wholesale Stock?

- Immediate availability for customers
- Better margins on local sales
- Display products in physical store
- No waiting for 1stRep to ship to customer

---

## Admin Management

### Managing Partners

Navigate to **Admin Portal → B2B Partners** to:
- View all partner applications (resellers and vendors)
- Approve or reject new applications
- Edit partner details and commission rates
- Convert resellers to vendors
- View partner performance

### Setting Commission Rates

Navigate to **Admin Portal → Products** to:
- Set commission rate per product
- Set category-level commission rates
- View which products have which rates

### Processing Payouts

Navigate to **Admin Portal → Commission Payouts** to:
- View pending payout requests
- Approve or reject requests
- Process payments
- Track payout history
- Set minimum payout thresholds

---

## Getting Started

### For New Resellers
1. Apply at the reseller registration page
2. Wait for admin approval
3. Access reseller dashboard
4. Set up EPOS and branded website
5. Start selling 1stRep products
6. Track earnings and request payouts

### For New Vendors
1. Apply at the vendor registration page
2. Wait for admin approval
3. Access vendor dashboard
4. Set up EPOS with 1stRep products
5. Add your own products (optional)
6. Order wholesale stock (optional)
7. Track earnings and request payouts

---

## Summary

| Capability | Reseller | Vendor |
|------------|----------|--------|
| Sell 1stRep products via EPOS | Yes | Yes |
| Sell 1stRep products via website | Yes | Yes |
| Earn commission on 1stRep sales | Yes | Yes |
| Add own products | No | Yes |
| Order wholesale stock | No | Yes |
| Request payouts | Yes | Yes |
| Branded storefront | Yes | Yes |

**In simple terms:**
- **Reseller** = Sells 1stRep products only, earns commission
- **Vendor** = Everything a reseller does + can add own products + can buy wholesale stock
