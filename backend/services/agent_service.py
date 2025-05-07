from .transcription_plugin import TranscriptionPlugin
from .database_plugin import DatabasePlugin
import asyncio
from azure.identity.aio import DefaultAzureCredential
from semantic_kernel.agents import AzureAIAgent, AzureAIAgentSettings, AzureAIAgentThread, AgentGroupChat
from semantic_kernel.functions import kernel_function
from strategies.medical import MedicalSelectionStrategy, MedicalTerminationStrategy


class AgentService:
    _instance  = None

    @classmethod
    async def get_instance(cls):
        if cls._instance is None:
            cls._instance = AgentService()
            await cls._instance.initialize()
        return cls._instance
    
    async def initialize(self):
        """Initialize the agents once during application startup"""
        self.ai_agent_settings = AzureAIAgentSettings()
        
        # Create connection to Azure AI service
        self.credential = DefaultAzureCredential()
        self.client =  AzureAIAgent.create_client(credential=self.credential)
        
        # Create agents (only once)
        print("Initializing agents...")
        await self._initialize_agents()
        print("Agents initialized successfully")
    
    async def _initialize_agents(self):
        """Create the agent definitions and instances once"""
        
        
        # transcirption agent
        self.transcription_agent_def = await self.client.agents.create_agent(
            model=self.ai_agent_settings.model_deployment_name,
            name="TranscriptionAgent",
            instructions="""You are a medical transcription specialist.
        Your job is to convert audio files of medical conversations into text.

        When you see a message containing an audio file path, you must call the transcribe_file function. Do not write out any transcript yourself.

        Use exactly this line—nothing else—to invoke it (replace <path> with the real file path):

        Edit
        {"name":"transcribe_file","arguments":{"audio_path":"<path>"}}
After that function returns, you may write follow-up clarification messages, tagging speakers as “Doctor” and “Patient.”
            """
        )
        await asyncio.sleep(1)
    
        # Documentation Agent
        self.documentation_agent_def = await self.client.agents.create_agent(
            model=self.ai_agent_settings.model_deployment_name,
            name="DocumentationAgent",
            instructions="""You are a clinical documentation assistant.
    Given a transcript of a doctor-patient conversation, generate a SOAP note in this format:
    
    **Subjective:**  
    (Patient-reported symptoms)
    
    **Objective:**  
    (Doctor observations, vitals)
    
    **Assessment:**  
    (Clinical diagnosis)
    
    **Plan:**  
    (Treatment plan or next steps)
    
    After creating the SOAP note, save it by calling the save_soap_note function with these parameters:
    - visit_id: The ID of the visit
    - subjective: The subjective section text
    - objective: The objective section text
    - assessment: The assessment section text
    - treatment_plan: The plan section text
            """
        )
        await asyncio.sleep(1)
        
        # verification agent
        self.verification_agent_def = await self.client.agents.create_agent(
            model=self.ai_agent_settings.model_deployment_name,
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
        await asyncio.sleep(1)
        
        
        self.transcription_plugin = TranscriptionPlugin()
        self.database_plugin = DatabasePlugin()
        
        self.transcription_agent = AzureAIAgent(
            client=self.client,
            definition=self.transcription_agent_def,
            plugins=[self.transcription_plugin]
        )
        
        self.documentation_agent = AzureAIAgent(
            client=self.client,
            definition=self.documentation_agent_def,
            plugins=[self.database_plugin]
        )
        
        self.verification_agent = AzureAIAgent(
            client=self.client,
            definition=self.verification_agent_def
        )
        
    async def create_documentation_session(self, visit_id):
        """Create a new thread for a documentation session"""
        thread = await self.client.agents.create_thread()
        return thread.id
    
    async def process_conversation(self, thread_id, visit_id, audio_file=None, transcript=None):
        """Process a doctor-patient conversation"""
        print(f"Starting agent conversation with audio_file: {audio_file}")
        print(f"AgentService - Starting conversation for thread_id: {thread_id}, visit_id: {visit_id}")
        print(f"AgentService - Audio: {audio_file}, Transcript: {transcript}")
        
        # Create agent group chat with existing agents (reusing them)
        chat = AgentGroupChat(
            agents=[self.transcription_agent, self.documentation_agent, self.verification_agent],
            selection_strategy=MedicalSelectionStrategy(),
            termination_strategy=MedicalTerminationStrategy()
        )
        
        # Add context message to thread with visit information
        message = f"Process documentation for visit ID {visit_id}."
        if audio_file:
            message += f" Record and transcribe the audio file: {audio_file}"
        elif transcript:
            message += f" Use the provided transcript: {transcript}"
        
        await chat.add_chat_message(message)
        
        # Process with retry for rate limiting
        responses = []
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"AgentService - Starting chat.invoke() (attempt {retry_count + 1})")
                async for response in chat.invoke():
                    print(f"AgentService - Got response from agent: {response.name}")
                    if response:
                        responses.append({
                            "agent": response.name,
                            "content": response.content
                        })
                        print(f"AgentService - Added response from {response.name}")
                break  # Success, exit the retry loop
            except Exception as e:
                retry_count += 1
                print(f"AgentService - Error in processing (attempt {retry_count}): {str(e)}")
                
                if "Rate limit is exceeded" in str(e):
                    # Parse the wait time from the error message
                    import re
                    wait_seconds = 3  # Default
                    match = re.search(r'Try again in (\d+) seconds', str(e))
                    if match:
                        wait_seconds = int(match.group(1))
                    
                    print(f"Rate limit exceeded. Waiting {wait_seconds} seconds before retry...")
                    await asyncio.sleep(wait_seconds + 5)  # Add a buffer
                elif retry_count >= max_retries:
                    print("Max retries reached. Giving up.")
                    break
                else:
                    # For other errors, use exponential backoff
                    wait_time = 2 ** retry_count
                    print(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
        
        print(f"AgentService - Total responses collected: {len(responses)}")
        return responses
        
        
    async def cleanup(self):
        """Clean up resources when application shuts down"""
        if hasattr(self.client, 'close') and callable(self.client.close):
            await self.client.close()
        elif hasattr(self.client, '__aexit__'):
            await self.client.__aexit__(None, None, None)
        
