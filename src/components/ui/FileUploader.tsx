
import React, { useState, useRef } from 'react';
import { Upload, File, X, Check, FileText, CreditCard, FileImage, FileCog } from 'lucide-react';
import { useTaxOrganizer } from '../../context/TaxOrganizerContext';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FileUploader: React.FC = () => {
  const { state, dispatch } = useTaxOrganizer();
  const [isDragging, setIsDragging] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("identification");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const documentCategories = [
    { 
      id: "identification", 
      name: "Identification", 
      description: "Driver's license, passport, or other ID", 
      icon: <CreditCard className="text-tax-red" size={24} />, 
      color: "bg-tax-lightRed border-tax-red/30",
      activeColor: "bg-tax-red text-white"
    },
    { 
      id: "tax-forms", 
      name: "Tax Forms", 
      description: "W-2, 1099, or other tax documents", 
      icon: <FileText className="text-tax-blue" size={24} />,
      color: "bg-tax-lightBlue border-tax-blue/30",
      activeColor: "bg-tax-blue text-white"
    },
    { 
      id: "receipts", 
      name: "Receipts", 
      description: "Business expenses, donations, etc.", 
      icon: <FileImage className="text-tax-green" size={24} />,
      color: "bg-tax-lightGreen border-tax-green/30", 
      activeColor: "bg-tax-green text-white"
    },
    { 
      id: "other", 
      name: "Other Documents", 
      description: "Any other relevant files", 
      icon: <FileCog className="text-amber-500" size={24} />,
      color: "bg-yellow-50 border-amber-200", 
      activeColor: "bg-amber-500 text-white"
    }
  ];

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, category: string) => {
    e.preventDefault();
    setIsDragging(false);
    setActiveCategory(category);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, category);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files, activeCategory);
    }
  };

  const uploadFileToSupabase = async (file: File, documentId: string, category: string) => {
    try {
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

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          user_id: userId,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          status: 'uploaded',
          category: category
        });

      if (dbError) {
        console.error('Error saving document to database:', dbError);
        await supabase.storage.from('tax_documents').remove([filePath]);
        return null;
      }

      return data.path;
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      return null;
    }
  };

  const handleFiles = (files: FileList, category: string) => {
    Array.from(files).forEach(async (file) => {
      const documentId = uuidv4();
      
      const previewUrl = URL.createObjectURL(file);
      
      let type = 'document';
      if (file.type.includes('image')) {
        type = 'image';
      } else if (file.type.includes('pdf')) {
        type = 'pdf';
      }
      
      const document = {
        id: documentId,
        name: file.name,
        file,
        previewUrl,
        uploadProgress: 0,
        type,
        status: 'uploading' as const,
        category
      };
      
      dispatch({ type: 'ADD_DOCUMENT', payload: document });
      
      try {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 10;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
          }
          
          dispatch({ 
            type: 'UPDATE_DOCUMENT', 
            payload: { 
              id: document.id, 
              updates: { uploadProgress: Math.round(progress) } 
            } 
          });
        }, 200);

        const filePath = await uploadFileToSupabase(file, documentId, category);
        
        clearInterval(interval);
        
        if (filePath) {
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
    const document = state.documents.find(d => d.id === id);
    if (!document) return;

    if (document.status === 'uploaded' || document.status === 'processed') {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const userId = sessionData.session.user.id;
        
        const { data } = await supabase
          .from('documents')
          .select('file_path')
          .eq('id', id)
          .single();

        if (data?.file_path) {
          await supabase.storage
            .from('tax_documents')
            .remove([data.file_path]);
          
          await supabase
            .from('documents')
            .delete()
            .eq('id', id);
        }
      } catch (error) {
        console.error('Error removing document from Supabase:', error);
      }
    }

    dispatch({ type: 'REMOVE_DOCUMENT', payload: id });
  };

  const triggerFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getDocumentsByCategory = (category: string) => {
    return state.documents.filter(doc => doc.category === category);
  };

  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="identification" onValueChange={setActiveCategory} className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-6">
          {documentCategories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id} 
              className="flex flex-col items-center gap-1 py-4"
            >
              <div className={`p-2 rounded-full transition-colors ${activeCategory === category.id ? category.activeColor : 'bg-gray-100'}`}>
                {category.icon}
              </div>
              <span className="text-xs font-medium">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {documentCategories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <div 
              className={`upload-container h-64 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all ${
                category.color
              } ${
                isDragging && activeCategory === category.id ? 'scale-102 border-tax-blue' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.id)}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.heic"
                multiple
                className="hidden"
              />
              
              <div className="flex flex-col items-center text-center">
                <div className={`${category.color} p-4 rounded-full mb-4`}>
                  {category.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-500 mb-4 max-w-md">
                  {category.description}
                </p>
                <button 
                  onClick={triggerFileInputClick}
                  className="bg-tax-blue text-white px-6 py-2 rounded-lg hover:bg-tax-darkBlue transition-colors"
                >
                  Browse Files
                </button>
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: PDF, JPEG, PNG, TIFF, BMP, HEIC
                </p>
              </div>
            </div>

            {getDocumentsByCategory(category.id).length > 0 && (
              <div className="bg-white p-4 rounded-xl border mt-4">
                <h3 className="font-medium mb-3">{category.name} Documents ({getDocumentsByCategory(category.id).length})</h3>
                <div className="space-y-3">
                  {getDocumentsByCategory(category.id).map((doc) => (
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
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default FileUploader;
