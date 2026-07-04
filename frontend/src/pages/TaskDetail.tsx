import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Copy, 
  Check, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  inputText: string;
  operation: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result: any;
  logs: string;
  createdAt: string;
  updatedAt: string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);

  const consoleContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of window on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch single task details helper
  const fetchTaskDetails = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } catch (err) {
      console.error('Failed to fetch task:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [apiUrl, id, token]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  // Polling logic: poll every 1.5 seconds if status is pending or running
  useEffect(() => {
    if (!task) return;
    if (task.status !== 'pending' && task.status !== 'running') return;

    const interval = setInterval(() => {
      fetchTaskDetails(true);
    }, 1500);

    return () => clearInterval(interval);
  }, [task, fetchTaskDetails]);

  // Auto Scroll to bottom of terminal console container only
  useEffect(() => {
    if (consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
    }
  }, [task?.logs]);

  // Copy to clipboard helper
  const copyToClipboard = () => {
    if (!task || task.result === null) return;
    navigator.clipboard.writeText(task.result.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Retry handler
  const handleRetry = async () => {
    if (!task) return;
    setRetryLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks/${task._id}/retry`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchTaskDetails();
      }
    } catch (err) {
      console.error('Retry execution failed:', err);
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading && !task) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
        <XCircle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Task Not Found</h3>
        <p className="text-sm mt-1">The task you are looking for does not exist or has been deleted.</p>
        <button onClick={() => navigate('/')} className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 mx-auto">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          {task.status === 'failed' && (
            <button
              onClick={handleRetry}
              disabled={retryLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition text-xs font-semibold disabled:opacity-50"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${retryLoading ? 'animate-spin' : ''}`} />
              <span>Retry Task</span>
            </button>
          )}

          {/* Dynamic Badge */}
          {task.status === 'pending' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="h-4 w-4" />
              <span>Pending</span>
            </span>
          )}
          {task.status === 'running' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Running</span>
            </span>
          )}
          {task.status === 'success' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <span>Success</span>
            </span>
          )}
          {task.status === 'failed' && (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="h-4 w-4" />
              <span>Failed</span>
            </span>
          )}
        </div>
      </div>

      {/* Task Details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Meta details & input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-slate-900 pb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <span>Task Information</span>
            </h2>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Title</span>
              <p className="text-sm font-medium text-slate-200 mt-0.5">{task.title}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Operation</span>
              <p className="text-sm font-semibold text-indigo-400 mt-0.5 capitalize">{task.operation.replace('_', ' ')}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Task ID</span>
              <p className="text-xs text-slate-400 font-mono mt-0.5 break-all">{task._id}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Created At</span>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(task.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Last Updated</span>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(task.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Original Input Text Card */}
          <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Original Input Text</span>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-slate-300 text-sm max-h-48 overflow-y-auto font-sans break-all terminal-scrollbar">
              {task.inputText}
            </div>
          </div>
        </div>

        {/* Console logs & Result display */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Result Card */}
          {task.status === 'success' && (
            <div className="glass-panel border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Processed Result</span>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition rounded-lg"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950/80 border border-emerald-500/20 p-4 rounded-xl text-slate-100 font-mono text-base break-all max-h-48 overflow-y-auto terminal-scrollbar">
                {task.result}
              </div>
            </div>
          )}

          {/* Logs Terminal Console */}
          <div className="glass-panel rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5 text-indigo-400" />
              <span>Real-time Execution Console Logs</span>
            </h3>

            {/* Simulated Console Screen */}
            <div 
              ref={consoleContainerRef}
              className="bg-black/95 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-emerald-400 h-96 overflow-y-auto terminal-scrollbar space-y-1.5 flex flex-col justify-start relative shadow-inner"
            >
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
              </div>

              <div className="text-slate-500 border-b border-slate-900 pb-2 mb-2">
                $ cat task_logs_{task._id}.log
              </div>

              {task.logs ? (
                task.logs.split('\n').filter(Boolean).map((log, index) => (
                  <div key={index} className="leading-5">
                    <span className="text-slate-500 mr-2">[{index + 1}]</span>
                    <span>{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 animate-pulse">Waiting for logs from queue worker...</div>
              )}
              
              {/* Dynamic blinking cursor on active tasks */}
              {(task.status === 'pending' || task.status === 'running') && (
                <div className="text-indigo-400 flex items-center gap-1 text-[11px] font-semibold animate-pulse mt-2">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default TaskDetail;
