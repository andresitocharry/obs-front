import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def setup_bucket():
    print("Iniciando creación de bucket...")
    try:
        # Intentar crear el bucket
        supabase.storage.create_bucket("temp_uploads", options={"public": True})
        print("✅ Bucket 'temp_uploads' creado exitosamente.")
    except Exception as e:
        if "already exists" in str(e).lower():
            print("ℹ️ El bucket 'temp_uploads' ya existía.")
        else:
            print(f"❌ Error creando bucket: {e}")

if __name__ == "__main__":
    setup_bucket()
