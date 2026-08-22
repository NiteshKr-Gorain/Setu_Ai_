import React, { useState } from 'react';

const mockSchemes = [
  {
    id: 1,
    title: 'Indira Gandhi National Old Age Pension Scheme (IGNOAPS)',
    category: 'Pension & Financial Security',
    eligibility: 'BPL Seniors aged 60 years and above.',
    description: 'Provides monthly financial assistance directly to BPL senior citizens. ₹200-₹500/month depending on age tier.',
    documentsRequired: ['Aadhaar Card', 'BPL Ration Card', 'Bank Passbook', 'Age Proof Certificate'],
    officialUrl: 'https://nsap.nic.in/',
    applicationSteps: 'Submit form through Gram Panchayat or District Social Welfare Officer.'
  },
  {
    id: 2,
    title: 'Pradhan Mantri Vaya Vandana Yojana (PMVVY)',
    category: 'Investment & Pension',
    eligibility: 'Senior citizens aged 60 years and above (LIC managed).',
    description: 'Guaranteed pension scheme providing assured 7.4% per annum return for 10 years.',
    documentsRequired: ['Aadhaar Card', 'PAN Card', 'Address Proof', 'Cancelled Bank Cheque'],
    officialUrl: 'https://licindia.in/',
    applicationSteps: 'Apply online through LIC portal or visit any LIC branch.'
  },
  {
    id: 3,
    title: 'Ayushman Bharat - PM-JAY Senior Add-On',
    category: 'Healthcare & Insurance',
    eligibility: 'Seniors in SECC cataloged households.',
    description: 'Free secondary and tertiary healthcare hospitalization cover up to ₹5 Lakh per family per year.',
    documentsRequired: ['Ayushman Card', 'Aadhaar Card', 'Ration Card'],
    officialUrl: 'https://pmjay.gov.in/',
    applicationSteps: 'Visit nearest empanelled hospital or Common Service Centre (CSC).'
  },
  {
    id: 4,
    title: 'Senior Citizen Savings Scheme (SCSS)',
    category: 'High-Yield Savings',
    eligibility: 'Seniors aged 60+ (or 55+ for retired defense personnel).',
    description: 'Government-backed savings scheme with 8.2% annual interest paid quarterly and Section 80C tax benefits.',
    documentsRequired: ['PAN Card', 'Aadhaar Card', 'Passport size photos', 'Form A'],
    officialUrl: 'https://www.indiapost.gov.in/',
    applicationSteps: 'Open SCSS account at any authorized Post Office or public bank branch.'
  },
  {
    id: 5,
    title: 'Rashtriya Vayoshri Yojana (RVY)',
    category: 'Assistive Devices',
    eligibility: 'BPL seniors with age-related disabilities or physical infirmities.',
    description: 'Free distribution of physical aids and assisted-living devices like wheelchairs, walking sticks, hearing aids, and spectacles.',
    documentsRequired: ['BPL Certificate', 'Disability/Doctor Certificate', 'Aadhaar Card'],
    officialUrl: 'https://socialjustice.gov.in/',
    applicationSteps: 'Register at ALIMCO assessment camps organized by District Administration.'
  }
];

const schemeCategories = [
  'All',
  'Pension & Financial Security',
  'Healthcare & Insurance',
  'High-Yield Savings',
  'Assistive Devices',
  'Investment & Pension'
];

export default function GovernmentSchemesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeModalScheme, setActiveModalScheme] = useState(null);

  const filteredSchemes = mockSchemes.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-16 min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-8">

        {/* Intro Header */}
        <div className="text-left space-y-2 max-w-2xl">
          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wide">
            Verified Government Directory
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight pt-1">
            Senior Welfare &amp; Support Schemes
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Simplified directory of central and state welfare initiatives, pensions, healthcare coverage, and savings schemes for senior citizens.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 text-left shadow-xs space-y-5">
          <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100/50 transition-all duration-300">
            <span className="pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search schemes by name, pensions, healthcare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs focus:outline-none px-3 py-2 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="flex flex-wrap gap-1.5">
            {schemeCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-3xs'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredSchemes.map(scheme => (
            <div
              key={scheme.id}
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/40 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {scheme.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {scheme.title}
                </h3>
                <p className="text-xs text-slate-500 font-normal line-clamp-3 leading-relaxed">
                  {scheme.description}
                </p>
                <div className="pt-2 border-t border-slate-50 text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800">Eligibility: </span>
                  <span>{scheme.eligibility}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalScheme(scheme)}
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
              >
                View Documents &amp; Apply
              </button>
            </div>
          ))}
        </div>

      </div>

      {/* Scheme Detail Modal */}
      {activeModalScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 p-8 text-left space-y-6 overflow-y-auto max-h-[85vh] animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-wider">
                {activeModalScheme.category}
              </span>
              <button
                onClick={() => setActiveModalScheme(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">{activeModalScheme.title}</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">{activeModalScheme.description}</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">📄 Required Documents</h4>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1 font-medium">
                {activeModalScheme.documentsRequired.map((doc, idx) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">📌 How to Apply</h4>
              <p className="text-xs text-slate-600 font-medium">{activeModalScheme.applicationSteps}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <a
                href={activeModalScheme.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Official Portal ↗
              </a>
              <button
                onClick={() => setActiveModalScheme(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
