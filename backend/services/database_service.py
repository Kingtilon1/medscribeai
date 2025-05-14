import aioodbc
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import datetime
import asyncio

class DatabaseService:
    _instance = None
    current_organization_id = 1

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DatabaseService()
            cls._instance.initialize()
        return cls._instance
    
    def set_organization_id(self, org_id):
        self.current_organization_id = org_id

    def initialize(self):

        """Initialize database connection pool"""
        load_dotenv()
        self.connection_string = (
        os.getenv('AZURE_SQL_CONNECTIONSTRING')
    )
        # In a production app, you would set up connection pooling here

    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        dsn = self.connection_string
        conn = await aioodbc.connect(dsn=dsn, autocommit=True)
        try:
            yield conn
        finally:
            await conn.close()

    async def get_all_patients(self) -> list[dict]:
        """Get all patients from the database"""
        async with self.get_connection() as conn:
            print("conn is:", type(conn))
            async with conn.cursor() as cursor:
                print("cursor is:", type(cursor))
                await cursor.execute("SELECT PatientID, FirstName, LastName, DOB FROM Patients")
                columns = [col[0] for col in cursor.description]
                rows = await cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]

    async def get_patient(self, patient_id):
        """Get patient information by ID"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = "SELECT * FROM Patients WHERE PatientID = ?"
                await cursor.execute(query, (patient_id,))
                result = await cursor.fetchone()
                if result:
                    return dict(zip([column[0] for column in cursor.description], result))
                return None
   
    async def update_visit(self, visit_id, patient_id, provider_id, visit_date, visit_type, status, reason):
        """Update a visit in the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                UPDATE Visits 
                SET PatientID = ?, 
                    ProviderID = ?,
                    VisitDate = ?, 
                    VisitType = ?, 
                    Status = ?, 
                    Reason = ?,
                    UpdatedDate = GETDATE()
                WHERE VisitID = ?
                """
                await cursor.execute(query, (
                    patient_id, 
                    provider_id,
                    visit_date, 
                    visit_type, 
                    status, 
                    reason,
                    visit_id
                ))
            
    async def get_provider(self, provider_id):
        """Get provider information by ID"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = "SELECT * FROM Providers WHERE ProviderID = ?"
                await cursor.execute(query, (provider_id,))
                result = await cursor.fetchone()
                if result:
                    return dict(zip([column[0] for column in cursor.description], result))
                return None

    async def get_active_visits(self, provider_id=None):
        """Get list of active visits (with optional provider filter)"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                if provider_id:
                    query = """
                    SELECT v.*, p.FirstName, p.LastName 
                    FROM Visits v JOIN Patients p ON v.PatientID = p.PatientID 
                    WHERE v.ProviderID = ? AND v.Status = 'In Progress'
                    """
                    await cursor.execute(query, (provider_id,))
                else:
                    query = """
                    SELECT v.*, p.FirstName, p.LastName 
                    FROM Visits v JOIN Patients p ON v.PatientID = p.PatientID 
                    WHERE v.Status = 'In Progress'
                    """
                    await cursor.execute(query)

                columns = [column[0] for column in cursor.description]
                rows = await cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
    async def get_all_visits(self):
        """Get all visits with patient information"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT v.*, p.FirstName, p.LastName 
                FROM Visits v JOIN Patients p ON v.PatientID = p.PatientID 
                ORDER BY v.VisitDate DESC
                """
                await cursor.execute(query)
                columns = [column[0] for column in cursor.description]
                rows = await cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
        
    async def get_visit(self, visit_id):
        """Get a single visit by ID, regardless of status"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT v.*, p.FirstName, p.LastName 
                FROM Visits v JOIN Patients p ON v.PatientID = p.PatientID 
                WHERE v.VisitID = ?
                """
                await cursor.execute(query, (visit_id,))
                result = await cursor.fetchone()
                
                if result:
                    return dict(zip([column[0] for column in cursor.description], result))
                return None
            
    async def create_visit(self, patient_id, provider_id, visit_date, visit_type, status, reason):
        """Create a new visit in the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                # First, execute the INSERT
                insert_query = """
                INSERT INTO Visits (PatientID, ProviderID, VisitDate, VisitType, Status, Reason,
                                CreatedDate, UpdatedDate)
                VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE());
                """
                await cursor.execute(insert_query, (patient_id, provider_id, visit_date, 
                                    visit_type, status, reason))
                
                # Then query for the most recently created visit for this patient
                get_id_query = """
                SELECT TOP 1 VisitID FROM Visits 
                WHERE PatientID = ? 
                ORDER BY CreatedDate DESC
                """
                await cursor.execute(get_id_query, (patient_id,))
                result = await cursor.fetchone()
                print(f"Query returned most recent visit ID: {result}")
                if result:
                    return result[0]
                else:
                    print("WARNING: Could not retrieve visit ID")
                    return None
    
    
    async def create_patient(self, first_name, last_name, dob, gender=None, address=None, phone=None, 
                        email=None, insurance_provider=None, insurance_number=None):
        """Create a new patient in the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                # First, execute only the INSERT statement
                insert_query = """
                INSERT INTO Patients (FirstName, LastName, DOB, Gender, Address, Phone, Email, 
                                InsuranceProvider, InsuranceNumber, CreatedDate, UpdatedDate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE());
                """
                await cursor.execute(insert_query, (first_name, last_name, dob, gender, address, phone, 
                                        email, insurance_provider, insurance_number))
                
                # Then, as a separate step, get the ID of the inserted record
                await cursor.execute("SELECT SCOPE_IDENTITY()")
                result = await cursor.fetchone()
                return result[0]


    async def get_transcript_for_visit(self, visit_id):
        """Get the most recent transcript for a specific visit"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT TOP 1 TranscriptID, VisitID, TranscriptText, RecordedDate
                FROM Transcripts
                WHERE VisitID = ?
                ORDER BY RecordedDate DESC
                """
                await cursor.execute(query, (visit_id,))
                result = await cursor.fetchone()
                
                if result:
                    columns = [column[0] for column in cursor.description]
                    return dict(zip(columns, result))
                return None

    async def get_soap_note_for_visit(self, visit_id):
        """Get the most recent SOAP note for a specific visit"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                SELECT TOP 1 NoteID, VisitID, Subjective, Objective, Assessment, Plans
                FROM SOAPNotes
                WHERE VisitID = ?
                ORDER BY CreatedDate DESC
                """
                await cursor.execute(query, (visit_id,))
                result = await cursor.fetchone()
                
                if result:
                    columns = [column[0] for column in cursor.description]
                    return dict(zip(columns, result))
                return None
        
    async def save_transcript(self, visit_id, transcript_text):
        """Save a transcript to the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                # First, execute the INSERT statement
                insert_query = """
                INSERT INTO Transcripts (VisitID, TranscriptText, RecordedDate)
                VALUES (?, ?, ?);
                """
                await cursor.execute(insert_query, (visit_id, transcript_text, datetime.datetime.now()))
                
                # Then, get the ID of the inserted record
                await cursor.execute("SELECT SCOPE_IDENTITY()")
                result = await cursor.fetchone()
                return result[0]  # Return the new transcript ID
    async def update_visit_status(self, visit_id, status):
        """Update visit status in the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                query = """
                UPDATE Visits 
                SET Status = ?, UpdatedDate = GETDATE()
                WHERE VisitID = ?
                """
                await cursor.execute(query, (status, visit_id))

    async def save_soap_note(self, visit_id, subjective, objective, assessment, treatment_plan):
        """Save a SOAP note to the database"""
        async with self.get_connection() as conn:
            async with conn.cursor() as cursor:
                # First, execute the INSERT statement
                insert_query = """
                INSERT INTO SOAPNotes (VisitID, Subjective, Objective, Assessment, Plans)
                VALUES (?, ?, ?, ?, ?);
                """
                await cursor.execute(insert_query, (visit_id, subjective, objective, assessment, treatment_plan))
                
                # Then, get the ID of the inserted record
                await cursor.execute("SELECT SCOPE_IDENTITY()")
                result = await cursor.fetchone()
                return result[0]  # Return the new note ID
