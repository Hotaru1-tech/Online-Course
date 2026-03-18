import { useQuery } from '@tanstack/react-query';
import { Link, useParams, Navigate } from 'react-router-dom';
import { apiFetch } from '../lib/api.js';
import { useAuth } from '../state/auth.jsx';
import { Card, Button } from '../components/ui.jsx';

export default function InstructorAnalyticsPage() {
  const { id } = useParams();
  const courseId = Number(id);
  const { token, user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['instructor', 'analytics', courseId],
    queryFn: () => apiFetch(`/api/instructor/courses/${courseId}/analytics`, { token }),
    enabled: !!token && !!courseId
  });

  if (!user || !['INSTRUCTOR', 'ADMIN'].includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/instructor" className="text-sm text-slate-400 hover:text-white transition">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-white">Course Analytics</h1>
          <p className="text-slate-400">Track student progress and course efficiency.</p>
        </div>
      </div>

      {isLoading && <div className="text-white">Loading analytics...</div>}
      {error && <div className="text-rose-500">Error: {error.message}</div>}

      {data && (
        <>
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Students</span>
              <span className="text-3xl font-bold text-white">{data.enrollmentsCount}</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completion Rate</span>
              <span className="text-3xl font-bold text-emerald-500">{data.completionRate}%</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Avg. Rating</span>
              <span className="text-3xl font-bold text-amber-500">{data.avgRating?.toFixed(1) || 'N/A'} ★</span>
            </Card>
            <Card className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reviews</span>
              <span className="text-3xl font-bold text-white">{data.reviewsCount}</span>
            </Card>
          </div>

          {/* Lesson Attendance Chart (Simple CSS implementation) */}
          <Card>
            <h3 className="text-lg font-bold text-white mb-6">Lesson Attendance</h3>
            <div className="flex h-64 items-end gap-2 px-2">
              {data.lessonChart.map((l) => (
                <div key={l.lessonId} className="group relative flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-brand-600/40 border border-brand-500/50 rounded-t-lg transition-all group-hover:bg-brand-500/60"
                    style={{ height: `${data.enrollmentsCount > 0 ? (l.completedCount / data.enrollmentsCount) * 100 : 0}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-[10px] text-white px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-10">
                      {l.completedCount} students
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 rotate-45 origin-left truncate max-w-[60px] mt-2">
                    {l.title}
                  </div>
                </div>
              ))}
              {data.lessonChart.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-500 italic">
                  No lessons found for this course.
                </div>
              )}
            </div>
            <div className="mt-12 text-xs text-slate-500 text-center uppercase tracking-widest font-bold">
              Lessons (Order)
            </div>
          </Card>

          {/* Student Progress Table */}
          <Card className="overflow-hidden p-0">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Student Progress</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-900/50 text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Student Email</th>
                    <th className="px-6 py-4">Enrolled At</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.studentsTable.map((s) => (
                    <tr key={s.userId} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4 text-white font-medium">{s.email}</td>
                      <td className="px-6 py-4 text-slate-400">{new Date(s.enrolledAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-500 transition-all" 
                              style={{ width: `${s.completionPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-300 w-8">{s.completionPct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {s.completionPct === 100 ? (
                          <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-700">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.studentsTable.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                        No students enrolled yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
