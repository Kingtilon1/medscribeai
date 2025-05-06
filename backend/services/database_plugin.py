from semantic_kernel.functions import kernel_function
from services.database_service import DatabaseService

class DatabasePlugin:
    def __init__(self):
        self.db_service = DatabaseService.get_instance()
    
    @kernel_function(description="Saves a transcript to the database")
    async def save_transcript(self, visit_id: str, transcript_text: str) -> str:
        """Saves a transcript to the database"""
        try:
            result = await self.db_service.save_transcript(visit_id, transcript_text)
            return f"Transcript saved successfully with ID: {result}"
        except Exception as e:
            return f"Error saving transcript: {str(e)}"
    
    @kernel_function(description="Saves a SOAP note to the database")
    async def save_soap_note(self, visit_id: str, subjective: str, objective: str, assessment: str, treatment_plan: str) -> str:
        """Saves a SOAP note to the database"""
        try:
            result = await self.db_service.save_soap_note(visit_id, subjective, objective, assessment, treatment_plan)
            return f"SOAP note saved successfully with ID: {result}"
        except Exception as e:
            return f"Error saving SOAP note: {str(e)}"