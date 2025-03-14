import React, { memo } from 'react';
import { domAnimation, LazyMotion, m } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Extremely simplified animations for better performance
const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.1, // Very quick transition
};

// Memoize component to prevent unnecessary re-renders
const PageTransition = memo(({ children }: PageTransitionProps) => {
  try {
    return (
      // LazyMotion with domAnimation for better performance
      <LazyMotion features={domAnimation} strict>
        <m.div
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full min-h-screen bg-black"
          // Enhanced hardware acceleration and browser optimizations
          style={{ 
            willChange: 'opacity'
          }}
        >
          {children}
        </m.div>
      </LazyMotion>
    );
  } catch (error) {
    console.error("PageTransition error:", error);
    // Fallback rendering without animations if there's an error
    return (
      <div className="w-full min-h-screen bg-black">
        {children}
      </div>
    );
  }
});

PageTransition.displayName = 'PageTransition';

export default PageTransition;
