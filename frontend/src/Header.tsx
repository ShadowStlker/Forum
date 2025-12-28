import React from 'react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <header className="mb-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-lg p-8 border border-gray-700">
      <div className="flex items-center justify-between gap-6">
        {/* Left side: logo icons */}
        <div className="flex items-center gap-4">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="flex items-center gap-4">
            <svg className="w-24 h-16" viewBox="0 0 100 40" fill="none">
              <text x="10" y="32" fontSize="28" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">AI</text>
            </svg>
            <svg className="w-36 h-16" viewBox="0 0 150 40" fill="none">
              <text x="10" y="32" fontSize="28" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">Forum</text>
            </svg>
        </div>
          <div className="flex items-center gap-3">
            <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeWidth="2"/>
            </svg>
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
        {/* Right side: search */}
      </div>
    </header>
  );
};

export default Header;
