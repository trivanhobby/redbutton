import React from 'react';

// Thought data type
export interface Thought {
  text: string;
  color: string;
}

// Standard thoughts that can be used across scenes
export const standardThoughts: Thought[] = [
  { text: "Work Task", color: "#FF9AA2" },
  { text: "Exercise", color: "#FFB7B2" },
  { text: "Family", color: "#FFDAC1" },
  { text: "Projects", color: "#E2F0CB" },
  { text: "Finances", color: "#B5EAD7" },
  { text: "Health", color: "#C7CEEA" },
  { text: "Learning", color: "#F0E6EF" },
  { text: "Social", color: "#FED8B1" },
  { text: "Hobbies", color: "#D7E9F7" },
  { text: "Chores", color: "#CCEDD2" },
];

// User component
interface UserProps {
  initialState?: {
    opacity?: number;
    scale?: number;
    top?: string;
    left?: string;
  }
}

export const User = React.forwardRef<HTMLDivElement, UserProps>((props, ref) => {
  const { initialState } = props;
  return (
    <div 
      ref={ref}
      className="absolute w-16 h-16 bg-blue-500 rounded-full border-4 border-blue-600 flex items-center justify-center"
      style={{ 
        top: initialState?.top || '45%', 
        left: initialState?.left || '50%', 
        transform: 'translate(-50%, -50%)',
        opacity: initialState?.opacity ?? 0,
        scale: initialState?.scale ?? 0,
        zIndex: 10
      }}
    >
      {/* Simple face representation */}
      <div className="person-face">
        <div className="eyes flex justify-center space-x-2 mt-1">
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <div className="mouth w-3 h-0.5 bg-white mx-auto mt-2 rounded-full"></div>
      </div>
    </div>
  );
});

User.displayName = 'User';

// Find the Clock component and update it to use forwardRef correctly
export interface ClockProps {
  position?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export const Clock = React.forwardRef<HTMLDivElement, ClockProps>(
  ({ position = { top: '20%', right: '20%' } }, ref) => {
    return (
      <div 
        ref={ref}
        className="clock relative w-16 h-16 bg-gray-200 rounded-full border-4 border-gray-300 flex items-center justify-center"
        style={{ 
          position: 'absolute',
          ...position,
          zIndex: 10
        }}
      >
        {/* Clock face */}
        <div className="clock-face w-full h-full relative">
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="hour-marker w-0.5 h-1.5 bg-gray-600 absolute"
              style={{ 
                top: '2px',
                left: '50%',
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
                transformOrigin: 'bottom center'
              }}
            />
          ))}
          
          {/* Hour hand */}
          <div 
            className="hour-hand w-1 h-5 bg-gray-800 absolute bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom"
          />
          
          {/* Minute hand */}
          <div 
            className="minute-hand w-0.5 h-6 bg-gray-600 absolute bottom-1/2 left-1/2 -translate-x-1/2 origin-bottom"
          />
          
          {/* Center point */}
          <div className="center-point w-1.5 h-1.5 bg-gray-800 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }
);

Clock.displayName = 'Clock';

// Find the ThoughtBubble component definition and update its props interface
export interface ThoughtBubbleProps {
  thought: Thought;
  position?: { top: string; left: string };
}

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = React.forwardRef<HTMLDivElement, ThoughtBubbleProps>(
  ({ thought, position }, ref) => {
    // Use the provided position or generate a random one if not provided
    const randomPosition = position || {
      top: `${25 + Math.random() * 50}%`,
      left: `${25 + Math.random() * 50}%`
    };

    return (
      <div
        ref={ref}
        className="thought-bubble absolute px-2 py-1 rounded-lg border flex items-center justify-center text-sm font-medium shadow-sm"
        style={{
          backgroundColor: thought.color,
          color: '#333',
          width: "70px",
          height: "45px",
          top: randomPosition.top,
          left: randomPosition.left,
          zIndex: 5,
          opacity: 0,
          transform: 'scale(0)'
        }}
      >
        {thought.text}
      </div>
    );
  }
);

// After the ThoughtBubble component definition
ThoughtBubble.displayName = 'ThoughtBubble';

// RedButton logo/icon component
interface RedButtonLogoProps {
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  }
}

export const RedButtonLogo = React.forwardRef<HTMLDivElement, RedButtonLogoProps>((props, ref) => {
  const { position } = props;
  return (
    <div
      ref={ref}
      className="absolute flex flex-col items-center justify-center"
      style={{
        top: position?.top || '10%',
        left: position?.left || '50%',
        right: position?.right,
        bottom: position?.bottom,
        transform: 'translateX(-50%)',
        opacity: 0,
        zIndex: 10
      }}
    >
      <div className="w-20 h-20 rounded-full bg-red-600 border-4 border-red-700 flex items-center justify-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-green-500 border-2 border-green-600 flex items-center justify-center">
          <div className="text-white font-bold text-xs">RB</div>
        </div>
      </div>
    </div>
  );
});

RedButtonLogo.displayName = 'RedButtonLogo';

// Helper function to update narration
export const updateNarration = (
  narration: HTMLElement | null, 
  text: string, 
  timeline: gsap.core.Timeline
): void => {
  if (!narration) return;
  
  timeline.to(narration, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      if (narration) {
        narration.innerHTML = text;
      }
    }
  });
  
  timeline.to(narration, {
    opacity: 1,
    duration: 0.7
  });
};

// StaticBubble: for static infographics (not absolutely positioned, always visible)
export interface StaticBubbleProps {
  text: string;
  color: string;
  className?: string;
}

export const StaticBubble: React.FC<StaticBubbleProps> = ({ text, color, className }) => (
  <div
    className={`static-bubble px-4 py-2 rounded-lg border flex items-center justify-center text-base font-medium shadow-sm ${className || ''}`}
    style={{
      backgroundColor: color,
      color: '#333',
      minWidth: '80px',
      minHeight: '40px',
      position: 'relative',
      zIndex: 5,
    }}
  >
    {text}
  </div>
);

// StaticUser: for static infographics (not absolutely positioned, always visible)
export interface StaticUserProps {
  emoji?: string;
  className?: string;
}

export const StaticUser: React.FC<StaticUserProps> = ({ emoji, className }) => (
  <div
    className={`static-user w-16 h-16 bg-blue-500 rounded-full border-4 border-blue-600 flex items-center justify-center relative ${className || ''}`}
    style={{ minWidth: '64px', minHeight: '64px' }}
  >
    <div className="person-face">
      <div className="eyes flex justify-center space-x-2 mt-1">
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
      </div>
      <div className="mouth w-3 h-0.5 bg-white mx-auto mt-2 rounded-full"></div>
    </div>
    {emoji && (
      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none">{emoji}</span>
    )}
  </div>
);

// StaticRedButton: for static infographics (not absolutely positioned, always visible)
export const StaticRedButton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={`static-redbutton flex flex-col items-center justify-center relative ${className || ''}`}
    style={{ minWidth: '64px', minHeight: '64px' }}
  >
    <div className="w-16 h-16 rounded-full bg-red-600 border-4 border-red-700 flex items-center justify-center shadow-lg">
      <div className="w-10 h-10 rounded-full bg-green-500 border-2 border-green-600 flex items-center justify-center">
        <div className="text-white font-bold text-xs">RB</div>
      </div>
    </div>
  </div>
); 