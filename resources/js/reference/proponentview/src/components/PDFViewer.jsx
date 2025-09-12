import React, { useState } from 'react';
import { FaDownload, FaEye, FaExpand, FaCompress, FaFilePdf } from 'react-icons/fa';

const PDFViewer = ({ pdfPath, title = 'Document' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = () => {
    if (pdfPath) {
      const link = document.createElement('a');
      link.href = pdfPath;
      link.download = title || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePdfError = () => {
    console.error('PDF failed to load:', pdfPath);
    setPdfError(true);
    setIsLoading(false);
  };

  const handlePdfLoad = () => {
    console.log('PDF loaded successfully:', pdfPath);
    setPdfError(false);
    setIsLoading(false);
  };

  // Set a timeout to handle cases where onLoad doesn't fire
  React.useEffect(() => {
    if (pdfPath) {
      const timer = setTimeout(() => {
        if (isLoading) {
          console.log('PDF load timeout, assuming success');
          setPdfError(false);
          setIsLoading(false);
        }
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    }
  }, [pdfPath, isLoading]);

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="text-base md:text-lg font-semibold truncate">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(pdfPath, '_blank')}
            title="Open in new tab"
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <FaEye className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            title="Download PDF"
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <FaDownload className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            {isFullscreen ? <FaCompress className="w-4 h-4" /> : <FaExpand className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className={`bg-gray-50 ${isFullscreen ? 'h-full' : 'p-4 min-h-[800px]'}`}>
        <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${isFullscreen ? 'h-full' : ''}`}>
          {isLoading && (
            <div className={`flex flex-col items-center justify-center text-gray-500 text-center px-4 ${isFullscreen ? 'h-full' : 'h-[800px]'}`}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
              <p className="text-lg font-semibold">Loading PDF...</p>
              <p className="text-sm text-gray-600">Please wait while the document loads</p>
              <button
                onClick={() => window.open(pdfPath, '_blank')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
              >
                Try Opening PDF in New Tab
              </button>
            </div>
          )}
          {pdfPath && !pdfError && !isLoading ? (
            <iframe
              src={pdfPath}
              className={`w-full border-0 ${isFullscreen ? 'h-full' : 'h-[800px]'}`}
              title={title}
              onLoad={handlePdfLoad}
              onError={handlePdfError}
            />
          ) : !isLoading && (
            <div className={`flex flex-col items-center justify-center text-gray-500 text-center px-4 ${isFullscreen ? 'h-full' : 'h-[800px]'}`}>
              <FaFilePdf className="w-16 h-16 mb-4 text-red-300" />
              <p className="text-lg font-semibold">
                {pdfError ? 'PDF could not be loaded' : 'PDF not available'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                {pdfError
                  ? 'There was an error loading the PDF file.'
                  : 'Please check the file path or upload a PDF.'}
              </p>
              {pdfPath && (
                <>
                  <p className="text-xs text-gray-400 mb-2">Attempted to load: {pdfPath}</p>
                  <button
                    onClick={() => window.open(pdfPath, '_blank')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    Open in New Tab
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 