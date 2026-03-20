'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@civictwin.local');
  const [password, setPassword] = useState('password');
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="text-center space-y-4 pt-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto shadow-sm">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">CivicTwin AI</CardTitle>
            <CardDescription className="text-sm">
              Predictive & Proactive Traffic Management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2 flex flex-col items-start text-left">
              <label htmlFor="email" className="text-sm font-medium leading-none">Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background w-full"
              />
            </div>
            <div className="space-y-2 flex flex-col items-start text-left">
              <div className="flex items-center justify-between w-full">
                <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 border-t border-border pt-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Demo: admin@civictwin.local / password
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
