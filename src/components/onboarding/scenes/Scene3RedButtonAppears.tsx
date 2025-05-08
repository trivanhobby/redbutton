import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { RedButtonLogo, updateNarration } from '../common/AnimationElements';

export class Scene3RedButtonAppears extends Scene {
  private user: HTMLDivElement | null = null;
  private logo: HTMLDivElement | null = null;
  private lightBeam: HTMLDivElement | null = null;
  private thoughtBubbles: HTMLElement[] = [];
  private narration: HTMLElement | null = null;
  private logoAnimation: gsap.core.Tween | null = null;

  public setElements(
    user: HTMLDivElement | null,
    logo: HTMLDivElement | null,
    lightBeam: HTMLDivElement | null,
    thoughtBubbles: HTMLElement[],
    narration: HTMLElement | null
  ): void {
    this.user = user;
    this.logo = logo;
    this.lightBeam = lightBeam;
    this.thoughtBubbles = thoughtBubbles.filter(bubble => bubble && bubble.nodeType === 1);
    this.narration = narration;
  }

  protected createAnimations(): void {
    // Check required elements
    if (!this.user) {
      console.warn('Scene3: User element is missing');
      return;
    }
    
    if (!this.logo) {
      console.warn('Scene3: Logo element is missing');
      return;
    }
    
    if (!this.lightBeam) {
      console.warn('Scene3: Light beam element is missing');
      return;
    }
    
    // We can proceed without thought bubbles
    const hasBubbles = this.thoughtBubbles.length > 0;

    // Reset properties
    gsap.set(this.logo, { 
      scale: 0, 
      opacity: 0,
      transformOrigin: "center center" 
    });
    
    gsap.set(this.lightBeam, {
      opacity: 0,
      scaleY: 0,
      transformOrigin: "top center"
    });
    
    // 1. RedButton logo appears at the top of the screen
    if (this.narration) {
      updateNarration(
        this.narration,
        "That's where RedButton comes in. A simple system designed to cut through the noise...",
        this.timeline
      );
    }
    
    this.timeline.to(this.logo, {
      scale: 1,
      opacity: 1,
      duration: 1.2,
      ease: "elastic.out(1, 0.7)"
    });
    
    // 2. A beam of light extends from the logo to the user
    this.timeline.to(this.lightBeam, {
      opacity: 0.7,
      scaleY: 1,
      duration: 1,
      ease: "power2.out"
    }, "+=0.3");
    
    // 3. The chaotic thought bubbles slow down their movement - only if they exist
    if (hasBubbles) {
      this.thoughtBubbles.forEach((bubble) => {
        this.timeline.to(bubble, {
          duration: 1.5,
          ease: "power2.inOut",
          x: `+=${Math.random() * 10 - 5}`,
          y: `+=${Math.random() * 10 - 5}`,
          scale: 0.9
        }, "-=1.5");
      });
    }
    
    // 4. RedButton logo pulses gently
    this.logoAnimation = gsap.to(this.logo, {
      scale: 1.1,
      repeat: -1,
      yoyo: true,
      duration: 1.5,
      ease: "sine.inOut"
    });
    
    this.timeline.add(this.logoAnimation, "-=1");
    
    // 5. User's expression begins to change from overwhelmed to curious
    this.timeline.to(this.user, {
      backgroundColor: "#4F86F7", // slightly more vibrant blue
      scale: 0.9,
      duration: 1,
      ease: "power1.inOut"
    }, "-=1.5");
  }
  
  public override cleanup(): void {
    super.cleanup();
    if (this.logoAnimation) {
      this.logoAnimation.kill();
    }
  }
}

export const Scene3Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
  thoughtBubblesRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef, thoughtBubblesRef }) => {
  // References
  const logoRef = useRef<HTMLDivElement>(null);
  const lightBeamRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene3RedButtonAppears();
    
    // Get thought bubbles if container is visible and has children
    let thoughtBubbles: HTMLElement[] = [];
    if (thoughtBubblesRef.current && thoughtBubblesRef.current.style.display !== 'none') {
      thoughtBubbles = Array.from(thoughtBubblesRef.current.children)
        .filter(node => node && node.nodeType === 1) as HTMLElement[];
    }
    
    if (!userRef.current) {
      console.warn('Scene3: User element not available for animation');
      return;
    }
    
    if (!logoRef.current) {
      console.warn('Scene3: Logo element not available for animation');
      return;
    }
    
    if (!lightBeamRef.current) {
      console.warn('Scene3: Light beam element not available for animation');
      return;
    }
    
    scene.setElements(
      userRef.current,
      logoRef.current,
      lightBeamRef.current,
      thoughtBubbles,
      narrationRef.current
    );
    
    scene.init();
    scene.play();
    
    // Cleanup
    return () => {
      scene.cleanup();
    };
  }, [userRef, thoughtBubblesRef]);
  
  return (
    <>
      {/* RedButton Logo */}
      <RedButtonLogo ref={logoRef} position={{ top: '10%' }} />
      
      {/* Light Beam */}
      <div
        ref={lightBeamRef}
        className="absolute left-1/2 transform -translate-x-1/2 w-12 bg-gradient-to-b from-red-500 via-red-400 to-transparent opacity-0"
        style={{
          top: '20%',
          height: '25%',
          borderRadius: '50%',
          zIndex: 2,
          filter: 'blur(8px)'
        }}
      ></div>
      
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