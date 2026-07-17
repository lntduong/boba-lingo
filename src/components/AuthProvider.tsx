'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PIN_CODE = '1234';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedPin = localStorage.getItem('app_pin');
    if (savedPin === PIN_CODE) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CODE) {
      localStorage.setItem('app_pin', pin);
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPin('');
    }
  };

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome</h2>
            <p className="text-zinc-500 text-sm">Nhập mã PIN để vào ứng dụng</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Input
                type="password"
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="text-center text-3xl tracking-[0.5em] h-16 rounded-xl shadow-sm"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center font-medium">Mã PIN không đúng!</p>}
            <Button type="submit" className="w-full h-14 text-lg rounded-xl shadow-md">Đăng nhập</Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
