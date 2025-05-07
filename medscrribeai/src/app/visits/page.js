'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchAllVisits } from '../api/documentation/route';

export default function Visits() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadVisits = async () => {
      try {
        const data = await fetchAllVisits();
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
        <h1 className="text-2xl font-bold">All Visits</h1>
        <Link href="/visits/new" className="bg-blue-500 text-white px-4 py-2 rounded">
          New Visit
        </Link>
      </div>
      
      {visits.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="mb-4">No visits found.</p>
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
                <br />
                <span className={`inline-block px-2 py-1 mt-1 text-xs font-medium rounded ${
                  visit.Status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                  visit.Status === 'Completed' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {visit.Status}
                </span>
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