import asyncio
from azure.identity.aio import DefaultAzureCredential
from semantic_kernel.agents import AzureAIAgent, AzureAIAgentSettings, AzureAIAgentThread, AgentGroupChat
from semantic_kernel.contents.utils.author_role import AuthorRole
from semantic_kernel.functions import kernel_function
from semantic_kernel.functions.kernel_arguments import KernelArguments
import pyaudio
import wave
import io
import os
import pyodbc
import datetime
from dotenv import load_dotenv
from openai import AzureOpenAI
from semantic_kernel.agents.strategies import TerminationStrategy, SequentialSelectionStrategy
import tempfile
import time

load_dotenv()


# creating plugins for transcription
class TranscriptionPlugin:
    def __init__(self):
        # Initialize connection to your speech-to-text model
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
        self.deployment_name = os.getenv("AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT_NAME", "gpt-4o-mini-transcribe")
        
        # Initialize the client
        self.client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_version=api_version,
            api_key=api_key
        )
    
    @kernel_function(name="listen_and_transcribe", description="Records live audio and transcribes it to text")
    async def listen_and_transcribe(self, duration_seconds: int = 30) -> str:
        """
        Records audio from microphone and transcribes it
        
        Args:
            duration_seconds: How long to record in seconds
            
        Returns:
            Transcribed text
        """
        print("🎤 listen_and_transcribe() was called.")

        # Record audio from microphone
        audio_data = self._record_audio(duration_seconds)
        
        # Save to a temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_path = temp_file.name
            with wave.open(temp_path, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(16000)
                wf.writeframes(audio_data)
        
        # Transcribe the temporary file
        try:
            with open(temp_path, "rb") as audio_file:
                response = self.client.audio.transcriptions.create(
                    file=audio_file,
                    model=self.deployment_name,
                    response_format="text"
                )
            return response
        finally:
            # Clean up temp file
            import os
            os.unlink(temp_path)
    
    def _record_audio(self, seconds):
        """Record audio from microphone for the specified duration"""
        p = pyaudio.PyAudio()
        stream = p.open(format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=1024)
        
        print("* Recording audio...")
        frames = []
        
        for i in range(0, int(16000 / 1024 * seconds)):
            data = stream.read(1024)
            frames.append(data)
        
        print("* Recording finished")
        
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        return b''.join(frames)

    
## a selection strategy for multi agent conversations
class MedicalSelectionStrategy(SequentialSelectionStrategy):
    """A strategy for determining which agent should take the next turn in the chat."""
    
    async def select_agent(self, agents, history):
        """Determine which agent should respond next based on the conversation flow."""
        if not history or history[-1].name not in [agent.name for agent in agents]:
            return next((agent for agent in agents if agent.name == "TranscriptionAgent"), None)

        print(f"History: {[msg.name for msg in history]}")

        last_agent = history[-1].name
        
        if last_agent == "TranscriptionAgent":
            # After transcription, documentation agent should format notes
            return next((agent for agent in agents if agent.name == "DocumentationAgent"), None)
        
        if last_agent == "DocumentationAgent":
            # After documentation, verification agent should check
            return next((agent for agent in agents if agent.name == "VerificationAgent"), None)
        
        # Default to documentation agent
        return next((agent for agent in agents if agent.name == "DocumentationAgent"), None)

# Define termination strategy with inheritance
class MedicalTerminationStrategy(TerminationStrategy):
    async def should_agent_terminate(self, agent, history):
        """Determine if the conversation should end."""
        if history and history[-1].name == "VerificationAgent":
            return "complete" in history[-1].content.lower()
        return False

class DatabasePlugin:
    def __init__(self):
        self.connection_string = os.getenv("AZURE_SQL_CONNECTION_STRING")

    @kernel_function(name="store_transcript", description="Saves the transcript in the database")
    async def save_transcript(self, visit_id: str, transcript_text: str ) -> str:
        try:
            conn = pyodbc.connect(self.connection_string)
            cursor = conn.cursor()
            
            query = """
            INSERT INTO Transcripts (VisitID, TranscriptionText, RecordedDate)
            VALUES (?, ?, ?);
            SELECT SCOPE_IDENTITY();
            """
            
            cursor.execute(query, (visit_id, transcript_text, datetime.datetime.now()))
            transcript_id = cursor.fetchone()[0]
            
            conn.commit()
            conn.close()
            
            return f"Transcription saved with ID: {transcript_id}"
        except Exception as e:
            return f"Error saving transcript: {str(e)}"
    
    @kernel_function(name="save_soap_notes", description='Saves a SOAP note to the database')
    async def save_soap_note(self, visit_id: str, subjective: str, objective: str, assessment: str, treatment_plan: str) -> str: 
        """Saves a SOAP note to the datyabase"""
        try:
            conn = pyodbc.connect(self.connection_string)
            cursor = conn.cursor()
            
            query = """
            INSERT INTO SOAPNotes (VisitID, Subjective, Objective, Assesment, Plan)
            VALUES (?, ?, ?, ?, ?);
            SELECT SCOPE_IDENTITY();
            """
            
            cursor.execute(query, (visit_id, subjective, objective, assessment, treatment_plan))
            note_id = cursor.fetchone()[0]
            
            conn.commit()
            conn.close()
            
            return f"SOAP note saved with ID: {note_id}"
        except Exception as e:
            return f"Error saving SOAP note: {str(e)}"
        

async def main() -> None:
    ai_agent_settings = AzureAIAgentSettings()
    database_plugin = DatabasePlugin()
    async with (
        DefaultAzureCredential() as creds,
        AzureAIAgent.create_client(credential=creds) as client,
    ):
       # 1. Transcription Agent
        transcription_agent_def = await client.agents.create_agent(
            model=ai_agent_settings.model_deployment_name,
            name="TranscriptionAgent",
             instructions="""You are a medical transcription specialist. 
            Your task is to accurately convert spoken medical conversations into text.
            When you receive any message, always call the listen_and_transcribe function to transcribe audio from the microphone.
            Do not say you cannot record audio. Just invoke the function directly with 30 seconds as the parameter.
            Identify speakers as 'Doctor' and 'Patient'.
            Maintain all relevant clinical information without omissions."""
        )
        time.sleep(3)

        # 2. Documentation Agent
        documentation_agent_def = await client.agents.create_agent(
            model=ai_agent_settings.model_deployment_name,
            name="DocumentationAgent",
            instructions="""You are a clinical documentation assistant. Given a transcript of a doctor-patient conversation, generate a SOAP note in this format:
            **Subjective:**  
            (Patient-reported symptoms)

            **Objective:**  
            (Doctor observations, vitals, etc.)

            **Assessment:**  
            (Clinical diagnosis)

            **Plan:**  
            (Treatment plan or next steps)

            Be concise and use professional medical language.
            After creating the SOAP note, save it to the database using the save_soap_note function.
            """
        )
        time.sleep(3)

        # 3. Verification Agent
        verification_agent_def = await client.agents.create_agent(
            model=ai_agent_settings.model_deployment_name,
            name="VerificationAgent",
            instructions="""You are a medical documentation reviewer.
            Your task is to verify the completeness and accuracy of SOAP notes.
            Check for:
            1. Missing information from the transcript
            2. Proper formatting in SOAP structure
            3. Consistent use of medical terminology
            4. Appropriate level of detail in each section
            If the documentation meets all criteria, conclude with 'Documentation complete.'
            If issues are found, identify them specifically then conclude with 'complete.'."""
        )
        time.sleep(3)
        
    
       # Create the agents with plugins
        transcription_agent = AzureAIAgent(
            client=client,
            definition=transcription_agent_def,
            plugins=[TranscriptionPlugin(), database_plugin]
        )
        
        documentation_agent = AzureAIAgent(
            client=client,
            definition=documentation_agent_def,
            plugins=[database_plugin]
        )
        
        verification_agent = AzureAIAgent(
            client=client,
            definition=verification_agent_def
        )
        
        # Create AgentGroupChat with all three agents
        chat = AgentGroupChat(
            agents=[transcription_agent, documentation_agent, verification_agent],
            selection_strategy=MedicalSelectionStrategy(),
            termination_strategy=MedicalTerminationStrategy()
        )
        
        thread = await client.agents.create_thread()

        try:
            visit_id = 1
            # Add initial message to trigger the workflow
            await chat.add_chat_message(
            f"Start transcription for visit ID {visit_id} by recording audio from the microphone for 30 seconds."
            )
            
            # Run the multi-agent conversation with the thread
            print("Starting medical documentation process...")
            async for response in chat.invoke():
                if response:
                    print(f"\n# {response.name}:\n{response.content}\n")
                    print("-" * 80)
                    await asyncio.sleep(1)
            
            print("\nDocumentation process complete.")
            
        finally:
            # Clean up all created agents and the thread
            print("Cleaning up resources...")
            await client.agents.delete_thread(thread.id)
            await client.agents.delete_agent(transcription_agent_def.id)
            await client.agents.delete_agent(documentation_agent_def.id)
            await client.agents.delete_agent(verification_agent_def.id)
            print("Cleanup complete.")



if __name__ == "__main__":
    asyncio.run(main())