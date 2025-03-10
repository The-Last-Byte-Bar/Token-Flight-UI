
import React from 'react';

interface AnimatedTokenProps {
  delay?: number;
  size?: number;
  left?: string;
}

const AnimatedToken: React.FC<AnimatedTokenProps> = ({ 
  delay = 0,
  size = 24,
  left = "10%"
}) => {
  const style = {
    animationDelay: `${delay}s`,
    width: `${size}px`,
    height: `${size}px`,
    left,
  };
  
  return (
    <div 
      className="absolute animate-float" 
      style={style}
    >
      <div className="relative">
        {/* Token body */}
        <div 
          className="rounded-full bg-pixel-teal pixel-borders"
          style={{ width: `${size}px`, height: `${size}px` }}
        ></div>
        
        {/* Token symbol */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-white font-bold"
          style={{ fontSize: `${size/2}px` }}
        >
          T
        </div>
        
        {/* Shine effect */}
        <div 
          className="absolute rounded-full bg-white/30"
          style={{ 
            width: `${size/3}px`, 
            height: `${size/3}px`,
            top: `${size/5}px`,
            left: `${size/5}px`
          }}
        ></div>
      </div>
    </div>
  );
};

export default AnimatedToken;
