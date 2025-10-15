# Hours & Materials Invoice System

## 🎯 Overview

The Hours & Materials system allows field technicians to create detailed service invoices on-site that, after admin approval, are automatically pushed to QuickBooks Online as invoices. The system handles customer creation/matching, line items, pricing, and tax calculations.

---

## 📋 System Flow

```
1. Technician completes job
2. Technician fills out H&M form on mobile/tablet
3. Form submitted for admin approval
4. Admin reviews, edits, approves/rejects
5. On approval → Auto-create/update customer in QuickBooks
6. On approval → Create invoice in QuickBooks
7. QuickBooks returns invoice ID
8. System stores complete invoice data
9. Invoice appears in dashboard "Invoices" page
```

---

## 🗂️ Database Schema

### Hours & Materials Forms Table

```sql
CREATE TABLE IF NOT EXISTS hours_materials_forms (
    id SERIAL PRIMARY KEY,
    
    -- Submission Info
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Customer Info (May not match existing customer)
    customer_name VARCHAR(255) NOT NULL,
    customer_address_street VARCHAR(255),
    customer_address_city VARCHAR(100),
    customer_address_state VARCHAR(2) DEFAULT 'CA',
    customer_address_zip VARCHAR(10),
    customer_address_country VARCHAR(3) DEFAULT 'USA',
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- QuickBooks Match/Create
    matched_customer_id BIGINT, -- QuickBooks customer ID if matched
    created_new_customer BOOLEAN DEFAULT FALSE,
    
    -- Invoice Info (After QuickBooks Creation)
    qbo_invoice_id BIGINT, -- QuickBooks invoice ID after creation
    invoice_number VARCHAR(50), -- QuickBooks invoice number
    
    -- Totals (Calculated)
    subtotal DECIMAL(10,2),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(10,2),
    discount DECIMAL(10,2) DEFAULT 0.00,
    deposit DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hours_materials_line_items (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES hours_materials_forms(id) ON DELETE CASCADE,
    
    -- Line Item Details
    line_number INTEGER NOT NULL,
    date_entered DATE NOT NULL,
    item_type VARCHAR(20) NOT NULL, -- 'hours' (service) or 'materials' (product)
    
    -- Product/Service Info
    qbo_item_id BIGINT, -- QuickBooks Item ID if matched
    qbo_item_name VARCHAR(255),
    product_service_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing
    quantity DECIMAL(10,2) NOT NULL, -- Increments of 0.25, min 1.0
    rate DECIMAL(10,2) NOT NULL,
    line_total DECIMAL(10,2) NOT NULL, -- quantity × rate
    
    -- Flags
    rate_modified BOOLEAN DEFAULT FALSE, -- True if tech changed from QuickBooks rate
    original_rate DECIMAL(10,2), -- Original QuickBooks rate if modified
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hm_forms_status ON hours_materials_forms(status);
CREATE INDEX IF NOT EXISTS idx_hm_forms_submitted_by ON hours_materials_forms(submitted_by);
CREATE INDEX IF NOT EXISTS idx_hm_forms_qbo_invoice ON hours_materials_forms(qbo_invoice_id);
CREATE INDEX IF NOT EXISTS idx_hm_line_items_form ON hours_materials_line_items(form_id);
```

---

## 🔌 Backend API Endpoints

### 1. Forms Management

#### Get All H&M Forms (Admin)
```http
GET /api/hours-materials/forms
Authorization: Bearer <token>

Query Parameters:
- status: 'pending' | 'approved' | 'rejected' | 'all'
- submittedBy: user_id
- startDate: ISO date
- endDate: ISO date

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "submittedBy": { "id": 5, "name": "John Doe" },
      "submittedAt": "2025-10-11T10:30:00Z",
      "status": "pending",
      "customerName": "Smith Residence",
      "lineItemCount": 5,
      "subtotal": 450.00,
      "total": 495.00
    },
    ...
  ]
}
```

#### Get My H&M Forms (Technician)
```http
GET /api/hours-materials/my-forms
Authorization: Bearer <token>

Response: Same as above, filtered by current user
```

#### Get Single Form Details
```http
GET /api/hours-materials/forms/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "submittedBy": { "id": 5, "name": "John Doe", "email": "john@example.com" },
    "submittedAt": "2025-10-11T10:30:00Z",
    "status": "pending",
    "reviewedBy": null,
    "reviewedAt": null,
    
    "customerName": "Smith Residence",
    "customerAddressStreet": "123 Main St",
    "customerAddressCity": "San Rafael",
    "customerAddressState": "CA",
    "customerAddressZip": "94901",
    "customerEmail": "smith@example.com",
    "customerPhone": "(415) 555-1234",
    
    "matchedCustomerId": 456,
    "qboInvoiceId": null,
    
    "lineItems": [
      {
        "id": 1,
        "lineNumber": 1,
        "dateEntered": "2025-10-11",
        "itemType": "hours",
        "productServiceName": "Exclusion",
        "description": "Sealed rodent entry points",
        "quantity": 2.5,
        "rate": 120.00,
        "lineTotal": 300.00,
        "rateModified": false
      },
      {
        "id": 2,
        "lineNumber": 2,
        "itemType": "materials",
        "productServiceName": "Steel Mesh",
        "description": "1/4 inch steel mesh for exclusion",
        "quantity": 10.0,
        "rate": 15.00,
        "lineTotal": 150.00,
        "rateModified": false
      }
    ],
    
    "subtotal": 450.00,
    "taxRate": 9.25,
    "taxAmount": 41.63,
    "discount": 0.00,
    "deposit": 0.00,
    "totalAmount": 491.63,
    
    "notes": "Customer was very pleased with service"
  }
}
```

#### Create H&M Form (Technician)
```http
POST /api/hours-materials/forms
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "Smith Residence",
  "customerAddressStreet": "123 Main St",
  "customerAddressCity": "San Rafael",
  "customerAddressState": "CA",
  "customerAddressZip": "94901",
  "customerEmail": "smith@example.com",
  "customerPhone": "(415) 555-1234",
  
  "lineItems": [
    {
      "dateEntered": "2025-10-11",
      "itemType": "hours",
      "productServiceName": "Exclusion",
      "qboItemId": 789,
      "description": "Sealed rodent entry points",
      "quantity": 2.5,
      "rate": 120.00
    },
    {
      "dateEntered": "2025-10-11",
      "itemType": "materials",
      "productServiceName": "Steel Mesh",
      "qboItemId": 123,
      "description": "1/4 inch steel mesh",
      "quantity": 10.0,
      "rate": 15.00
    }
  ],
  
  "notes": "Customer was very pleased with service"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "pending",
    "submittedAt": "2025-10-11T10:30:00Z",
    "totalAmount": 491.63
  }
}
```

#### Update H&M Form (Admin Only - Before Approval)
```http
PUT /api/hours-materials/forms/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "discount": 50.00,
  "deposit": 100.00,
  "notes": "Applied 10% discount, received deposit"
}
```

#### Approve H&M Form (Admin Only)
```http
POST /api/hours-materials/forms/:id/approve
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "formId": 1,
    "status": "approved",
    "qboCustomerId": 456,
    "qboInvoiceId": 789,
    "invoiceNumber": "INV-1234",
    "createdNewCustomer": false,
    "message": "Invoice created successfully in QuickBooks"
  }
}
```

#### Reject H&M Form (Admin Only)
```http
POST /api/hours-materials/forms/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Pricing incorrect, please resubmit with updated rates"
}

Response:
{
  "success": true,
  "data": {
    "formId": 1,
    "status": "rejected",
    "rejectionReason": "Pricing incorrect..."
  }
}
```

---

## 🔧 Backend Service Implementation

### Hours & Materials Service (`backend/src/services/hoursMateriaisService.ts`)

```typescript
import { db } from '../db/index.js';
import { hoursMateriaisForms, hoursMaterialsLineItems } from '../db/schema.js';
import { QBOService } from './qboService.js';
import { logger } from '../utils/logger.js';
import { eq } from 'drizzle-orm';

export class HoursMaterialsService {
  private qboService: QBOService;

  constructor() {
    this.qboService = new QBOService();
  }

  /**
   * Match or create customer in QuickBooks
   */
  async matchOrCreateCustomer(formData: any): Promise<{ customerId: number; created: boolean }> {
    try {
      // 1. Try to find existing customer by name
      let customer = await this.qboService.findCustomerByName(formData.customerName);
      
      if (customer) {
        return { customerId: customer.Id, created: false };
      }

      // 2. No match found, create new customer
      const newCustomer = await this.qboService.createCustomer({
        DisplayName: formData.customerName,
        GivenName: formData.customerName.split(' ')[0],
        FamilyName: formData.customerName.split(' ').slice(1).join(' '),
        PrimaryEmailAddr: { Address: formData.customerEmail },
        PrimaryPhone: { FreeFormNumber: formData.customerPhone },
        BillAddr: {
          Line1: formData.customerAddressStreet,
          City: formData.customerAddressCity,
          CountrySubDivisionCode: formData.customerAddressState,
          PostalCode: formData.customerAddressZip,
          Country: formData.customerAddressCountry
        },
        ShipAddr: {
          Line1: formData.customerAddressStreet,
          City: formData.customerAddressCity,
          CountrySubDivisionCode: formData.customerAddressState,
          PostalCode: formData.customerAddressZip,
          Country: formData.customerAddressCountry
        }
      });

      return { customerId: newCustomer.Id, created: true };
    } catch (error) {
      logger.error('Error matching/creating customer:', error);
      throw error;
    }
  }

  /**
   * Create invoice in QuickBooks from approved H&M form
   */
  async createInvoiceInQuickBooks(formId: number): Promise<any> {
    try {
      // 1. Get form with line items
      const form = await db.query.hoursMateriaisForms.findFirst({
        where: eq(hoursMateriaisForms.id, formId),
        with: { lineItems: true }
      });

      if (!form) {
        throw new Error('Form not found');
      }

      // 2. Match or create customer
      const { customerId, created } = await this.matchOrCreateCustomer(form);

      // 3. Update form with customer match
      await db.update(hoursMateriaisForms)
        .set({
          matchedCustomerId: customerId,
          createdNewCustomer: created
        })
        .where(eq(hoursMateriaisForms.id, formId));

      // 4. Build QuickBooks line items
      const qboLineItems = form.lineItems.map((item: any) => ({
        DetailType: 'SalesItemLineDetail',
        Amount: item.lineTotal,
        SalesItemLineDetail: {
          ItemRef: { value: item.qboItemId },
          Qty: item.quantity,
          UnitPrice: item.rate
        },
        Description: item.description
      }));

      // 5. Create invoice in QuickBooks
      const invoice = await this.qboService.createInvoice({
        CustomerRef: { value: customerId },
        Line: qboLineItems,
        TxnDate: new Date().toISOString().split('T')[0],
        DueDate: this.calculateDueDate(30), // 30 days net
        PrivateNote: form.notes,
        CustomerMemo: { value: form.notes },
        
        // Apply discount if present
        ...(form.discount > 0 && {
          Line: [
            ...qboLineItems,
            {
              DetailType: 'DiscountLineDetail',
              Amount: form.discount,
              DiscountLineDetail: {
                PercentBased: false,
                DiscountAccountRef: { value: '86' } // Discount account
              }
            }
          ]
        }),
        
        // Apply deposit if present
        ...(form.deposit > 0 && {
          Deposit: form.deposit
        })
      });

      // 6. Update form with QuickBooks invoice info
      await db.update(hoursMateriaisForms)
        .set({
          qboInvoiceId: invoice.Id,
          invoiceNumber: invoice.DocNumber,
          status: 'approved',
          totalAmount: invoice.TotalAmt
        })
        .where(eq(hoursMateriaisForms.id, formId));

      // 7. Sync invoice back to database
      await this.syncInvoiceToDatabase(invoice);

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice in QuickBooks:', error);
      throw error;
    }
  }

  /**
   * Calculate totals for H&M form
   */
  calculateTotals(lineItems: any[], taxRate: number = 9.25, discount: number = 0, deposit: number = 0) {
    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountedSubtotal = subtotal - discount - deposit;
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const total = discountedSubtotal + taxAmount;

    return {
      subtotal,
      taxRate,
      taxAmount,
      discount,
      deposit,
      totalAmount: total
    };
  }

  /**
   * Calculate due date (days from today)
   */
  calculateDueDate(daysFromNow: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  }

  /**
   * Sync QuickBooks invoice back to local database
   */
  async syncInvoiceToDatabase(qboInvoice: any): Promise<void> {
    // Use existing upsertInvoice function
    await this.qboService.upsertInvoice(qboInvoice);
  }
}
```

---

## 🎨 Frontend Implementation

### H&M Form Component (`frontend/src/pages/hours-materials-form.tsx`)

Key features to implement:
1. **Customer autocomplete** with QuickBooks customer data
2. **Product/Service autocomplete** from QuickBooks items
3. **Real-time line total calculation** (quantity × rate)
4. **Quantity validation** (increments of 0.25, min 1.0)
5. **Rate modification tracking** (flag if changed from QB default)
6. **Running subtotal display**
7. **Mobile-friendly UI** (large touch targets, number keyboards)

### Admin Approval Page (`frontend/src/pages/admin/hours-materials-approval.tsx`)

Key features:
1. **List all pending forms** with summary
2. **Click to view full details**
3. **Edit discount/deposit fields**
4. **Approve/Reject buttons**
5. **Rejection reason modal**
6. **Track which forms have been approved/rejected**
7. **Show QuickBooks invoice number after approval**

---

## 📊 Form Validation Rules

### Customer Fields
- **Customer Name:** Required, min 2 characters
- **Address:** Required for new customers
- **Email:** Valid email format
- **Phone:** Valid phone format (flexible)

### Line Item Fields
- **Date Entered:** Required, defaults to today, allow past dates
- **Product/Service:** Required, must match QuickBooks item
- **Description:** Required, min 5 characters
- **Quantity:** Required, ≥ 1.0, increments of 0.25 (1.0, 1.25, 1.5, 1.75, 2.0...)
- **Rate:** Required, > 0

### Business Rules
- **Minimum 1 line item** per form
- **Maximum 50 line items** per form
- **Subtotal must be > 0**
- **Admin discount cannot exceed subtotal**
- **Admin deposit cannot exceed total**

---

## 🔄 State Machine

```
PENDING → Admin Reviews
  ↓
  ├─→ APPROVED → Create/Update Customer in QB
  │              ↓
  │              Create Invoice in QB
  │              ↓
  │              Sync to Database
  │              ↓
  │              COMPLETED
  │
  └─→ REJECTED → Notify Technician
                 ↓
                 Technician can resubmit
```

---

## 🚀 Implementation Phases

### Phase 1: Database & Backend (Week 1)
- [ ] Create database schema
- [ ] Run migrations
- [ ] Build Hours & Materials Service
- [ ] Create API endpoints
- [ ] Test QuickBooks customer match/create
- [ ] Test QuickBooks invoice creation

### Phase 2: Technician Form (Week 2)
- [ ] Build H&M form component
- [ ] Customer autocomplete
- [ ] Product/Service autocomplete
- [ ] Line item management (add/edit/delete)
- [ ] Real-time calculations
- [ ] Form submission
- [ ] Mobile optimization

### Phase 3: Admin Approval (Week 3)
- [ ] Build approval list page
- [ ] Build detail review modal
- [ ] Add discount/deposit fields
- [ ] Approve/reject functionality
- [ ] QuickBooks integration testing
- [ ] Error handling

### Phase 4: Integration & Testing (Week 4)
- [ ] End-to-end testing
- [ ] Error handling & edge cases
- [ ] Performance optimization
- [ ] User acceptance testing
- [ ] Documentation
- [ ] Deploy to production

---

## 🎯 Key Features Summary

### For Technicians
✅ Easy-to-use mobile form
✅ Customer autocomplete (saves typing)
✅ Product/Service autocomplete with descriptions
✅ Automatic price lookup from QuickBooks
✅ Real-time total calculation
✅ Submit for admin approval
✅ View submission history
✅ Resubmit rejected forms

### For Admins
✅ Review all pending forms
✅ See flagged rate modifications
✅ Add discounts/deposits
✅ Approve with one click
✅ Reject with reason
✅ Auto-create customers in QuickBooks
✅ Auto-create invoices in QuickBooks
✅ Track QuickBooks sync status

---

## 📝 Example Use Case

**Scenario:** Technician John completes a rodent exclusion job

1. John opens "Hours & Materials" page on tablet
2. Types "Smith" → selects "Smith Residence" from autocomplete
3. Customer info auto-fills (address, email, phone)
4. Adds line item:
   - Date: Today
   - Service: "Exclusion" (autocomplete)
   - Description: "Sealed 15 rodent entry points under deck"
   - Quantity: 3.5 (hours)
   - Rate: $120/hr (auto-filled from QB)
   - Total: $420 (calculated)
5. Adds another line item:
   - Date: Today
   - Material: "Steel Mesh" (autocomplete)
   - Description: "1/4 inch galvanized steel mesh"
   - Quantity: 12 (feet)
   - Rate: $15/ft (auto-filled from QB)
   - Total: $180 (calculated)
6. Reviews total: $600 + tax = $655.50
7. Submits form
8. Admin Spencer reviews:
   - Sees Smith Residence, $655.50
   - Everything looks good
   - Clicks "Approve"
9. System:
   - Matches Smith Residence in QuickBooks (ID: 456)
   - Creates Invoice #1234 in QuickBooks
   - Syncs invoice to database
   - Sends confirmation to John
10. Invoice appears in dashboard "Invoices" page
11. Email sent to Smith Residence with invoice

---

## 🔒 Security Considerations

- ✅ Only authenticated users can create forms
- ✅ Only admins can approve/reject
- ✅ Only admins can edit discount/deposit
- ✅ Technicians can only view their own forms
- ✅ Admins can view all forms
- ✅ Rate modifications flagged for admin review
- ✅ QuickBooks API calls use secure OAuth tokens
- ✅ All monetary values validated server-side

---

## 📊 Success Metrics

- **Form submission time:** < 5 minutes per job
- **Admin approval time:** < 2 minutes per form
- **QuickBooks sync success rate:** > 99%
- **Customer match accuracy:** > 95%
- **Mobile usability:** Fully functional on tablets/phones
- **Error rate:** < 1%

---

*This system replaces manual invoice entry, saving hours of admin time and reducing errors!*
