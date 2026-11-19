import React, { useState } from 'react';
import { Plus, MessageSquare, CheckCircle, ShieldCheck, Copy } from 'lucide-react';

export const WhatsAppTemplates = () => {
  const templates = [
    {
      id: '1',
      name: 'LOAN_APPLICATION_01',
      category: 'Loan Sourcing',
      language: 'English',
      isApproved: true,
      content: 'Dear {customerName},\n\nThank you for your interest in our instant loan facility of ₹{amount}. Complete your digital application in 2 minutes:\n\n{link}\n\nRegards,\nAutoDial Support',
      variables: ['customerName', 'amount', 'link'],
    },
    {
      id: '2',
      name: 'CALLBACK_CONFIRMATION',
      category: 'Follow-up',
      language: 'English',
      isApproved: true,
      content: 'Dear {customerName}, as requested during our call, our representative will contact you at {time}. Feel free to reply here if you have any questions.',
      variables: ['customerName', 'time'],
    },
    {
      id: '3',
      name: 'PAYMENT_REMINDER_EMI',
      category: 'Collections',
      language: 'Hindi & English',
      isApproved: true,
      content: 'प्रिय {customerName}, आपकी ₹{amount} की ऋण किस्त {dueDate} को देय है। कृपया किसी भी अतिरिक्त शुल्क से बचने के लिए लिंक पर भुगतान करें: {link}',
      variables: ['customerName', 'amount', 'dueDate', 'link'],
    },
    {
      id: '4',
      name: 'DOCUMENTS_REQUIRED_KYC',
      category: 'Documentation',
      language: 'English',
      isApproved: true,
      content: 'Hi {customerName}, to sanction your loan #{loanId}, please reply with photos of: 1) PAN Card, 2) Aadhaar (Front/Back), 3) Last 3 Months Salary Slip.',
      variables: ['customerName', 'loanId'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">WhatsApp Business Templates</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Meta Cloud API pre-approved HSM templates with dynamic placeholders for telecallers
          </p>
        </div>

        <button
          onClick={() => alert('New Template Request')}
          className="px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Request New Meta Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                  {tpl.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3 h-3" /> Meta Approved
                </span>
              </div>

              <p className="text-[11px] text-gray-400 mb-3">
                Category: <span className="text-gray-700 font-semibold">{tpl.category}</span> • {tpl.language}
              </p>

              <div className="bg-emerald-50/40 border border-emerald-100 p-3.5 rounded-xl text-xs text-gray-700 whitespace-pre-wrap font-sans">
                {tpl.content}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Variables: {tpl.variables.join(', ')}</span>
              <button
                onClick={() => alert('Copied template snippet')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

