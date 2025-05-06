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