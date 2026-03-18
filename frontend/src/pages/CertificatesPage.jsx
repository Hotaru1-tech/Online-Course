import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Star, MessageSquare, X, Trash2 } from 'lucide-react';

import { api } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Card } from '../components/ui.jsx';

export default function CertificatesPage() {
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const [reviewingCourse, setReviewingCourse] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.listCertificates(token),
    enabled: Boolean(token)
  });

  const deleteCertMutation = useMutation({
    mutationFn: (id) => api.deleteCertificate(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificates'] });
    }
  });

  const reviewMutation = useMutation({
    mutationFn: (courseId) => api.submitReview(courseId, { rating, comment }, token),
    onSuccess: () => {
      setReviewingCourse(null);
      setComment('');
      setRating(5);
      void qc.invalidateQueries({ queryKey: ['certificates'] });
    }
  });

  const openReviewModal = (cert) => {
    const existingReview = cert.course.reviews?.[0];
    setReviewingCourse(cert.course);
    setRating(existingReview?.rating || 5);
    setComment(existingReview?.comment || '');
  };

  if (!token) {
    return (
      <Card className="max-w-2xl">
        <div className="text-lg font-semibold text-white">Log in required</div>
        <div className="mt-2 text-sm text-slate-300">Please log in to view your certificates.</div>
        <div className="mt-4">
          <Link className="text-sm font-semibold text-brand-500 hover:text-brand-400" to="/login">
            Go to login
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">My Certificates</h1>
        <p className="mt-2 text-sm text-slate-300">
          Certificates are issued automatically after you complete all lessons in a course.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950/40">
              <tr className="border-b border-slate-800 text-left text-slate-300">
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Instructor</th>
                <th className="px-5 py-3 font-semibold">Issued</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-5 py-5 text-slate-400" colSpan={4}>
                    Loading…
                  </td>
                </tr>
              )}

              {error && (
                <tr>
                  <td className="px-5 py-5 text-rose-300" colSpan={4}>
                    {error.message}
                  </td>
                </tr>
              )}

              {!isLoading && !error && (data?.length ?? 0) === 0 && (
                <tr>
                  <td className="px-5 py-5 text-slate-400" colSpan={4}>
                    No certificates yet. Complete a course to unlock your first certificate.
                  </td>
                </tr>
              )}

              {(data ?? []).map((c) => (
                <tr key={c.id} className="border-b border-slate-800/70 last:border-b-0">
                  <td className="px-5 py-4">
                    <Link className="font-semibold text-white hover:text-brand-400" to={`/courses/${c.courseId}`}>
                      {c.course?.title ?? `Course #${c.courseId}`}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{c.course?.instructor?.email ?? '—'}</td>
                  <td className="px-5 py-4 text-slate-400">{new Date(c.issuedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openReviewModal(c)}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand-600/10 px-3 py-1.5 text-xs font-bold text-brand-500 border border-brand-500/20 hover:bg-brand-600/20 transition"
                    >
                      <MessageSquare size={14} />
                      <span>{c.course.reviews?.length > 0 ? 'Edit Review' : 'Leave Review'}</span>
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
                            deleteCertMutation.mutate(c.id);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-lg bg-rose-500/10 p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition"
                        title="Delete Certificate"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      {reviewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <Card className="w-full max-w-md relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setReviewingCourse(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Course Review</h3>
            <p className="text-sm text-slate-400 mb-6">{reviewingCourse.title}</p>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        size={32}
                        className={s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you learned..."
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white outline-none focus:border-brand-500 transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setReviewingCourse(null)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate(reviewingCourse.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-sm font-bold text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20 transition disabled:opacity-50"
                >
                  {reviewMutation.isPending ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
