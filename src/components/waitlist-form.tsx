'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function WaitlistForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const supabase = createClient();
      
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingUser) {
        setStatus('error');
        setMessage('This email is already on the waitlist.');
        return;
      }

      // Insert new waitlist entry
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          {
            name,
            email,
            company_name: companyName || null,
          },
        ]);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      setStatus('success');
      setMessage('Thank you for joining our waitlist!');
      setName('');
      setEmail('');
      setCompanyName('');
    } catch (error: any) {
      console.error('Error:', error);
      setStatus('error');
      setMessage(error.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100">
      <h3 className="text-xl font-semibold mb-4">Join the Waitlist</h3>
      <p className="text-gray-600 mb-6">Be among the first to experience the future of financial management.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Company name (optional)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 backdrop-blur-sm"
          />
        </div>
        {message && (
          <div className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  );
} 