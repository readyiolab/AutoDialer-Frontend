import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PhoneCall, Clock, RefreshCw, Save } from 'lucide-react';

export const CallingRules = () => {
  const location = useLocation();
  const pageMeta = useMemo(() => {
    if (location.pathname.includes('/dispositions')) {
      return {
        title: 'Disposition Master',
        subtitle: 'Call outcome labels used by telecallers (full editor coming soon — retry rules below).',
      };
    }
    if (location.pathname.includes('/retry-config')) {
      return {
        title: 'Retry Configuration',
        subtitle: 'Gaps between retries and daily limits for unanswered calls.',
      };
    }
    return {
      title: 'Calling Rules',
      subtitle:
        'Configure inter-call delays, retry intervals for unanswered calls, and permitted calling windows',
    };
  }, [location.pathname]);

  const [minGap, setMinGap] = useState(5);
  const [maxRetriesPerDay, setMaxRetriesPerDay] = useState(3);
  const [maxTotalRetries, setMaxTotalRetries] = useState(6);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('19:00');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{pageMeta.title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{pageMeta.subtitle}</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Waiting Time Between Calls
            </label>
            <select
              value={minGap}
              onChange={(e) => setMinGap(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 text-gray-800"
            >
              <option value={3}>3 Seconds</option>
              <option value={5}>5 Seconds (Recommended)</option>
              <option value={10}>10 Seconds</option>
              <option value={15}>15 Seconds</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Countdown timer before opening the next lead on Android.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Call Retries Per Day
            </label>
            <input
              type="number"
              value={maxRetriesPerDay}
              onChange={(e) => setMaxRetriesPerDay(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 text-gray-800 font-semibold"
            />
            <p className="text-[11px] text-gray-400 mt-1">Prevents customer harassment for unanswered calls.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Max Lifetime Dial Attempts Per Lead
            </label>
            <input
              type="number"
              value={maxTotalRetries}
              onChange={(e) => setMaxTotalRetries(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 text-gray-800 font-semibold"
            />
            <p className="text-[11px] text-gray-400 mt-1">Lead is marked as Exhausted once limit is reached.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Permitted Calling Window (TRAI Compliant)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 text-gray-800"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg text-xs py-2 px-3 text-gray-800"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Calls cannot be initiated outside these permitted hours.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          {saved && (
            <span className="text-xs font-semibold text-emerald-600">
              ✓ Calling rules saved successfully!
            </span>
          )}
          <button
            type="submit"
            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save Rules Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

