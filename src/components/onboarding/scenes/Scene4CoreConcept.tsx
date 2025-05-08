import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { ThoughtBubble, Thought, updateNarration } from '../common/AnimationElements';

// Define interfaces locally
interface Emotion {
  name: string;
  color: string;
  icon: string;
}

export class Scene4CoreConcept extends Scene {
  private user: HTMLDivElement | null = null;
  private redButtonInterface: HTMLDivElement | null = null;
  private thoughtBubbles: HTMLElement[] = [];
  private narration: HTMLElement | null = null;
  private emotions: HTMLElement[] = [];
  private selectedBubble: HTMLElement | null = null;
  private selectedEmotion: HTMLElement | null = null;
  private interfaceAnimation: gsap.core.Tween | null = null;

  public setElements(
    user: HTMLDivElement | null,
    redButtonInterface: HTMLDivElement | null,
    thoughtBubbles: HTMLElement[],
    narration: HTMLElement | null,
    emotions: HTMLElement[],
    selectedBubble: HTMLElement | null,
    selectedEmotion: HTMLElement | null
  ): void {
    this.user = user;
    this.redButtonInterface = redButtonInterface;
    this.thoughtBubbles = thoughtBubbles.filter(bubble => bubble && bubble.nodeType === 1);
    this.narration = narration;
    this.emotions = emotions.filter(emotion => emotion && emotion.nodeType === 1);
    this.selectedBubble = selectedBubble;
    this.selectedEmotion = selectedEmotion;
  }

  protected createAnimations(): void {
    // Check required elements    
    if (!this.redButtonInterface) {
      console.warn('Scene4: RedButton interface element is missing');
      return;
    }
    
    if (!this.selectedBubble) {
      console.warn('Scene4: Selected bubble element is missing');
      return;
    }
    
    if (!this.selectedEmotion) {
      console.warn('Scene4: Selected emotion element is missing');
      return;
    }
    
    // Reset properties
    gsap.set(this.redButtonInterface, {
      opacity: 0,
      scale: 0,
      transformOrigin: "top center"
    });
    
    gsap.set(this.selectedBubble, {
      scale: 1,
      opacity: 1,
      x: 0,
      y: 0,
      transformOrigin: "center center"
    });
    
    // First create visible thought bubbles if we have bubbles to work with 
    if (this.thoughtBubbles.length > 0) {
      // Ensure thought bubbles are visible in case they were hidden from previous scenes
      gsap.set(this.thoughtBubbles, {
        opacity: 1,
        scale: 1,
        clearProps: "x,y"  // Clear any previous transforms
      });
    }
    
    // 1. Start with narration explaining the RedButton concept
    if (this.narration) {
      updateNarration(
        this.narration,
        "RedButton provides clarity by focusing on ONE thing at a time, based on your context and emotion.",
        this.timeline
      );
    }
    
    // 2. Display the RedButton interface
    this.timeline.to(this.redButtonInterface, {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: "back.out(1.7)"
    });
    
    // 3. Highlight the "feeling" section with a subtle pulse
    if (this.emotions.length > 0) {
      this.timeline.to(this.emotions, {
        backgroundColor: "#2A2A35",
        boxShadow: "0 0 8px rgba(255, 255, 255, 0.3)",
        duration: 0.5
      });
      
      // 4. Highlight a specific emotion as the selected one
      this.timeline.to(this.selectedEmotion, {
        backgroundColor: "#4A3AFF",
        scale: 1.1,
        boxShadow: "0 0 12px rgba(74, 58, 255, 0.5)",
        duration: 0.5
      });
    }
    
    // Label for organizing bubbles
    this.timeline.addLabel("organize", "+=0.5");
    
    // Create the actual organization animation
    if (this.thoughtBubbles.length > 0) {
      // 5. Other bubbles fade to background (still visible but muted)
      this.thoughtBubbles.forEach((bubble) => {
        if (bubble && bubble !== this.selectedBubble) {
          this.timeline.to(bubble, {
            opacity: 0.3,
            scale: 0.6,
            duration: 0.5
          }, "organize+=3");
        }
      });
    }
    
    // 6. User moves toward the highlighted bubble
    if (this.user && this.selectedBubble) {
      this.timeline.to(this.user, {
        x: 75, // Fixed position rather than calculating from bubble's position which might not be reliable
        y: 50,
        duration: 1.5,
        ease: "power2.inOut"
      }, "organize+=4");
      
      // 7. User's expression changes to determined/focused
      this.timeline.to(this.user, {
        backgroundColor: "#377CF6", // brighter blue
        borderColor: "#0047AB",
        scale: 1,
        duration: 1,
        ease: "power1.inOut"
      }, "organize+=4");
      
      // 8. Selected bubble glows
      this.timeline.to(this.selectedBubble, {
        boxShadow: "0 0 15px rgba(255, 255, 255, 0.6)",
        backgroundColor: "#FFB7B2",
        scale: 1.2,
        duration: 0.7,
        ease: "sine.out"
      }, "organize+=5");
    }
    
    // 9. RedButton interface subtly pulses to indicate it's working
    this.interfaceAnimation = gsap.to(this.redButtonInterface, {
      boxShadow: "0 0 15px rgba(255, 0, 0, 0.3)",
      repeat: -1,
      yoyo: true,
      duration: 1.5
    });
    
    this.timeline.add(this.interfaceAnimation, "organize+=3");
  }
  
  public override cleanup(): void {
    super.cleanup();
    if (this.interfaceAnimation) {
      this.interfaceAnimation.kill();
    }
  }
}

export const Scene4Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
  thoughtBubblesRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef, thoughtBubblesRef }) => {
  // References
  const redButtonInterfaceRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);
  const emotionsContainerRef = useRef<HTMLDivElement>(null);
  const selectedBubbleRef = useRef<HTMLDivElement>(null);
  const selectedEmotionRef = useRef<HTMLDivElement>(null);
  
  // Emotions data
  const emotions: Emotion[] = [
    { name: "Happy", color: "#FFD700", icon: "😊" },
    { name: "Stressed", color: "#FF6B6B", icon: "😓" },
    { name: "Tired", color: "#A0A0A0", icon: "😴" },
    { name: "Motivated", color: "#77DD77", icon: "🔥" },
    { name: "Confused", color: "#AEC6CF", icon: "🤔" }
  ];
  
  // Selected thought
  const selectedThought: Thought = {
    text: "Exercise",
    color: "#FFB7B2"
  };
  
  // Animation logic
  useEffect(() => {
    const scene = new Scene4CoreConcept();
    
    // Get thought bubbles if they exist and are visible
    let thoughtBubbles: HTMLElement[] = [];
    if (thoughtBubblesRef.current && thoughtBubblesRef.current.style.display !== 'none') {
      thoughtBubbles = Array.from(thoughtBubblesRef.current.children)
        .filter(node => node && node.nodeType === 1) as HTMLElement[];
    }
    
    const emotionElements = Array.from(emotionsContainerRef.current?.children || [])
      .filter(node => node && node.nodeType === 1) as HTMLElement[];
    
  
    if (!redButtonInterfaceRef.current) {
      console.warn('Scene4: RedButton interface not available for animation');
      return;
    }
    
    if (!selectedBubbleRef.current) {
      console.warn('Scene4: Selected bubble not available for animation');
      return;
    }
    
    if (!selectedEmotionRef.current) {
      console.warn('Scene4: Selected emotion not available for animation');
      return;
    }
    
    scene.setElements(
      userRef.current,
      redButtonInterfaceRef.current,
      thoughtBubbles,
      narrationRef.current,
      emotionElements,
      selectedBubbleRef.current,
      selectedEmotionRef.current
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
      {/* RedButton Interface */}
      <div 
        ref={redButtonInterfaceRef}
        className="red-button-interface absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg border border-gray-600 p-4 shadow-lg"
        style={{ width: "360px", opacity: 0 }}
      >
        <div className="interface-header flex items-center mb-4">
          <div className="logo w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold">RB</span>
          </div>
          <h3 className="text-white font-medium">RedButton</h3>
        </div>
        
        <div className="interface-content">
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-1">Right now, you're feeling:</div>
            <div 
              ref={emotionsContainerRef}
              className="emotions-list flex space-x-2 mb-3"
            >
              {emotions.map((emotion, index) => (
                <div 
                  key={index}
                  ref={emotion.name === "Stressed" ? selectedEmotionRef : null}
                  className="emotion-item flex flex-col items-center p-2 bg-gray-700 rounded-md"
                  style={{ width: "60px" }}
                >
                  <div className="text-xl">{emotion.icon}</div>
                  <div className="text-xs text-gray-300 mt-1">{emotion.name}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400 mb-1">You should focus on:</div>
            <div className="selected-priority p-3 bg-gray-700 rounded-md">
              <div 
                ref={selectedBubbleRef}
                className="priority-bubble inline-block px-4 py-2 rounded-full text-gray-800 font-medium"
                style={{ backgroundColor: selectedThought.color }}
              >
                {selectedThought.text}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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