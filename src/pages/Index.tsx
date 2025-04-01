
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-tax-blue text-white p-4 rounded-2xl shadow-lg transform hover:rotate-3 transition-transform">
            <FileText size={48} />
          </div>
        </div>
        
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-tax-blue to-tax-skyBlue bg-clip-text text-transparent">
          2024 Tax Return
        </h1>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Welcome to your seamless tax experience. Let's make filing your taxes simple, efficient, and maximize your return.
        </p>
        
        <Button 
          onClick={() => navigate('/welcome')}
          className="bg-tax-blue hover:bg-tax-blue/90 text-white px-8 py-6 rounded-lg text-lg flex items-center gap-2 mx-auto"
        >
          Get Started
          <ArrowRight />
        </Button>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
            <div className="text-tax-blue font-bold text-lg mb-2">Easy Upload</div>
            <p className="text-gray-600">Scan or upload your tax documents in seconds</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
            <div className="text-tax-blue font-bold text-lg mb-2">Smart AI</div>
            <p className="text-gray-600">Our AI extracts and organizes your tax information</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
            <div className="text-tax-blue font-bold text-lg mb-2">Maximize Returns</div>
            <p className="text-gray-600">Find every deduction you qualify for</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
