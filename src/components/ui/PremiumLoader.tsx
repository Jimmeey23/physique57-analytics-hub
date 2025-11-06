import React, { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface PremiumLoaderProps {
  title?: string;
  subtitle?: string;
  progress?: number;
}

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  title = "Physique 57 Analytics",
  subtitle = "Loading your dashboard...",
  progress: externalProgress,
}) => {
  const [autoProgress, setAutoProgress] = useState(0);
  const [dots, setDots] = useState('');

  // Auto-increment progress
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoProgress(prev => (prev >= 95 ? 95 : prev + 1));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const progressValue = externalProgress ?? autoProgress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.1,
              animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main loader content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6">
        {/* Spinning loader with glow effect */}
        <div className="relative">
          {/* Outer glow rings */}
          <div className="absolute inset-0 -m-4">
            <div className="w-full h-full rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 -m-2">
            <div className="w-full h-full rounded-full bg-indigo-500/30 animate-pulse" />
          </div>

          {/* Main spinner */}
          <div className="relative">
            <Loader2 className="w-16 h-16 text-white animate-spin" style={{ animationDuration: '1s' }} />
            
            {/* Center sparkle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Progress circle */}
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progressValue / 100)}`}
              className="transition-all duration-500 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white tabular-nums">
              {Math.round(progressValue)}
            </span>
            <span className="text-sm text-blue-200 font-medium mt-1">percent</span>
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-3 text-center max-w-md">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {title}
          </h2>
          <p className="text-lg text-blue-100">
            {subtitle}{dots}
          </p>
          <div className="flex items-center justify-center gap-1 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-white"
                style={{
                  animation: 'bounce 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0) translateY(0);
          }
          40% {
            transform: scale(1) translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
};
