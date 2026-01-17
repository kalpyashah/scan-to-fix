'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Fan, Wind, Lightbulb, Plug, Projector, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const searchParams = useSearchParams();
  const room = searchParams.get('room') || 'Scan a QR Code';
  
  const [submittingIssue, setSubmittingIssue] = useState<string | null>(null);
  const [successIssue, setSuccessIssue] = useState<string | null>(null);
  const [errorIssue, setErrorIssue] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const issues = [
    { id: 'fan', label: 'Fan', icon: Fan },
    { id: 'ac', label: 'AC', icon: Wind },
    { id: 'light', label: 'Light', icon: Lightbulb },
    { id: 'socket', label: 'Socket', icon: Plug },
    { id: 'projector', label: 'Projector', icon: Projector },
  ];

  const handleIssueClick = async (issueId: string) => {
    // Don't submit if room is not set (default "Scan a QR Code")
    if (room === 'Scan a QR Code') {
      setErrorIssue(issueId);
      setErrorMessage('Please scan a QR code first to identify the room');
      setTimeout(() => {
        setErrorIssue(null);
        setErrorMessage('');
      }, 4000);
      return;
    }

    setSubmittingIssue(issueId);
    setSuccessIssue(null);
    setErrorIssue(null);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            room: room,
            issue: issues.find(i => i.id === issueId)?.label || issueId,
            status: 'Pending',
            reported_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      // Success
      setSubmittingIssue(null);
      setSuccessIssue(issueId);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessIssue(null);
      }, 3000);
    } catch (error: any) {
      // Handle error gracefully
      console.error('Error submitting report:', error);
      setSubmittingIssue(null);
      setErrorIssue(issueId);
      setErrorMessage(
        error?.message || 'Failed to submit report. Please try again.'
      );
      
      // Clear error message after 4 seconds
      setTimeout(() => {
        setErrorIssue(null);
        setErrorMessage('');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            College Maintenance
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-blue-800 font-semibold">Room:</span>
            <span className="text-blue-900 font-bold text-lg">{room}</span>
          </div>
        </header>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Issues Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {issues.map((issue) => {
            const Icon = issue.icon;
            const isSubmitting = submittingIssue === issue.id;
            const isSuccess = successIssue === issue.id;
            const isError = errorIssue === issue.id;
            
            return (
              <button
                key={issue.id}
                onClick={() => handleIssueClick(issue.id)}
                disabled={isSubmitting || isSuccess}
                className={`
                  relative flex flex-col items-center justify-center
                  p-8 rounded-xl shadow-lg
                  transition-all duration-300
                  ${isSuccess 
                    ? 'bg-green-500 text-white scale-105' 
                    : isError
                    ? 'bg-red-500 text-white scale-105'
                    : isSubmitting
                    ? 'bg-blue-400 text-white cursor-wait'
                    : 'bg-white text-blue-900 hover:bg-blue-50 hover:shadow-xl hover:scale-105 active:scale-95'
                  }
                  border-2 ${
                    isSuccess ? 'border-green-600' 
                    : isError ? 'border-red-600'
                    : 'border-blue-200'
                  }
                  disabled:opacity-90
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
                    <span className="text-lg font-semibold">Submitting...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <div className="mb-3">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-lg font-semibold">Success!</span>
                  </>
                ) : isError ? (
                  <>
                    <AlertCircle className="w-12 h-12 mb-3" />
                    <span className="text-lg font-semibold">Error</span>
                  </>
                ) : (
                  <>
                    <Icon className="w-16 h-16 mb-4 text-blue-600" />
                    <span className="text-xl font-semibold">{issue.label}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="text-center text-blue-700 text-sm mt-8">
          <p>Select an issue to report maintenance request</p>
        </footer>
      </div>
    </div>
  );
}
