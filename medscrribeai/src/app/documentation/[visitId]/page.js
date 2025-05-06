"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  createDocumentationSession,
  processDocumentation,
} from "../../lib/api";

export default function DocumentationPage() {
  const params = useParams();
  const visitId = params.visitId;

  const [threadId, setThreadId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [responses, setResponses] = useState([]);
  const [step, setStep] = useState("init"); // init, ready, recording, transcribing, complete, error
  const [error, setError] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const API_BASE_URL = 'http://localhost:8000/api'
  // Initialize documentation session when component mounts
  useEffect(() => {
    if (visitId) {
      initializeSession();
    }
  }, [visitId]);

  const initializeSession = async () => {
    try {
      setStep("init");
      console.log("Initializing with visitId:", visitId);
      const { thread_id } = await createDocumentationSession(visitId);
      console.log("Got thread_id:", thread_id);
      setThreadId(thread_id);
      setStep("ready");
    } catch (error) {
      console.error("Failed to initialize session:", error);
      setError("Failed to initialize documentation session. Please try again.");
      setStep("error");
    }
  };

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
    setProcessing(true);

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
    } finally {
      setProcessing(false);
    }
  };

  const formatTranscript = (transcriptContent) => {
    if (!transcriptContent) return null;

    // This regex extracts speaker and text from markdown formatted text
    // It looks for patterns like "**Speaker:** Text"
    const regex = /\*\*(.*?):\*\*(.*?)(?=\*\*|$)/gs;
    const matches = [...transcriptContent.matchAll(regex)];

    if (matches.length === 0) {
      // Just return the content as is if no matches found
      return <p className="whitespace-pre-line">{transcriptContent}</p>;
    }

    // Add this to your DocumentationPage component

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b border-r text-left w-1/4">
                Speaker
              </th>
              <th className="py-2 px-4 border-b text-left">Dialogue</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => {
              const speaker = match[1].trim();
              const text = match[2].trim();
              return (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  <td className="py-2 px-4 border-b border-r font-medium">
                    {speaker}
                  </td>
                  <td className="py-2 px-4 border-b">{text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };


  const saveDocumentation = async () => {
    try {
      setIsSaving(true);

      // Get SOAP note and transcript from agent responses
      const transcriptionResponses = findAgentResponse("TranscriptionAgent");
      const documentationResponse = findAgentResponse("DocumentationAgent");
      console.log(responses)
      if (!transcriptionResponses || !documentationResponse) {
        throw new Error("Missing transcript or SOAP note data");
      }

      // Parse SOAP note into sections
      const subjectiveMatch = documentationResponse.content.match(
        /\*\*Subjective:\*\*(.*?)(?=\*\*Objective:|$)/s
      );
      const objectiveMatch = documentationResponse.content.match(
        /\*\*Objective:\*\*(.*?)(?=\*\*Assessment:|$)/s
      );
      const assessmentMatch = documentationResponse.content.match(
        /\*\*Assessment:\*\*(.*?)(?=\*\*Plan:|$)/s
      );
      const planMatch = documentationResponse.content.match(
        /\*\*Plan:\*\*(.*?)(?=$)/s
      );

      const subjective = subjectiveMatch ? subjectiveMatch[1].trim() : "";
      const objective = objectiveMatch ? objectiveMatch[1].trim() : "";
      const assessment = assessmentMatch ? assessmentMatch[1].trim() : "";
      const plan = planMatch ? planMatch[1].trim() : "";

      // Save transcript to database
      const transcriptFormData = new FormData();
      transcriptFormData.append("visit_id", visitId);
      transcriptFormData.append(
        "transcript_text",
        transcriptionResponses.content
      );

      // Save SOAP note to database
      const soapFormData = new FormData();
      soapFormData.append("visit_id", visitId);
      soapFormData.append("subjective", subjective);
      soapFormData.append("objective", objective);
      soapFormData.append("assessment", assessment);
      soapFormData.append("treatment_plan", plan);

      // Make API calls to save the data
      const [transcriptResponse, soapResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/documentation/save-transcript`, {
          method: "POST",
          body: transcriptFormData,
        }),
        fetch(`${API_BASE_URL}/documentation/save-soap`, {
          method: "POST",
          body: soapFormData,
        }),
      ]);

      if (!transcriptResponse.ok || !soapResponse.ok) {
        throw new Error("Failed to save documentation");
      }

      // Update visit status to 'Completed'
      const updateVisitFormData = new FormData();
      updateVisitFormData.append("visit_id", visitId);
      updateVisitFormData.append("status", "Completed");

      await fetch(`${API_BASE_URL}/visits/${visitId}/update-status`, {
        method: "POST",
        body: updateVisitFormData,
      });

      setIsSaved(true);
      setSuccessMessage("Documentation saved successfully");
    } catch (error) {
      console.error("Error saving documentation:", error);
      setErrorMessage("Failed to save documentation: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };
  // Format SOAP note with nice sections
  const formatSoapNote = (soapContent) => {
    if (!soapContent) return null;

    // Extract SOAP sections using regex
    const subjectiveMatch = soapContent.match(
      /\*\*Subjective:\*\*(.*?)(?=\*\*|$)/s
    );
    const objectiveMatch = soapContent.match(
      /\*\*Objective:\*\*(.*?)(?=\*\*|$)/s
    );
    const assessmentMatch = soapContent.match(
      /\*\*Assessment:\*\*(.*?)(?=\*\*|$)/s
    );
    const planMatch = soapContent.match(/\*\*Plan:\*\*(.*?)(?=\*\*|$)/s);

    const subjective = subjectiveMatch ? subjectiveMatch[1].trim() : "";
    const objective = objectiveMatch ? objectiveMatch[1].trim() : "";
    const assessment = assessmentMatch ? assessmentMatch[1].trim() : "";
    const plan = planMatch ? planMatch[1].trim() : "";

    return (
      <div className="space-y-4">
        <div className="border rounded-md p-4 bg-blue-50">
          <h3 className="font-bold text-blue-800">Subjective</h3>
          <p className="mt-2">
            {subjective || "No subjective information provided."}
          </p>
        </div>

        <div className="border rounded-md p-4 bg-green-50">
          <h3 className="font-bold text-green-800">Objective</h3>
          <p className="mt-2">
            {objective || "No objective information provided."}
          </p>
        </div>

        <div className="border rounded-md p-4 bg-purple-50">
          <h3 className="font-bold text-purple-800">Assessment</h3>
          <p className="mt-2">{assessment || "No assessment provided."}</p>
        </div>

        <div className="border rounded-md p-4 bg-amber-50">
          <h3 className="font-bold text-amber-800">Plan</h3>
          <p className="mt-2">{plan || "No plan provided."}</p>
        </div>
      </div>
    );
  };

  // Format verification results
  const formatVerification = (verificationContent) => {
    if (!verificationContent) return null;

    // Extract specific sections of the verification feedback if present
    const issuesMatch = verificationContent.match(/issues:(.*?)(?=\n\n|$)/is);
    const recommendationsMatch = verificationContent.match(
      /recommendations:(.*?)(?=\n\n|$)/is
    );

    return (
      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="font-bold text-gray-800 mb-2">Verification Results</h3>

        {verificationContent.includes("complete") ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-3">
            Documentation verified and complete
          </div>
        ) : (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded mb-3">
            Documentation requires attention
          </div>
        )}

        <div className="mt-2 whitespace-pre-line prose prose-sm max-w-none">
          {verificationContent}
        </div>
      </div>
    );
  };

  // Find responses by agent
  const findAgentResponse = (agentName) => {
    return responses.find((r) => r.agent === agentName);
  };

  // Rendering based on current step
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Documentation - Visit #{visitId}
      </h1>

      {/* Loading and Error states */}
      {step === "init" && (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Initializing documentation session...</p>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error || "An error occurred"}</p>
          <button
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
            onClick={initializeSession}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Ready to record */}
      {step === "ready" && (
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
      )}

      {/* Recording in progress */}
      {step === "recording" && (
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
              onClick={() => {
                // Simulate stopping with a blob for testing
                // In real implementation, this would get the actual recording
                const mockBlob = new Blob(["audio data"], {
                  type: "audio/wav",
                });
                stopRecording(mockBlob);
              }}
            >
              Stop Recording
            </button>
          </div>
        </div>
      )}

      {/* Transcribing/Processing */}
      {step === "transcribing" && (
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
      )}

      {/* Results display */}
      {step === "complete" && (
        <div className="space-y-8">
          {/* Transcription */}
          {findAgentResponse("TranscriptionAgent") && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Conversation Transcript
              </h2>
              {formatTranscript(
                findAgentResponse("TranscriptionAgent").content
              )}
            </div>
          )}

          {/* SOAP Note - if available */}
          {findAgentResponse("DocumentationAgent") && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">SOAP Note</h2>
              {formatSoapNote(findAgentResponse("DocumentationAgent").content)}
            </div>
          )}

          {/* Verification */}
          {findAgentResponse("VerificationAgent") && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Verification Results
              </h2>
              {formatVerification(
                findAgentResponse("VerificationAgent").content
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep("ready")}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Record New Conversation
            </button>

            <button
              onClick={saveDocumentation}
              disabled={isSaving}
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
                isSaving ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? "Saving…" : "Save Documentation"}
            </button>
            {successMessage && (
              <p className="text-green-600 mt-2">{successMessage}</p>
            )}
            {errorMessage && (
              <p className="text-red-600 mt-2">{errorMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
