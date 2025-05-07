'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FileText, 
  Users, 
  Calendar, 
  Menu, 
  X, 
  Home,
  LogOut,
  User,
  Search
} from 'lucide-react';

export default function AppBar({ providerName = "Dr. Smith" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (path) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
    setSearchQuery('');
  };

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-md">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-white font-bold text-xl">MedDoc AI</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/" isActive={isActive('/')} icon={<Home size={18} />}>
                Home
              </NavLink>
              <NavLink href="/patients" isActive={isActive('/patients')} icon={<Users size={18} />}>
                Patients
              </NavLink>
              <NavLink href="/visits" isActive={isActive('/visits')} icon={<Calendar size={18} />}>
                Visits
              </NavLink>
              <NavLink href="/documentation" isActive={isActive('/documentation')} icon={<FileText size={18} />}>
                Documentation
              </NavLink>
            </div>
          </div>

          {/* Right side items: Search, User, Mobile menu button */}
          <div className="flex items-center">
            {/* Search Bar */}
            

            {/* User Menu */}
            <div className="hidden md:flex items-center border-l border-blue-500 ml-2 pl-4">
              <div className="bg-blue-700 rounded-full h-8 w-8 flex items-center justify-center mr-2">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium">{providerName}</span>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:ml-6 md:ml-0">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white sm:block md:hidden"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`sm:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <MobileNavLink href="/" isActive={isActive('/')} icon={<Home size={18} />}>
            Home
          </MobileNavLink>
          <MobileNavLink href="/patients" isActive={isActive('/patients')} icon={<Users size={18} />}>
            Patients
          </MobileNavLink>
          <MobileNavLink href="/visits" isActive={isActive('/visits')} icon={<Calendar size={18} />}>
            Visits
          </MobileNavLink>
          <MobileNavLink href="/documentation" isActive={isActive('/documentation')} icon={<FileText size={18} />}>
            Documentation
          </MobileNavLink>
          
          {/* Mobile search */}
          <div className="pt-4 pb-2">
            <form onSubmit={handleSearch} className="flex px-2">
              <input
                type="text"
                placeholder="Search patients..."
                className="bg-blue-700/30 text-white placeholder-blue-200 rounded-l-md py-2 px-4 flex-grow focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button 
                type="submit" 
                className="bg-blue-800 text-white rounded-r-md px-4"
              >
                <Search size={18} />
              </button>
            </form>
          </div>
          
          {/* Mobile user info */}
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="bg-blue-700 rounded-full h-10 w-10 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{providerName}</div>
                <div className="text-sm font-medium text-blue-200">Provider</div>
              </div>
            </div>
            <div className="mt-3 px-2">
              <button className="flex items-center px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700 w-full">
                <LogOut className="mr-3 h-5 w-5 text-blue-200" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Desktop Navigation Link
function NavLink({ href, isActive, children, icon }) {
  return (
    <Link 
      href={href}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
        isActive 
          ? 'border-white text-white' 
          : 'border-transparent text-blue-100 hover:border-blue-300 hover:text-white'
      }`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Link>
  );
}

// Mobile Navigation Link
function MobileNavLink({ href, isActive, children, icon }) {
  return (
    <Link
      href={href}
      className={`${
        isActive 
          ? 'bg-blue-800 text-white' 
          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
      } flex items-center px-3 py-2 rounded-md text-base font-medium`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </Link>
  );
}