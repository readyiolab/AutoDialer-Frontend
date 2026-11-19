import React from 'react';
import { Smartphone } from 'lucide-react';

export const TelecallerAppNotice = () => (
  <div className="max-w-lg mx-auto mt-16 p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center space-y-3">
    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
      <Smartphone className="w-6 h-6" />
    </div>
    <h1 className="text-lg font-black text-gray-900">Telecaller dialing moved to Android</h1>
    <p className="text-sm text-gray-600">
      Progressive autodialing runs on the AutoDial Pro Android app (SIM call). Use Live Calling
      Monitor here to supervise the floor; telecallers sign in on mobile only.
    </p>
    <a
      href="/live-calling"
      className="inline-flex mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
    >
      Open Live Calling Monitor
    </a>
  </div>
);
