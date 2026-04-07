import { FileText, CheckCircle, Star, MessageSquare, ClipboardCheck, HelpCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';

import { api } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Button, Card } from '../components/ui.jsx';

export default function CoursePage() {
  const { id } = useParams();
  const courseId = Number(id);

  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [message, setMessage] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [viewedPdfs, setViewedPdfs] = useState(new Set());
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => api.getCourse(courseId, token),
    enabled: Number.isFinite(courseId)
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: () => api.listReviews(courseId),
    enabled: Number.isFinite(courseId)
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.enroll(courseId, token),
    onSuccess: () => {
      setMessage('Enrolled successfully.');
      void qc.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: (e) => setMessage(e.message)
  });

  const lessons = useMemo(() => data?.lessons ?? [], [data]);
  const isEnrolled = useMemo(() => data?.isEnrolled ?? false, [data]);
  const hasCertificate = useMemo(() => data?.hasCertificate ?? false, [data]);
  const canEnroll = useMemo(() => !user || ['STUDENT', 'ADMIN'].includes(user.role), [user]);
  const allCompleted = useMemo(() => {
    if (lessons.length === 0) return false;
    return lessons.every((l) => l.progress?.[0]?.completedAt);
  }, [lessons]);

  const { data: quizData } = useQuery({
    queryKey: ['course-quiz', courseId],
    queryFn: () => api.getCourseQuiz(courseId, token),
    enabled: Number.isFinite(courseId) && !!token && isEnrolled && allCompleted && !hasCertificate
  });

  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  const submitQuizMutation = useMutation({
    mutationFn: () => api.submitQuiz(courseId, quizAnswers, token),
    onSuccess: (res) => {
      setQuizResult(res);
      if (res.certificateIssued) {
        setMessage('Congratulations! You passed the quiz and earned your certificate!');
        void qc.invalidateQueries({ queryKey: ['course', courseId] });
      } else if (!res.passed) {
        setMessage(`You scored ${res.score}%. You need 80% to pass. Please try again.`);
      }
    }
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId) => api.setLessonProgress(courseId, lessonId, { completed: true }, token),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['course', courseId] });
      void res;
    },
    onSettled: () => setCompletingId(null)
  });

  const handleViewPdf = (lessonId, pdfUrl) => {
    setViewedPdfs((prev) => new Set([...prev, lessonId]));
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const reviewMutation = useMutation({
    mutationFn: () => api.submitReview(courseId, { rating, comment }, token),
    onSuccess: () => {
      setMessage('Review submitted! Thank you.');
      setComment('');
      void qc.invalidateQueries({ queryKey: ['course', courseId] });
      void qc.invalidateQueries({ queryKey: ['course-reviews', courseId] });
    },
    onError: (e) => setMessage(e.message)
  });

  return (
    <div>
      <div className="mb-6">
        <Link to="/courses" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
          ← Back to courses
        </Link>
      </div>

      {isLoading && <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>}
      {error && <div className="text-sm text-rose-700 dark:text-rose-300">{error.message}</div>}

      {data && (
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-8 overflow-hidden rounded-[2.5rem] border border-amber-200/60 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="relative h-52 w-full">
                <img
                  src={data.bannerUrl || '/assets/img/banner.png'}
                  alt="Course banner"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/0" />
                <div className="absolute bottom-5 left-6 right-6">
                  <div className="text-xs font-medium text-white/80">Course</div>
                  <div className="mt-1 text-2xl font-semibold text-white">{data.title}</div>
                </div>
              </div>
            </div>

            <div className="mb-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="h-24 w-24 rounded-3xl bg-brand-100 dark:bg-brand-900/30 overflow-hidden flex items-center justify-center text-3xl font-black text-brand-600 shadow-inner">
                <img 
                  src="/assets/img/Logo.png" 
                  alt="Indra Cyber School"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden">{data.instructor.email.slice(0, 1).toUpperCase()}</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                    {data.instructor.email.split('@')[0]}
                  </h1>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-950/30">
                    <span className="text-emerald-500 text-sm">✔</span>
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Verified Tutor</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Instructor</div>
              </div>
            </div>

            <div className="space-y-12">
              <section className="rounded-3xl border border-slate-100 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/20 shadow-sm">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <span className="h-8 w-1 bg-brand-600 rounded-full"></span>
                  About the Tutor
                </h2>
                <div className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                  {data.description || "Professional cybersecurity instructor at Indra Cyber Institute. I specialize in making complex technical concepts easy to understand through hands-on practice and personalized guidance."}
                </div>
                <div className="mt-8 flex flex-wrap gap-6 border-t border-slate-50 pt-8 dark:border-slate-800/50">
                   <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Response time</span>
                      <span className="font-bold text-slate-900 dark:text-white">Very responsive</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Lessons taught</span>
                      <span className="font-bold text-slate-900 dark:text-white">450+</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Students</span>
                      <span className="font-bold text-slate-900 dark:text-white">82</span>
                   </div>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-2xl font-black">Curriculum</h2>
                  <div className="text-sm font-black text-brand-600 uppercase tracking-widest">
                    {lessons.length} Modules
                  </div>
                </div>
                <div className="space-y-4">
                  {lessons.map((l) => (
                    <div
                      key={l.id}
                      className="group rounded-2xl border-2 border-slate-800/50 bg-slate-900/40 p-6 transition-all hover:border-brand-500/30 hover:shadow-xl"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-sm font-black text-slate-500 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                          {l.order}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-black text-white group-hover:text-brand-600 transition-colors">{l.title}</h3>
                          {l.content && <p className="mt-2 text-base text-slate-400 leading-relaxed">{l.content}</p>}
                        </div>
                        </div>

                        {token && (
                          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
                            <div className="flex items-center gap-3">
                              {l.pdfUrl ? (
                                <button
                                  onClick={() => handleViewPdf(l.id, l.pdfUrl)}
                                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                                >
                                  <FileText size={14} />
                                  <span>View PDF</span>
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic">No PDF available</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {l.progress?.[0]?.completedAt ? (
                                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                                  <CheckCircle size={12} />
                                  <span>Completed</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                  <Button
                                    variant="secondary"
                                    className="!py-1.5 !text-[10px] font-black uppercase tracking-wider"
                                    disabled={completingId === l.id || (l.pdfUrl && !viewedPdfs.has(l.id))}
                                    onClick={() => {
                                      setCompletingId(l.id);
                                      completeMutation.mutate(l.id);
                                    }}
                                  >
                                    {completingId === l.id ? 'Saving...' : 'Mark as Attended'}
                                  </Button>
                                  {l.pdfUrl && !viewedPdfs.has(l.id) && (
                                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-tighter">View PDF first</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {lessons.length === 0 && (
                    <div className="rounded-3xl border-2 border-dashed border-slate-100 p-12 text-center text-slate-500 dark:border-slate-800">
                      <div className="text-4xl mb-4 opacity-20 text-brand-600 font-black italic underline decoration-wavy">IC</div>
                      <p className="font-bold">The tutor is currently finalizing the course material.</p>
                    </div>
                  )}
                </div>

                {/* Reviews Section */}
                <div className="mt-16">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h2 className="text-2xl font-black">Student Reviews</h2>
                    <div className="text-sm font-black text-brand-600 uppercase tracking-widest">
                      {reviewsData?.length || 0} Feedback
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {reviewsData?.map((r) => (
                      <Card key={r.id} className="!bg-slate-900/40 border-slate-800/50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                              <span className="text-xs font-black text-brand-500 uppercase">
                                {r.user.email.substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{r.user.email.split('@')[0]}</div>
                              <div className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= r.rating ? 'fill-amber-500' : 'text-slate-700'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                          "{r.comment || 'No comment provided.'}"
                        </p>
                      </Card>
                    ))}
                    {(!reviewsData || reviewsData.length === 0) && (
                      <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                        <MessageSquare className="mx-auto mb-4 opacity-20" size={48} />
                        <p className="font-bold">No reviews yet. Be the first to share your experience!</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-10">
              <Card className="!p-8 border-brand-100 shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:border-slate-800 dark:shadow-[0_30px_60px_rgba(0,0,0,0.3)] !rounded-[2.5rem]">
                <div className="mb-8 flex items-baseline justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pricing</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white italic">Active</div>
                  </div>
                  <div className="text-right">
                    <div className="flex text-brand-500 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-lg leading-none">
                          {s <= (data.avgRating || 0) ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest underline decoration-slate-200">
                      {data.reviewsCount || 0} Reviews
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {isEnrolled && allCompleted && quizData && (
                    <Card className="!bg-slate-900/60 border-brand-500/30 p-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-500">
                          <ClipboardCheck size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Course Final Quiz</h3>
                          <p className="text-sm text-slate-400">Answer 5 questions to earn your certificate (80% pass score)</p>
                        </div>
                      </div>

                      {quizResult ? (
                        <div className="space-y-6">
                          <div className={`p-6 rounded-2xl text-center ${quizResult.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                            <div className="text-4xl font-black mb-2 text-white">{quizResult.score}%</div>
                            <div className={`text-sm font-bold uppercase tracking-widest ${quizResult.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {quizResult.passed ? 'PASSED - Certificate Issued!' : 'FAILED - Try Again'}
                            </div>
                          </div>
                          {!quizResult.passed && (
                            <Button 
                              variant="secondary" 
                              className="w-full"
                              onClick={() => {
                                setQuizResult(null);
                                setQuizAnswers([]);
                              }}
                            >
                              Restart Quiz
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {quizData.questions.map((q, idx) => (
                            <div key={q.id} className="space-y-4">
                              <div className="text-sm font-bold text-slate-200">
                                {idx + 1}. {q.prompt}
                              </div>
                              <div className="grid gap-3">
                                {JSON.parse(q.options).map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() => {
                                      const newAnswers = quizAnswers.filter(a => a.questionId !== q.id);
                                      newAnswers.push({ questionId: q.id, selectedOption: opt });
                                      setQuizAnswers(newAnswers);
                                    }}
                                    className={`w-full text-left p-4 rounded-xl text-sm transition-all border-2 ${
                                      quizAnswers.find(a => a.questionId === q.id)?.selectedOption === opt
                                        ? 'border-brand-500 bg-brand-500/10 text-white shadow-lg shadow-brand-500/20'
                                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                          <Button
                            className="w-full mt-8"
                            disabled={quizAnswers.length < 5 || submitQuizMutation.isPending}
                            onClick={() => submitQuizMutation.mutate()}
                          >
                            {submitQuizMutation.isPending ? 'Submitting...' : 'Submit Final Quiz'}
                          </Button>
                        </div>
                      )}
                    </Card>
                  )}

                  {isEnrolled && allCompleted && !quizData && (
                    <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 text-center text-slate-500">
                      <HelpCircle className="mx-auto mb-4 opacity-20" size={48} />
                      <p className="font-bold">Wait for the tutor to add a final quiz to earn your certificate.</p>
                    </div>
                  )}

                  {isEnrolled && allCompleted && hasCertificate && (
                    <Card className="!bg-slate-900/60 border-brand-500/30">
                      <div className="text-sm font-bold text-white mb-3">Leave a review</div>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setRating(s)}
                            className={`text-xl ${s <= rating ? 'text-brand-500' : 'text-slate-600'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Share your experience..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-brand-500 min-h-[60px]"
                      />
                      <Button
                        variant="primary"
                        className="w-full mt-2 !py-2 !text-xs"
                        disabled={reviewMutation.isPending}
                        onClick={() => reviewMutation.mutate()}
                      >
                        {reviewMutation.isPending ? 'Sending...' : 'Submit Review'}
                      </Button>
                    </Card>
                  )}

                  {!token ? (
                    <Link to="/login">
                      <Button className="w-full !py-5 text-lg font-black shadow-2xl shadow-brand-500/40 rounded-2xl">
                        Log in to enroll
                      </Button>
                    </Link>
                  ) : !canEnroll ? (
                    <Button
                      className="w-full !py-5 text-lg font-black shadow-2xl shadow-brand-500/10 rounded-2xl"
                      variant="secondary"
                      disabled
                    >
                      Instructor accounts cannot enroll
                    </Button>
                  ) : isEnrolled ? (
                    <Button
                      className="w-full !py-5 text-lg font-black shadow-2xl shadow-emerald-500/10 rounded-2xl"
                      variant="secondary"
                      disabled
                    >
                      You are already enrolled
                    </Button>
                  ) : (
                    <Button
                      className="w-full !py-5 text-lg font-black shadow-2xl shadow-brand-500/40 rounded-2xl"
                      onClick={() => enrollMutation.mutate()}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? 'Processing…' : 'Enroll now'}
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Fast response: 2h average</span>
                  </div>
                </div>

                <div className="mt-10 space-y-5 border-t border-slate-100 pt-8 dark:border-slate-800">
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs dark:bg-emerald-950/50">✓</span>
                    <span>100% Satisfaction Guarantee</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs dark:bg-emerald-950/50">✓</span>
                    <span>Verified Academic Background</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xs dark:bg-emerald-950/50">✓</span>
                    <span>Hand-picked by Indra Institute</span>
                  </div>
                </div>

                {message && (
                  <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm font-black text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 animate-bounce">
                    {message}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
