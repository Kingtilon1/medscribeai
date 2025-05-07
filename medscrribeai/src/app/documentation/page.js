'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function DocumentationHomePage() {
  const [recentVisits, setRecentVisits] = useState([]);
  const [pendingDocumentation, setPendingDocumentation] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch recent visits that need documentation
    async function fetchVisitsData() {
      try {
        // Fetch recent visits (regardless of status)
        const recentRes = await fetch('http://localhost:8000/api/visits?limit=5');
        
        // Fetch visits with pending documentation (status = "In Progress")
        const pendingRes = await fetch('http://localhost:8000/api/visits?status=In%20Progress');
        
        if (!recentRes.ok || !pendingRes.ok) {
          throw new Error("Failed to fetch visits");
        }
        
        const recentData = await recentRes.json();
        const pendingData = await pendingRes.json();
        
        setRecentVisits(recentData);
        setPendingDocumentation(pendingData);
      } catch (error) {
        console.error("Error fetching visits:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchVisitsData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Documentation Center</h1>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Pending Documentation" 
          value={pendingDocumentation.length} 
          icon={<Clock className="h-8 w-8 text-yellow-500" />}
          color="bg-yellow-50 border-yellow-200"
        />
        <StatCard 
          title="Completed Today" 
          value="3" 
          icon={<CheckCircle className="h-8 w-8 text-green-500" />}
          color="bg-green-50 border-green-200"
        />
        <StatCard 
          title="Needs Review" 
          value="2" 
          icon={<AlertCircle className="h-8 w-8 text-red-500" />}
          color="bg-red-50 border-red-200"
        />
      </div>
      
      {/* Pending Documentation */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Pending Documentation</h2>
        {pendingDocumentation.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-gray-500">No pending documentation.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingDocumentation.map((visit) => (
                  <tr key={visit.VisitID} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{visit.FirstName} {visit.LastName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {visit.VisitType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(visit.VisitDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/documentation/${visit.VisitID}`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Document
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      
      {/* Recent Documentation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Visits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentVisits.map((visit) => (
            <div key={visit.VisitID} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{visit.FirstName} {visit.LastName}</h3>
                  <p className="text-sm text-gray-500">{visit.VisitType} - {new Date(visit.VisitDate).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  visit.Status === 'Completed' ? 'bg-green-100 text-green-800' : 
                  visit.Status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {visit.Status}
                </span>
              </div>
              <div className="mt-4 flex justify-end">
                <Link 
                  href={`/documentation/${visit.VisitID}`}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
                    visit.Status === 'Completed' 
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                      : 'text-white bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {visit.Status === 'Completed' ? 'View' : 'Document'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, color }) {
  return (
    <div className={`${color} border rounded-lg p-6 flex items-center`}>
      <div className="mr-4">
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}