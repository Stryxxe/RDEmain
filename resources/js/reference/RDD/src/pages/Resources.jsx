import React, { useState, useCallback } from 'react';
import PDFViewer from '../components/PDFViewer';

// Document card component with improved design
const DocumentCard = ({ document, onDownload, onViewPDF }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden group h-full flex flex-col">
    <div className="p-6 flex-1 flex flex-col">
      <div className="flex items-start space-x-4">
        {/* Document icon */}
        <div className="flex-shrink-0">
          <div className="w-14 h-18 bg-gradient-to-br from-red-50 to-red-100 rounded-lg flex items-center justify-center group-hover:from-red-100 group-hover:to-red-200 transition-all duration-300 border border-red-200">
            <svg 
              className="w-8 h-8 text-red-600 transition-colors duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Document content */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onViewPDF(document)}
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg p-2 -m-2 group/button"
            aria-label={`View ${document.title}`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-red-700 group/button-hover:text-red-700 transition-colors duration-200 line-clamp-2">
              {document.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
              {document.description}
            </p>
          </button>
          
          {/* File info */}
          <div className="mb-4">
            <div className="text-sm text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">{document.fileName}</p>
              <p className="text-xs">{document.fileSize}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Download button - fixed at bottom */}
    <div className="px-6 pb-6 mt-auto">
      <button
        onClick={() => onDownload(document)}
        className="w-full bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
        aria-label={`Download ${document.fileName}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Download</span>
      </button>
    </div>
  </div>
);

// Main Resources Page component
const ResourcesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Sample documents data
  const documents = [
    {
      id: 1,
      title: 'Monitoring Minutes - Q1 2024',
      description: 'Comprehensive quarterly monitoring report covering key performance indicators and milestone achievements for the first quarter of 2024.',
      fileName: 'Monitoring-Minutes-Q1-2024.pdf',
      fileSize: '2.5 MB'
    },
    {
      id: 2,
      title: 'Monitoring Minutes - Q2 2024',
      description: 'Second quarter monitoring documentation with detailed analysis and recommendations for ongoing projects and initiatives.',
      fileName: 'Monitoring-Minutes-Q2-2024.pdf',
      fileSize: '3.1 MB'
    },
    {
      id: 3,
      title: 'Research Monitoring Evaluation Form',
      description: 'Standardized evaluation framework for research project monitoring and assessment procedures used across all departments.',
      fileName: 'Research-Monitoring-Evaluation-Form.pdf',
      fileSize: '4.2 MB'
    },
    {
      id: 4,
      title: 'Advanced Research Evaluation Template',
      description: 'Enhanced evaluation template with advanced metrics and comprehensive assessment criteria for complex research projects.',
      fileName: 'Advanced-Research-Evaluation-Template.pdf',
      fileSize: '5.8 MB'
    },
    {
      id: 5,
      title: 'Annual Compliance Report 2024',
      description: 'Complete annual report documenting compliance status and regulatory adherence across all organizational units and processes.',
      fileName: 'Annual-Compliance-Report-2024.pdf',
      fileSize: '7.3 MB'
    },
    {
      id: 6,
      title: 'Research Guidelines & Standards',
      description: 'Comprehensive guidelines for research methodology, data collection, and reporting standards for academic research.',
      fileName: 'Research-Guidelines-Standards.pdf',
      fileSize: '3.8 MB'
    }
  ];

  // Event handlers with useCallback for performance
  const handleDownload = useCallback((document) => {
    setSelectedDocument(document);
    setShowDownloadModal(true);
  }, []);

  const handleViewPDF = useCallback((document) => {
    setSelectedDocument(document);
    setShowPDFModal(true);
  }, []);

  const confirmDownload = async () => {
    if (!selectedDocument) return;
    
    setIsDownloading(true);
    try {
      // Simulate download process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would trigger the actual download
      console.log(`Downloading ${selectedDocument.fileName}...`);
      
      // Show success message (you might want to replace this with a toast notification)
      alert(`${selectedDocument.fileName} downloaded successfully!`);
    } catch (error) {
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
      closeModal();
    }
  };

  const closeModal = useCallback(() => {
    setShowDownloadModal(false);
    setShowPDFModal(false);
    setSelectedDocument(null);
    setIsDownloading(false);
  }, []);

  // Filter documents based on search term
  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle escape key to close modals
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    if (showDownloadModal || showPDFModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDownloadModal, showPDFModal, closeModal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
            Document Resources
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Access and download important documents and reports
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search documents, descriptions, or filenames..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-5 pr-12 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm text-gray-900 placeholder-gray-500"
              aria-label="Search documents"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg 
                className="h-6 w-6 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Results count */}
        {searchTerm && (
          <div className="mb-8 text-center">
            <p className="text-gray-600 bg-white rounded-full px-4 py-2 inline-block shadow-sm border">
              <span className="font-medium text-red-600">{filteredDocuments.length}</span> document{filteredDocuments.length !== 1 ? 's' : ''} found
              {searchTerm && (
                <>
                  {' '}matching <span className="font-medium">"{searchTerm}"</span>
                </>
              )}
            </p>
          </div>
        )}

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onDownload={handleDownload}
                onViewPDF={handleViewPDF}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg 
                    className="w-12 h-12 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search terms or browse all available documents</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
                  >
                    Clear search and show all documents
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Download Confirmation Modal */}
        {showDownloadModal && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeModal}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Download Document</h3>
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                Are you sure you want to download this document to your device?
              </p>
              
              <div className="bg-gray-50 p-6 rounded-2xl mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 mb-2 line-clamp-2">{selectedDocument?.title}</p>
                    <p className="text-sm text-gray-600 mb-1">{selectedDocument?.fileName}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-block text-xs font-medium text-gray-700 bg-white px-3 py-1 rounded-full border">
                      {selectedDocument?.fileSize}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                  onClick={closeModal}
                  disabled={isDownloading}
                >
                  Cancel
                </button>
                <button
                  className="px-8 py-3 rounded-2xl bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium min-w-[120px] justify-center"
                  onClick={confirmDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <span>Download</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Modal */}
        {showPDFModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={closeModal}
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  aria-label="Close PDF Viewer"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center space-x-2">
              </div>
            </div>
            {/* PDF Content - Full Screen */}
            <div className="absolute inset-0 pt-16">
              <PDFViewer pdfPath="/Balbuena_Concept+Paper.pdf" title={selectedDocument?.title} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesPage; 