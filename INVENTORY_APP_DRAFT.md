# Inventory App — Draft

## Overview

A web-based inventory management system that allows businesses to track stock levels, manage products, handle suppliers, and generate reports. The system should support role-based access and provide real-time visibility into inventory status.

---

## Core Features

### 1. Product Management
- Create, read, update, delete (CRUD) products
- Product fields: name, SKU, description, category, unit of measure, price (cost & selling), barcode/QR code
- Product images (single or multiple)
- Product variants (e.g. size, color)
- Low stock threshold per product

### 2. Category & Tag Management
- Hierarchical categories (parent → child)
- Tag products for flexible filtering
- Bulk assign/remove categories and tags

### 3. Stock Management
- Track current stock level per product (and per location/warehouse)
- Manual stock adjustment with reason (e.g. damaged, lost, correction)
- Stock-in (receiving from supplier)
- Stock-out (sales, internal use, write-off)
- Reserve/allocate stock for pending orders
- Batch/lot tracking and expiry dates (optional)

### 4. Warehouse / Location Management
- Multiple warehouse support
- Zones/shelves/bins within a warehouse
- Transfer stock between locations
- View stock breakdown by location

### 5. Supplier Management
- CRUD suppliers (name, contact, address, payment terms)
- Link products to one or more suppliers
- Track supplier lead times

### 6. Purchase Orders (PO)
- Create POs to reorder stock from suppliers
- PO statuses: Draft → Sent → Partially Received → Received → Cancelled
- Receive items against a PO (partial or full)
- Auto-update stock on receipt

### 7. Sales / Stock-Out Orders
- Record outbound stock movements (manual or linked to orders)
- Integrate with sales/order system (optional)
- Auto-decrease stock on fulfillment

### 8. Reporting & Analytics
- Current stock report (with filters: category, location, low stock)
- Stock movement history (audit log)
- Inventory valuation report (FIFO / weighted average)
- Low stock & reorder report
- Supplier order history
- Export reports to CSV / Excel / PDF

### 9. Alerts & Notifications
- Low stock alert (email / in-app)
- Expiry date alert (if batch tracking enabled)
- PO status change notifications
- Overstock alerts

### 10. User & Role Management
- Roles: Admin, Manager, Staff, Viewer
- Permissions per role (e.g. only Admin can delete, Viewer is read-only)
- Activity log (who did what and when)

### 11. Barcode / QR Code Support
- Generate barcodes/QR codes for products
- Scan to look up or update stock (mobile-friendly)

### 12. Dashboard
- Total products, total stock value, low stock count
- Recent stock movements
- POs awaiting receipt
- Charts: stock trends, top moving products, category breakdown

---

## Process Flows

### Product Creation Flow
```
Admin/Manager
  → Fill product details (name, SKU, category, price, unit)
  → Set low stock threshold
  → Assign supplier(s)
  → Set initial stock level per location
  → Save → Product active in system
```

### Stock-In (Receiving) Flow
```
Supplier ships goods
  → Staff creates or receives against a PO
  → Enter quantities received per product
  → Select destination warehouse/location
  → System increases stock level
  → Movement logged in audit trail
  → PO status updated (partial / fully received)
```

### Stock-Out Flow
```
Sales order / internal request created
  → System checks available stock
  → If sufficient: reserve stock
  → Staff fulfills order → confirm dispatch
  → System decreases stock level
  → Movement logged
  → If insufficient: trigger low stock alert
```

### Stock Transfer Flow
```
Manager initiates transfer (source location → destination)
  → System decreases stock at source
  → System increases stock at destination
  → Transfer logged with timestamp and user
```

### Reorder Flow
```
System detects stock ≤ low stock threshold
  → Alert sent to Manager
  → Manager creates Purchase Order for supplier
  → PO sent to supplier
  → On receipt: stock updated (see Stock-In flow)
```

### Stocktake / Physical Count Flow
```
Manager initiates stocktake for a location
  → System locks location from movements (optional)
  → Staff counts physical items and enters counts
  → System compares counted vs. system quantity
  → Discrepancies flagged for review
  → Manager approves adjustments
  → Stock updated, discrepancies logged
```

---

## Technical Requirements

### Backend
- RESTful API (or GraphQL)
- Authentication: JWT-based, refresh token support
- Role-based authorization (RBAC)
- Soft delete for products and records
- Optimistic concurrency (prevent double-update of stock)
- Pagination, filtering, and sorting on all list endpoints

### Frontend
- Responsive web app (works on desktop and tablet)
- Mobile-friendly for warehouse staff (barcode scanning)
- Real-time stock updates (WebSocket or polling)

### Database
- Relational DB (PostgreSQL / SQL Server)
- Key tables: Products, Categories, Suppliers, Warehouses, Locations, StockMovements, PurchaseOrders, PurchaseOrderLines, Users, Roles

### Integrations (Optional / Future)
- Accounting software (e.g. QuickBooks, Xero)
- E-commerce platform (Shopify, WooCommerce)
- Barcode scanner hardware
- Email / SMS notification provider

---

## Entities (Data Model Draft)

| Entity | Key Fields |
|---|---|
| Product | Id, SKU, Name, CategoryId, UnitOfMeasure, CostPrice, SellingPrice, LowStockThreshold, IsActive |
| Category | Id, Name, ParentCategoryId |
| Supplier | Id, Name, ContactName, Email, Phone, LeadTimeDays |
| Warehouse | Id, Name, Address |
| Location | Id, WarehouseId, Zone, Shelf, Bin |
| Stock | ProductId, LocationId, Quantity, ReservedQty |
| StockMovement | Id, ProductId, LocationId, Type (IN/OUT/TRANSFER/ADJUSTMENT), Qty, Reason, UserId, Timestamp |
| PurchaseOrder | Id, SupplierId, Status, OrderDate, ExpectedDate |
| POLine | Id, POId, ProductId, QtyOrdered, QtyReceived, UnitCost |
| User | Id, Name, Email, PasswordHash, RoleId |
| Role | Id, Name, Permissions (JSON) |

---

## Roles & Permissions

| Feature | Admin | Manager | Staff | Viewer |
|---|:---:|:---:|:---:|:---:|
| View products | ✅ | ✅ | ✅ | ✅ |
| Create/edit products | ✅ | ✅ | ❌ | ❌ |
| Delete products | ✅ | ❌ | ❌ | ❌ |
| Stock-in / Stock-out | ✅ | ✅ | ✅ | ❌ |
| Manual adjustment | ✅ | ✅ | ❌ | ❌ |
| Create PO | ✅ | ✅ | ❌ | ❌ |
| Manage suppliers | ✅ | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ | ✅ | ✅ |
| Export reports | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |

---

## Out of Scope (v1)

- Point of Sale (POS) integration
- Manufacturing / Bill of Materials (BOM)
- Multi-currency support
- Mobile native app
- AI-based demand forecasting

---

*Draft version — subject to revision based on business requirements.*
