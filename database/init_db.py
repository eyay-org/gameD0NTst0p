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
            lines = f.readlines()
            
        # Parse and execute commands respecting DELIMITER
        current_delimiter = ';'
        buffer = []
        
        for line in lines:
            stripped = line.strip()
            
            # Handle DELIMITER command
            if stripped.upper().startswith('DELIMITER'):
                current_delimiter = stripped.split()[1]
                continue
                
            # Skip comments and empty lines if buffer is empty
            if not buffer and (not stripped or stripped.startswith('--')):
                continue
                
            buffer.append(line)
            
            # Check if command ends with current delimiter
            # We check the stripped line to handle trailing whitespace
            if stripped.endswith(current_delimiter):
                # Remove delimiter from the end
                command = ''.join(buffer).strip()
                
                # Handle the case where delimiter might be multi-char like //
                if command.endswith(current_delimiter):
                    command = command[:-len(current_delimiter)]
                
                if command.strip():
                    try:
                        cursor.execute(command)
                    except mysql.connector.Error as err:
                        print(f"Warning (Command skipped): {err}")
                        # print(f"Command: {command[:50]}...")
                
                buffer = []
        
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
