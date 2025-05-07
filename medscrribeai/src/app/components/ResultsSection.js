'use client'
import {SoapNoteSection} from './SoapNoteSection'
export function ResultsSection({
  responses,
  step,
  setStep,
  successMessage,
  errorMessage,
  isEditing,
  setIsEditing,
  editableSoapNote,
  setEditableSoapNote,
  saveEditedSoapNote,
  saveDocumentation,
  isSaving
}) {
  // Find responses by agent
  const findAgentResponse = (agentName) => {
    return responses.find((r) => r.agent === agentName);
  };

  // Format transcript for display
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

  // Format verification results
  const formatVerification = (verificationContent) => {
    if (!verificationContent) return null;

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

  if (step !== 'complete') return null;

  return (
    <div className="space-y-8">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

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
        <SoapNoteSection 
          content={findAgentResponse("DocumentationAgent").content}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editableSoapNote={editableSoapNote}
          setEditableSoapNote={setEditableSoapNote}
          saveEditedSoapNote={saveEditedSoapNote}
          isSaving={isSaving}
        />
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

        {!isEditing && (
          <button
            onClick={saveDocumentation}
            disabled={isSaving}
            className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isSaving ? "Saving…" : "Save Documentation"}
          </button>
        )}
      </div>
    </div>
  );
}