import React from 'react';

export const PageHeader = ({ title, subtitle, actions, icon: Icon }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 space-y-1.5">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
        {Icon ? <Icon className="w-6 h-6 text-teal-600 shrink-0" /> : null}
        <span className="truncate">{title}</span>
      </h1>
      {subtitle ? <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{subtitle}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
  </div>
);
