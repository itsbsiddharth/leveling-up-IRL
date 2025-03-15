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
          
          <div className="cyber-panel p-4 rounded-lg mb-6 bg-black/40 border border-gray-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2">
                <div className="text-cyber-blue font-semibold mb-1">Intellectual</div>
                <div className="text-xs text-gray-400">+1 XP per 3 min</div>
              </div>
              <div className="text-center p-2">
                <div className="text-cyber-purple font-semibold mb-1">Physical Activity</div>
                <div className="text-xs text-gray-400">+1 XP per 3 min</div>
              </div>
              <div className="text-center p-2">
                <div className="text-cyber-red font-semibold mb-1">Distractions</div>
                <div className="text-xs text-gray-400">-1 HP per 6 min</div>
              </div>
              <div className="text-center p-2">
                <div className="text-green-400 font-semibold mb-1">Recovery</div>
                <div className="text-xs text-gray-400">+1 HP per 6 min</div>
              </div>
            </div>
          </div>
          
          <TimerControl />
        </div>
      </div>
      <Navbar />
    </PageTransition>
  );
};

export default Timer;
