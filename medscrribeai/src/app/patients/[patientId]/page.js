"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PatientPage() {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPatient() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:8000/api/patients/${patientId}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch patient: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Patient data:', data);
        setPatient(data);
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md shadow-sm">
        <p>Patient information not found</p>
      </div>
    );
  }

  // Format date properly
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with patient name */}
        <div className="bg-gradient-to-r from-blue-500 to-teal-400 px-6 py-4">
          <div className="flex items-center">
            <div className="bg-white rounded-full p-3 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{patient.FirstName} {patient.LastName}</h1>
              <p className="text-blue-100">Patient ID: {patient.PatientID}</p>
            </div>
          </div>
        </div>

        {/* Patient information sections */}
        <div className="p-6">
          {/* Personal Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(patient.DOB)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{patient.Gender || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{patient.Email || "Not provided"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{patient.Phone ? formatPhoneNumber(patient.Phone) : "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Address</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="font-medium">{patient.Address || "No address on file"}</p>
            </div>
          </div>

          {/* Insurance Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Insurance Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Insurance Provider</p>
                <p className="font-medium">{patient.InsuranceProvider || "Not specified"}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Insurance Number</p>
                <p className="font-medium">{patient.InsuranceNumber || "Not specified"}</p>
              </div>
            </div>
          </div>

          {/* Record Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Record Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Created Date</p>
                <p className="font-medium">{formatDate(patient.CreatedDate)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(patient.UpdatedDate)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format phone numbers
function formatPhoneNumber(phoneNumberString) {
  const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phoneNumberString;
}