import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Eye, EyeOff, Loader2, Mail,
} from 'lucide-react';
import { SiFacebook } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import Logo from '@/components/icons/Logo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Create schema for form validation
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  rememberMe: z.boolean().optional()
});

const otpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }).regex(/^\d+$/, { message: 'OTP must contain only numbers' })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

const LoginPage: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('email');
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  
  // Check for token in URL (for social login redirects) or verified email from OTP
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const verified = params.get('verified');
    
    if (token) {
      // Store the token in localStorage
      localStorage.setItem('auth_token', token);
    }
    
    if (email && verified === 'true') {
      // Pre-fill the login form with the verified email
      form.setValue('email', email);
      toast({
        title: 'Email Verified',
        description: 'Your email has been verified. Please log in with your password.',
        duration: 3000
      });
      
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [navigate, toast]);

  // Initialize the form with default values
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    },
  });

  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: '',
      otp: '',
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return response.json();
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      toast({
        title: 'Login successful',
        description: 'You have been successfully logged in.',
        duration: 3000
      });
      
      // Force a complete page refresh to reset all app state
      if (data.user.isAdmin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    },
    onError: (error) => {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  // OTP request mutation
  const sendOtpMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/auth/send-otp', { email });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'OTP Sent',
        description: 'We have sent a 6-digit code to your email address.',
        duration: 5000
      });
      setShowOtpDialog(true);
    },
    onError: (error) => {
      console.error('OTP request error:', error);
      toast({
        title: 'OTP Request Failed',
        description: 'Could not send OTP. Please try again later.',
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  // OTP verification mutation
  const verifyOtpMutation = useMutation({
    mutationFn: async (data: OtpFormValues) => {
      const response = await apiRequest('POST', '/api/auth/verify-otp', data);
      return response.json();
    },
    onSuccess: (data) => {
      const userExists = data.userExists;
      
      toast({
        title: 'OTP Verified',
        description: 'Email verified successfully!',
        duration: 3000
      });
      
      setShowOtpDialog(false);
      
      if (userExists) {
        // If user already exists, stay on login page with email pre-filled
        form.setValue('email', otpEmail);
        toast({
          title: 'Account Exists',
          description: 'This email is already registered. Please login with your password.',
          duration: 3000
        });
      } else {
        // If new user, redirect to registration
        navigate('/register?email=' + encodeURIComponent(otpEmail));
      }
    },
    onError: (error) => {
      console.error('OTP verification error:', error);
      toast({
        title: 'Verification Failed',
        description: 'Invalid or expired OTP. Please try again.',
        variant: 'destructive',
        duration: 5000
      });
    }
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const handleOtpRequest = () => {
    const email = form.getValues().email;
    if (!email || !z.string().email().safeParse(email).success) {
      form.setError('email', { message: 'Please enter a valid email address' });
      return;
    }
    
    setOtpEmail(email);
    otpForm.setValue('email', email);
    sendOtpMutation.mutate(email);
  };

  const handleOtpSubmit = (values: OtpFormValues) => {
    verifyOtpMutation.mutate(values);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = '/api/auth/facebook';
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Helmet>
        <title>Login - Blinkeach</title>
        <meta name="description" content="Login to your Blinkeach account to access your orders, wishlist, and more." />
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="medium" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-800">Login to your account</h1>
            <p className="text-neutral-600 mt-1">Welcome back! Please enter your details.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Tabs defaultValue="email" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email">Email Login</TabsTrigger>
                <TabsTrigger value="social">Social Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Enter your password" 
                                {...field} 
                              />
                              <button 
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                                onClick={togglePasswordVisibility}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex items-center justify-between">
                      <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">Remember me</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Link href="/forgot-password" className="text-sm text-secondary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-secondary hover:bg-secondary-dark text-white"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Login
                    </Button>
                    
                    {/* Removed the "Sign up with OTP verification" button as per new requirements */}
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="social">
                <div className="space-y-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleGoogleLogin}
                  >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    Continue with Google
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleFacebookLogin}
                  >
                    <SiFacebook className="mr-2 h-5 w-5 text-blue-600" />
                    Continue with Facebook
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="text-center text-sm text-neutral-600 mt-6">
              Don't have an account?{' '}
              <Link href="/register" className="text-secondary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-neutral-500">
              By continuing, you agree to Blinkeach's{' '}
              <Link href="/terms-and-conditions" className="text-secondary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-secondary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      
      {/* OTP Verification Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Verification</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to {otpEmail}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 6-digit code" 
                        {...field} 
                        maxLength={6}
                        className="text-center text-xl tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => sendOtpMutation.mutate(otpEmail)}
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Resend Code
                </Button>
                
                <Button 
                  type="submit"
                  disabled={verifyOtpMutation.isPending}
                >
                  {verifyOtpMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginPage;
