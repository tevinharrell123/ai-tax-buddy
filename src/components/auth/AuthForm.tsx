
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import AnimatedCard from '@/components/ui/AnimatedCard';

type AuthMode = 'login' | 'signup';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email for a verification link, or try logging in.",
          variant: "success",
        });
        
        // Switch to login mode after signup
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
          variant: "success",
        });
        
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <AnimatedCard delay={100} className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-purple-600 via-blue-500 to-tax-blue bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-gray-600 mt-2">
              {mode === 'login' ? 'Log in to access your tax documents' : 'Sign up to start organizing your taxes'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="pl-10 py-6"
                />
                <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="pl-10 py-6"
                />
                <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-6 bg-gradient-to-r from-tax-blue to-purple-600 hover:from-tax-blue/90 hover:to-purple-600/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {mode === 'login' ? (
                    <>
                      <LogIn size={18} className="mr-2" />
                      Log In
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="mr-2" />
                      Sign Up
                    </>
                  )}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={toggleMode}
              className="text-tax-blue hover:underline text-sm font-medium"
            >
              {mode === 'login'
                ? "Don't have an account? Sign Up"
                : "Already have an account? Log In"}
            </button>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};

export default AuthForm;
