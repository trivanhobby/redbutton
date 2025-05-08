import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { updateNarration } from '../common/AnimationElements';

// Emotion Icon component
const EmotionIcon: React.FC<{ 
  emotion: 'stressed' | 'energized';
  className?: string; 
}> = ({ emotion, className }) => {
  const colors = {
    stressed: {
      bg: 'bg-red-200',
      border: 'border-red-400',
      text: 'text-red-700'
    },
    energized: {
      bg: 'bg-green-200',
      border: 'border-green-400',
      text: 'text-green-700'
    }
  };
  
  const icons = {
    stressed: '😓',
    energized: '😊'
  };
  
  const label = emotion.charAt(0).toUpperCase() + emotion.slice(1);
  
  return (
    <div className={`emotion-icon ${className || ''}`}>
      <div className={`flex flex-col items-center p-2 rounded-lg ${colors[emotion].bg} border ${colors[emotion].border}`}>
        <div className="text-2xl">{icons[emotion]}</div>
        <div className={`text-xs font-medium mt-1 ${colors[emotion].text}`}>{label}</div>
      </div>
    </div>
  );
};

// Task Suggestion component
const TaskSuggestion: React.FC<{
  text: string;
  type: 'calming' | 'productive';
  className?: string;
}> = ({ text, type, className }) => {
  const colors = {
    calming: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-800'
    },
    productive: {
      bg: 'bg-amber-100',
      border: 'border-amber-300',
      text: 'text-amber-800'
    }
  };
  
  return (
    <div className={`task-suggestion ${className || ''}`}>
      <div className={`px-3 py-2 rounded-lg ${colors[type].bg} border ${colors[type].border} ${colors[type].text} font-medium text-sm`}>
        {text}
      </div>
    </div>
  );
};

// Progress Bar component
const ProgressBar: React.FC<{
  progress: number;
  type: 'slow' | 'fast';
  className?: string;
}> = ({ progress, type, className }) => {
  const barColor = type === 'slow' ? 'bg-blue-400' : 'bg-amber-400';
  const bgColor = type === 'slow' ? 'bg-blue-100' : 'bg-amber-100';
  
  return (
    <div className={`progress-bar ${className || ''}`}>
      <div className={`w-full h-3 rounded-full ${bgColor}`}>
        <div 
          className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export class Scene6EmotionalContext extends Scene {
  private user: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private leftSide: HTMLDivElement | null = null;
  private rightSide: HTMLDivElement | null = null;
  private stressedEmotion: HTMLDivElement | null = null;
  private energizedEmotion: HTMLDivElement | null = null;
  private calmingSuggestion: HTMLDivElement | null = null;
  private productiveSuggestion: HTMLDivElement | null = null;
  private slowProgress: HTMLDivElement | null = null;
  private fastProgress: HTMLDivElement | null = null;
  private divider: HTMLDivElement | null = null;
  private narration: HTMLElement | null = null;

  public setElements(
    user: HTMLDivElement | null,
    container: HTMLDivElement | null,
    leftSide: HTMLDivElement | null,
    rightSide: HTMLDivElement | null,
    stressedEmotion: HTMLDivElement | null,
    energizedEmotion: HTMLDivElement | null,
    calmingSuggestion: HTMLDivElement | null,
    productiveSuggestion: HTMLDivElement | null,
    slowProgress: HTMLDivElement | null,
    fastProgress: HTMLDivElement | null,
    divider: HTMLDivElement | null,
    narration: HTMLElement | null
  ): void {
    this.user = user;
    this.container = container;
    this.leftSide = leftSide;
    this.rightSide = rightSide;
    this.stressedEmotion = stressedEmotion;
    this.energizedEmotion = energizedEmotion;
    this.calmingSuggestion = calmingSuggestion;
    this.productiveSuggestion = productiveSuggestion;
    this.slowProgress = slowProgress;
    this.fastProgress = fastProgress;
    this.divider = divider;
    this.narration = narration;
  }

  protected createAnimations(): void {
    // Check required elements
    if (!this.user) {
      console.warn('Scene6: User element is missing');
      return;
    }
    
    if (!this.container || !this.leftSide || !this.rightSide || !this.divider) {
      console.warn('Scene6: Container or side panels are missing');
      return;
    }
    
    if (!this.stressedEmotion || !this.energizedEmotion) {
      console.warn('Scene6: Emotion elements are missing');
      return;
    }
    
    if (!this.calmingSuggestion || !this.productiveSuggestion) {
      console.warn('Scene6: Task suggestion elements are missing');
      return;
    }
    
    if (!this.slowProgress || !this.fastProgress) {
      console.warn('Scene6: Progress bar elements are missing');
      return;
    }
    
    // Reset properties
    gsap.set(this.user, {
      opacity: 1, 
      scale: 1,
      x: 0, 
      y: 0
    });
    
    gsap.set([this.leftSide, this.rightSide], {
      opacity: 0,
      y: 20
    });
    
    gsap.set(this.divider, {
      opacity: 0,
      height: 0,
    });
    
    gsap.set([this.stressedEmotion, this.energizedEmotion, this.calmingSuggestion, this.productiveSuggestion], {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center"
    });
    
    gsap.set([this.slowProgress, this.fastProgress], {
      opacity: 0,
      width: '100%',
    });
    
    // Animation timeline
    if (this.narration) {
      updateNarration(
        this.narration,
        "Whether you're feeling overwhelmed and need stabilization, or energized and ready to tackle challenges, RedButton adapts to your emotional context.",
        this.timeline
      );
    }
    
    // 1. Scene splits to show two parallel scenarios
    this.timeline.to(this.divider, {
      opacity: 1,
      height: '80%',
      duration: 1,
      ease: "power2.inOut"
    });
    
    // Show left and right sides
    this.timeline.to([this.leftSide, this.rightSide], {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.4)"
    }, "-=0.5");
    
    // 2. Left side: User with stressed emotion icon
    this.timeline.to(this.stressedEmotion, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: "back.out(1.5)"
    }, "-=0.3");
    
    // Right side: User with energized emotion icon
    this.timeline.to(this.energizedEmotion, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: "back.out(1.5)"
    }, "-=0.5");
    
    // 3. Show the suggestions for each state
    this.timeline.to(this.calmingSuggestion, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: "back.out(1.5)"
    }, "+=0.5");
    
    this.timeline.to(this.productiveSuggestion, {
      opacity: 1,
      scale: 1,
      duration: 0.7,
      ease: "back.out(1.5)"
    }, "-=0.5");
    
    // 4. Show progress bars
    this.timeline.to([this.slowProgress, this.fastProgress], {
      opacity: 1,
      duration: 0.5
    }, "+=0.5");
    
    // 5. Animate progress differently for each side
    // Slow, gradual progress for the stressed/calming side
    if (this.slowProgress) {
      const slowProgressBar = this.slowProgress.querySelector('div > div');
      if (slowProgressBar) {
        this.timeline.to(slowProgressBar, {
          width: '60%',
          duration: 3,
          ease: "power1.inOut"
        }, "-=0.2");
      }
    }
    
    // Fast, accelerated progress for the energized/productive side
    if (this.fastProgress) {
      const fastProgressBar = this.fastProgress.querySelector('div > div');
      if (fastProgressBar) {
        this.timeline.to(fastProgressBar, {
          width: '100%',
          duration: 2,
          ease: "power2.out"
        }, "-=3");
      }
    }
    
    // 6. Pulse the emotions and suggestions to emphasize the contrast
    this.timeline.to([this.stressedEmotion, this.calmingSuggestion], {
      scale: 1.1,
      repeat: 1,
      yoyo: true,
      duration: 0.6,
      ease: "sine.inOut"
    }, "+=0.5");
    
    this.timeline.to([this.energizedEmotion, this.productiveSuggestion], {
      scale: 1.1,
      repeat: 1,
      yoyo: true,
      duration: 0.6,
      ease: "sine.inOut"
    }, "-=1.2");
  }
}

export const Scene6Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef }) => {
  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const leftSideRef = useRef<HTMLDivElement>(null);
  const rightSideRef = useRef<HTMLDivElement>(null);
  const stressedEmotionRef = useRef<HTMLDivElement>(null);
  const energizedEmotionRef = useRef<HTMLDivElement>(null);
  const calmingSuggestionRef = useRef<HTMLDivElement>(null);
  const productiveSuggestionRef = useRef<HTMLDivElement>(null);
  const slowProgressRef = useRef<HTMLDivElement>(null);
  const fastProgressRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene6EmotionalContext();
    
    if (!userRef.current || !containerRef.current) {
      console.warn('Scene6: Container or user element not available');
      return;
    }
    
    if (!leftSideRef.current || !rightSideRef.current || !dividerRef.current) {
      console.warn('Scene6: Side panels or divider not available');
      return;
    }
    
    if (!stressedEmotionRef.current || !energizedEmotionRef.current) {
      console.warn('Scene6: Emotion elements not available');
      return;
    }
    
    if (!calmingSuggestionRef.current || !productiveSuggestionRef.current) {
      console.warn('Scene6: Task suggestion elements not available');
      return;
    }
    
    if (!slowProgressRef.current || !fastProgressRef.current) {
      console.warn('Scene6: Progress bar elements not available');
      return;
    }
    
    scene.setElements(
      userRef.current,
      containerRef.current,
      leftSideRef.current,
      rightSideRef.current,
      stressedEmotionRef.current,
      energizedEmotionRef.current,
      calmingSuggestionRef.current,
      productiveSuggestionRef.current,
      slowProgressRef.current,
      fastProgressRef.current,
      dividerRef.current,
      narrationRef.current
    );
    
    scene.init();
    scene.play();
    
    // Cleanup
    return () => {
      scene.cleanup();
    };
  }, [userRef]);
  
  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Center Divider */}
      <div 
        ref={dividerRef}
        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 bg-gray-400"
        style={{ height: '0%', opacity: 0 }}
      ></div>
      
      {/* Left Side - Stressed */}
      <div 
        ref={leftSideRef}
        className="absolute left-0 top-0 w-1/2 h-full flex flex-col items-center justify-center"
        style={{ opacity: 0, transform: 'translateY(20px)' }}
      >
        <div className="text-center mb-2 text-gray-300 font-medium">Stressed</div>
        
        <div ref={stressedEmotionRef} className="mb-4" style={{ opacity: 0, transform: 'scale(0)' }}>
          <EmotionIcon emotion="stressed" />
        </div>
        
        <div ref={calmingSuggestionRef} className="mb-4" style={{ opacity: 0, transform: 'scale(0)' }}>
          <TaskSuggestion 
            text="Take a 10-minute mindfulness break" 
            type="calming" 
          />
        </div>        
        <div ref={slowProgressRef} className="w-32" style={{ opacity: 0 }}>
          <ProgressBar progress={0} type="slow" />
        </div>
      </div>
      
      {/* Right Side - Energized */}
      <div 
        ref={rightSideRef}
        className="absolute right-0 top-0 w-1/2 h-full flex flex-col items-center justify-center"
        style={{ opacity: 0, transform: 'translateY(20px)' }}
      >
        <div className="text-center mb-2 text-gray-300 font-medium">Energized</div>
        
        <div ref={energizedEmotionRef} className="mb-4" style={{ opacity: 0, transform: 'scale(0)' }}>
          <EmotionIcon emotion="energized" />
        </div>
        
        <div ref={productiveSuggestionRef} className="mb-4" style={{ opacity: 0, transform: 'scale(0)' }}>
          <TaskSuggestion 
            text="Complete your priority work project" 
            type="productive" 
          />
        </div>
        
        <div ref={fastProgressRef} className="w-32" style={{ opacity: 0 }}>
          <ProgressBar progress={0} type="fast" />
        </div>
      </div>
      
      {/* Narration area */}
      <div 
        ref={narrationRef}
        className="narration absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 bg-gray-700 bg-opacity-70 rounded-lg text-gray-200 w-4/5 min-h-16 text-center font-medium italic"
      >
        {/* Narration text will be animated here */}
      </div>
    </div>
  );
}; 