import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { RedButtonLogo, updateNarration } from '../common/AnimationElements';

// Priority Path component - represents the path of upcoming priorities
const PriorityPath: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`priority-path relative ${className || ''}`}>
      <div className="w-full h-1 bg-gray-500 rounded-full overflow-hidden">
        <div className="h-full w-0 bg-blue-500"></div>
      </div>
      
      {/* Priority bubbles along the path */}
      <div className="priority-bubble absolute top-0 left-0 -translate-y-full -translate-x-1/2 transform">
        <div className="px-3 py-1.5 bg-green-200 text-green-800 rounded-lg border border-green-300 font-medium">
          Current
        </div>
      </div>
      
      <div className="priority-bubble absolute top-0 left-1/3 -translate-y-full -translate-x-1/2 transform">
        <div className="px-3 py-1.5 bg-blue-200 text-blue-800 rounded-lg border border-blue-300 font-medium opacity-80">
          Next
        </div>
      </div>
      
      <div className="priority-bubble absolute top-0 left-2/3 -translate-y-full -translate-x-1/2 transform">
        <div className="px-3 py-1.5 bg-purple-200 text-purple-800 rounded-lg border border-purple-300 font-medium opacity-60">
          Soon
        </div>
      </div>
      
      <div className="priority-bubble absolute top-0 right-0 -translate-y-full -translate-x-1/2 transform">
        <div className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg border border-gray-300 font-medium opacity-40">
          Later
        </div>
      </div>
    </div>
  );
};

export class Scene7Closing extends Scene {
  private user: HTMLDivElement | null = null;
  private logo: HTMLDivElement | null = null;
  private priorityBubble: HTMLDivElement | null = null;
  private priorityPath: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private narration: HTMLElement | null = null;
  private getStartedButton: HTMLElement | null = null;
  
  private logoAnimation: gsap.core.Tween | null = null;

  public setElements(
    user: HTMLDivElement | null,
    logo: HTMLDivElement | null,
    priorityBubble: HTMLDivElement | null,
    priorityPath: HTMLDivElement | null,
    progressBar: HTMLDivElement | null,
    narration: HTMLElement | null,
    getStartedButton: HTMLElement | null
  ): void {
    this.user = user;
    this.logo = logo;
    this.priorityBubble = priorityBubble;
    this.priorityPath = priorityPath;
    this.progressBar = progressBar;
    this.narration = narration;
    this.getStartedButton = getStartedButton;
  }

  protected createAnimations(): void {
    // Check required elements
    if (!this.user) {
      console.warn('Scene7: User element is missing');
      return;
    }
    
    if (!this.logo || !this.priorityBubble || !this.priorityPath) {
      console.warn('Scene7: Some closing scene elements are missing');
      return;
    }
    
    // Reset properties
    gsap.set(this.logo, { 
      opacity: 0,
      scale: 0,
      y: -20,
      transformOrigin: "center center" 
    });
    
    gsap.set(this.priorityBubble, {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center"
    });
    
    gsap.set(this.priorityPath, {
      opacity: 0,
      y: 20
    });
    
    gsap.set(this.getStartedButton, {
      opacity: 0,
      scale: 0,
      transformOrigin: "center center"
    });
    
    // Position the user in a confident stance
    gsap.set(this.user, {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      backgroundColor: "#2E64FE", // Bright confident blue from previous scene
      boxShadow: "0 0 15px rgba(46, 100, 254, 0.3)",
    });
    
    // Add label for the beginning of the animation
    this.timeline.addLabel("start");
    
    // 1. User stands confidently with RedButton logo beside them
    if (this.narration) {
      updateNarration(
        this.narration,
        "Start your journey with RedButton - where clarity replaces confusion, and progress replaces paralysis.",
        this.timeline
      );
    }
    
    // Animate RedButton logo appearing
    this.timeline.to(this.logo, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 1,
      ease: "elastic.out(1, 0.7)"
    }, "start+=0.5");
    
    // 2. A clear, single priority is highlighted
    this.timeline.to(this.priorityBubble, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "start+=1.5");
    
    // 3. Path extends forward showing upcoming priorities in sequence
    this.timeline.to(this.priorityPath, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    }, "start+=2.5");
    
    // Animate the progress bar to fill gradually
    if (this.progressBar) {
      this.timeline.to(this.progressBar, {
        width: '100%',
        duration: 2.5,
        ease: "power1.inOut"
      }, "start+=3");
    }
    
    // 4. User takes a step forward on this path
    this.timeline.to(this.user, {
      x: 50, // Move user forward
      duration: 1.5,
      ease: "power2.inOut"
    }, "start+=3.5");
    
    // 5. Scene brightens, suggesting clarity and purpose
    this.timeline.to(this.user, {
      scale: 1.1,
      boxShadow: "0 0 20px rgba(46, 100, 254, 0.5)",
      duration: 1,
      ease: "power2.out"
    }, "start+=4.5");
    
    // 6. RedButton logo pulses gently, then transitions to "Get Started" button
    this.logoAnimation = gsap.to(this.logo, {
      scale: 1.1,
      repeat: 2,
      yoyo: true,
      duration: 1,
      ease: "sine.inOut",
      onComplete: () => {
        if (this.logo) gsap.to(this.logo, { opacity: 0, duration: 0.5 });
      }
    });
    
    this.timeline.add(this.logoAnimation, "start+=5");
    
    // Show the Get Started button
    this.timeline.to(this.getStartedButton, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: "back.out(1.7)"
    }, "start+=7");
    
    // Make the button pulse to draw attention
    this.timeline.to(this.getStartedButton, {
      scale: 1.1,
      boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
      repeat: -1,
      yoyo: true,
      duration: 1,
      ease: "sine.inOut"
    }, "start+=8");
  }
  
  public override cleanup(): void {
    super.cleanup();
    if (this.logoAnimation) {
      this.logoAnimation.kill();
    }
  }
}

export const Scene7Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef }) => {
  // References
  const logoRef = useRef<HTMLDivElement>(null);
  const priorityBubbleRef = useRef<HTMLDivElement>(null);
  const priorityPathRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  const getStartedButtonRef = useRef<HTMLButtonElement>(null);
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene7Closing();
    
    if (!userRef.current) {
      console.warn('Scene7: User element not available for animation');
      return;
    }
    
    if (!logoRef.current || !priorityBubbleRef.current || !priorityPathRef.current) {
      console.warn('Scene7: Some closing scene elements not available');
      return;
    }
    
    scene.setElements(
      userRef.current,
      logoRef.current,
      priorityBubbleRef.current,
      priorityPathRef.current,
      progressBarRef.current,
      narrationRef.current,
      getStartedButtonRef.current
    );
    
    scene.init();
    scene.play();
    
    // Cleanup
    return () => {
      scene.cleanup();
    };
  }, [userRef]);
  
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ minHeight: 380 }}>
      {/* Centered User and Logo */}
      <div className="flex flex-col items-center justify-center relative z-10" style={{ minHeight: 180 }}>
        {/* RedButton Logo */}
        <div
          ref={logoRef}
          className="mb-2"
          style={{ opacity: 0, transform: 'scale(0) translateY(-20px)' }}
        >
          <RedButtonLogo />
        </div>
        {/* User (positioned absolutely by parent) */}
        {/* User is rendered by parent, so just leave space here */}
      </div>
      {/* Priority Bubble */}
      <div
        ref={priorityBubbleRef}
        className="mt-2"
        style={{ opacity: 0, transform: 'scale(0)' }}
      >
        <div className="px-4 py-2 bg-green-200 text-green-800 rounded-lg border-2 border-green-400 font-medium text-center shadow-md">
          Your Current Priority
        </div>
      </div>
      {/* Path showing upcoming priorities */}
      <div
        ref={priorityPathRef}
        className="w-4/5 mt-8"
        style={{ opacity: 0, transform: 'translateY(20px)' }}
      >
        <PriorityPath />
        {/* Progress bar for the path */}
        <div className="mt-12 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            ref={progressBarRef} 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: '0%' }}
          ></div>
        </div>
      </div>
      {/* Get Started Button */}
      <button
        ref={getStartedButtonRef}
        className="mt-12 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:bg-blue-700 transition-colors"
        style={{ opacity: 0, transform: 'scale(0)' }}
        onClick={() => console.log('Get Started clicked')}
      >
        Get Started
      </button>
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