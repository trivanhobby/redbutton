import React, { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Scene } from './Scene';
import { updateNarration, RedButtonLogo } from '../common/AnimationElements';

// Journal icon component
const JournalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`journal-icon ${className || ''}`}>
    <div className="w-14 h-16 bg-amber-100 border-2 border-amber-300 rounded-r-md relative shadow-md flex flex-col justify-center items-center">
      <div className="absolute left-0 top-0 h-full w-2 bg-amber-300 rounded-l-sm"></div>
      {/* Journal lines */}
      <div className="w-8 h-0.5 bg-gray-300 my-0.5"></div>
      <div className="w-8 h-0.5 bg-gray-300 my-0.5"></div>
      <div className="w-6 h-0.5 bg-gray-300 my-0.5"></div>
    </div>
  </div>
);

// Goal/Trophy icon component
const GoalIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`goal-icon ${className || ''}`}>
    <div className="w-12 h-14 flex flex-col items-center">
      <div className="w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-500 flex items-center justify-center">
        <div className="text-yellow-700 text-lg font-bold">★</div>
      </div>
      <div className="w-6 h-4 bg-yellow-500 rounded-b-lg mt-1"></div>
      <div className="w-8 h-1 bg-yellow-600 rounded-lg mt-0.5"></div>
    </div>
  </div>
);

// CheckMark component
const CheckMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`checkmark-icon ${className || ''}`}>
    <div className="w-10 h-10 bg-green-400 rounded-full border-2 border-green-500 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

export class Scene5FeedbackLoop extends Scene {
  private user: HTMLDivElement | null = null;
  private completedTask: HTMLDivElement | null = null;
  private journal: HTMLDivElement | null = null;
  private goal: HTMLDivElement | null = null;
  private redButton: HTMLDivElement | null = null;
  private newTask: HTMLDivElement | null = null;
  private narration: HTMLElement | null = null;

  public setElements(
    user: HTMLDivElement | null,
    completedTask: HTMLDivElement | null,
    journal: HTMLDivElement | null,
    goal: HTMLDivElement | null,
    redButton: HTMLDivElement | null,
    newTask: HTMLDivElement | null,
    narration: HTMLElement | null
  ): void {
    this.user = user;
    this.completedTask = completedTask;
    this.journal = journal;
    this.goal = goal;
    this.redButton = redButton;
    this.newTask = newTask;
    this.narration = narration;
  }

  protected createAnimations(): void {
    if (!this.user || !this.completedTask || !this.journal || !this.goal || !this.redButton || !this.newTask) return;
    // Reset all
    gsap.set([
      this.user, this.completedTask, this.journal, this.goal, this.redButton, this.newTask
    ], { opacity: 0, scale: 0.8 });
    // 1. User appears
    this.timeline.to(this.user, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // 2. Completed task appears
    this.timeline.to(this.completedTask, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // 3. Journal appears
    this.timeline.to(this.journal, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // 4. Goal appears
    this.timeline.to(this.goal, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // 5. RedButton appears
    this.timeline.to(this.redButton, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // 6. New task appears
    this.timeline.to(this.newTask, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' });
    // Animate arrows (could use SVG opacity if needed)
    // 7. User becomes more confident
    this.timeline.to(this.user, { scale: 1.1, boxShadow: '0 0 15px #2E64FE', duration: 0.8, ease: 'power2.out' });
    // Narration
    if (this.narration) {
      updateNarration(
        this.narration,
        "Your journal entries and goals progress become fuel for the system, making each next suggestion smarter and more relevant to you.",
        this.timeline
      );
    }
  }
}

export const Scene5Component: React.FC<{
  userRef: React.RefObject<HTMLDivElement>;
}> = ({ userRef }) => {
  const completedTaskRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const redButtonRef = useRef<HTMLDivElement>(null);
  const newTaskRef = useRef<HTMLDivElement>(null);
  const narrationRef = useRef<HTMLDivElement>(null);

  // Arrow visibility state
  const [arrowVisible, setArrowVisible] = useState([false, false, false, false, false]);

  useEffect(() => {
    const scene = new Scene5FeedbackLoop();
    if (!userRef.current || !completedTaskRef.current || !journalRef.current || !goalRef.current || !redButtonRef.current || !newTaskRef.current) return;
    scene.setElements(
      userRef.current,
      completedTaskRef.current,
      journalRef.current,
      goalRef.current,
      redButtonRef.current,
      newTaskRef.current,
      narrationRef.current
    );
    scene.init();
    // Animate arrows in sync with icons using a separate timeline
    setArrowVisible([false, false, false, false, false]);
    const arrowTimeline = gsap.timeline();
    arrowTimeline.to({}, { duration: 0.6, onComplete: () => setArrowVisible(a => [true, a[1], a[2], a[3], a[4]]) }); // after user->completedTask
    arrowTimeline.to({}, { duration: 0.6, onComplete: () => setArrowVisible(a => [true, true, a[2], a[3], a[4]]) }); // after completedTask->journal
    arrowTimeline.to({}, { duration: 0.6, onComplete: () => setArrowVisible(a => [true, true, true, a[3], a[4]]) }); // after journal->goal
    arrowTimeline.to({}, { duration: 0.6, onComplete: () => setArrowVisible(a => [true, true, true, true, a[4]]) }); // after goal->redButton
    arrowTimeline.to({}, { duration: 0.6, onComplete: () => setArrowVisible(a => [true, true, true, true, true]) }); // after redButton->newTask
    scene.play();
    return () => { scene.cleanup(); arrowTimeline.kill(); };
  }, [userRef]);

  // SVG arrow helper
  const Arrow = ({ from, to, visible }: { from: React.RefObject<HTMLDivElement>, to: React.RefObject<HTMLDivElement>, visible: boolean }) => {
    const [coords, setCoords] = React.useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    useEffect(() => {
      function update() {
        if (!from.current || !to.current) return;
        const fromRect = from.current.getBoundingClientRect();
        const toRect = to.current.getBoundingClientRect();
        const parentRect = from.current.parentElement?.getBoundingClientRect();
        if (!parentRect) return;
        setCoords({
          x1: fromRect.right - parentRect.left,
          y1: fromRect.top + fromRect.height / 2 - parentRect.top,
          x2: toRect.left - parentRect.left,
          y2: toRect.top + toRect.height / 2 - parentRect.top
        });
      }
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [from, to]);
    if (!coords || !visible) return null;
    return (
      <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
        <defs>
          <marker id="arrowhead5" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#bbb" />
          </marker>
        </defs>
        <line x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2} stroke="#bbb" strokeWidth={3} markerEnd="url(#arrowhead5)" />
      </svg>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <div className="relative flex flex-row items-center justify-center gap-8" style={{ minHeight: 180 }}>
        {/* User */}
        <div ref={userRef} className="z-10">
          <div className="w-16 h-16 bg-blue-500 rounded-full border-4 border-blue-600 flex items-center justify-center shadow-lg">
            <div className="person-face">
              <div className="eyes flex justify-center space-x-2 mt-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="mouth w-3 h-0.5 bg-white mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
        </div>
        {/* Completed Task */}
        <div ref={completedTaskRef} className="z-10">
          <div className="flex items-center">
            <div className="task-bubble px-4 py-2 bg-green-200 text-green-800 rounded-lg border border-green-300 font-medium text-lg shadow">
              Exercise
            </div>
            <CheckMarkIcon className="ml-2" />
          </div>
        </div>
        {/* Journal */}
        <div ref={journalRef} className="z-10">
          <JournalIcon />
        </div>
        {/* Goal */}
        <div ref={goalRef} className="z-10">
          <GoalIcon />
        </div>
        {/* RedButton */}
        <div ref={redButtonRef} className="z-10">
          <RedButtonLogo />
        </div>
        {/* New Priority Task */}
        <div ref={newTaskRef} className="z-10">
          <div className="task-bubble px-4 py-2 bg-blue-200 text-blue-800 rounded-lg border border-blue-300 font-medium text-lg shadow">
            Work Project
          </div>
        </div>
        {/* SVG Arrows */}
        <Arrow from={userRef} to={completedTaskRef} visible={arrowVisible[0]} />
        <Arrow from={completedTaskRef} to={journalRef} visible={arrowVisible[1]} />
        <Arrow from={journalRef} to={goalRef} visible={arrowVisible[2]} />
        <Arrow from={goalRef} to={redButtonRef} visible={arrowVisible[3]} />
        <Arrow from={redButtonRef} to={newTaskRef} visible={arrowVisible[4]} />
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