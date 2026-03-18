import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card, Input } from '../components/ui.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api.login({ email, password });
      setAuth({ user, token });
      navigate('/courses');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-grid opacity-[0.06]" />
      <div className="pointer-events-none fixed inset-0 bg-radial-glow" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-200 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Sign in to continue
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Access your Indra Cyber School dashboard and continue your learning roadmap.
          </p>

          <Card className="mt-8 border-amber-200/60 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Email address</label>
              <Input
                type="email"
                placeholder="student@demo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Student123!"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-20"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button 
              disabled={loading} 
              className="w-full h-12 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-lg"
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="grid gap-2">
              <div className="text-[11px] font-medium text-slate-400">Quick fill demo account</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="h-10 rounded-2xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    setEmail('student@demo.com');
                    setPassword('Student123!');
                  }}
                >
                  Student
                </button>
                <button
                  type="button"
                  className="h-10 rounded-2xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    setEmail('instructor@demo.com');
                    setPassword('Instructor123!');
                  }}
                >
                  Instructor
                </button>
                <button
                  type="button"
                  className="h-10 rounded-2xl border border-slate-800 bg-slate-900 text-xs font-medium text-slate-200 hover:bg-slate-800"
                  onClick={() => {
                    setEmail('admin@demo.com');
                    setPassword('Admin123!');
                  }}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="text-center text-slate-300">
              Don't have an account?{' '}
              <Link to="/signup" className="text-amber-400 hover:text-amber-300 font-semibold">
                Sign up for free
              </Link>
            </div>
            </form>
          </Card>
        </div>

        <div className="hidden lg:col-span-7 lg:block">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950 shadow-2xl">
            <img src="/assets/img/banner.png" alt="Indra Cyber School" className="h-[520px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <img src="/assets/img/Logo.png" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Create your brightest roadmap</div>
                    <div className="text-xs text-slate-400">Courses • Labs • Projects</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-amber-400">Indra Cyber School</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
