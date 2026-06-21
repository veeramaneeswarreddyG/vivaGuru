import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-20 w-screen h-screen bg-[#F8FAFC] dark:bg-[#080B11] bg-grid-pattern transition-colors duration-500 overflow-hidden">
      {/* Orb 1 */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-secondary/20 blur-[80px] animate-orb-slow-1 opacity-70 dark:opacity-40 pointer-events-none" />
      
      {/* Orb 2 */}
      <div className="absolute bottom-[20%] right-[15%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-secondary/20 via-primary/10 to-purple-500/15 blur-[100px] animate-orb-slow-2 opacity-65 dark:opacity-35 pointer-events-none" />
      
      {/* Orb 3 */}
      <div className="absolute top-[40%] right-[35%] w-[300px] h-[300px] rounded-full bg-gradient-to-r from-blue-400/10 to-primary/15 blur-[70px] animate-orb-slow-3 opacity-50 dark:opacity-30 pointer-events-none" />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC]/50 via-transparent to-[#F8FAFC]/30 dark:from-[#080B11]/50 dark:via-transparent dark:to-[#080B11]/30 pointer-events-none" />
    </div>
  );
}
