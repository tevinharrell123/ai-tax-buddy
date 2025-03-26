
import React, { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({ 
  children, 
  delay = 0,
  className = ''
}) => {
  return (
    <div 
      className={`info-card bg-white p-6 animate-scale-in ${className}`}
      style={{ 
        animationDelay: `${delay}ms`,
        opacity: 0,
        animation: `scale-in 500ms ${delay}ms forwards ease-out`
      }}
    >
      {children}
    </div>
  );
};

export default AnimatedCard;
