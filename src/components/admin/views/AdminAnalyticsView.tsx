import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, Users, Globe, Activity, RefreshCw } from 'lucide-react';
import { getActiveVisitorCount, getTrafficLogs } from '../../../utils/trafficTracker';

export const AdminAnalyticsView: React.FC = () => {
  const [activeVisitors, setActiveVisitors] = useState(1);
  const [trafficLogs, setTrafficLogs] = useState<any[]>([]);

  const reloadData = () => {
    setActiveVisitors(getActiveVisitorCount());
    setTrafficLogs(getTrafficLogs());
  };

  useEffect(() => {
    reloadData();
    const timer = setInterval(reloadData, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span>REAL-TIME TRAFFIC ENGINE</span>
          </div>
          <h2 className="text-xl font-extrabold font-sans">Website Analytics & Active Visitors</h2>
        </div>

        <button
          onClick={reloadData}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
            <span>ACTIVE VISITORS ONLINE</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">{activeVisitors}</span>
            <span className="text-xs text-emerald-600 font-mono font-bold">Online Now</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
            <span>TOTAL LOGGED PAGEVIEWS</span>
            <Eye className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-extrabold font-mono text-slate-900">{trafficLogs.length}</span>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 font-mono text-xs">
            <span>TRACKING ENGINE</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-block">
            ACTIVE HARDENED
          </span>
        </div>
      </div>

      {/* Traffic Table */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm font-mono">Recent Live Traffic Audit Logs ({trafficLogs.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200/90 text-slate-400 uppercase">
                <th className="pb-3 font-bold">Path</th>
                <th className="pb-3 font-bold">Device</th>
                <th className="pb-3 font-bold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trafficLogs.slice(0, 10).map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-bold text-emerald-700">{log.path || '/'}</td>
                  <td className="py-3 text-slate-600 font-sans">{log.device || 'Desktop Chrome'}</td>
                  <td className="py-3 text-slate-400">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
