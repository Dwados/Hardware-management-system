import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 1. Seed Initial Products
initial_products = [
    {
        "sku": "CEM-001",
        "barcode": "8901234567890",
        "name": "Portland Cement 50kg",
        "category_id": "Building",
        "supplier_id": "Supplier A",
        "storage_location_id": "A1-S1-B1",
        "unit": "bag",
        "cost_price": 9.50,
        "selling_price": 12.00,
        "stock_quantity": 120,
        "minimum_stock": 20,
        "active": True
    },
    {
        "sku": "PVC-002",
        "barcode": "8901234567891",
        "name": "PVC Pipe 2 inch (3m)",
        "category_id": "Plumbing",
        "supplier_id": "Supplier B",
        "storage_location_id": "A2-S3-B1",
        "unit": "pcs",
        "cost_price": 5.00,
        "selling_price": 8.50,
        "stock_quantity": 4,
        "minimum_stock": 10,
        "active": True
    },
    {
        "sku": "NAL-003",
        "barcode": "8901234567892",
        "name": "Steel Nails 3 inch (kg)",
        "category_id": "Hardware",
        "supplier_id": "Supplier C",
        "storage_location_id": "A3-S1-B2",
        "unit": "kg",
        "cost_price": 1.50,
        "selling_price": 2.50,
        "stock_quantity": 25,
        "minimum_stock": 15,
        "active": True
    }
]

print("Seeding initial products...")
for prod in initial_products:
    try:
        client.table("products").insert(prod).execute()
        print(f"  + Added product: {prod['name']}")
    except Exception as e:
        print(f"  - Error inserting {prod['name']}: {e}")

# 2. Seed Initial Customers / Debtors
initial_customers = [
    {
        "name": "John Doe Builders",
        "phone": "+11223344",
        "total_credit": 350.00,
        "amount_paid": 230.00,
        "balance_due": 120.00,
        "store_credit": 0.00,
        "status": "OVERDUE"
    },
    {
        "name": "Apex Construction",
        "phone": "+55667788",
        "total_credit": 500.00,
        "amount_paid": 170.00,
        "balance_due": 330.00,
        "store_credit": 0.00,
        "status": "PENDING"
    },
    {
        "name": "Samuel Miller",
        "phone": "+77889900",
        "total_credit": 0.00,
        "amount_paid": 250.00,
        "balance_due": 0.00,
        "store_credit": 150.00,
        "status": "STORE CREDIT"
    }
]

print("Seeding initial customers & debtors...")
for cust in initial_customers:
    try:
        client.table("customers").insert(cust).execute()
        print(f"  + Added customer: {cust['name']}")
    except Exception as e:
        print(f"  - Error inserting {cust['name']}: {e}")

# 3. Seed Initial Suppliers / Creditors
initial_suppliers = [
    {
        "name": "Plumbing World",
        "phone": "+987654321",
        "total_purchased": 600.00,
        "amount_paid": 450.00,
        "balance_due": 150.00,
        "status": "PENDING"
    },
    {
        "name": "BuildPro Supplies",
        "phone": "+123456789",
        "total_purchased": 1200.00,
        "amount_paid": 1200.00,
        "balance_due": 0.00,
        "status": "CLEARED"
    }
]

print("Seeding initial suppliers & creditors...")
for supp in initial_suppliers:
    try:
        client.table("suppliers").insert(supp).execute()
        print(f"  + Added supplier: {supp['name']}")
    except Exception as e:
        print(f"  - Error inserting {supp['name']}: {e}")

print("\nSeeding Complete! Database is live and populated.")
