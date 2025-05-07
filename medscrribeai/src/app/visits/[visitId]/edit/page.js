"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditVisitPage() {
  const params = useParams();
  const visitId = params.visitId;
  const router = useRouter();
  
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    patient_id: "",
    visit_date: "",
    visit_time: "",
    visit_type: "",
    reason: "",
    status: ""
  });

  useEffect(() => {
    // Fetch visit data when component mounts
    const fetchVisit = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/visits/${visitId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch visit: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        setVisit(data);
        
        // Initialize form data from visit
        const visitDate = data.VisitDate ? new Date(data.VisitDate).toISOString().split('T')[0] : "";
        const visitTime = data.VisitTime || "";
        
        setFormData({
          patient_id: data.PatientID || "",
          visit_date: visitDate,
          visit_time: visitTime,
          visit_type: data.VisitType || "",
          reason: data.Reason || "",
          status: data.Status || ""
        });
        
      } catch (err) {
        console.error("Error fetching visit:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVisit();
  }, [visitId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Create FormData object for the API request
      const apiFormData = new FormData();
      
      // Append all form values
      Object.entries(formData).forEach(([key, value]) => {
        apiFormData.append(key, value);
      });
      
      console.log("Submitting form data:", Object.fromEntries(apiFormData));
      
      // Make the API request - using POST to the /update endpoint
      const response = await fetch(`http://localhost:8000/api/visits/${visitId}/update`, {
        method: "POST",
        body: apiFormData,
      });
      
      // Get the response text for more detailed error information
      const responseText = await response.text();
      console.log("Response status:", response.status);
      console.log("Response text:", responseText);
      
      if (!response.ok) {
        throw new Error(`Failed to update visit (${response.status}): ${responseText}`);
      }
      
      setSuccess("Visit updated successfully");
      
      // Redirect back to visit details after a short delay
      setTimeout(() => {
        router.push(`/visits/${visitId}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error saving visit:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Visit #{visitId}</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSave} className="bg-white shadow-md rounded-lg p-6">
        <div className="space-y-4">
          {/* Patient ID field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="patient_id">
              Patient ID
            </label>
            <input
              id="patient_id"
              name="patient_id"
              type="text"
              value={formData.patient_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Visit Date field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="visit_date">
              Visit Date
            </label>
            <input
              id="visit_date"
              name="visit_date"
              type="date"
              value={formData.visit_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Visit Time field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="visit_time">
              Visit Time
            </label>
            <input
              id="visit_time"
              name="visit_time"
              type="time"
              value={formData.visit_time}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Visit Type field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="visit_type">
              Visit Type
            </label>
            <select
              id="visit_type"
              name="visit_type"
              value={formData.visit_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="Initial Consultation">Initial Consultation</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Emergency">Emergency</option>
              <option value="Routine Check-up">Routine Check-up</option>
              <option value="Specialist Referral">Specialist Referral</option>
            </select>
          </div>
          
          {/* Reason field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="reason">
              Reason for Visit
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          {/* Status field */}
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Checked In">Checked In</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}