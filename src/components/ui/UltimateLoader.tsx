import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UltimateLoaderProps {
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
}

export const UltimateLoader: React.FC<UltimateLoaderProps> = ({ 
  onComplete,
  title = "PHYSIQUE 57",
  subtitle = "Analytics Hub"
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const logoSrcs = ['/physique57-logo.png', '/placeholder.svg'];

  // Dynamic messages based on subtitle/page type
  const getLoadingMessages = () => {
    const subtitleLower = subtitle.toLowerCase();
    
    if (subtitleLower.includes('sales')) {
      return [
        'Analyzing revenue trends...',
        'Processing sales data...',
        'Calculating ATV...',
        'Preparing insights...'
      ];
    } else if (subtitleLower.includes('discount')) {
      return [
        'Loading discount analytics...',
        'Analyzing promotion impact...',
        'Processing offer data...',
        'Calculating ROI...'
      ];
    } else if (subtitleLower.includes('funnel') || subtitleLower.includes('lead')) {
      return [
        'Mapping conversion funnel...',
        'Analyzing lead pipeline...',
        'Processing prospect data...',
        'Tracking conversions...'
      ];
    } else if (subtitleLower.includes('retention')) {
      return [
        'Analyzing member retention...',
        'Processing loyalty metrics...',
        'Tracking engagement...',
        'Calculating retention rates...'
      ];
    } else if (subtitleLower.includes('attendance') || subtitleLower.includes('class')) {
      return [
        'Loading class schedules...',
        'Analyzing attendance patterns...',
        'Processing bookings...',
        'Tracking capacity...'
      ];
    } else if (subtitleLower.includes('cancellation')) {
      return [
        'Analyzing cancellations...',
        'Processing timing data...',
        'Identifying patterns...',
        'Calculating impact...'
      ];
    } else if (subtitleLower.includes('payroll')) {
      return [
        'Loading payroll data...',
        'Calculating compensation...',
        'Processing instructor hours...',
        'Preparing reports...'
      ];
    } else if (subtitleLower.includes('expiration')) {
      return [
        'Tracking expirations...',
        'Analyzing renewal patterns...',
        'Processing member data...',
        'Identifying opportunities...'
      ];
    } else {
      return [
        'Loading analytics...',
        'Processing data...',
        'Preparing dashboard...',
        'Almost ready...'
      ];
    }
  };

  const loadingMessages = getLoadingMessages();

  useEffect(() => {
    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 800);

    // Auto-complete after animation duration
    const timer = setTimeout(() => {
      onComplete?.();
    }, 3500);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(timer);
    };
  }, [onComplete, loadingMessages.length]);

  return (
    <div className="fixed inset-0 z-[9999] bg-white overflow-hidden flex items-center justify-center">
      {/* Animated gradient background orbs */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(0,168,232,0.4) 0%, rgba(0,119,182,0.2) 50%, transparent 100%)"
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(72,202,228,0.4) 0%, rgba(0,182,199,0.2) 50%, transparent 100%)"
          }}
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        {/* Main container - no rotation */}
        <motion.div className="relative">
          {/* Glow effect wrapper */}
          <motion.div
            className="relative flex items-center justify-center"
          >
            {/* Glossy shine effect overlay */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, transparent 40%, rgba(255,255,255,0.95) 50%, transparent 60%, transparent 100%)',
              }}
              animate={{
                x: ['-200%', '200%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.3,
                ease: "easeInOut"
              }}
            />
            {/* Logo Image or Fallback SVG */}
            {!imgFailed ? (
              <motion.div 
                className="relative w-60 h-60 flex items-center justify-center z-10"
                animate={{
                  filter: ['brightness(1.1)', 'brightness(1.3)', 'brightness(1.1)']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <img
                  src={logoSrcs[srcIndex]}
                  alt="Physique 57"
                  className="w-full h-full object-contain"
                  onError={() => {
                    if (srcIndex < logoSrcs.length - 1) {
                      setSrcIndex(srcIndex + 1);
                    } else {
                      setImgFailed(true);
                    }
                  }}
                />
              </motion.div>
            ) : (
              <svg
                width="260"
                height="260"
                viewBox="0 0 500 500"
                className="relative"
              >
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00A8E8" />
                    <stop offset="50%" stopColor="#0077B6" />
                    <stop offset="100%" stopColor="#023E8A" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Large 5 */}
                <motion.path
                  d="M 180 100 L 270 100 C 280 100 285 105 285 115 L 280 160 L 180 170 L 175 210 C 175 210 180 205 200 205 L 250 205 C 280 205 290 215 285 245 L 275 300 C 270 330 260 340 230 340 L 150 340 L 155 310 L 235 310 C 245 310 250 305 252 295 L 257 265 C 258 255 253 250 243 250 L 180 250 C 150 250 140 240 145 210 L 160 120 C 165 105 170 100 180 100 Z"
                  fill="url(#logoGradient)"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                
                {/* Large 7 */}
                <motion.path
                  d="M 270 160 L 390 160 C 400 160 405 165 405 175 C 405 180 404 185 403 190 L 320 390 L 280 390 L 365 195 L 275 195 L 270 160 Z"
                  fill="url(#logoGradient)"
                  filter="url(#glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                />
                
                {/* PHYSIQUE text */}
                <motion.text
                  x="50"
                  y="260"
                  fontSize="42"
                  fontWeight="900"
                  fill="#03045E"
                  letterSpacing="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  PHYSIQUE
                </motion.text>
                
                {/* Registered trademark */}
                <motion.circle
                  cx="460"
                  cy="250"
                  r="12"
                  stroke="#03045E"
                  strokeWidth="2"
                  fill="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                />
                <motion.text
                  x="460"
                  y="256"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#03045E"
                  textAnchor="middle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  ®
                </motion.text>
              </svg>
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom text */}
      <motion.div
        className="absolute bottom-16 text-center px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.8 }}
      >
  <div className="inline-flex flex-col items-center gap-5 px-10 py-8">
          <motion.div
            className="text-slate-900 text-3xl md:text-4xl font-black tracking-[0.18em] uppercase"
            style={{
              textShadow: '0 3px 16px rgba(15, 23, 42, 0.12)',
              letterSpacing: '0.22em'
            }}
            animate={{
              opacity: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {title}
          </motion.div>

          {/* Dynamic loading message */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              className="text-blue-600 text-xl md:text-2xl font-bold tracking-wide"
              style={{
                textShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
            >
              {loadingMessages[currentMessageIndex]}
            </motion.div>
          </AnimatePresence>

          {subtitle && (
            <motion.div
              className="text-slate-600 text-lg md:text-xl font-semibold tracking-[0.08em]"
              style={{
                textShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: 0.6 }}
            >
              {subtitle}
            </motion.div>
          )}

          {/* Loading dots */}
          <motion.div className="flex items-center justify-center gap-3 pt-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg"
                style={{
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.55, 1, 0.55],
                  scale: [1, 1.12, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.22,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default UltimateLoader;
