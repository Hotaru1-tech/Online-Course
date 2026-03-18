import clsx from 'clsx';

export function Card({ className, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

export function Button({ className, variant = 'primary', ...props }) {
  const base =
    'rounded-lg px-3 py-2 text-sm font-medium transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 border';
  const styles = {
    primary: 'border-transparent bg-brand-600 text-white hover:bg-brand-500',
    secondary:
      'border-slate-800 bg-slate-800 text-slate-100 hover:bg-slate-700',
    ghost:
      'border-slate-800 bg-transparent text-slate-200 hover:bg-slate-900'
  };
  return <button className={clsx(base, styles[variant], className)} {...props} />;
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10',
        className
      )}
      {...props}
    />
  );
}
