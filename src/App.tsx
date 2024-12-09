import React from 'react';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Excel File Processor</h1>
          <p className="mt-2 text-gray-600">
            Upload an Excel file to process reviews and assign items to reviewers
          </p>
        </div>
        <FileUpload />
      </div>
    </div>
  );
}

export default App;