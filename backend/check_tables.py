import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_KEY)

for table in ["products", "customers", "suppliers", "sales", "receipts", "users"]:
    try:
        res = client.table(table).select("*").limit(1).execute()
        print(f"Table '{table}': EXISTS (Rows: {len(res.data)})")
    except Exception as e:
        print(f"Table '{table}': NOT FOUND / ERROR -> {e}")
