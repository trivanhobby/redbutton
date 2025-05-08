import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { Scene1Component } from './scenes/Scene1OverwhelmedUser';
import { Scene2Component } from './scenes/Scene2AnalysisParalysis';
import { Scene3Component } from './scenes/Scene3RedButtonAppears';
import { Scene4Component } from './scenes/Scene4CoreConcept';
import { Scene5Component } from './scenes/Scene5FeedbackLoop';
import { Scene6Component } from './scenes/Scene6EmotionalContext';
import { Scene7Component } from './scenes/Scene7Closing';
import { User } from './common/AnimationElements';
import { standardThoughts, ThoughtBubble, Thought } from './common/AnimationElements';

enum SceneType {
  OVERWHELMED_USER = 1,
  ANALYSIS_PARALYSIS = 2,
  REDBUTTON_APPEARS = 3,
  CORE_CONCEPT = 4,
  FEEDBACK_LOOP = 5,
  EMOTIONAL_CONTEXT = 6,
  CLOSING = 7
}

interface OnboardingAnimationProps {
  autoPlay?: boolean;
  initialScene?: SceneType;
}

// Create a type for persisted thought bubble positions
interface ThoughtBubblePosition {
  id: number;
  thought: Thought;
  position: { top: string; left: string; };
}

const OnboardingAnimation: React.FC<OnboardingAnimationProps> = ({ 
  autoPlay = true,
  initialScene = SceneType.OVERWHELMED_USER
}) => {
  const [activeScene, setActiveScene] = useState<SceneType>(initialScene);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [elementsReady, setElementsReady] = useState<boolean>(false);
  const [persistedThoughts, setPersistedThoughts] = useState<ThoughtBubblePosition[]>([]);
  
  // Common refs to be passed between scenes
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);
  
  // Initialize the thought bubble positions once and persist them
  useLayoutEffect(() => {
    if (persistedThoughts.length === 0) {
      const avoidCenter = (top: number, left: number) => {
        console.log("avoidCenter", top, left);
        // User is at 50%/50%, radius ~10% (user is 16/100 = 16% of height)
        const dx = left - 50;
        const dy = top - 45;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 15) return false; // Avoid 15% radius around user
        // Narration is at bottom: avoid 80%+ top
        if (top > 75) return false;
        return true;
      };
      const thoughts = standardThoughts.map((thought, index) => {
        let top, left;
        let tries = 0;
        do {
          top = 25 + Math.random() * 50;
          left = 25 + Math.random() * 50;
          tries++;
        } while (!avoidCenter(top, left) && tries < 20);
        return {
          id: index,
          thought,
          position: {
            top: `${top}%`,
            left: `${left}%`
          }
        };
      });
      setPersistedThoughts(thoughts);
    }
  }, []);
  
  // Make sure all required elements are available before showing scenes
  useEffect(() => {
    if (userRef.current && thoughtsContainerRef.current && containerRef.current) {
      // A brief delay to ensure DOM elements are fully rendered
      const timer = setTimeout(() => {
        setElementsReady(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userRef.current, thoughtsContainerRef.current, containerRef.current]);
  
  // Auto-play next scene effect
  useEffect(() => {
    if (!isPlaying || !elementsReady) return;
    
    const sceneDelay = 10000; // 10 seconds per scene
    
    const timer = setTimeout(() => {
      if (activeScene < SceneType.CLOSING) {
        setActiveScene(prev => (prev + 1) as SceneType);
      } else if (autoPlay) {
        // Optionally loop back to the first scene
        setActiveScene(SceneType.OVERWHELMED_USER);
      }
    }, sceneDelay);
    
    return () => clearTimeout(timer);
  }, [activeScene, isPlaying, autoPlay, elementsReady]);
  
  // Handle scene selection
  const handleSelectScene = (scene: SceneType) => {
    setActiveScene(scene);
  };
  
  // Toggle auto-play
  const toggleAutoPlay = () => {
    setIsPlaying(prev => !prev);
  };
  
  // Get scene name
  const getSceneName = (scene: SceneType): string => {
    switch (scene) {
      case SceneType.OVERWHELMED_USER:
        return "Scene 1: The Overwhelmed User";
      case SceneType.ANALYSIS_PARALYSIS:
        return "Scene 2: Analysis Paralysis";
      case SceneType.REDBUTTON_APPEARS:
        return "Scene 3: RedButton Appears";
      case SceneType.CORE_CONCEPT:
        return "Scene 4: The Core Concept";
      case SceneType.FEEDBACK_LOOP:
        return "Scene 5: The Feedback Loop";
      case SceneType.EMOTIONAL_CONTEXT:
        return "Scene 6: Emotional Context";
      case SceneType.CLOSING:
        return "Scene 7: Closing";
      default:
        return "Unknown Scene";
    }
  };
  
  // Should bubbles be visible in the current scene?
  const shouldShowBubbles = (scene: SceneType): boolean => {
    return scene === SceneType.OVERWHELMED_USER || 
           scene === SceneType.ANALYSIS_PARALYSIS;
  };
  
  // Render current scene
  const renderScene = () => {
    const showThoughts = shouldShowBubbles(activeScene);
    // Only show user in scenes 1, 2, 3, 6, 7
    const showUser = [SceneType.OVERWHELMED_USER, SceneType.ANALYSIS_PARALYSIS, SceneType.REDBUTTON_APPEARS, SceneType.EMOTIONAL_CONTEXT, SceneType.CLOSING].includes(activeScene);
    return (
      <div className="relative h-full w-full">
        {/* Common Elements - Always render these */}
        {showUser && <User ref={userRef} initialState={{ opacity: 1, scale: 1 }} />}
        
        <div 
          ref={thoughtsContainerRef} 
          className="thought-bubbles absolute inset-0 pointer-events-none"
          style={{ display: showThoughts ? 'block' : 'none' }}
        >
          {persistedThoughts.map((item) => (
            <ThoughtBubble 
              key={item.id} 
              thought={item.thought} 
              position={item.position}
            />
          ))}
        </div>
        
        {/* Scene-specific components */}
        {elementsReady && activeScene === SceneType.OVERWHELMED_USER && (
          <Scene1Component 
            userRef={userRef} 
            thoughtsContainerRef={thoughtsContainerRef} 
          />
        )}
        
        {elementsReady && activeScene === SceneType.ANALYSIS_PARALYSIS && (
          <Scene2Component 
            userRef={userRef} 
            containerRef={containerRef} 
          />
        )}
        
        {elementsReady && activeScene === SceneType.REDBUTTON_APPEARS && (
          <Scene3Component 
            userRef={userRef}
            thoughtBubblesRef={thoughtsContainerRef}
          />
        )}
        
        {elementsReady && activeScene === SceneType.CORE_CONCEPT && (
          <Scene4Component 
            userRef={userRef}
            thoughtBubblesRef={thoughtsContainerRef}
          />
        )}
        
        {elementsReady && activeScene === SceneType.FEEDBACK_LOOP && (
          <Scene5Component 
            userRef={userRef}
          />
        )}
        
        {elementsReady && activeScene === SceneType.EMOTIONAL_CONTEXT && (
          <Scene6Component 
            userRef={userRef}
          />
        )}
        
        {elementsReady && activeScene === SceneType.CLOSING && (
          <Scene7Component 
            userRef={userRef}
          />
        )}
        
        {/* Loading state when elements aren't ready */}
        {!elementsReady && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-gray-300 rounded-full animate-spin"></div>
              <div className="mt-3">Preparing animation...</div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Add an effect for proper GSAP cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Clear any lingering animations when component unmounts
      gsap.killTweensOf("*");
    };
  }, []);

  // Add cleanup when scene changes
  useEffect(() => {
    // Clean up any stray animations when scene changes
    gsap.killTweensOf("*");
  }, [activeScene]);
  
  return (
    <div className="onboarding-animation relative p-6 my-8 bg-gray-800 rounded-lg">
      
      {/* Current Scene Heading */}
      <div className="bg-gray-900 rounded-t-lg py-2 px-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-200">{getSceneName(activeScene)}</h3>
        {isPlaying && (
          <div className="text-xs text-gray-400 flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Auto-playing
          </div>
        )}
      </div>
      
      {/* Animation Stage */}
      <div 
        ref={containerRef}
        className="animation-stage relative h-96 border-x border-b border-gray-600 rounded-b-lg overflow-hidden bg-gray-900"
      >
        {renderScene()}
      </div>
      
      {/* Navigation Controls */}
      <div className="mt-4 flex justify-center">
        <div className="flex space-x-2 items-center">
          {Object.values(SceneType).filter(v => !isNaN(Number(v))).map((scene) => (
            <div 
              key={scene}
              className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                activeScene === scene ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
              }`}
              onClick={() => handleSelectScene(scene as SceneType)}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingAnimation; 