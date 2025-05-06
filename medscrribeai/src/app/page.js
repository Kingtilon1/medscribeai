'use client'
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Medical Documentation System</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/patients">
          <div className="bg-blue-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-bold mb-2">Patients</h2>
            <p>View and manage patient records</p>
          </div>
        </Link>
        
        <Link href="/visits">
          <div className="bg-green-100 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <h2 className="text-xl font-bold mb-2">Visits</h2>
            <p>Manage patient visits and appointments</p>
          </div>
        </Link>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/patients/new" className="bg-blue-500 text-white px-4 py-2 rounded">
            New Patient
          </Link>
          <Link href="/visits/new" className="bg-green-500 text-white px-4 py-2 rounded">
            New Visit
          </Link>
          <Link href="/documentation" className="bg-purple-500 text-white px-4 py-2 rounded">
            Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}