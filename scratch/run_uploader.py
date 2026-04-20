import os
import sys

# Path to the metadata project
metadatos_path = r'c:\Users\PIPEC\Desktop\tesis\dqg-metadatos'

# Change working directory so relative paths in config.py work
os.chdir(metadatos_path)

# Add to sys.path so imports like 'from processor import *' work if needed
# but main.py does 'from src.processor import *' or similar?
# Let's check imports in main.py again.
# 1: #Archivo donde corre todo el proceso de transformación y carga 
# 2: from processor import *
# 3: from uploader import *
# 4: from supabase_manager import *

# Based on main.py, it expects to be run from 'src' or have 'src' in path?
# Wait, if main.py is in 'src', 'from processor import *' works if CWD IS 'src'.

src_path = os.path.join(metadatos_path, 'src')
sys.path.insert(0, src_path)
sys.path.insert(0, metadatos_path) # Also add root for 'src.config' etc.

try:
    print(f"Current CWD: {os.getcwd()}")
    import uploader
    print("Starting upload process...")
    uploader.charge_all_csv()
    print("Upload completed successfully!")
except Exception as e:
    print(f"Error during upload: {e}")
    import traceback
    traceback.print_exc()
