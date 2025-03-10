
import React, { ReactNode } from 'react';

interface PixelatedContainerProps {
  children: ReactNode;
  className?: string;
}

const PixelatedContainer: React.FC<PixelatedContainerProps> = ({ children, className = "" }) => {
  return (
    <div className={`relative p-1 ${className}`}>
      {/* Border */}
      <div className="absolute inset-0 pixel-borders bg-black/10"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner pixels */}
      <div className="absolute top-0 left-0 w-2 h-2 bg-black"></div>
      <div className="absolute top-0 right-0 w-2 h-2 bg-black"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 bg-black"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 bg-black"></div>
    </div>
  );
};

export default PixelatedContainer;
