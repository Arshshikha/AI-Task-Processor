import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Plus, 
  Sparkles, 
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';

interface Task {
  _id: string;
  title: string;
  inputText: string;
  operation: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result: any;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { token, apiUrl } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Task form state
  const [title, setTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [operation, setOperation] = useState('uppercase');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch tasks helper
  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Polling for pending/running tasks
  useEffect(() => {
    const hasActiveTasks = tasks.some(task => task.status === 'pending' || task.status === 'running');
    if (!hasActiveTasks) return;

    const interval = setInterval(() => {
      fetchTasks(true); // silent update
    }, 2000);

    return () => clearInterval(interval);
  }, [tasks, fetchTasks]);

  // Handle Form Submission (Create task)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const res = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, inputText, operation }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit task.');
      }

      // Reset form
      setTitle('');
      setInputText('');
      setOperation('uppercase');
      
      // Refresh tasks
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || 'Something went wrong.');
    } finally {
      setFormLoading(false);
    }
  };

  // Stats computation
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    success: tasks.filter(t => t.status === 'success').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Total Stats Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Pending Stats Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending</p>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pending}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Running Stats Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Running</p>
            <h3 className="text-2xl font-extrabold text-blue-400 mt-1">{stats.running}</h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        </div>

        {/* Success Stats Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Success</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.success}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Failed Stats Card */}
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between shadow-lg col-span-2 md:col-span-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Failed</p>
            <h3 className="text-2xl font-extrabold text-rose-400 mt-1">{stats.failed}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-400">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Layout grid: Form Left, Tasks Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Run Task Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl p-6 shadow-xl sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Trigger New AI Task</h2>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/25 p-3 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Analyze logs, format text, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Operation Type
                </label>
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-white bg-slate-900 text-sm"
                >
                  <option value="uppercase">Uppercase Converter</option>
                  <option value="lowercase">Lowercase Converter</option>
                  <option value="reverse">Reverse String</option>
                  <option value="word_count">Word Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Input String Data
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Provide text content here for AI processing..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-white placeholder-slate-600 text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-semibold transition border border-indigo-500/50 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {formLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Run Task</span>
                    <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-400" />
              <span>Execution Records</span>
            </h2>
            <button 
              onClick={() => fetchTasks()} 
              className="p-2 hover:bg-slate-900 rounded-lg border border-slate-900 hover:border-slate-800 transition text-slate-400 hover:text-white"
              title="Refresh lists"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500 mx-auto mb-4"></div>
              <span>Fetching logs and task databases...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border-dashed border-2 border-slate-800/60">
              <Layers className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No tasks found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Create and run a task using the panel on the left to start processing text.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task._id} 
                  onClick={() => navigate(`/tasks/${task._id}`)}
                  className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer shadow-md"
                >
                  <div className="space-y-1.5 max-w-lg">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-100">{task.title}</span>
                      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full border bg-slate-900 text-slate-400 border-slate-800">
                        {task.operation.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      Input: {task.inputText}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Created: {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {/* Dynamic Status Badges */}
                    {task.status === 'pending' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Pending</span>
                      </span>
                    )}
                    {task.status === 'running' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Running</span>
                      </span>
                    )}
                    {task.status === 'success' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Success</span>
                      </span>
                    )}
                    {task.status === 'failed' && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Failed</span>
                      </span>
                    )}

                    <div className="text-slate-400 hover:text-indigo-400 transition-colors p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
