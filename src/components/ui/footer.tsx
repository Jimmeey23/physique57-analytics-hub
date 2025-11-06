import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-16 overflow-hidden font-sans">
      {/* Enhanced Background with Gradient and Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-pink-950/40" />
      
      {/* Ambient glow effect */}
      <div className="absolute top-0 left-1/4 w-96 h-24 bg-blue-500/10 blur-3xl" />
      <div className="absolute top-0 right-1/4 w-96 h-24 bg-purple-500/10 blur-3xl" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Section - Brand */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight mb-2">
              PHYSIQUE 57 INDIA
            </h3>
            <p className="text-sm text-slate-400 tracking-wide">Business Intelligence Dashboard</p>
          </div>

          {/* Center Section - Copyright & Info */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-3 text-slate-300">
              <span className="text-sm tracking-wide">© 2025 All Rights Reserved</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                Advanced Analytics Platform
              </span>
              <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                Real-Time Insights
              </span>
            </div>
          </div>

          {/* Right Section - Creator */}
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-slate-400 tracking-wide">Crafted by</span>
              <span className="text-base font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                JIMMEEY
              </span>
            </div>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full" />
          </div>
        </div>

        {/* Bottom Divider */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <p className="text-center text-xs text-slate-500">
            Empowering data-driven decisions through intelligent analytics
          </p>
        </div>
      </div>

      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent pointer-events-none" />
    </footer>
  );
};
