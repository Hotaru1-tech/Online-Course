import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Card } from '../components/ui.jsx';

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.listCourses()
  });

  const filteredCourses = useMemo(() => {
    const courses = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return courses;

    return courses.filter((course) => {
      const title = course.title?.toLowerCase() ?? '';
      const description = course.description?.toLowerCase() ?? '';
      const instructor = course.instructor?.email?.toLowerCase() ?? '';
      return title.includes(term) || description.includes(term) || instructor.includes(term);
    });
  }, [data, search]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Course catalog</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Browse curated learning paths. Enroll and track your progress — clean UX, real projects, deploy-ready skills.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">🔍</div>
            <input
              className="h-11 w-full rounded-2xl border border-amber-200/60 bg-white pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              placeholder="Search courses…"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-200/60 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            {filteredCourses.length} available
          </div>
        </div>
      </div>

      {isLoading && <div className="text-sm text-slate-600 dark:text-slate-400">Loading…</div>}
      {error && <div className="text-sm text-rose-700 dark:text-rose-300">{error.message}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        {filteredCourses.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="group block">
            <Card className="!p-0 overflow-hidden border-amber-200/60 bg-white shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-col sm:flex-row">
                <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-56">
                  <img src={c.bannerUrl || '/assets/img/banner.png'} alt={c.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-900 backdrop-blur">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Indra Cyber School
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Instructor</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {c.instructor.email}
                  </div>

                  <div className="mt-4 text-lg font-semibold leading-snug text-slate-900 dark:text-white">
                    {c.title}
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {c.description || 'No description provided yet.'}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-amber-100/70 pt-4 text-sm dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Lessons: {c._count?.lessons ?? 0}
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition group-hover:translate-x-0.5 dark:text-amber-300">
                      View course
                      <span aria-hidden>→</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {!isLoading && !error && filteredCourses.length === 0 && (
        <div className="rounded-3xl border border-dashed border-amber-200/70 bg-white/70 px-6 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">No courses match your search</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Try another keyword, instructor email, or a broader topic.
          </div>
        </div>
      )}
    </div>
  );
}
