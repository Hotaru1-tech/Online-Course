import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card, Input } from '../components/ui.jsx';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api.register({ email, password, role });
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
            Create your account
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Start your roadmap</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            Join Indra Cyber School and learn with a clean path — fundamentals to real projects.
          </p>

          <Card className="mt-8 border-amber-200/60 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Email address</label>
                <Input
                  type="email"
                  placeholder="name@domain.com"
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
                    placeholder="Min 8 characters"
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">I want to join as</label>
                <select
                  className="w-full h-12 rounded-lg px-4 text-sm font-medium outline-none transition bg-slate-950/40 border border-slate-800 text-slate-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="STUDENT">Student - Learn & Enroll</option>
                  <option value="INSTRUCTOR">Instructor - Create Courses</option>
                </select>
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
                {loading ? 'Creating account...' : 'Create account'}
              </Button>

              <div className="text-center text-slate-300 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
                  Sign in
                </Link>
              </div>
            </form>
          </Card>

          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300 backdrop-blur">
            <div className="font-semibold text-white">Why join?</div>
            <div className="mt-1">Expert instructors • Personalized paths • Real-world labs</div>
          </div>
        </div>

        <div className="hidden lg:col-span-7 lg:block">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-800 bg-slate-950 shadow-2xl">
            <img src="/assets/img/banner.png" alt="Indra Cyber School" className="h-[520px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <img src="/assets/img/Logo.png" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Your learning, structured</div>
                    <div className="text-xs text-slate-400">Tracks • Courses • Certifications</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
