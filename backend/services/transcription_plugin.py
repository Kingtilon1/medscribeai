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
import subprocess
import datetime
from dotenv import load_dotenv
from openai import AzureOpenAI
from semantic_kernel.agents.strategies import TerminationStrategy, SequentialSelectionStrategy
import tempfile
import time
from services.database_plugin import DatabasePlugin  

load_dotenv()



class TranscriptionPlugin:
    def __init__(self):
        # Initialize connection to your speech-to-text model
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
        self.deployment_name = os.getenv("AZURE_OPENAI_TRANSCRIPTION_DEPLOYMENT_NAME", "gpt-4o-mini-transcribe")
        whisper_key      = os.getenv("AZURE_OPENAI_API_KEY")
        whisper_endpoint = os.getenv("AZURE_OPENAI_WHISPER_ENDPOINT")
        whisper_version  = os.getenv("AZURE_OPENAI_WHISPER_API_VERSION")
        whisper_deploy   = os.getenv("AZURE_OPENAI_WHISPER_DEPLOYMENT")
        # Initialize the client
        self.client = AzureOpenAI(
            azure_endpoint=endpoint,
            api_version=api_version,
            api_key=api_key
        )
        
        self.whisper_client = AzureOpenAI(
            azure_endpoint=whisper_endpoint,
            api_version=whisper_version,
            api_key=whisper_key
        )
        self.whisper_deployment = whisper_deploy
    
            
    def _convert_to_pcm_wav(self, input_path: str) -> str:
        """
        Convert any audio file into 16kHz, 16-bit, mono PCM WAV.
        """
        base, _ = os.path.splitext(input_path)
        out_path = f"{base}_pcm16k_mono.wav"
        subprocess.run([
            "ffmpeg", "-y",
            "-i", input_path,
            "-ac", "1",        # mono
            "-ar", "16000",    # 16 kHz
            "-sample_fmt", "s16",
            out_path
        ], check=True)
        return out_path
    
    @kernel_function( name="transcribe_file", description="Transcribes an audio file via Whisper")
    async def listen_and_transcribe(self, audio_path: str) -> str:
        """
        1. Normalize audio to PCM WAV  
        2. Send to your Whisper deployment for transcription  
        """
        print("🎤 listen_and_transcribe() called.")

        # 1) convert to the exact format Whisper expects
        pcm_path = self._convert_to_pcm_wav(audio_path)

        # 2) invoke Azure OpenAI Whisper
        try:
            with open(pcm_path, "rb") as f:
                result =  self.whisper_client.audio.transcriptions.create(
                    file=f,
                    model=self.whisper_deployment,
                    response_format="text"
                )
            return result

        except subprocess.CalledProcessError as conv_err:
            print(f"Audio conversion failed: {conv_err}")
            raise

        except Exception as e:
            print(f"Whisper transcription error: {e}")
            raise
            

