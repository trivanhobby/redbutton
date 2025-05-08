import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { Clock, updateNarration } from '../common/AnimationElements';

// Helper for random int
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export type ArrowState = { x1: number, y1: number, x2: number, y2: number, opacity: number } | null;

export class Scene2AnalysisParalysis extends Scene {
  private user: HTMLDivElement | null = null;
  private clock: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;
  private narration: HTMLElement | null = null;
  private clockHandAnimations: gsap.core.Tween[] = [];
  private thoughtBubbles: HTMLElement[] = [];
  private setArrow?: React.Dispatch<React.SetStateAction<ArrowState>>;

  public setElements(
    user: HTMLDivElement | null,
    clock: HTMLDivElement | null,
    container: HTMLDivElement | null,
    narration: HTMLElement | null,
    thoughtBubbles: HTMLElement[],
    setArrow?: React.Dispatch<React.SetStateAction<ArrowState>>,
  ): void {
    this.user = user;
    this.clock = clock;
    this.container = container;
    this.narration = narration;
    this.thoughtBubbles = thoughtBubbles;
    this.setArrow = setArrow;
  }

  protected createAnimations(): void {
    // Check required elements
    if (!this.user) {
      console.warn('Scene2: User element is missing');
      return;
    }
    
    if (!this.clock) {
      console.warn('Scene2: Clock element is missing');
      return;
    }
    
    if (!this.container) {
      console.warn('Scene2: Container element is missing');
      return;
    }

    // Reset properties
    gsap.set(this.clock, { 
      scale: 0, 
      opacity: 0,
      transformOrigin: "center center", 
    });
    
    // 1. User stands still while thought bubbles continue circling
    // (already handled by the continuous animation from Scene 1)
    
    // 2. Clock appears, hands spinning quickly showing time passing
    if (this.narration) {
      updateNarration(
        this.narration,
        "This often leads to analysis paralysis - when we're so overwhelmed by options that we end up doing nothing at all.",
        this.timeline
      );
    }

    this.timeline.fromTo(this.clock, 
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1, ease: "back.out(1.7)" }
    );
    
    // Animate clock hands
    const hourHand = this.clock?.querySelector(".hour-hand");
    const minuteHand = this.clock?.querySelector(".minute-hand");
    
    if (hourHand && minuteHand) {
      const hourHandAnim = gsap.to(hourHand, {
        rotation: 360,
        transformOrigin: "bottom center",
        repeat: -1,
        duration: 6,
        ease: "linear"
      });
      
      const minuteHandAnim = gsap.to(minuteHand, {
        rotation: 360,
        transformOrigin: "bottom center",
        repeat: -1,
        duration: 1,
        ease: "linear"
      });
      
      this.clockHandAnimations.push(hourHandAnim, minuteHandAnim);
      this.timeline.add(hourHandAnim, "-=1");
      this.timeline.add(minuteHandAnim, "-=1");
    }
    
    // 4. User eventually freezes completely, bubbles still swirling
    this.timeline.to(this.user, {
      scale: 0.85,
      backgroundColor: "#5A7AB8", // even more stressed blue
      borderColor: "#3A5998", 
      duration: 1.5,
      ease: "power3.inOut"
    });
    
    // 5. Scene darkens slightly to emphasize the stuck state
    this.timeline.to(this.container, {
      backgroundColor: "rgba(30, 30, 40, 0.9)",
      duration: 2,
      ease: "power2.inOut"
    }, "-=1");

    // Arrow animation logic (strict timeline)
    if (this.thoughtBubbles.length > 0 && this.setArrow) {
      let usedIndexes: number[] = [];
      for (let i = 0; i < 2; i++) {
        let idx;
        do { idx = randomInt(0, this.thoughtBubbles.length - 1); } while (usedIndexes.includes(idx) && usedIndexes.length < this.thoughtBubbles.length);
        usedIndexes.push(idx);
        const bubble = this.thoughtBubbles[idx];
        const userRect = this.user.getBoundingClientRect();
        const bubbleRect = bubble.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const startX = userRect.left + userRect.width/2 - containerRect.left;
        const startY = userRect.top + userRect.height/2 - containerRect.top;
        const endX = bubbleRect.left + bubbleRect.width/2 - containerRect.left;
        const endY = bubbleRect.top + bubbleRect.height/2 - containerRect.top;
        // Animate arrow and bubble in strict sequence
        const t0 = i * 2.0;
        this.timeline.to({}, {
          duration: 0.01,
          onStart: () => this.setArrow && this.setArrow({ x1: startX, y1: startY, x2: endX, y2: endY, opacity: 0 }),
        }, t0);
        this.timeline.to({}, {
          duration: 1,
          onStart: () => this.setArrow && this.setArrow({ x1: startX, y1: startY, x2: endX, y2: endY, opacity: 1 }),
          onUpdate: () => this.setArrow && this.setArrow(a => a && { ...a, opacity: 1 }),
          onComplete: () => this.setArrow && this.setArrow(a => a && { ...a, opacity: 1 }),
        }, t0);
        this.timeline.to(bubble, { boxShadow: '0 0 16px 4px #fff', scale: 1.15, duration: 1, ease: 'power1.out' }, t0);
        this.timeline.to({}, {
          duration: 1,
          onStart: () => this.setArrow && this.setArrow(a => a && { ...a, opacity: 1 }),
          onUpdate: () => this.setArrow && this.setArrow(a => a && { ...a, opacity: 1 - (this.timeline.time() - (t0+1)) }),
          onComplete: () => this.setArrow && this.setArrow(null),
        }, t0 + 1);
        this.timeline.to(bubble, { boxShadow: '', scale: 1, duration: 1, ease: 'power1.out' }, t0 + 1);
      }
    }
  }
  
  public override cleanup(): void {
    super.cleanup();
    this.clockHandAnimations.forEach(tween => tween.kill());
  }
}

export const Scene2Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef, containerRef }) => {
  // References
  const clockRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  
  // Get thought bubbles from the DOM
  const thoughtsContainer = document.querySelector('.thought-bubbles');
  const thoughtBubbles = thoughtsContainer ? Array.from(thoughtsContainer.children).filter(node => node && node.nodeType === 1) as HTMLElement[] : [];
  
  // Add this state to hold the arrow coordinates and opacity
  const [arrow, setArrow] = useState<ArrowState>(null);
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene2AnalysisParalysis();

    if (!userRef.current) {
      console.warn('Scene2: User element not available for animation');
      return;
    }
    
    if (!containerRef.current) {
      console.warn('Scene2: Container element not available for animation');
      return;
    }
    
    if (!clockRef.current) {
      console.warn('Scene2: Clock element not available for animation');
      return;
    }
    
    scene.setElements(
      userRef.current,
      clockRef.current,
      containerRef.current,
      narrationRef.current,
      thoughtBubbles,
      setArrow
    );
    
    scene.init();
    scene.play();
    
    // Cleanup
    return () => {
      scene.cleanup();
    };
  }, [userRef, containerRef]);
  
  return (
    <>
      {/* Clock */}
      <Clock ref={clockRef} position={{ top: '25%', right: '15%' }} />
      {/* Animated Arrow */}
      {arrow && (
        <svg
          style={{
            position: 'absolute',
            top: 0, left: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="white" />
            </marker>
          </defs>
          <line
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            stroke="white"
            strokeWidth={4}
            markerEnd="url(#arrowhead)"
            opacity={arrow.opacity}
            style={{ filter: 'drop-shadow(0 0 6px #fff)' }}
          />
        </svg>
      )}
      {/* Narration area */}
      <div 
        ref={narrationRef}
        className="narration absolute bottom-4 left-1/2 transform -translate-x-1/2 p-4 bg-gray-700 bg-opacity-70 rounded-lg text-gray-200 w-4/5 min-h-16 text-center font-medium italic"
      >
        {/* Narration text will be animated here */}
      </div>
    </>
  );
}; 