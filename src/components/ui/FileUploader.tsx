
import React, { useState, useRef } from 'react';
import { Upload, File, X, Check } from 'lucide-react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';

const FileUploader: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      // Create a preview URL for the file
      const previewUrl = URL.createObjectURL(file);
      
      // Determine file type
      let type = 'document';
      if (file.type.includes('image')) {
        type = 'image';
      } else if (file.type.includes('pdf')) {
        type = 'pdf';
      }
      
      // Create document object
      const document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        file,
        previewUrl,
        uploadProgress: 0,
        type,
        status: 'uploading' as const
      };
      
      // Add document to state
      dispatch({ type: 'ADD_DOCUMENT', payload: document });
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update document status after "upload"
          setTimeout(() => {
            dispatch({ 
              type: 'UPDATE_DOCUMENT', 
              payload: { 
                id: document.id, 
                updates: { status: 'uploaded' } 
              } 
            });
            
            // Simulate processing
            setTimeout(() => {
              dispatch({ 
                type: 'UPDATE_DOCUMENT', 
                payload: { 
                  id: document.id, 
                  updates: { status: 'processed' } 
                } 
              });
            }, 1000);
          }, 500);
        }
        
        // Update progress
        dispatch({ 
          type: 'UPDATE_DOCUMENT', 
          payload: { 
            id: document.id, 
            updates: { uploadProgress: Math.round(progress) } 
          } 
        });
      }, 200);
    });
  };

  const removeDocument = (id: string) => {
    dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
  };

  return (
    <div className="w-full space-y-6">
      <div 
        className={`upload-container h-64 flex flex-col items-center justify-center bg-white p-6 rounded-xl transition-all ${
          isDragging ? 'border-tax-blue bg-tax-lightBlue scale-102' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.heic"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center text-center">
          <div className="bg-tax-lightBlue p-4 rounded-full mb-4">
            <Upload size={28} className="text-tax-blue animate-bounce-gentle" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Upload your tax documents</h3>
          <p className="text-gray-500 mb-4 max-w-md">
            Drag and drop your tax forms, receipts, or documents here, or click to browse
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary px-6 py-2 rounded-lg"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Supported formats: PDF, JPEG, PNG, TIFF, BMP, HEIC
          </p>
        </div>
      </div>

      {state.documents.length > 0 && (
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-medium mb-3">Uploaded Documents ({state.documents.length})</h3>
          <div className="space-y-3">
            {state.documents.map((doc) => (
              <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="bg-gray-100 p-2 rounded">
                  <File size={20} className="text-gray-500" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium truncate max-w-xs">{doc.name}</p>
                    <button 
                      onClick={() => removeDocument(doc.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  {doc.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-tax-blue h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${doc.uploadProgress}%` }}
                      />
                    </div>
                  )}
                  
                  {doc.status === 'uploaded' && (
                    <p className="text-xs text-yellow-600 flex items-center mt-1">
                      Processing...
                    </p>
                  )}
                  
                  {doc.status === 'processed' && (
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Check size={12} className="mr-1" />
                      Processed successfully
                    </p>
                  )}
                  
                  {doc.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      Error processing file
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
