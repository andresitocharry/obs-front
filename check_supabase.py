import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def check_supabase():
    print("--- Verificando Supabase ---")
    
    # Check Buckets
    print("\n1. Buckets de Storage:")
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"Buckets encontrados: {bucket_names}")
        if "temp_uploads" not in bucket_names:
            print("⚠️ ADVERTENCIA: No se encontró el bucket 'temp_uploads'.")
    except Exception as e:
        print(f"Error listando buckets: {e}")

    # Check Tables
    print("\n2. Tablas Requeridas:")
    tables_to_check = ["variable", "hecho_registrar_variable", "upload_sessions", "validation_reports", "bronze_raw_clinical_data"]
    for table in tables_to_check:
        try:
            # Intentamos un select limitado para ver si existe y tiene datos
            res = supabase.table(table).select("count", count="exact").limit(1).execute()
            count = res.count if res.count is not None else 0
            print(f"Table '{table}': OK (Records: {count})")
        except Exception as e:
            print(f"Table '{table}': ERROR (Likely missing or permission issue). Detail: {e}")

if __name__ == "__main__":
    check_supabase()
