'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Assuming you'll add this function to your route.js file
// If the import path is different, you'll need to adjust it
const API_BASE_URL = 'http://localhost:8000/api';

async function fetchVisit(visitId) {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch visit: ${response.statusText}`);
  }
  return await response.json();
}

export default function VisitDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.visitId;
  
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVisitDetails = async () => {
      try {
        const visitData = await fetchVisit(visitId);
        setVisit(visitData);
      } catch (error) {
        console.error('Error fetching visit details:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (visitId) {
      fetchVisitDetails();
    }
  }, [visitId]);

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <p className="mt-2">
            <button 
              onClick={() => router.back()} 
              className="underline"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Visit not found.</p>
          <p className="mt-2">
            <Link href="/visits" className="underline">
              Return to visits
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visit Details</h1>
        <Link href="/visits" className="text-blue-500 hover:underline">
          Back to Visits
        </Link>
      </div>

      {/* Visit Overview Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold mb-4">Visit Overview</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(visit.Status)}`}>
            {visit.Status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Visit ID</p>
            <p className="font-medium">{visit.VisitID}</p>
          </div>
          <div>
            <p className="text-gray-600">Date & Time</p>
            <p className="font-medium">{new Date(visit.VisitDate).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Visit Type</p>
            <p className="font-medium">{visit.VisitType}</p>
          </div>
          <div>
            <p className="text-gray-600">Reason</p>
            <p className="font-medium">{visit.Reason || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Patient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Patient Name</p>
            <p className="font-medium">{visit.FirstName} {visit.LastName}</p>
          </div>
          <div>
            <p className="text-gray-600">Patient ID</p>
            <p className="font-medium">{visit.PatientID}</p>
          </div>
          {/* For more detailed patient info, you might still want to fetch from patient endpoint */}
        </div>
      </div>

      {/* Provider Information Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Provider Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Provider ID</p>
            <p className="font-medium">{visit.ProviderID}</p>
          </div>
          {/* For provider name and specialty, you would need a separate API call */}
        </div>
      </div>

      {/* Documentation Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Documentation</h2>
        
        {visit.Status === 'Completed' ? (
          <div>
            <p className="text-green-600 mb-4">Visit documentation has been completed.</p>
            <div className="mt-4">
              <Link 
                href={`/documentation/${visitId}`}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                View Documentation
              </Link>
            </div>
          </div>
        ) : visit.Status === 'In Progress' ? (
          <div>
            <p className="text-yellow-600 mb-4">Documentation is in progress.</p>
            <div className="mt-4">
              <Link 
                href={`/documentation/${visitId}`}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Continue Documentation
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">No documentation has been started for this visit.</p>
            <div className="mt-4">
              <Link 
                href={`/documentation/${visitId}`}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Start Documentation
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <button 
          onClick={() => router.back()} 
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back
        </button>
        
        <div className="space-x-4">
          <Link 
            href={`/visits/${visitId}/edit`}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Edit Visit
          </Link>
          {visit.Status !== 'Completed' && visit.Status !== 'Canceled' && (
            <button 
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                // Implement status update logic
                alert('Status update functionality would go here');
              }}
            >
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}