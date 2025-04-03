
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Button } from '@/components/ui/button';
import { ArrowUpFromLine, Link as LinkIcon, Check, FileText } from 'lucide-react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import FileUploader from '@/components/ui/FileUploader';
import { Checkbox } from '@/components/ui/checkbox';

const ImportOptions: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useTaxOrganizer();
  const { toast } = useToast();
  
  // State for file upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  
  // State for IRS connection dialog
  const [irsDialogOpen, setIrsDialogOpen] = useState(false);
  const [socialLast4, setSocialLast4] = useState('');
  const [lastName, setLastName] = useState('');
  const [filingStatus, setFilingStatus] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  const handleProceed = () => {
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: state.step });
    navigate('/review');
  };
  
  const handleFileSelect = () => {
    setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadDialogOpen(false);
          setUploadProgress(0);
          setUploadComplete(true);
          setUploadedFile("1040_tax_return.pdf");
          toast({
            title: "Upload Complete",
            description: "Your tax return was successfully uploaded and processed.",
            variant: "success",
          });
        }, 500);
      }
    }, 300);
  };
  
  const handleIRSConnect = () => {
    // Basic validation
    if (socialLast4.length !== 4 || !lastName || !filingStatus) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields correctly.",
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    
    // Simulate connection progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setConnectionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsConnecting(false);
          setIsConnected(true);
        }, 500);
      }
    }, 300);
  };

  return (
    <Layout
      onNext={handleProceed}
      showBackButton={true}
      nextButtonText={uploadComplete || isConnected ? "Continue" : "Skip & Continue"}
    >
      <div className="max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
        {/* Virtual Tax Assistant Image - Positioned a bit lower */}
        <div className="flex justify-center mb-12 relative">
          <div className="absolute -top-6 md:-top-2 right-0 md:right-12">
            <img 
              src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
              alt="Tax Assistant" 
              className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-full shadow-xl border-4 border-white"
            />
            <div className="absolute bottom-0 right-0 bg-tax-blue text-white p-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"></path><path d="m8 9 3 3-3 3"></path><line x1="13" x2="16" y1="15" y2="15"></line></svg>
            </div>
          </div>
        </div>
        
        <AnimatedCard delay={100}>
          <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-br from-tax-blue via-tax-mediumBlue to-tax-skyBlue bg-clip-text text-transparent">
            Let's make it easy for you
          </h1>
          
          <p className="text-gray-600 text-center mb-12">
            We can help pre-fill much of your tax information automatically
          </p>
        </AnimatedCard>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedCard delay={200} className="h-full">
            {uploadComplete ? (
              <div className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-green-500/30 hover:border-green-500 transition-all">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Check className="text-green-600" size={28} />
                </div>
                <h3 className="font-medium text-xl mb-3 text-center">Tax Return Uploaded</h3>
                <div className="flex items-center justify-center space-x-2 mt-4 bg-gray-50 p-3 rounded-lg">
                  <FileText size={20} className="text-gray-500" />
                  <p className="text-sm font-medium">{uploadedFile}</p>
                </div>
                <p className="text-gray-600 text-center mt-4 text-sm">
                  Your tax information will be pre-filled automatically
                </p>
              </div>
            ) : (
              <div 
                className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-dashed border-tax-blue/30 hover:border-tax-blue transition-all cursor-pointer group"
                onClick={() => setUploadDialogOpen(true)}
              >
                <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <ArrowUpFromLine className="text-tax-blue group-hover:scale-110 transition-transform" size={28} />
                </div>
                <h3 className="font-medium text-xl mb-3 text-center">Upload last year's tax return</h3>
                <p className="text-gray-600 text-center">
                  Import data from your previous tax return to save time on data entry
                </p>
              </div>
            )}
          </AnimatedCard>
          
          <AnimatedCard delay={300} className="h-full">
            {isConnected ? (
              <div className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-green-500/30 hover:border-green-500 transition-all">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <Check className="text-green-600" size={28} />
                </div>
                <h3 className="font-medium text-xl mb-3 text-center">Connected to IRS</h3>
                <div className="flex items-center justify-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="irs-connected" checked={true} />
                    <label
                      htmlFor="irs-connected"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      IRS Connection Complete
                    </label>
                  </div>
                </div>
                <p className="text-gray-600 text-center mt-4 text-sm">
                  Your tax documents have been retrieved successfully
                </p>
              </div>
            ) : (
              <div 
                className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-dashed border-tax-blue/30 hover:border-tax-blue transition-all cursor-pointer group"
                onClick={() => setIrsDialogOpen(true)}
              >
                <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <LinkIcon className="text-tax-blue group-hover:scale-110 transition-transform" size={28} />
                </div>
                <h3 className="font-medium text-xl mb-3 text-center">Connect to IRS & financial institutions</h3>
                <p className="text-gray-600 text-center">
                  Securely connect to retrieve your tax documents automatically
                </p>
              </div>
            )}
          </AnimatedCard>
        </div>
        
        <AnimatedCard delay={400} className="mt-12 text-center">
          <div className="bg-tax-lightBlue rounded-lg p-6">
            <p className="text-gray-600">
              By connecting with the IRS or uploading your return from last year, we can autofill a lot of information for you, saving you time and reducing errors.
            </p>
          </div>
        </AnimatedCard>
      </div>
      
      {/* File Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload last year's tax return</DialogTitle>
            <DialogDescription>
              Upload your previous year's tax return to help us pre-fill information.
            </DialogDescription>
          </DialogHeader>
          {isUploading ? (
            <div className="p-6 flex flex-col items-center">
              <Progress value={uploadProgress} className="w-full mb-4" />
              <p className="text-sm text-center text-gray-500">Uploading and processing your documents...</p>
            </div>
          ) : (
            <div className="p-6">
              <FileUploader 
                onUpload={handleFileSelect} 
                documentType="tax"
                maxFiles={1}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* IRS Connection Dialog */}
      <Dialog open={irsDialogOpen} onOpenChange={(open) => {
        if (!isConnected) setIrsDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to the IRS</DialogTitle>
            <DialogDescription>
              Enter the following information to securely connect to the IRS.
            </DialogDescription>
          </DialogHeader>
          
          {isConnected ? (
            <div className="p-6 flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Connected!</h3>
              <p className="text-gray-600 text-center">
                Your IRS account has been successfully connected. Your tax documents will be imported automatically.
              </p>
              <Button 
                onClick={() => setIrsDialogOpen(false)} 
                className="mt-6 w-full bg-tax-blue hover:bg-tax-blue/90"
              >
                Continue
              </Button>
            </div>
          ) : isConnecting ? (
            <div className="p-6 flex flex-col items-center">
              <Progress value={connectionProgress} className="w-full mb-4" />
              <p className="text-sm text-center text-gray-500">Connecting to the IRS...</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="ssn" className="text-sm font-medium">Last 4 digits of SSN</label>
                  <Input
                    id="ssn"
                    value={socialLast4}
                    onChange={(e) => {
                      // Only allow numbers and limit to 4 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setSocialLast4(value);
                    }}
                    placeholder="1234"
                    maxLength={4}
                    className="col-span-3"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="filingStatus" className="text-sm font-medium">Filing Status</label>
                  <select
                    id="filingStatus"
                    value={filingStatus}
                    onChange={(e) => setFilingStatus(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select filing status</option>
                    <option value="single">Single</option>
                    <option value="married_joint">Married Filing Jointly</option>
                    <option value="married_separate">Married Filing Separately</option>
                    <option value="head_household">Head of Household</option>
                    <option value="widow">Qualifying Widow(er)</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={handleIRSConnect}
                  className="bg-tax-blue hover:bg-tax-blue/90"
                >
                  Connect
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ImportOptions;
