
import React from 'react';
import SeaCreature from './SeaCreature';

const WaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Sky gradient is set in body background */}
      
      {/* Animated waves - slowed down */}
      <div className="absolute bottom-0 left-0 right-0 h-40 flex flex-nowrap">
        <div className="h-full w-[200%] bg-ocean-light flex-shrink-0" 
             style={{ 
               backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L10 10 L20 20 L30 10 L40 20 L40 40 L0 40 Z' fill='%230C4A6E' fill-opacity='0.5' /%3E%3C/svg%3E\")",
               animation: "wave 35s linear infinite" // Slowed down
             }}>
        </div>
        <div className="h-full w-[200%] bg-ocean-light flex-shrink-0" 
             style={{ 
               backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20 L10 10 L20 20 L30 10 L40 20 L40 40 L0 40 Z' fill='%230C4A6E' fill-opacity='0.5' /%3E%3C/svg%3E\")",
               animation: "wave 35s linear infinite" // Slowed down
             }}>
        </div>
      </div>
      
      {/* Deeper waves - slowed down */}
      <div className="absolute bottom-0 left-0 right-0 h-20 flex flex-nowrap">
        <div className="h-full w-[200%] bg-ocean flex-shrink-0"
             style={{ 
               animation: "wave 40s linear infinite", // Slowed down
               backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 L10 20 L20 15 L30 20 L40 15 L40 40 L0 40 Z' fill='%230C4A6E' fill-opacity='0.7' /%3E%3C/svg%3E\")" 
             }}>
        </div>
        <div className="h-full w-[200%] bg-ocean flex-shrink-0"
             style={{ 
               animation: "wave 40s linear infinite", // Slowed down
               backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 15 L10 20 L20 15 L30 20 L40 15 L40 40 L0 40 Z' fill='%230C4A6E' fill-opacity='0.7' /%3E%3C/svg%3E\")" 
             }}>
        </div>
      </div>
      
      {/* Floating bubbles */}
      <div className="absolute bottom-20 left-1/4 w-3 h-3 rounded-full bg-white opacity-70 animate-float"
           style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute bottom-40 left-1/3 w-2 h-2 rounded-full bg-white opacity-60 animate-float"
           style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute bottom-60 left-2/3 w-4 h-4 rounded-full bg-white opacity-80 animate-float"
           style={{ animationDelay: '1s' }}></div>
           
      {/* Add sea creatures */}
      <SeaCreature type="octopus" position="bottom-32 left-1/5" size="lg" delay={2} />
      <SeaCreature type="fish" position="bottom-52 left-2/3" size="md" delay={0.5} />
      <SeaCreature type="monster" position="bottom-80 left-1/4" size="xl" delay={4} />
      <SeaCreature type="crab" position="bottom-24 left-3/4" size="sm" delay={1} />
      <SeaCreature type="jellyfish" position="bottom-60 left-1/2" size="lg" delay={3} />
    </div>
  );
};

export default WaveBackground;
