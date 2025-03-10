
import React from 'react';

const TokenFlightLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10 animate-float">
        {/* Pixelated coin */}
        <div className="absolute inset-0 bg-pixel-teal rounded-full pixel-borders"></div>
        <div className="absolute inset-[4px] bg-pixel-blue rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">T</span>
        </div>
      </div>
      <div className="font-bold text-2xl text-white tracking-wider pixel-text">
        Token <span className="text-pixel-teal">Flight</span>
      </div>
    </div>
  );
};

export default TokenFlightLogo;
