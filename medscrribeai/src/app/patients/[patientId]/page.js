"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PatientPage() {
  const { patientId } = useParams();  // Get the patientId from URL params
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await fetch(`http://localhost:8000/api/patients/${patientId}`);
        const data = await res.json();
        setPatient(data);  // Store fetched patient data in state
      } catch (error) {
        console.error("Failed to fetch patient data:", error);
      }
    }
    
    fetchPatient();
  }, [patientId]);  // Re-run when patientId changes

  if (!patient) return <p>Loading...</p>;

  return (
    <div>
      <h1>{patient.FirstName} {patient.LastName}</h1>
      <p>DOB: {new Date(patient.DOB).toLocaleDateString()}</p>
      <p>Gender: {patient.Gender}</p>
      {/* Display other patient information */}
    </div>
  );
}
