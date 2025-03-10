
import React from 'react';
import PageTransition from '@/components/layout/PageTransition';
import Navbar from '@/components/layout/Navbar';
import TimerControl from '@/components/timer/TimerControl';

const Timer = () => {
  return (
    <PageTransition>
      <div className="min-h-screen px-4 pt-6 pb-24">
        <div className="max-w-lg mx-auto">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold mb-1 cyber-text-glow text-cyber-blue">
              Activity Timer
            </h1>
            <p className="text-gray-400">Track your time, earn rewards</p>
          </div>
          
          <TimerControl />
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Timer;
