'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPatients } from '../api/documentation/route';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const data = await fetchPatients();
        setPatients(data);
      } catch (error) {
        console.error('Error loading patients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, []);
  
  if (loading) {
    return <div className="text-center p-4">Loading patients...</div>;
  }
  
  if (patients.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="mb-4">No patients found.</p>
        <Link href="/patients/new" className="text-blue-500 underline">
          Add a new patient
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {patients.map((patient) => (
            <tr key={patient.PatientID}>
              <td className="px-6 py-4 whitespace-nowrap">{patient.PatientID}</td>
              <td className="px-6 py-4 whitespace-nowrap">{patient.FirstName} {patient.LastName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(patient.DOB).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link href={`/patients/${patient.PatientID}`} className="text-blue-500 hover:underline mr-4">
                  View
                </Link>
                <Link href={`/visits/new?patientId=${patient.PatientID}`} className="text-green-500 hover:underline">
                  New Visit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}