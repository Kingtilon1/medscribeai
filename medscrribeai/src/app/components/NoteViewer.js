// components/NoteViewer.jsx
'use client';
import { useState } from 'react';

export default function NoteViewer({ note, visitId }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    
    try {
      // You could implement saving to database here
      // For now, just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">SOAP Note</h2>
        <div>
          {saved ? (
            <span className="text-green-500 mr-2">Saved</span>
          ) : (
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Subjective</h3>
          <div className="bg-gray-50 p-3 rounded border">{note.subjective || 'No subjective data'}</div>
        </div>
        
        <div>
          <h3 className="font-semibold">Objective</h3>
          <div className="bg-gray-50 p-3 rounded border">{note.objective || 'No objective data'}</div>
        </div>
        
        <div>
          <h3 className="font-semibold">Assessment</h3>
          <div className="bg-gray-50 p-3 rounded border">{note.assessment || 'No assessment data'}</div>
        </div>
        
        <div>
          <h3 className="font-semibold">Plan</h3>
          <div className="bg-gray-50 p-3 rounded border">{note.plan || 'No plan data'}</div>
        </div>
      </div>
    </div>
  );
}