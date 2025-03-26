
import React, { useState, useRef } from 'react';
import { Upload, File, X, Check, FileText } from 'lucide-react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import AIProcessingModal from './AIProcessingModal';
import { useNavigate } from 'react-router-dom';

const FileUploader: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const uploadFileToSupabase = async (file: File, documentId: string) => {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('No authenticated user found');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return null;
    }

    const userId = sessionData.session.user.id;
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${documentId}.${fileExt}`;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from('tax_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Insert record in documents table
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        status: 'uploaded'
      });

    if (dbError) {
      console.error('Error saving document to database:', dbError);
      // Delete uploaded file if database insert fails
      await supabase.storage.from('tax_documents').remove([filePath]);
      return null;
    }

    return data.path;
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(async (file) => {
      // Create a document ID
      const documentId = uuidv4();
      
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
        id: documentId,
        name: file.name,
        file,
        previewUrl,
        uploadProgress: 0,
        type,
        status: 'uploading' as const
      };
      
      // Add document to state
      dispatch({ type: 'ADD_DOCUMENT', payload: document });
      
      // Start upload and track progress
      try {
        // Simulate upload progress (in a real app, we would use Supabase upload progress events)
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
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

        // Upload to Supabase
        const filePath = await uploadFileToSupabase(file, documentId);
        
        // Clear the interval once upload is complete
        clearInterval(interval);
        
        if (filePath) {
          // Update document status after upload
          dispatch({ 
            type: 'UPDATE_DOCUMENT', 
            payload: { 
              id: document.id, 
              updates: { 
                status: 'uploaded',
                uploadProgress: 100
              } 
            } 
          });
          
          // Simulate processing after successful upload
          setTimeout(() => {
            dispatch({ 
              type: 'UPDATE_DOCUMENT', 
              payload: { 
                id: document.id, 
                updates: { status: 'processed' } 
              } 
            });
          }, 1500);
        } else {
          // Handle upload failure
          dispatch({ 
            type: 'UPDATE_DOCUMENT', 
            payload: { 
              id: document.id, 
              updates: { status: 'error' } 
            } 
          });
          
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${file.name}. Please try again.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Upload error:', error);
        dispatch({ 
          type: 'UPDATE_DOCUMENT', 
          payload: { 
            id: document.id, 
            updates: { status: 'error' } 
          } 
        });
      }
    });
  };

  const removeDocument = async (id: string) => {
    // Get the document from state
    const document = state.documents.find(d => d.id === id);
    if (!document) return;

    // If the document was uploaded to Supabase, remove it
    if (document.status === 'uploaded' || document.status === 'processed') {
      try {
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const userId = sessionData.session.user.id;
        
        // Find the document in the database
        const { data } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', id)
          .single();

        if (data?.file_path) {
          // Delete file from storage
          await supabase.storage
            .from('tax_documents')
            .remove([data.file_path]);
          
          // Delete record from documents table
          await supabase
            .from('documents')
            .delete()
            .eq('id', id);
        }
      } catch (error) {
        console.error('Error removing document from Supabase:', error);
      }
    }

    // Remove from state
    dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
  };

  const processDocuments = async () => {
    // Check if we have processed documents
    if (state.documents.length === 0) {
      toast({
        title: "No Documents Found",
        description: "Please upload at least one document to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Prepare documents for processing
      const docs = state.documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        status: doc.status
      }));
      
      // Call the Supabase Edge Function to extract information
      const { data, error } = await supabase.functions.invoke('extract-document-info', {
        body: { documents: docs }
      });
      
      if (error) {
        console.error('Error processing documents:', error);
        toast({
          title: "Processing Error",
          description: "There was a problem extracting information from your documents.",
          variant: "destructive"
        });
        return;
      }
      
      // Update the extracted fields in the context
      if (data && data.extractedFields) {
        dispatch({ 
          type: 'SET_EXTRACTED_FIELDS', 
          payload: data.extractedFields 
        });
        
        // Mark step 1 as completed
        dispatch({ type: 'MARK_STEP_COMPLETED', payload: 1 });
        
        // Move to the next step
        dispatch({ type: 'SET_STEP', payload: 2 });
        
        // Navigate to review page
        navigate('/review');
        
        toast({
          title: "Processing Complete",
          description: "Your documents have been successfully analyzed.",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: "Processing Error",
        description: "An unexpected error occurred while processing your documents.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div 
        className={`upload-container h-64 flex flex-col items-center justify-center bg-white p-6 rounded-xl border-2 border-dashed transition-all ${
          isDragging ? 'border-tax-blue bg-tax-lightBlue scale-102' : 'border-gray-200'
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
            className="bg-tax-blue text-white px-6 py-2 rounded-lg hover:bg-tax-darkBlue transition-colors"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-400 mt-4">
            Supported formats: PDF, JPEG, PNG, TIFF, BMP, HEIC
          </p>
        </div>
      </div>

      {state.documents.length > 0 && (
        <>
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-medium mb-3">Uploaded Documents ({state.documents.length})</h3>
            <div className="space-y-3">
              {state.documents.map((doc) => (
                <div key={doc.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="bg-gray-100 p-2 rounded">
                    <FileText size={20} className="text-gray-500" />
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

          <div className="flex justify-end">
            <button
              onClick={processDocuments}
              disabled={state.documents.length === 0 || state.documents.some(d => d.status === 'uploading')}
              className="bg-tax-green hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={18} className="mr-2" />
              Analyze Documents
            </button>
          </div>
        </>
      )}

      <AIProcessingModal 
        open={isProcessing} 
        onOpenChange={setIsProcessing} 
      />
    </div>
  );
};

export default FileUploader;
