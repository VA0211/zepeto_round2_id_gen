import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { processExcelFile } from '../utils/excelProcessor';
import { exportToExcel } from '../utils/excelExporter';
import { ProcessedData } from '../types/excel';

export default function FileUpload() {
  const [percentage, setPercentage] = useState<number>(10);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<ProcessedData[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totalItems: number; uniqueItems: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please upload an Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      const { processedData, totalItems, uniqueItems } = await processExcelFile(file, percentage);
      setResults(processedData);
      setStats({ totalItems, uniqueItems });
    } catch (err) {
      setError('Error processing file. Please check the file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (results.length > 0) {
      try {
        exportToExcel(results);
      } catch (err) {
        setError('Error exporting to Excel. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-pink-500 transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-pink-600">
                    <FileSpreadsheet className="w-6 h-6" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-gray-400" />
                    <p className="text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500">Excel files only (.xlsx, .xls)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {stats && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="font-medium text-pink-900 mb-2">File Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-pink-700">Total Items:</p>
                    <p className="font-medium">{stats.totalItems}</p>
                  </div>
                  <div>
                    <p className="text-pink-700">Unique Items:</p>
                    <p className="font-medium">{stats.uniqueItems}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Percentage of Items to Process ({percentage}%)
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                !file || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700'
              }`}
            >
              {loading ? 'Processing...' : 'Process File'}
            </button>
          </div>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Results</h2>
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export to Excel</span>
            </button>
          </div>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">{result.reviewer}</h3>
                <p className="text-sm text-gray-600">
                  Assigned Items: {result.itemIds.length}
                </p>
                <div className="mt-2">
                  <details className="text-sm">
                    <summary className="cursor-pointer text-pink-600 hover:text-pink-700">
                      View Item IDs
                    </summary>
                    <div className="mt-2 pl-4 text-gray-600">
                      {result.itemIds.join(', ')}
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}