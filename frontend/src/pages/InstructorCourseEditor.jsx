import { FileText, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';

import { apiFetch } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card, Input } from '../components/ui.jsx';

function canAccess(user) {
  return user && ['INSTRUCTOR', 'ADMIN'].includes(user.role);
}

export default function InstructorCourseEditor() {
  const { id } = useParams();
  const courseId = Number(id);

  const { token, user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const { data } = useQuery({
    queryKey: ['instructor', 'course', courseId],
    enabled: Number.isFinite(courseId),
    queryFn: async () => {
      const courses = await apiFetch('/api/instructor/courses', { token });
      const c = courses.find((x) => x.id === courseId);
      if (!c) throw new Error('Not found');
      setTitle(c.title);
      setDescription(c.description || '');
      setBannerUrl(c.bannerUrl || '');
      return c;
    }
  });

  const lessons = useMemo(() => (data?.lessons ?? []).slice().sort((a, b) => a.order - b.order), [data]);

  const patchCourse = useMutation({
    mutationFn: (body) => apiFetch(`/api/instructor/courses/${courseId}`, { method: 'PATCH', token, body: JSON.stringify(body) }),
    onSuccess: () => {
      setMessage('Saved.');
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      void qc.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
    },
    onError: (e) => setMessage(e.message)
  });

  const addLesson = useMutation({
    mutationFn: () =>
      apiFetch(`/api/instructor/courses/${courseId}/lessons`, {
        method: 'POST',
        token,
        body: JSON.stringify({ 
          title: lessonTitle, 
          content: lessonContent || undefined,
          pdfUrl: lessonPdfUrl || undefined 
        })
      }),
    onSuccess: () => {
      setLessonTitle('');
      setLessonContent('');
      setLessonPdfUrl('');
      setMessage('Lesson added.');
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      void qc.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
    },
    onError: (e) => setMessage(e.message)
  });

  const deleteLesson = useMutation({
    mutationFn: (lessonId) => apiFetch(`/api/instructor/lessons/${lessonId}`, { method: 'DELETE', token }),
    onSuccess: () => {
      setMessage('Lesson removed.');
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
      void qc.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
    },
    onError: (e) => setMessage(e.message)
  });

  const reorderLessons = useMutation({
    mutationFn: (lessonIds) =>
      apiFetch(`/api/instructor/courses/${courseId}/lessons/reorder`, {
        method: 'POST',
        token,
        body: JSON.stringify({ lessonIds })
      }),
    onSuccess: () => {
      setMessage('Reordered.');
      void qc.invalidateQueries({ queryKey: ['instructor', 'course', courseId] });
      void qc.invalidateQueries({ queryKey: ['instructor', 'courses'] });
    },
    onError: (e) => setMessage(e.message)
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setMessage('Only PDF files are allowed');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setLessonPdfUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${data.url}`);
      setMessage('PDF uploaded successfully');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (!canAccess(user)) return <Navigate to="/login" replace />;

  function move(lessonId, dir) {
    const idx = lessons.findIndex((l) => l.id === lessonId);
    if (idx < 0) return;
    const next = lessons.slice();
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = tmp;
    reorderLessons.mutate(next.map((l) => l.id));
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/instructor"
          className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← Back to instructor
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="text-sm font-semibold">Course settings</div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Banner image URL</label>
              <Input value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." />
              <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <img
                  src={bannerUrl || data?.bannerUrl || '/assets/img/banner.png'}
                  alt="Course banner preview"
                  className="h-24 w-full object-cover"
                />
              </div>
            </div>
            <Button
              className="w-full"
              variant="secondary"
              disabled={patchCourse.isPending || !title.trim()}
              onClick={() =>
                patchCourse.mutate({
                  title,
                  description: description || null,
                  bannerUrl: bannerUrl || null
                })
              }
            >
              {patchCourse.isPending ? 'Saving…' : 'Save'}
            </Button>

            <div className="mt-2 flex gap-2">
              <Button
                className="flex-1"
                disabled={patchCourse.isPending}
                onClick={() => patchCourse.mutate({ published: true })}
              >
                Publish
              </Button>
              <Button
                className="flex-1"
                variant="secondary"
                disabled={patchCourse.isPending}
                onClick={() => patchCourse.mutate({ published: false })}
              >
                Unpublish
              </Button>
            </div>

            {message && <div className="text-sm text-slate-300">{message}</div>}
          </div>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Lessons</div>
              <div className="text-xs text-slate-500">Use arrows to reorder</div>
            </div>

            <div className="space-y-3">
              {lessons.map((l) => (
                <div
                  key={l.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">
                      {l.order}. {l.title}
                    </div>
                    <div className="flex items-center gap-2">
                      {l.pdfUrl && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-brand-500/10 px-2 py-1 text-[10px] font-bold text-brand-400 border border-brand-500/20">
                          <FileText size={12} />
                          <span>PDF Attached</span>
                        </div>
                      )}
                      <Button variant="ghost" onClick={() => move(l.id, -1)} disabled={reorderLessons.isPending} className="!p-2">
                        <ChevronUp size={16} />
                      </Button>
                      <Button variant="ghost" onClick={() => move(l.id, 1)} disabled={reorderLessons.isPending} className="!p-2">
                        <ChevronDown size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => deleteLesson.mutate(l.id)}
                        disabled={deleteLesson.isPending}
                        className="!p-2 text-rose-500 hover:bg-rose-500/10 border-rose-500/20"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {lessons.length === 0 && <div className="text-sm text-slate-500">No lessons yet.</div>}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-sm font-semibold">Add lesson</div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Title</label>
                  <Input value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="Lesson 1" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Content</label>
                  <Input value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="Overview..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">PDF Document</label>
                  <div className="flex gap-2">
                    <Input 
                      value={lessonPdfUrl} 
                      onChange={(e) => setLessonPdfUrl(e.target.value)} 
                      placeholder="https://... or upload" 
                      className="flex-1"
                    />
                    <label className="relative cursor-pointer group">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 transition group-hover:text-white">
                        {uploading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                        ) : (
                          <Upload size={18} />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <Button
                className="mt-3"
                disabled={!lessonTitle.trim() || addLesson.isPending}
                onClick={() => addLesson.mutate()}
              >
                {addLesson.isPending ? 'Adding…' : 'Add lesson'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
