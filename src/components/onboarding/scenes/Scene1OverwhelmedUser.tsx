import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { standardThoughts, ThoughtBubble, updateNarration } from '../common/AnimationElements';

export class Scene1OverwhelmedUser extends Scene {
  private user: HTMLDivElement | null = null;
  private thoughtBubbles: HTMLElement[] = [];
  private narration: HTMLElement | null = null;
  private randomMotions: gsap.core.Tween[] = [];

  public setElements(
    user: HTMLDivElement | null,
    thoughtBubbles: HTMLElement[],
    narration: HTMLElement | null
  ): void {
    this.user = user;
    this.thoughtBubbles = thoughtBubbles.filter(bubble => bubble && bubble.nodeType === 1); // Filter out invalid nodes
    this.narration = narration;
  }

  protected createAnimations(): void {
    if (!this.user) {
      console.warn('Scene1: User element is missing');
      return;
    }

    if (this.thoughtBubbles.length === 0) {
      console.warn('Scene1: Thought bubbles are missing');
      return;
    }

    // Reset properties - only apply to elements that exist
    gsap.set(this.thoughtBubbles, { 
      scale: 0, 
      opacity: 0,
      transformOrigin: "center center",
    });

    // 1. User appears center screen with neutral expression
    this.timeline.fromTo(this.user, 
      { scale: 0.5, opacity: 0.5 }, 
      { scale: 1, opacity: 1, duration: 1, ease: "power2.out" }
    );
    
    // 2. Multiple thought bubbles begin to appear around the user's head, one by one
    if (this.narration) {
      updateNarration(
        this.narration, 
        "We all face moments when too many priorities compete for our attention...", 
        this.timeline
      );
    }
    
    // 3. Each bubble pulses briefly as it appears
    this.thoughtBubbles.forEach((bubble, index) => {
      if (!bubble) return; // Skip if bubble is null
      
      this.timeline.to(bubble, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.7)"
      }, `>-0.1`);
      
      this.timeline.to(bubble, {
        scale: 1.1,
        yoyo: true,
        repeat: 1,
        duration: 0.2,
        ease: "power1.inOut"
      }, `>-0.1`);
    });
    
    // 4. As more bubbles appear, they begin to crowd the space
    // 5. User's expression changes to confused/overwhelmed
    this.timeline.to(this.user, {
      backgroundColor: "#6495ED", // changed to a slightly stressed blue
      borderColor: "#4169E1",
      duration: 1,
      ease: "power1.inOut"
    }, "-=1");
    
    // 6. Thought bubbles begin to circle around user faster, creating visual chaos
    this.randomMotions = this.thoughtBubbles.map((bubble, index) => {
      if (!bubble) return null; // Skip if bubble is null
      
      const angle = Math.random() * Math.PI * 2;
      const distance = 70 + Math.random() * 40;
      const duration = 4 + Math.random() * 3;
      
      return gsap.to(bubble, {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        duration: duration,
        ease: "none",
        repeat: -1,
        yoyo: true,
        yoyoEase: "power1.inOut"
      });
    }).filter(Boolean) as gsap.core.Tween[]; // Filter out null values
    
    const chaosTimeline = gsap.timeline();
    chaosTimeline.add(this.randomMotions);
    
    this.timeline.add(chaosTimeline, "-=5");
    
    // 7. User figure shrinks slightly showing the feeling of being overwhelmed
    this.timeline.to(this.user, {
      scale: 0.9,
      duration: 1,
      ease: "power2.inOut"
    }, "-=2");
  }

  public override cleanup(): void {
    super.cleanup();
    this.randomMotions.forEach(tween => tween && tween.kill());
  }
}

export const Scene1Component: React.FC<{
  userRef?: React.RefObject<HTMLDivElement>;
  thoughtsContainerRef?: React.RefObject<HTMLDivElement>;
}> = ({ userRef: externalUserRef, thoughtsContainerRef: externalThoughtsContainerRef }) => {
  // References
  const internalUserRef = useRef<HTMLDivElement>(null);
  const internalThoughtsContainerRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene1OverwhelmedUser();
    
    // Only use these refs if they're actually provided and have current set
    const userElement = externalUserRef?.current || internalUserRef.current;
    
    let thoughtBubbles: HTMLElement[] = [];
    if (externalThoughtsContainerRef?.current) {
      // Get all child elements that are actual DOM nodes
      thoughtBubbles = Array.from(externalThoughtsContainerRef.current.children)
        .filter(node => node && node.nodeType === 1) as HTMLElement[];
    } else if (internalThoughtsContainerRef.current) {
      thoughtBubbles = Array.from(internalThoughtsContainerRef.current.children)
        .filter(node => node && node.nodeType === 1) as HTMLElement[];
    }
    
    // Check if elements are available - log a different message than before to avoid confusion
    if (!userElement) {
      console.warn('Scene1: User element not available for animation');
      return;
    }
    
    if (thoughtBubbles.length === 0) {
      console.warn('Scene1: No thought bubbles available for animation');
      return;
    }
    
    scene.setElements(
      userElement,
      thoughtBubbles,
      narrationRef.current
    );
    
    scene.init();
    scene.play();
    
    // Cleanup
    return () => {
      scene.cleanup();
    };
  }, [externalUserRef, externalThoughtsContainerRef]);
  
  return (
    <>
      {/* Only render the user if no external ref is provided */}
      {!externalUserRef && (
        <div 
          ref={internalUserRef}
          className="absolute w-16 h-16 bg-blue-500 rounded-full border-4 border-blue-600 flex items-center justify-center"
          style={{ 
            top: '45%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            opacity: 0,
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
      )}
      
      {/* Only render thought bubbles if no external ref is provided */}
      {!externalThoughtsContainerRef && (
        <div ref={internalThoughtsContainerRef} className="thought-bubbles absolute inset-0 pointer-events-none">
          {standardThoughts.map((thought, index) => (
            <ThoughtBubble 
              key={index} 
              thought={thought} 
            />
          ))}
        </div>
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