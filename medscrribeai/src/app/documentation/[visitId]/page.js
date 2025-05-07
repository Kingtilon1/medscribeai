'use client'
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createDocumentationSession, processDocumentation } from "../../lib/api";
import { RecordingSection } from "../../components/RecordingSection";
import { ResultsSection } from "../../components/ResultsSection";

export default function DocumentationPage() {
  const params = useParams();
  const visitId = params.visitId;
  const router = useRouter();
  const API_BASE_URL = 'http://localhost:8000/api';

  const [threadId, setThreadId] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [responses, setResponses] = useState([]);
  const [step, setStep] = useState("init"); // init, ready, recording, transcribing, complete, error
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDocumentationExists, setIsDocumentationExists] = useState(false);
  
  // State variables for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editableSoapNote, setEditableSoapNote] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

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
      
      // First, check if documentation already exists for this visit
      try {
        const response = await fetch(`${API_BASE_URL}/visits/${visitId}`);
        if (response.ok) {
          const visitData = await response.json();
          
          // If the visit status is "Completed", assume documentation exists
          if (visitData.Status === "Completed") {
            await loadExistingDocumentation(visitId);
            return; // Skip the rest of initialization if documentation exists
          }
        }
      } catch (error) {
        console.error("Error checking visit status:", error);
        // Continue with initialization if there's an error checking status
      }
      
      // Regular initialization process if no documentation exists
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

  const loadExistingDocumentation = async (visitId) => {
    try {
      // Fetch transcript
      const transcriptResponse = await fetch(`${API_BASE_URL}/documentation/transcript/${visitId}`);
      
      // Fetch SOAP note
      const soapResponse = await fetch(`${API_BASE_URL}/documentation/soap/${visitId}`);
      
      if (transcriptResponse.ok || soapResponse.ok) {
        let transcriptData = null;
        let soapData = null;
        
        if (transcriptResponse.ok) {
          transcriptData = await transcriptResponse.json();
        }
        
        if (soapResponse.ok) {
          soapData = await soapResponse.json();
          
          // Initialize the editable state with loaded values
          setEditableSoapNote({
            subjective: soapData.Subjective || "",
            objective: soapData.Objective || "",
            assessment: soapData.Assessment || "",
            plan: soapData.Plan || ""
          });
        }
        
        // Create mock responses to match the format your component expects
        const mockResponses = [];
        
        if (transcriptData && transcriptData.TranscriptText) {
          mockResponses.push({
            agent: "TranscriptionAgent",
            content: transcriptData.TranscriptText
          });
        }
        
        if (soapData) {
          // Format the SOAP note to match DocumentationAgent response format
          const soapContent = `**Subjective:**\n${soapData.Subjective || ''}\n\n` +
                             `**Objective:**\n${soapData.Objective || ''}\n\n` +
                             `**Assessment:**\n${soapData.Assessment || ''}\n\n` +
                             `**Plan:**\n${soapData.Plan || ''}`;
          
          mockResponses.push({
            agent: "DocumentationAgent",
            content: soapContent
          });
        }
        
        // Add a mock verification response for completeness
        mockResponses.push({
          agent: "VerificationAgent",
          content: "Documentation previously verified and saved. Complete."
        });
        
        setResponses(mockResponses);
        setIsDocumentationExists(true);
        setStep("complete");
      } else {
        // No existing documentation found, proceed to recording interface
        const { thread_id } = await createDocumentationSession(visitId);
        setThreadId(thread_id);
        setStep("ready");
      }
    } catch (error) {
      console.error("Error loading existing documentation:", error);
      // Fallback to recording interface
      const { thread_id } = await createDocumentationSession(visitId);
      setThreadId(thread_id);
      setStep("ready");
    }
  };

  const saveDocumentation = async () => {
    try {
      setIsSaving(true);
      
      // Get responses from agents
      console.log("All responses:", responses);
      
      const transcriptResponse = responses.find((r) => r.agent === "TranscriptionAgent");
      const documentationResponse = responses.find((r) => r.agent === "DocumentationAgent");
      
      console.log("Transcript response:", transcriptResponse);
      console.log("Documentation response:", documentationResponse);
      
      if (!transcriptResponse) {
        throw new Error("Missing transcript data");
      }
      
      // Save transcript to database - ensure content exists
      const transcriptContent = transcriptResponse.content || "No transcript available";
      const transcriptFormData = new FormData();
      transcriptFormData.append("visit_id", visitId);
      transcriptFormData.append("transcript_text", transcriptContent);
      
      // For SOAP note - create default values
      let subjective = "No subjective data available";
      let objective = "No objective data available";
      let assessment = "No assessment available";
      let plan = "No plan available";
      
      // Extract SOAP data if documentation response exists
      if (documentationResponse && documentationResponse.content) {
        const content = documentationResponse.content;
        
        const subjectiveMatch = content.match(/\*\*Subjective:\*\*(.*?)(?=\*\*Objective:|$)/s);
        const objectiveMatch = content.match(/\*\*Objective:\*\*(.*?)(?=\*\*Assessment:|$)/s);
        const assessmentMatch = content.match(/\*\*Assessment:\*\*(.*?)(?=\*\*Plan:|$)/s);
        const planMatch = content.match(/\*\*Plan:\*\*(.*?)(?=$)/s);
        
        if (subjectiveMatch) subjective = subjectiveMatch[1].trim();
        if (objectiveMatch) objective = objectiveMatch[1].trim();
        if (assessmentMatch) assessment = assessmentMatch[1].trim();
        if (planMatch) plan = planMatch[1].trim();
      } else {
        // Create basic SOAP from transcript if documentation agent failed
        subjective = `Patient complaint from transcript: ${transcriptContent.substring(0, 500)}`;
      }
      
      // Save SOAP note to database
      const soapFormData = new FormData();
      soapFormData.append("visit_id", visitId);
      soapFormData.append("subjective", subjective);
      soapFormData.append("objective", objective);
      soapFormData.append("assessment", assessment);
      soapFormData.append("treatment_plan", plan);
      
      // Make API calls to save the data - with better error handling
      try {
        const transcriptResponse = await fetch(`${API_BASE_URL}/documentation/save-transcript`, {
          method: "POST",
          body: transcriptFormData,
        });
        
        if (!transcriptResponse.ok) {
          console.error("Transcript save failed:", await transcriptResponse.text());
          throw new Error(`Transcript save failed: ${transcriptResponse.status}`);
        }
        
        const soapResponse = await fetch(`${API_BASE_URL}/documentation/save-soap`, {
          method: "POST",
          body: soapFormData,
        });
        
        if (!soapResponse.ok) {
          console.error("SOAP note save failed:", await soapResponse.text());
          throw new Error(`SOAP note save failed: ${soapResponse.status}`);
        }
        
        // Update visit status
        const updateVisitFormData = new FormData();
        updateVisitFormData.append("status", "Completed");
        
        await fetch(`${API_BASE_URL}/visits/${visitId}/update-status`, {
          method: "POST",
          body: updateVisitFormData,
        });
        
        setSuccessMessage("Documentation saved successfully");
      } catch (fetchError) {
        console.error("API request error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error saving documentation:", error);
      setErrorMessage("Failed to save documentation: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditedSoapNote = async () => {
    try {
      setIsSaving(true);
      
      // Save SOAP note to database
      const soapFormData = new FormData();
      soapFormData.append("visit_id", visitId);
      soapFormData.append("subjective", editableSoapNote.subjective);
      soapFormData.append("objective", editableSoapNote.objective);
      soapFormData.append("assessment", editableSoapNote.assessment);
      soapFormData.append("treatment_plan", editableSoapNote.plan);
      
      const soapResponse = await fetch(`${API_BASE_URL}/documentation/save-soap`, {
        method: "POST",
        body: soapFormData,
      });
      
      if (!soapResponse.ok) {
        console.error("SOAP note save failed:", await soapResponse.text());
        throw new Error(`SOAP note save failed: ${soapResponse.status}`);
      }
      
      // Update responses array with new content
      const updatedResponses = [...responses];
      const docIndex = updatedResponses.findIndex(r => r.agent === "DocumentationAgent");
      
      if (docIndex >= 0) {
        // Format the updated SOAP note in the same format
        const updatedContent = `**Subjective:**\n${editableSoapNote.subjective}\n\n` +
                              `**Objective:**\n${editableSoapNote.objective}\n\n` +
                              `**Assessment:**\n${editableSoapNote.assessment}\n\n` +
                              `**Plan:**\n${editableSoapNote.plan}`;
        
        updatedResponses[docIndex].content = updatedContent;
        setResponses(updatedResponses);
      }
      
      setIsEditing(false);
      setSuccessMessage("Documentation updated successfully");
    } catch (error) {
      console.error("Error saving edited SOAP note:", error);
      setErrorMessage("Failed to save edited documentation: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Documentation - Visit #{visitId}
      </h1>

      {/* Loading state */}
      {step === "init" && (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Initializing documentation session...</p>
          </div>
        </div>
      )}

      {/* Error state */}
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

      {/* Recording section - shown when step is ready, recording, or transcribing */}
      {(step === "ready" || step === "recording" || step === "transcribing") && (
        <RecordingSection
          visitId={visitId}
          threadId={threadId}
          step={step}
          setStep={setStep}
          setAudioBlob={setAudioBlob}
          setResponses={setResponses}
          setError={setError}
          processDocumentation={processDocumentation}
        />
      )}

      {/* Results section - shown when step is complete */}
      <ResultsSection
        responses={responses}
        step={step}
        setStep={setStep}
        successMessage={successMessage}
        errorMessage={errorMessage}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editableSoapNote={editableSoapNote}
        setEditableSoapNote={setEditableSoapNote}
        saveEditedSoapNote={saveEditedSoapNote}
        saveDocumentation={saveDocumentation}
        isSaving={isSaving}
      />
    </div>
  );
}