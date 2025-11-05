# 📊 Data Export - Table Catalog

This document lists all tables extracted by the Data Export Tool with their unique identifiers and tags.

## 🎯 Table Identification System

Each table now has:
- **Unique ID**: `page_title_location_tab` format
- **Tags**: Multiple tags for easy filtering (`page:X`, `location:X`, `type:X`, etc.)
- **Metadata**: Page, section, location, tab information

---

## 📑 Tables by Page

### 1. Executive Summary
**Path**: `/`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Top Products | `executive-summary_top-products_*_overview` | revenue | `page:Executive Summary`, `type:revenue`, `sales`, `products` |
| 2 | Revenue Summary | `executive-summary_revenue-summary_*` | revenue | `page:Executive Summary`, `type:revenue` |

---

### 2. Sales Analytics
**Path**: `/sales-analytics`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Products Performance | `sales-analytics_products-performance_*_products` | revenue | `page:Sales Analytics`, `tab:Products`, `type:revenue`, `sales`, `products`, `performance` |
| 2 | Category Performance | `sales-analytics_category-performance_*_categories` | revenue | `page:Sales Analytics`, `tab:Categories`, `type:revenue`, `sales`, `categories` |
| 3 | Payment Methods | `sales-analytics_payment-methods_*_payment-analysis` | payment | `page:Sales Analytics`, `tab:Payment Analysis`, `type:payment`, `sales`, `payments` |
| 4 | Discounts Applied | `sales-analytics_discounts-applied_*_discounts` | discount | `page:Sales Analytics`, `tab:Discounts`, `type:discount`, `sales`, `discounts`, `promotions` |

---

### 3. Client Retention
**Path**: `/client-retention`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | New Clients | `client-retention_new-clients_*` | customer | `page:Client Retention`, `type:customer`, `retention` |
| 2 | Retention Metrics | `client-retention_retention-metrics_*` | customer | `page:Client Retention`, `type:customer`, `retention` |

---

### 4. Trainer Performance
**Path**: `/trainer-performance`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Trainer Statistics | `trainer-performance_trainer-statistics_*` | performance | `page:Trainer Performance`, `type:performance`, `trainers` |
| 2 | Class Breakdown | `trainer-performance_class-breakdown_*` | attendance | `page:Trainer Performance`, `type:attendance`, `trainers` |

---

### 5. Class Attendance
**Path**: `/class-attendance`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Attendance Overview | `class-attendance_attendance-overview_*` | attendance | `page:Class Attendance`, `type:attendance`, `classes` |
| 2 | Class Formats | `class-attendance_class-formats_*` | attendance | `page:Class Attendance`, `type:attendance`, `formats` |
| 3 | Time Analysis | `class-attendance_time-analysis_*` | attendance | `page:Class Attendance`, `type:attendance`, `time` |

---

### 6. Class Formats Comparison
**Path**: `/class-formats-comparison`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Format Performance | `class-formats-comparison_format-performance_*` | attendance | `page:Class Formats Comparison`, `type:attendance`, `formats` |

---

### 7. Discounts & Promotions
**Path**: `/discounts-promotions`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Discount Analysis | `discounts-promotions_discount-analysis_*` | discount | `page:Discounts & Promotions`, `type:discount` |
| 2 | Product Performance | `discounts-promotions_product-performance_*` | revenue | `page:Discounts & Promotions`, `type:revenue`, `discounts` |

---

### 8. Sessions
**Path**: `/sessions`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | All Sessions | `sessions_all-sessions_*` | session | `page:Sessions`, `type:session` |
| 2 | By Trainer | `sessions_by-trainer_*` | session | `page:Sessions`, `type:session`, `trainers` |
| 3 | By Class Type | `sessions_by-class-type_*` | session | `page:Sessions`, `type:session`, `classes` |

---

### 9. Expiration Analytics
**Path**: `/expiration-analytics`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Expiring Memberships | `expiration-analytics_expiring-memberships_*` | expiration | `page:Expiration Analytics`, `type:expiration`, `memberships` |
| 2 | Expired Report | `expiration-analytics_expired-report_*` | expiration | `page:Expiration Analytics`, `type:expiration` |

---

### 10. Late Cancellations
**Path**: `/late-cancellations`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Late Cancellations | `late-cancellations_late-cancellations_*` | cancellation | `page:Late Cancellations`, `type:cancellation` |
| 2 | By Customer | `late-cancellations_by-customer_*` | cancellation | `page:Late Cancellations`, `type:cancellation`, `customers` |

---

### 11. Funnel & Leads
**Path**: `/funnel-leads`

| # | Table Name | ID Pattern | Type | Tags |
|---|------------|------------|------|------|
| 1 | Lead Pipeline | `funnel-leads_lead-pipeline_*` | lead | `page:Funnel & Leads`, `type:lead`, `funnel` |
| 2 | Conversion Metrics | `funnel-leads_conversion-metrics_*` | conversion | `page:Funnel & Leads`, `type:conversion` |

---

## 🏷️ Tag Reference

### Location Tags
- `location:all` - All locations combined
- `location:Kwality House` - Kwality House, Kemps Corner
- `location:Supreme HQ` - Supreme HQ, Bandra  
- `location:Kenkere House` - Kenkere House, Bengaluru

### Type Tags
- `type:revenue` - Revenue/sales tables
- `type:attendance` - Attendance/class tables
- `type:customer` - Customer/client tables
- `type:payment` - Payment method tables
- `type:discount` - Discount/promotion tables
- `type:performance` - Performance metrics tables
- `type:session` - Session detail tables
- `type:expiration` - Expiration tracking tables
- `type:cancellation` - Cancellation tables
- `type:lead` - Lead/funnel tables
- `type:conversion` - Conversion tracking tables

### Category Tags
- `sales` - Sales-related data
- `products` - Product information
- `categories` - Product categories
- `payments` - Payment methods
- `discounts` - Discount information
- `promotions` - Promotional data
- `retention` - Retention metrics
- `trainers` - Trainer information
- `classes` - Class information
- `formats` - Class formats
- `time` - Time-based analysis
- `customers` - Customer details
- `memberships` - Membership data
- `funnel` - Funnel analysis

---

## 🔍 How to Use Tags

### In PDF Export
Tags appear under each table title:
```
Table 1: Products Performance
ID: sales-analytics_products-performance_kwality-house_products
📍 Kwality House • 📂 Products • 📄 Sales Analytics • 📊 125 rows
🏷️ page:Sales Analytics • tab:Products • type:revenue • sales • products • performance
```

### In CSV Export
```csv
=== TABLE 1: Products Performance ===
ID: sales-analytics_products-performance_kwality-house_products
Location: Kwality House, Kemps Corner
Tab: Products
Tags: page:Sales Analytics, tab:Products, type:revenue, sales, products, performance
Records: 125
```

### In Text Export
```
▶ TABLE 1: Products Performance
  ID: sales-analytics_products-performance_kwality-house_products
  📍 Kwality House  •  📂 Products  •  📊 125 rows
  🏷️  Tags: page:Sales Analytics, tab:Products, type:revenue, sales, products, performance
```

---

## ✅ Export Completeness

The export tool extracts:
- ✅ **ALL pages** (11 pages total)
- ✅ **ALL locations** (4 locations including "All Locations")
- ✅ **ALL tabs** within each page
- ✅ **ALL rows** (no limits - complete data export)
- ✅ **ALL metrics** from each section

### Estimated Table Count
- Minimum: ~30 tables (if each page has 2-3 tables)
- Maximum: ~150 tables (all pages × all locations × all tabs)

---

## 🚀 Next Steps

If you're missing specific tables:
1. Check the console logs when generating preview
2. Look for the table ID pattern in the exported file
3. Verify the page is selected in the export tool
4. Ensure the location has data for that page

**Note**: Empty tables (0 rows) are still included with headers and metadata for completeness.
