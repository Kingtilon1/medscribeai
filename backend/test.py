import pyodbc

conn_str = (
    "Driver={ODBC Driver 18 for SQL Server};"
    "Server=tcp:patientdatabase.database.windows.net,1433;"
    "Database=patientinfo;"
    "Uid=Kingtilon;"
    "Pwd=Kidace909!;"
    "Encrypt=yes;"
    "TrustServerCertificate=no;"
    "Connection Timeout=30;"
)

try:
    conn = pyodbc.connect(conn_str)
    print("Connection successful!")
    conn.close()
except Exception as e:
    print("Connection failed:")
    print(e)
