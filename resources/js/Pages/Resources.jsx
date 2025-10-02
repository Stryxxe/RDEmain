import React from 'react';
import ResourceGrid from '../Components/UI/ResourceGrid';

const Resources = () => {
  const resources = [
    {
      id: 1,
      title: 'Research Proposal Guidelines',
      description: 'Complete guidelines for submitting research proposals',
      type: 'PDF',
      fileSize: '2.3 MB',
      fileName: 'research-proposal-guidelines.pdf',
      downloadUrl: '#'
    },
    {
      id: 2,
      title: 'Budget Template',
      description: 'Excel template for proposal budget planning',
      type: 'XLSX',
      fileSize: '156 KB',
      fileName: 'budget-template.xlsx',
      downloadUrl: '#'
    },
    {
      id: 3,
      title: 'Ethics Review Form',
      description: 'Required form for research involving human subjects',
      type: 'PDF',
      fileSize: '1.8 MB',
      fileName: 'ethics-review-form.pdf',
      downloadUrl: '#'
    },
    {
      id: 4,
      title: 'Research Center Directory',
      description: 'List of available research centers and their specializations',
      type: 'PDF',
      fileSize: '945 KB',
      fileName: 'research-center-directory.pdf',
      downloadUrl: '#'
    },
    {
      id: 5,
      title: 'DOST SPs Reference',
      description: 'Detailed information about DOST Strategic Programs',
      type: 'PDF',
      fileSize: '3.1 MB',
      fileName: 'dost-sps-reference.pdf',
      downloadUrl: '#'
    },
    {
      id: 6,
      title: 'SDG Mapping Guide',
      description: 'Guide for mapping research to Sustainable Development Goals',
      type: 'PDF',
      fileSize: '1.2 MB',
      fileName: 'sdg-mapping-guide.pdf',
      downloadUrl: '#'
    }
  ];

  const handleDownload = (resource) => {
    console.log('Downloading:', resource.title);
    // Implement download logic
  };

  const handleView = (resource) => {
    console.log('Viewing:', resource.title);
    // Implement view logic
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
          <p className="mt-2 text-gray-600">
            Access important documents, templates, and guidelines for research proposals.
          </p>
        </div>

        <ResourceGrid
          resources={resources}
          onDownload={handleDownload}
          onView={handleView}
          emptyMessage="No resources available at this time"
        />
      </div>
    </div>
  );
};

export default Resources;