import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print(f"Connecting to Supabase at: {SUPABASE_URL}")
client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    # Test read products
    res = client.table("products").select("*").execute()
    print("SUCCESS: Connected to Supabase!")
    print(f"Existing products count in DB: {len(res.data)}")
except Exception as e:
    print(f"CONNECTION OR QUERY ERROR: {e}")
