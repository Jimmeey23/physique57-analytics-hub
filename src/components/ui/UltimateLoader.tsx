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
      {/* Subtle gradient accent shadows in background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(37,99,235,0.2) 40%, transparent 70%)"
          }}
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.08]"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(79,70,229,0.2) 40%, transparent 70%)"
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-[0.06] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, rgba(147,197,253,0.3) 0%, rgba(96,165,250,0.15) 50%, transparent 70%)"
          }}
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.06, 0.1, 0.06],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10"
      >
        {/* Main container with enhanced animations */}
        <motion.div className="relative">
          {/* Premium glow effect wrapper */}
          <motion.div
            className="relative flex items-center justify-center"
            animate={{
              filter: ['drop-shadow(0 10px 30px rgba(59, 130, 246, 0.12))', 'drop-shadow(0 15px 40px rgba(59, 130, 246, 0.2))', 'drop-shadow(0 10px 30px rgba(59, 130, 246, 0.12))']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Refined glossy shine effect overlay */}
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none rounded-full"
              style={{
                background: 'linear-gradient(135deg, transparent 0%, transparent 45%, rgba(255,255,255,0.35) 50%, transparent 55%, transparent 100%)',
              }}
              animate={{
                x: ['-150%', '150%'],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: "easeInOut"
              }}
            />
            {/* Logo Image or Fallback SVG */}
            {!imgFailed ? (
              <motion.div 
                className="relative w-56 h-56 flex items-center justify-center z-10"
                animate={{
                  scale: [1, 1.02, 1],
                  filter: ['brightness(1)', 'brightness(1.08)', 'brightness(1)']
                }}
                transition={{
                  duration: 2.5,
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

      {/* Bottom text - Premium refined styling */}
      <motion.div
        className="absolute bottom-20 text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
      >
        <div className="inline-flex flex-col items-center gap-3.5 px-8 py-6">
          {/* Brand title - Smaller, more refined */}
          <motion.div
            className="text-slate-800 text-xl md:text-2xl font-bold tracking-[0.15em] uppercase"
            style={{
              textShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              letterSpacing: '0.18em'
            }}
            animate={{
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {title}
          </motion.div>

          {/* Subtitle - Smaller, elegant */}
          {subtitle && (
            <motion.div
              className="text-slate-500 text-xs md:text-sm font-medium tracking-wider uppercase"
              style={{
                textShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
                letterSpacing: '0.12em'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              transition={{ delay: 0.65 }}
            >
              {subtitle}
            </motion.div>
          )}

          {/* Dynamic loading message - Compact and refined */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMessageIndex}
              className="text-blue-600 text-sm md:text-base font-semibold tracking-wide mt-1"
              style={{
                textShadow: '0 2px 8px rgba(37, 99, 235, 0.18)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {loadingMessages[currentMessageIndex]}
            </motion.div>
          </AnimatePresence>

          {/* Loading dots - Smaller, more refined */}
          <motion.div className="flex items-center justify-center gap-2 pt-3">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                style={{
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                }}
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  delay: i * 0.2,
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
