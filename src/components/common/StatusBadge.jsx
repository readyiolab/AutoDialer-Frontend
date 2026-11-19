import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const badgeConfig = {
    NEW: { label: 'New', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    PENDING: { label: 'Pending', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    NOT_CONTACTED: { label: 'Not Contacted', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONTACTED: { label: 'Contacted', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    INTERESTED: { label: 'Interested', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    NOT_INTERESTED: { label: 'Not Interested', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    FOLLOW_UP_REQUIRED: { label: 'Follow-up', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    CALL_BACK: { label: 'Call Back', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONVERTED: { label: 'Converted', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    APPLICATION_SUBMITTED: { label: 'Converted', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
    CLOSED: { label: 'Closed', bg: 'bg-gray-100 text-gray-700 border-gray-200' },
    LOST: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    DND: { label: 'DND', bg: 'bg-red-50 text-red-700 border-red-200' },
    INVALID_NUMBER: { label: 'Invalid Number', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    DOCUMENTS_REQUIRED: { label: 'Docs Req', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    PAYMENT_PROMISED: { label: 'Payment Promised', bg: 'bg-lime-50 text-lime-700 border-lime-200' },
    BUSY: { label: 'Busy', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    NO_ANSWER: { label: 'No Answer', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    SWITCHED_OFF: { label: 'Switched Off', bg: 'bg-orange-50 text-orange-700 border-orange-200' },

    CONNECTED: { label: 'Connected', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    UNANSWERED: { label: 'Unanswered', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    CALLING: { label: 'Calling', bg: 'bg-green-100 text-green-800 border-green-300 animate-pulse' },
    AVAILABLE: { label: 'Available', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    ON_BREAK: { label: 'On Break', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    OFFLINE: { label: 'Offline', bg: 'bg-gray-100 text-gray-500 border-gray-200' },

    ACTIVE: { label: 'Active', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    PAUSED: { label: 'Paused', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    INACTIVE: { label: 'Inactive', bg: 'bg-gray-100 text-gray-600 border-gray-200' },
    BLOCKED: { label: 'Blocked', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    REVOKED: { label: 'Revoked', bg: 'bg-slate-100 text-slate-700 border-slate-200' },
    COMPLETED: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    OVERDUE: { label: 'Overdue', bg: 'bg-rose-50 text-rose-700 border-rose-200' },

    // Display buckets
    FOLLOWUP: { label: 'Follow-up', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    REJECTED: { label: 'Rejected', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const config = badgeConfig[normalized] || {
    label: String(status).replace(/_/g, ' '),
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg}`}
    >
      {config.label}
    </span>
  );
};
