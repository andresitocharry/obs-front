import os
import requests
import time
import pandas as pd

API_URL = "http://localhost:8000"
FILE_PATH = r"c:\Users\PIPEC\Desktop\tesis\dqg-frontend\Herramienta_seguimiento_monitoreo_pacientes_canguro.xlsm"

def test_flow():
    print(f"--- Iniciando Test del Pipeline para {os.path.basename(FILE_PATH)} ---")
    
    # 1. Upload
    print("1. Subiendo archivo a Capa Bronze (Storage)...")
    with open(FILE_PATH, "rb") as f:
        files = {"file": (os.path.basename(FILE_PATH), f, "application/vnd.ms-excel.sheet.macroEnabled.12")}
        # Sin auth para el test local si el backend lo permite (usaremos el token si es necesario)
        # Por ahora asumimos que el backend necesita auth según el código
        # Sacamos un token de prueba si es posible o modificamos el backend temporalmente para el test
        
    # Mejor simulamos la lógica interna para no pelear con Auth en el script de test
    from app.core.database import supabase_client
    import uuid
    
    upload_id = str(uuid.uuid4())
    with open(FILE_PATH, "rb") as f:
        contents = f.read()
        storage_path = f"{upload_id}_{os.path.basename(FILE_PATH)}"
        print(f"Subiendo a Supabase Storage: {storage_path}")
        supabase_client.storage.from_("temp_uploads").upload(storage_path, contents)
    
    # 2. Registrar sesión
    supabase_client.table("upload_sessions").insert({
        "id": upload_id,
        "filename": os.path.basename(FILE_PATH),
        "status": "pending"
    }).execute()
    
    # 3. Disparar Validación (usando el motor directamente para el test)
    print("2. Ejecutando Motor de Validación Dinámica...")
    from app.api.v1.upload import process_validation_background
    process_validation_background(upload_id, os.path.basename(FILE_PATH))
    
    # 4. Ver reporte
    print("3. Consultando reporte de errores...")
    res = supabase_client.table("validation_reports").select("*").eq("upload_id", upload_id).execute()
    if res.data:
        report = res.data[0]
        print(f"Validación finalizada. Total errores: {report['total_errors']}")
        if report['total_errors'] > 0:
            print("Muestra de errores detectados:")
            for err in report['errors'][:5]:
                print(f"  - Fila {err['row']}, Col {err['column']}: {err['error']} (Valor: {err['value_provided']})")
    else:
        print("No se generó reporte. Revisa los logs del backend.")

if __name__ == "__main__":
    test_flow()
