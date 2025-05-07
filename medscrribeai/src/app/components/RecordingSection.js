'use client'
import { useState, useRef } from "react";

export function RecordingSection({ visitId, threadId, step, setStep, setAudioBlob, setResponses, setError, processDocumentation }) {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const startRecording = async () => {
    try {
      // Reset audio chunks
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create MediaRecorder with specific MIME type
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus", // More reliable than WAV in browsers
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Set up data handler
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Set up stop handler
      mediaRecorder.onstop = async () => {
        // Create blob from chunks
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm", // Match the MIME type from MediaRecorder
        });

        setAudioBlob(audioBlob);
        setStep("transcribing");

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process the recording
        await processRecording(audioBlob);
      };

      // Start recording - request data every 1 second
      mediaRecorder.start(1000);
      setRecording(true);
      setStep("recording");
    } catch (error) {
      console.error("Error starting recording:", error);
      setError(
        "Could not access microphone. Please ensure you have given permission."
      );
      setStep("error");
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const processRecording = async (blob) => {
    try {
      const formData = new FormData();
      formData.append("thread_id", threadId);
      formData.append("visit_id", visitId);
      formData.append("audio", blob, "recording.wav");

      const result = await processDocumentation(formData);
      console.log("Process result:", result);

      setResponses(result.responses);
      setStep("complete");
    } catch (error) {
      console.error("Failed to process recording:", error);
      setError("Failed to process recording. Please try again.");
      setStep("error");
    }
  };

  // Render different UI based on current step
  if (step === "ready") {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">
          Ready to record doctor-patient conversation for this visit.
        </p>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={startRecording}
        >
          Start Recording
        </button>
      </div>
    );
  }

  if (step === "recording") {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="inline-block animate-pulse bg-red-500 rounded-full w-4 h-4 mr-2"></div>
          <span className="font-bold">Recording...</span>
        </div>
        <p className="my-4">
          Recording the doctor-patient conversation. Press stop when finished.
        </p>
        <div className="flex justify-center">
          <button
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        </div>
      </div>
    );
  }

  if (step === "transcribing") {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="font-bold">AI Agents Working...</p>
          <p className="text-gray-600 mt-2">
            Our AI Agents are transcribing your recording and creating
            documentation. This may take a minute.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
