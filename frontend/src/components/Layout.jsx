import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';

export default function Layout() {
  const { user, clear } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCatalogLanding = location.pathname === '/courses' || location.pathname === '/';

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.03]" />
        
        <div className="relative mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/courses" className="group flex items-center gap-4">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 shadow-md transition-all group-hover:scale-110 group-hover:rotate-3 overflow-hidden border border-slate-800">
                  <img 
                    src="/assets/img/Logo.png" 
                    alt="Indra Cyber School"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="hidden text-xl font-black italic text-brand-600">I</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-black tracking-tighter text-white">INDRA</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Cyber School</div>
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/courses"
                  className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-brand-500"
                >
                  Find Tutors
                </Link>
                {user && (user.role === 'STUDENT' || user.role === 'ADMIN') && (
                  <Link
                    to="/certificates"
                    className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-brand-500"
                  >
                    Certificates
                  </Link>
                )}
                {user && (user.role === 'INSTRUCTOR' || user.role === 'ADMIN') && (
                  <Link
                    to="/instructor"
                    className="rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-brand-500"
                  >
                    Teaching
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-6 w-[1px] bg-slate-800 mx-1" />

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden lg:block text-right">
                    <div className="text-xs font-bold text-white">{user.email}</div>
                    <div className="text-[10px] uppercase tracking-wider text-brand-600 font-black">{user.role}</div>
                  </div>
                  <button
                    className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg transition-all hover:bg-white active:scale-95"
                    onClick={() => {
                      clear();
                      navigate('/courses');
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:text-brand-500"
                    to="/login"
                  >
                    Log in
                  </Link>
                  <Link
                    className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-black text-white shadow-xl shadow-brand-500/20 transition-all hover:bg-brand-500 hover:shadow-brand-500/40 active:scale-95"
                    to="/login"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isCatalogLanding && (
        <div className="relative overflow-hidden bg-slate-950 py-16">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_10%,rgba(245,158,11,0.10),transparent)]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold tracking-wide text-slate-200 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Creating Your Brightest Educational Roadmap
                </div>
                <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
                  Learn cybersecurity with a cleaner path — from fundamentals to real projects.
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Courses designed to be readable, practical, and career-focused — with labs, projects, and guidance along the way.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/courses"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-amber-600 px-6 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition hover:bg-amber-700"
                  >
                    Browse courses
                  </Link>
                  <Link
                    to={user ? '/courses' : '/signup'}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-amber-200/70 bg-white px-6 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  >
                    {user ? 'Continue learning' : 'Create a free account'}
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-3 gap-4 rounded-3xl border border-amber-200/50 bg-white/70 p-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
                  <div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white">50+</div>
                    <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Lessons</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white">10+</div>
                    <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tracks</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-slate-900 dark:text-white">1-on-1</div>
                    <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Mentorship</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-200/60 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                  <img
                    src="/assets/img/banner.png"
                    alt="Indra Cyber School"
                    className="h-[420px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fbf6ee]/60 via-transparent to-transparent dark:from-slate-950/40" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between rounded-2xl border border-amber-200/60 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-xl border border-amber-200/60 bg-white">
                          <img src="/assets/img/Logo.png" alt="Logo" className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">Indra Cyber School</div>
                          <div className="text-xs text-slate-500 dark:text-slate-300">Clean UI • Real skills • Deploy-ready</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">Since 2018</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              <div className="rounded-3xl border border-amber-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Structured learning</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Follow a clear roadmap: fundamentals → labs → projects.
                </div>
              </div>
              <div className="rounded-3xl border border-amber-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Instructor workspace</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Create courses, publish, and organize lessons in minutes.
                </div>
              </div>
              <div className="rounded-3xl border border-amber-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Modern stack</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  JWT, RBAC, REST + GraphQL, Prisma, Redis caching.
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-amber-200/60 bg-white/70 p-8 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
              <div className="grid gap-6 lg:grid-cols-3 lg:items-center">
                <div className="lg:col-span-2">
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">Ready to build your roadmap?</div>
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Create an account, enroll in a course, and start learning with a clean UX.
                  </div>
                </div>
                <div className="flex gap-3 lg:justify-end">
                  {user ? (
                    <>
                      <Link
                        to="/courses"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                      >
                        Go to courses
                      </Link>
                      {['INSTRUCTOR', 'ADMIN'].includes(user.role) && (
                        <Link
                          to="/instructor"
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-200/70 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                        >
                          Instructor dashboard
                        </Link>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        to="/signup"
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                      >
                        Get started
                      </Link>
                      <Link
                        to="/login"
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-amber-200/70 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                      >
                        Log in
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Outlet />
      </div>

      <footer className="border-t border-slate-900 bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="col-span-2">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 shadow-sm overflow-hidden border border-slate-800">
                  <img src="/assets/img/Logo.png" alt="Indra Cyber School" className="h-full w-full object-cover" />
                </div>
                <div className="text-xl font-black tracking-tighter uppercase text-white">Indra Cyber School</div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                This project is developed by three 18 year old students.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Resources</h4>
              <ul className="mt-4 space-y-2 text-sm font-bold text-slate-400">
                <li><a href="/api/docs" className="hover:text-brand-500">API Documentation</a></li>
                <li><a href="/graphql" className="hover:text-brand-500">GraphQL Playground</a></li>
                <li><a href="#" className="hover:text-brand-500">Tutor Handbook</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white">Company</h4>
              <ul className="mt-4 space-y-2 text-sm font-bold text-slate-400">
                <li><a href="#" className="hover:text-brand-500">About Us</a></li>
                <li><a href="#" className="hover:text-brand-500">Careers</a></li>
                <li><a href="#" className="hover:text-brand-500">Support</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-500">
              © 2026 ALT+F4. All rights reserved.
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/50 border border-slate-800">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Developed by</span>
              <span className="text-sm font-black text-brand-600 italic">Team Alt+F4</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
