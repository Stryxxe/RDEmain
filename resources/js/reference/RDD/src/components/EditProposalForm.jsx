import React, { useState } from 'react';
import PDFViewer from './PDFViewer';

const EditProposalForm = ({ proposal, onBack, onSave }) => {
  const [formData, setFormData] = useState({
    researchAgenda: [],
    dost6Ps: [],
    sdg: [],
    budget: '',
    updatedForm: null
  });

  const [expandedSections, setExpandedSections] = useState({
    researchAgenda: false,
    dost6Ps: false,
    sdg: false,
    budget: false,
    upload: false
  });

  const researchAgendaOptions = [
    'Agriculture, Aquatic, and Agro-Forestry',
    'Business and Trade',
    'Social Sciences and Education',
    'Engineering and Technology',
    'Environment and Natural Resources',
    'Health and Wellness',
    'Peace and Security'
  ];

  const dost6PsOptions = [
    'Publication',
    'Patent',
    'Product',
    'People Services',
    'Places and Partnership',
    'Policies'
  ];

  const sdgOptions = [
    'No Poverty',
    'Zero Hunger',
    'Good Health and Well-Being',
    'Quality Education',
    'Gender Equality',
    'Clean Water and Sanitation',
    'Affordable and Clean Energy',
    'Decent Work and Economic Growth',
    'Industry, Innovation and Infrastructure',
    'Reduced Inequalities',
    'Sustainable Cities and Communities',
    'Responsible Consumption and Production',
    'Climate Action',
    'Life Below Water',
    'Life on Land',
    'Peace, Justice and Strong Institutions',
    'Partnership for the Goals'
  ];

  const handleCheckboxChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleBudgetChange = (e) => {
    setFormData(prev => ({
      ...prev,
      budget: e.target.value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        updatedForm: file
      }));
    }
  };

  // Path to PDF files in the public folder
  const pdfPath = '/Balbuena_Concept+Paper.pdf';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <button
              onClick={onBack}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Details</span>
            </button>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Edit Proposal</h1>
              <p className="text-gray-600 text-lg">{proposal.title}</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Main Content - Full Width Layout */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          {/* Left Side - Checklist */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-8">
                {/* Research Agenda Section */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('researchAgenda')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-lg transition-all duration-200 border border-blue-200"
                  >
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Research Agenda</h2>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedSections.researchAgenda ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSections.researchAgenda && (
                    <div className="space-y-3 pl-4">
                      <p className="text-gray-600 text-sm">Select the RDE Agenda that aligns best with your study</p>
                      
                      <div className="space-y-2">
                        {researchAgendaOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.researchAgenda.includes(option)}
                              onChange={() => handleCheckboxChange('researchAgenda', option)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* DOST 6P's Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => toggleSection('dost6Ps')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-lg transition-all duration-200 border border-green-200"
                  >
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-800">DOST 6P's</h2>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedSections.dost6Ps ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSections.dost6Ps && (
                    <div className="space-y-3 pl-4">
                      <p className="text-gray-600 text-sm">Select the most applicable category from the DOST 6Ps that best aligns with your study</p>
                      
                      <div className="space-y-2">
                        {dost6PsOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.dost6Ps.includes(option)}
                              onChange={() => handleCheckboxChange('dost6Ps', option)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sustainable Development Goal Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => toggleSection('sdg')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-lg transition-all duration-200 border border-purple-200"
                  >
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Sustainable Development Goal</h2>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedSections.sdg ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSections.sdg && (
                    <div className="space-y-3 pl-4">
                      <p className="text-gray-600 text-sm">Select the Sustainable Development Goal (SDG) that best align with the focus of your study</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sdgOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={formData.sdg.includes(option)}
                              onChange={() => handleCheckboxChange('sdg', option)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Budget Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => toggleSection('budget')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 rounded-lg transition-all duration-200 border border-yellow-200"
                  >
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Budget</h2>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedSections.budget ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSections.budget && (
                    <div className="space-y-3 pl-4">
                      <p className="text-gray-600 text-sm">Enter the proposed budget for this project</p>
                      
                      <div className="space-y-2">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₱</span>
                          <input
                            type="number"
                            value={formData.budget}
                            onChange={handleBudgetChange}
                            placeholder="0.00"
                            className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Updated Form Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => toggleSection('upload')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 rounded-lg transition-all duration-200 border border-red-200"
                  >
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Upload Updated Form</h2>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${expandedSections.upload ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedSections.upload && (
                    <div className="space-y-3 pl-4">
                      <p className="text-gray-600 text-sm">Upload the updated proposal form or any additional documents</p>
                      
                      <div className="space-y-2">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                              </p>
                              <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                            </div>
                          </label>
                        </div>
                        
                        {formData.updatedForm && (
                          <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-green-700">{formData.updatedForm.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - PDF Viewer */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800">Proposal Document</h3>
                <p className="text-sm text-gray-600">Review and reference the original proposal while editing</p>
              </div>
              <div className="h-[800px] min-h-[800px]">
                <PDFViewer pdfPath={pdfPath} title="Proposal Document" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProposalForm;
