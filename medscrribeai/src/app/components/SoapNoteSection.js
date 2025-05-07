'use client'
export function SoapNoteSection({ 
    content, 
    isEditing, 
    setIsEditing, 
    editableSoapNote, 
    setEditableSoapNote, 
    saveEditedSoapNote, 
    isSaving 
  }) {
    // Return either editable or read-only version based on mode
    const renderSoapNote = () => {
      // If not editing, extract SOAP sections using regex
      let subjective = "", objective = "", assessment = "", plan = "";
      
      if (!isEditing) {
        // Extract SOAP sections using regex
        const subjectiveMatch = content.match(/\*\*Subjective:\*\*(.*?)(?=\*\*|$)/s);
        const objectiveMatch = content.match(/\*\*Objective:\*\*(.*?)(?=\*\*|$)/s);
        const assessmentMatch = content.match(/\*\*Assessment:\*\*(.*?)(?=\*\*|$)/s);
        const planMatch = content.match(/\*\*Plan:\*\*(.*?)(?=\*\*|$)/s);
        
        subjective = subjectiveMatch ? subjectiveMatch[1].trim() : "";
        objective = objectiveMatch ? objectiveMatch[1].trim() : "";
        assessment = assessmentMatch ? assessmentMatch[1].trim() : "";
        plan = planMatch ? planMatch[1].trim() : "";
      }
    
      return (
        <div className="space-y-4">
          {/* Subjective Section */}
          <div className="border rounded-md p-4 bg-blue-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-blue-800">Subjective</h3>
              {isEditing && <span className="text-xs text-blue-600">Patient's reported symptoms and history</span>}
            </div>
            {isEditing ? (
              <textarea
                className="mt-2 w-full p-2 border border-blue-200 rounded bg-white"
                rows={4}
                value={editableSoapNote.subjective}
                onChange={(e) => setEditableSoapNote({...editableSoapNote, subjective: e.target.value})}
                placeholder="Enter patient-reported symptoms and history"
              />
            ) : (
              <p className="mt-2">{subjective || "No subjective information provided."}</p>
            )}
          </div>
  
          {/* Objective Section */}
          <div className="border rounded-md p-4 bg-green-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-green-800">Objective</h3>
              {isEditing && <span className="text-xs text-green-600">Examination findings, vital signs, measurements</span>}
            </div>
            {isEditing ? (
              <textarea
                className="mt-2 w-full p-2 border border-green-200 rounded bg-white"
                rows={4}
                value={editableSoapNote.objective}
                onChange={(e) => setEditableSoapNote({...editableSoapNote, objective: e.target.value})}
                placeholder="Enter examination findings, vital signs, measurements"
              />
            ) : (
              <p className="mt-2">{objective || "No objective information provided."}</p>
            )}
          </div>
  
          {/* Assessment Section */}
          <div className="border rounded-md p-4 bg-purple-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-purple-800">Assessment</h3>
              {isEditing && <span className="text-xs text-purple-600">Diagnosis or clinical impression</span>}
            </div>
            {isEditing ? (
              <textarea
                className="mt-2 w-full p-2 border border-purple-200 rounded bg-white"
                rows={3}
                value={editableSoapNote.assessment}
                onChange={(e) => setEditableSoapNote({...editableSoapNote, assessment: e.target.value})}
                placeholder="Enter diagnosis or clinical impression"
              />
            ) : (
              <p className="mt-2">{assessment || "No assessment provided."}</p>
            )}
          </div>
  
          {/* Plan Section */}
          <div className="border rounded-md p-4 bg-amber-50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-amber-800">Plan</h3>
              {isEditing && <span className="text-xs text-amber-600">Treatment plan, medications, follow-up</span>}
            </div>
            {isEditing ? (
              <textarea
                className="mt-2 w-full p-2 border border-amber-200 rounded bg-white"
                rows={4}
                value={editableSoapNote.plan}
                onChange={(e) => setEditableSoapNote({...editableSoapNote, plan: e.target.value})}
                placeholder="Enter treatment plan, medications, follow-up instructions"
              />
            ) : (
              <p className="mt-2">{plan || "No plan provided."}</p>
            )}
          </div>
        </div>
      );
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">SOAP Note</h2>
          <div>
            {isEditing ? (
              <div className="space-x-2">
                <button
                  onClick={saveEditedSoapNote}
                  disabled={isSaving}
                  className={`bg-green-500 hover:bg-green-700 text-white px-3 py-1 rounded ${
                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 hover:bg-gray-700 text-white px-3 py-1 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Edit Note
              </button>
            )}
          </div>
        </div>
        {renderSoapNote()}
      </div>
    );
  }