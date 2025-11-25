import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

DB_HOST = os.getenv('DB_HOST')
DB_USER = os.getenv('DB_USER')
DB_PASS = os.getenv('DB_PASS')
DB_NAME = os.getenv('DB_NAME')
DB_PORT = os.getenv('DB_PORT')

def full_reset():
    print("--- FULL DATABASE RESET STARTED ---")
    
    cnx = None
    cursor = None
    try:
        # Connect to MySQL server (without selecting DB)
        cnx = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            port=int(DB_PORT)
        )
        cursor = cnx.cursor()
        
        # 1. DROP DATABASE
        print(f"Dropping database '{DB_NAME}' if exists...")
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
        print("Database dropped.")
        
        # 2. Re-create DB and Tables (Logic from init_db.py)
        print("Re-initializing database schema...")
        
        # Read SQL file
        sql_path = os.path.join(os.path.dirname(__file__), 'dbsetup.sql')
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
            
        # Split and execute commands
        commands = sql_script.split(';')
        
        for command in commands:
            cleaned_command = command.strip()
            if cleaned_command:
                try:
                    cursor.execute(cleaned_command)
                except mysql.connector.Error as err:
                    print(f"Warning (Command skipped): {err}")
                    # print(f"Command: {cleaned_command[:50]}...")
        
        cnx.commit()
        print("Database schema re-created successfully.")
        
        print("--- FULL DATABASE RESET COMPLETED ---")
        print("Now run: python database/dataload.py")
        print("Then run: python database/generate_synthetic_data.py")
        
    except mysql.connector.Error as err:
        print(f"Error during reset: {err}")
    finally:
        if cursor: cursor.close()
        if cnx: cnx.close()

if __name__ == "__main__":
    full_reset()
