import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-12 overflow-hidden font-sans">
      {/* Enhanced Background with Gradient and Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-pink-950/40" />
      
      {/* Ambient glow effect */}
      <div className="absolute top-0 left-1/4 w-96 h-16 bg-blue-500/10 blur-3xl" />
      <div className="absolute top-0 right-1/4 w-96 h-16 bg-purple-500/10 blur-3xl" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left Section - Brand */}
          <div className="flex flex-col items-center md:items-start min-w-[200px]">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight mb-1">
              PHYSIQUE 57 INDIA
            </h3>
            <p className="text-xs text-slate-400 tracking-wide">Business Intelligence Dashboard</p>
          </div>

          {/* Center Section - Copyright */}
          <div className="flex items-center">
            <span className="text-sm text-slate-300 tracking-wide">© 2025 All Rights Reserved</span>
          </div>

          {/* Right Section - Creator with signature animation */}
          <div className="flex flex-col items-center md:items-end min-w-[200px]">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-sm text-slate-400 tracking-wide">Crafted by</span>
              <span className="footer-signature-text text-3xl bg-gradient-to-r from-blue-300 via-purple-400 to-pink-500 bg-clip-text text-transparent italic">
                Jimmeey Gondaa
              </span>
            </div>            
          </div>
        </div>
      </div>

      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent pointer-events-none" />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes signature-write {
          0% {
            opacity: 0;
            clip-path: inset(0 100% 0 0);
            transform: translateX(-5px);
          }
          100% {
            opacity: 1;
            clip-path: inset(0 0 0 0);
            transform: translateX(0);
          }
        }
        
        @keyframes underline-draw {
          0% {
            width: 0;
            opacity: 0;
          }
          100% {
            width: 7rem;
            opacity: 1;
          }
        }
        
        @keyframes subtle-glow {
          0%, 100% {
            filter: drop-shadow(0 0 1px rgba(147, 51, 234, 0.2));
          }
          50% {
            filter: drop-shadow(0 0 3px rgba(147, 51, 234, 0.4));
          }
        }
        
        .footer-signature-text {
          animation: signature-write 1.2s cubic-bezier(0.65, 0, 0.35, 1) forwards,
                     subtle-glow 2.5s ease-in-out 1.3s infinite;
          font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', cursive;
          letter-spacing: 0.02em;
          text-shadow: 0 0 8px rgba(147, 51, 234, 0.15);
        }
        
        .footer-signature-underline {
          animation: underline-draw 0.7s cubic-bezier(0.65, 0, 0.35, 1) 0.9s forwards;
          width: 0;
          box-shadow: 0 0 4px rgba(147, 51, 234, 0.2);
        }
      `}} />
    </footer>
  );
};
