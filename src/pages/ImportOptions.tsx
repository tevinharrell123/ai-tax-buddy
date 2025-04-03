
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AnimatedCard from '../components/ui/AnimatedCard';
import { Button } from '@/components/ui/button';
import { ArrowUpFromLine, Link as LinkIcon } from 'lucide-react';
import { useTaxOrganizer } from '../context/TaxOrganizerContext';

const ImportOptions: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useTaxOrganizer();

  const handleProceed = () => {
    dispatch({ type: 'MARK_STEP_COMPLETED', payload: 1 });
    navigate('/review');
  };

  return (
    <Layout
      onNext={handleProceed}
      showBackButton={true}
      nextButtonText="Skip & Continue"
    >
      <div className="max-w-4xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-300/5 to-transparent rounded-3xl blur-3xl -z-10"></div>
        
        {/* Virtual Tax Assistant Image */}
        <div className="flex justify-center mb-8 relative">
          <div className="absolute -top-24 right-0 md:right-12">
            <img 
              src="/lovable-uploads/e2c4b33b-d4e4-449a-a3ee-389616d5e3fe.png" 
              alt="Tax Assistant" 
              className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full shadow-xl border-4 border-white"
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
            <div className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-dashed border-tax-blue/30 hover:border-tax-blue transition-all cursor-pointer group">
              <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <ArrowUpFromLine className="text-tax-blue group-hover:scale-110 transition-transform" size={28} />
              </div>
              <h3 className="font-medium text-xl mb-3 text-center">Upload last year's tax return</h3>
              <p className="text-gray-600 text-center">
                Import data from your previous tax return to save time on data entry
              </p>
            </div>
          </AnimatedCard>
          
          <AnimatedCard delay={300} className="h-full">
            <div className="bg-white rounded-xl shadow-md p-6 h-full border-2 border-dashed border-tax-blue/30 hover:border-tax-blue transition-all cursor-pointer group">
              <div className="bg-tax-lightBlue p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <LinkIcon className="text-tax-blue group-hover:scale-110 transition-transform" size={28} />
              </div>
              <h3 className="font-medium text-xl mb-3 text-center">Connect to IRS & financial institutions</h3>
              <p className="text-gray-600 text-center">
                Securely connect to retrieve your tax documents automatically
              </p>
            </div>
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
    </Layout>
  );
};

export default ImportOptions;
