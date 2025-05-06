'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchActiveVisits } from '../api/documentation/route';

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadVisits = async () => {
      try {
        // Default to provider ID 1 for demo
        const providerId = 1;
        const data = await fetchActiveVisits(providerId);
        setVisits(data);
      } catch (error) {
        console.error('Error loading visits:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadVisits();
  }, []);
  
  if (loading) {
    return <div className="text-center p-4">Loading visits...</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Visits</h1>
        <Link href="/visits/new" className="bg-blue-500 text-white px-4 py-2 rounded">
          New Visit
        </Link>
      </div>
      
      {visits.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="mb-4">No active visits found.</p>
          <Link href="/visits/new" className="text-blue-500 underline">
            Create a new visit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visits.map((visit) => (
            <div key={visit.VisitID} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-2">
                {visit.FirstName} {visit.LastName}
              </h2>
              <p className="text-gray-600 mb-4">
                Visit ID: {visit.VisitID}<br />
                Type: {visit.VisitType}<br />
                Date: {new Date(visit.VisitDate).toLocaleString()}
              </p>
              <div className="flex justify-between">
                <Link href={`/documentation/${visit.VisitID}`} className="text-blue-500 hover:underline">
                  Document Visit
                </Link>
                <Link href={`/visits/${visit.VisitID}`} className="text-green-500 hover:underline">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}