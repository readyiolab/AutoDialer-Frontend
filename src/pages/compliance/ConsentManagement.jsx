import React from 'react';
import { ShieldCheck, UserCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { DataTable } from '../../components/common/DataTable';

export const ConsentManagement = () => {
  const consents = [
    { id: '1', customer: 'Ramesh Kumar', phone: '+91 98765 43210', consentType: 'Digital OTP', channel: 'Web Form', date: '01 Nov 2026, 10:15 AM', status: 'VERIFIED', ip: '103.21.58.12' },
    { id: '2', customer: 'Suresh Sharma', phone: '+91 98765 43211', consentType: 'In-Call Voice Consent', channel: 'Telecaller Rahul', date: '02 Nov 2026, 03:22 PM', status: 'VERIFIED', ip: '-' },
    { id: '3', customer: 'Amit Verma', phone: '+91 98765 43212', consentType: 'WhatsApp Opt-In', channel: 'Inbound Message', date: '03 Nov 2026, 11:05 AM', status: 'VERIFIED', ip: 'Meta API' },
    { id: '4', customer: 'Karan Mehra', phone: '+91 98765 43218', consentType: 'Explicit DND Revocation', channel: 'Customer Support', date: '05 Nov 2026, 04:40 PM', status: 'VERIFIED', ip: '103.24.11.90' },
  ];

  const columns = [
    { header: 'Customer', render: (r) => <span className="font-bold text-gray-900">{r.customer}</span> },
    { header: 'Mobile Number', render: (r) => <span className="font-mono text-gray-600">{r.phone}</span> },
    { header: 'Consent Type', accessor: 'consentType' },
    { header: 'Opt-in Channel', accessor: 'channel' },
    { header: 'Timestamp', accessor: 'date' },
    {
      header: 'Audit Status',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">TRAI & RBI Customer Consent Registry</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Auditable consent logging, DLT registration and opt-in tracking for commercial calling and messaging
        </p>
      </div>

      <DataTable columns={columns} data={consents} total={consents.length} />
    </div>
  );
};

