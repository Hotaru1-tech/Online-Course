import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';

import { apiFetch } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card, Input } from '../components/ui.jsx';

function canAccess(user) {
  return user && ['INSTRUCTOR', 'ADMIN'].includes(user.role);
}

export default function InstructorDashboard() {
  const { token, user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [error, setError] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: () => apiFetch('/api/instructor/courses', { token })
  });

  const courses = useMemo(() => data ?? [], [data]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/instructor/courses', {
        method: 'POST',
        token,
        body: JSON.stringify({ title, description: description || undefined, bannerUrl: bannerUrl || undefined })
      }),
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setBannerUrl('');
      setError(null);
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
    },
    onError: (e) => setError(e.message)
  });

  const deleteCourse = useMutation({
    mutationFn: (courseId) => apiFetch(`/api/instructor/courses/${courseId}`, { method: 'DELETE', token }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
    },
    onError: (e) => setError(e.message)
  });

  if (!canAccess(user)) return <Navigate to="/login" replace />;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Instructor</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Create, publish, and structure your courses.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-sm font-semibold">Create course</div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. JavaScript Fundamentals" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short course description" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Banner image URL</label>
              <Input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
              />
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <img
                  src={bannerUrl || '/assets/img/banner.png'}
                  alt="Course banner preview"
                  className="h-24 w-full object-cover"
                />
              </div>
            </div>
            {error && <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-sm">{error}</div>}
            <Button
              className="w-full"
              disabled={!title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating…' : 'Create draft'}
            </Button>
            <div className="text-xs text-slate-500">Draft courses are only visible here until published.</div>
          </div>
        </Card>

        <div className="lg:col-span-2">
          <div className="mb-3 text-sm font-semibold">Your courses</div>
          {isLoading && <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <Link key={c.id} to={`/instructor/courses/${c.id}`} className="block">
                <Card className="transition hover:-translate-y-0.5 hover:border-slate-300 dark:hover:border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold leading-tight">{c.title}</div>
                      <div className="mt-1 text-xs text-slate-500">Lessons: {c.lessons.length}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div
                        className={
                          'rounded-full px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider ' +
                          (c.published
                            ? 'border border-emerald-900/40 bg-emerald-950/30 text-emerald-400'
                            : 'border border-slate-800 bg-slate-900 text-slate-400')
                        }
                      >
                        {c.published ? 'Published' : 'Draft'}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/instructor/courses/${c.id}/analytics`}
                          className="flex-1 rounded-lg bg-slate-800 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-slate-700 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Analytics
                        </Link>
                        <Link
                          to={`/instructor/courses/${c.id}/quiz`}
                          className="flex-1 rounded-lg bg-amber-500/10 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500 hover:text-white transition border border-amber-500/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Quiz
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
                              deleteCourse.mutate(c.id);
                            }
                          }}
                          className="rounded-lg bg-rose-500/10 p-1.5 text-rose-500 hover:bg-rose-500 transition border border-rose-500/20 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
