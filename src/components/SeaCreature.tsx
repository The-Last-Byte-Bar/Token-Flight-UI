
import React from 'react';

type CreatureType = 'fish' | 'octopus' | 'monster' | 'crab' | 'jellyfish';
type CreatureSize = 'sm' | 'md' | 'lg' | 'xl';

interface SeaCreatureProps {
  type: CreatureType;
  position: string;
  size: CreatureSize;
  delay?: number;
}

const SeaCreature: React.FC<SeaCreatureProps> = ({ type, position, size, delay = 0 }) => {
  // Size mappings
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };
  
  // Color mappings based on creature type
  const colorMap = {
    fish: 'bg-pixel-skyblue',
    octopus: 'bg-pixel-teal',
    monster: 'bg-pixel-navy',
    crab: 'bg-red-500',
    jellyfish: 'bg-purple-400',
  };
  
  // Different creature shapes
  const renderCreature = () => {
    switch (type) {
      case 'fish':
        return (
          <div className="relative">
            <div className={`${sizeMap[size]} ${colorMap[type]} rounded-full pixel-borders`}></div>
            <div className={`absolute top-1/2 right-0 ${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} ${colorMap[type]} transform -translate-y-1/2 rotate-45 pixel-borders`}></div>
            <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-black rounded-full"></div>
          </div>
        );
      case 'octopus':
        return (
          <div className="relative">
            <div className={`${sizeMap[size]} ${colorMap[type]} rounded-full pixel-borders`}></div>
            <div className="absolute bottom-0 left-0 w-2 h-4 bg-pixel-teal rounded-b-full pixel-borders"></div>
            <div className="absolute bottom-0 left-1/4 w-2 h-3 bg-pixel-teal rounded-b-full pixel-borders"></div>
            <div className="absolute bottom-0 left-2/4 w-2 h-4 bg-pixel-teal rounded-b-full pixel-borders"></div>
            <div className="absolute bottom-0 left-3/4 w-2 h-3 bg-pixel-teal rounded-b-full pixel-borders"></div>
            <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'monster':
        return (
          <div className="relative">
            <div className={`${sizeMap[size]} ${colorMap[type]} rounded-lg pixel-borders`}></div>
            <div className="absolute top-0 left-1/4 w-2 h-4 bg-pixel-navy rounded-t-full pixel-borders"></div>
            <div className="absolute top-0 right-1/4 w-2 h-4 bg-pixel-navy rounded-t-full pixel-borders"></div>
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/3 right-1/3 h-1 bg-white"></div>
          </div>
        );
      case 'crab':
        return (
          <div className="relative">
            <div className={`${sizeMap[size]} ${colorMap[type]} rounded-full pixel-borders`}></div>
            <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full pixel-borders"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full pixel-borders"></div>
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-black rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-black rounded-full"></div>
          </div>
        );
      case 'jellyfish':
        return (
          <div className="relative">
            <div className={`${sizeMap[size]} ${colorMap[type]} rounded-t-full pixel-borders`}></div>
            <div className="absolute bottom-0 left-1/5 w-1 h-4 bg-purple-400"></div>
            <div className="absolute bottom-0 left-2/5 w-1 h-5 bg-purple-400"></div>
            <div className="absolute bottom-0 left-3/5 w-1 h-4 bg-purple-400"></div>
            <div className="absolute bottom-0 left-4/5 w-1 h-5 bg-purple-400"></div>
          </div>
        );
      default:
        return <div className={`${sizeMap[size]} ${colorMap.fish} rounded-full pixel-borders`}></div>;
    }
  };

  return (
    <div 
      className={`absolute ${position} animate-float pixel-creature`}
      style={{ 
        animationDuration: '8s', 
        animationDelay: `${delay}s`,
        // Add some subtle horizontal movement
        animation: `float 8s ease-in-out infinite ${delay}s, sway 12s ease-in-out infinite ${delay + 2}s`,
      }}
    >
      {renderCreature()}
    </div>
  );
};

export default SeaCreature;
