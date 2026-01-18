'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Settings, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Issue {
  id: string;
  room: string;
  issue: string;
  status: 'Pending' | 'Resolved';
  reported_at: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Fetch issues from Supabase
  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('reported_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setIssues(data || []);
    } catch (err: any) {
      console.error('Error fetching issues:', err);
      setError(err?.message || 'Failed to fetch issues');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchIssues();

    // Subscribe to changes in the reports table
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchIssues(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleResolve = async (id: string) => {
    try {
      setResolvingId(id);
      setError(null);

      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: 'Resolved' })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // The real-time subscription will automatically update the UI
      // But we can also optimistically update it
      setIssues(issues.map(issue => 
        issue.id === id ? { ...issue, status: 'Resolved' as const } : issue
      ));
    } catch (err: any) {
      console.error('Error resolving issue:', err);
      setError(err?.message || 'Failed to resolve issue');
      // Refetch to ensure consistency
      fetchIssues();
    } finally {
      setResolvingId(null);
    }
  };

  const pendingIssues = issues.filter(issue => issue.status === 'Pending');
  const resolvedIssues = issues.filter(issue => issue.status === 'Resolved');

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white shadow-lg">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-8">Maintenance Admin</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('Dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'Dashboard'
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('Reports')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'Reports'
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('Settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'Settings'
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-800'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'Dashboard' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Active Issues</h1>
              
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Pending Issues</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {loading ? '...' : pendingIssues.length}
                      </p>
                    </div>
                    <Clock className="w-12 h-12 text-red-500" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Resolved Issues</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {loading ? '...' : resolvedIssues.length}
                      </p>
                    </div>
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && issues.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading issues...</span>
                </div>
              )}

              {/* Empty State */}
              {!loading && issues.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-600 text-lg">No issues found</p>
                </div>
              )}

              {/* Issues List */}
              {!loading && issues.length > 0 && (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className={`p-6 rounded-lg shadow-md transition-all ${
                        issue.status === 'Pending'
                          ? 'bg-red-50 border-2 border-red-300'
                          : 'bg-green-50 border-2 border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-full ${
                              issue.status === 'Pending'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {issue.status === 'Pending' ? (
                              <Clock className="w-6 h-6" />
                            ) : (
                              <CheckCircle2 className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Room {issue.room} - {issue.issue}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Reported: {formatDate(issue.reported_at)}
                            </p>
                            <span
                              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                                issue.status === 'Pending'
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {issue.status}
                            </span>
                          </div>
                        </div>
                        {issue.status === 'Pending' && (
                          <button
                            onClick={() => handleResolve(issue.id)}
                            disabled={resolvingId === issue.id}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {resolvingId === issue.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Resolving...
                              </>
                            ) : (
                              'Resolve'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'Reports' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <p className="text-gray-600">Reports functionality coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'Settings' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <p className="text-gray-600">Settings functionality coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
