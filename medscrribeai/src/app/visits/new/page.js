'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function NewVisitPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('patientId');
  
  const [allPatients, setAllPatients] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    visitType: 'routine',
    reasonForVisit: '',
    visitDate: new Date().toISOString().split('T')[0],
    status: 'Scheduled'
  });
  
  // Fetch all patients for dropdown if no patientId provided
  useEffect(() => {
    if (!patientId) {
      const fetchPatients = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/patients');
          if (!response.ok) throw new Error('Failed to fetch patients');
          const data = await response.json();
          setAllPatients(data.patients || []);
        } catch (error) {
          console.error('Error fetching patients:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPatients();
    } else {
        fetch(`http://localhost:8000/api/patients/${patientId}`)
      .then(res => res.json())
      .then(data => {
        setPatientName(`${data.FirstName} ${data.LastName}`);
      })
      .catch(err => console.error("Error fetching patient details:", err));
      setLoading(false);
    }
  }, [patientId]);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: formData.patientId,
          visit_type: formData.visitType,
          reason_for_visit: formData.reasonForVisit,
          visit_date: formData.visitDate,
          status: formData.status
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create visit');
      }
      
      const result = await response.json();
      if (result.visit_id) {
        router.push(`/documentation/${result.visit_id}`);
      } else {
        console.error("No visit ID received, redirecting to visits list");
        setError("Visit created but ID couldn't be retrieved. Check the Visits page.");
        setTimeout(() => {
          router.push("/visits");
        }, 3000);
      }
      
    } catch (error) {
      console.error('Error creating visit:', error);
      setError('Failed to create visit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Visit</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
          <label htmlFor="patientId" className="block text-sm font-medium mb-1">
            Patient
          </label>
          
          {patientId ? (
            /* If patientId provided, show read-only field */
            <input
              type="text"
              id="patientId"
              name="patientId"
              value={patientName || `Patient #${patientId}`} 
              readOnly
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm p-2 border"
            />
          ) : (
            /* Otherwise show dropdown */
            <select
              id="patientId"
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            >
              <option value="">Select a patient</option>
              {allPatients.map(patient => (
                <option key={patient.PatientID} value={patient.PatientID}>
                  {patient.FirstName} {patient.LastName}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div>
          <label htmlFor="visitType" className="block text-sm font-medium mb-1">
            Visit Type
          </label>
          <select
            id="visitType"
            name="visitType"
            value={formData.visitType}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          >
            <option value="routine">Routine Check-up</option>
            <option value="follow-up">Follow-up</option>
            <option value="emergency">Emergency</option>
            <option value="consultation">Consultation</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="reasonForVisit" className="block text-sm font-medium mb-1">
            Reason for Visit
          </label>
          <textarea
            id="reasonForVisit"
            name="reasonForVisit"
            value={formData.reasonForVisit}
            onChange={handleChange}
            required
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        
        <div>
          <label htmlFor="visitDate" className="block text-sm font-medium mb-1">
            Visit Date/Time
          </label>
          <input
            type="datetime-local"
            id="visitDate"
            name="visitDate"
            value={formData.visitDate}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
          />
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Visit...' : 'Create Visit'}
          </button>
        </div>
      </form>
    </div>
  );
}