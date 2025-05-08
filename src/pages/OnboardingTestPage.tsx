import React, { useRef, useState } from 'react';
import { StaticUser, StaticBubble, StaticRedButton } from '../components/onboarding/common/AnimationElements';
import OnboardingGoalChat from '../components/onboarding/OnboardingGoalChat';

const Arrow = ({ from, to, label, color = '#bbb', curved = false, right = false }: { from: React.RefObject<HTMLDivElement>, to: React.RefObject<HTMLDivElement>, label?: string, color?: string, curved?: boolean, right?: boolean }) => {
  const [coords, setCoords] = React.useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  React.useLayoutEffect(() => {
    function update() {
      if (!from.current || !to.current) return;
      const fromRect = from.current.getBoundingClientRect();
      const toRect = to.current.getBoundingClientRect();
      const parentRect = from.current.parentElement?.getBoundingClientRect();
      if (!parentRect) return;

      // Calculate center points
      const fromCenterX = fromRect.left + fromRect.width/2 - parentRect.left;
      const fromCenterY = fromRect.top + fromRect.height/2 - parentRect.top;
      const toCenterX = toRect.left + toRect.width/2 - parentRect.left;
      const toCenterY = toRect.top + toRect.height/2 - parentRect.top;

      let x1, x2, y1, y2;

      // Determine relative positions
      const horizontalDiff = Math.abs(fromCenterX - toCenterX);
      const verticalDiff = Math.abs(fromCenterY - toCenterY);

      if (horizontalDiff > verticalDiff) {
        // Primarily horizontal movement
        y1 = fromCenterY;
        y2 = toCenterY;
        if (fromCenterX < toCenterX) {
          // From is left of to
          x1 = fromRect.right - parentRect.left;
          x2 = toRect.left - parentRect.left;
        } else {
          // From is right of to
          x1 = fromRect.left - parentRect.left;
          x2 = toRect.right - parentRect.left;
        }
      } else {
        // Primarily vertical movement
        x1 = fromCenterX;
        x2 = toCenterX;
        if (fromCenterY < toCenterY) {
          // From is above to
          y1 = fromRect.bottom - parentRect.top;
          y2 = toRect.top - parentRect.top;
        } else {
          // From is below to
          y1 = fromRect.top - parentRect.top;
          y2 = toRect.bottom - parentRect.top;
        }
      }

      setCoords({ x1, y1, x2, y2 });
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [from, to]);
  if (!coords) return null;
  const midX = (coords.x1 + coords.x2) / 2;
  const midY = (coords.y1 + coords.y2) / 2;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}>
      <defs>
        <marker id="arrowheadFlow" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
        </marker>
      </defs>
      {curved ? (
        <path d={`M${coords.x1},${coords.y1} Q${midX},${midY - 40} ${coords.x2},${coords.y2}`} stroke={color} strokeWidth={3} fill="none" markerEnd="url(#arrowheadFlow)" />
      ) : (
        <line x1={coords.x1} y1={coords.y1} x2={coords.x2} y2={coords.y2} stroke={color} strokeWidth={3} markerEnd="url(#arrowheadFlow)" />
      )}
      {label && (
        <text x={midX} y={midY - 10} fill={color} fontSize="14" textAnchor="middle">{label}</text>
      )}
    </svg>
  );
};

const OnboardingFlowStatic: React.FC = () => {
  // Refs for positioning
  const userRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLDivElement>(null);
  const initiativesRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const checkinRef = useRef<HTMLDivElement>(null);
  const redButtonRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);
  const happyUserRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full flex flex-col items-start justify-center bg-gray-900 rounded-lg shadow-lg p-8 gap-8" style={{ minHeight: 600, maxWidth: 700 }}>
      {/* Row 1 */}
      <div className="relative w-full flex flex-row items-center gap-20 mb-2" style={{ height: 80 }}>
        <div ref={userRef}><StaticUser /></div>
        <Arrow from={userRef} to={goalRef} label="create" color="#77DD77" />
        <div ref={goalRef}><StaticBubble text="Goal" color="#B5EAD7" /></div>
        <Arrow from={goalRef} to={initiativesRef} label="+" color="#B5EAD7" />
        <div ref={initiativesRef}><StaticBubble text="Initiatives" color="#C7CEEA" /></div>
      </div>
      {/* Row 2 */}
      <div className="relative w-full flex flex-row items-center gap-20 mb-2" style={{ height: 80 }}>
        {/* <div style={{ width: 64 }}></div> {}
        <Arrow from={userRef} to={journalRef} label="reflects and feels" color="#FF9AA2" /> */}
        <div ref={journalRef}><StaticBubble text="Journal" color="#FFDAC1" /></div>
        {/* <Arrow from={initiativesRef} to={checkinRef} label="plan" color="#C7CEEA" /> */}
        <div ref={redButtonRef}><StaticRedButton /></div>
        <div ref={checkinRef}><StaticBubble text="CheckIn" color="#F0E6EF" /></div>
        <Arrow from={journalRef} to={redButtonRef} label="trains" color="#e53e3e" />
        <Arrow from={checkinRef} to={redButtonRef} label="trains" color="#e53e3e" />
        <Arrow from={goalRef} to={redButtonRef} label="trains" color="#e53e3e" />
      </div>
      {/* Row 3 */}
      <div className="relative w-full flex flex-row items-center gap-20" style={{ height: 80 }}>
        <div style={{ width: 64 }}></div> {/* spacer for alignment */}
        <Arrow from={redButtonRef} to={focusRef} label="provides" color="#e53e3e" />
        <div ref={focusRef}><StaticBubble text="Focus Item" color="#77DD77" /></div>
        <div ref={happyUserRef}><StaticUser emoji="😃" /></div>
        <Arrow from={focusRef} to={happyUserRef} label="makes" color="#77DD77" />
      </div>
    </div>
  );
};

const OnboardingTestPage: React.FC = () => {
  const [step, setStep] = useState<'animation' | 'flow' | 'chat'>('animation');

  return (
    <div className="w-full flex flex-col items-center justify-center">
      {step === 'animation' && (
        <div>
          <OnboardingFlowStatic />
          <button
            onClick={() => setStep('flow')}
            className="mt-4 bg-primary text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      )}
      {step === 'flow' && (
        <div>
          <OnboardingFlowStatic />
          <button
            onClick={() => setStep('chat')}
            className="mt-4 bg-primary text-white px-4 py-2 rounded"
          >
            Next
          </button>
        </div>
      )}
      {step === 'chat' && (
        <div className="w-full max-w-4xl h-[80vh] bg-gray-900 rounded-lg shadow-lg">
          <OnboardingGoalChat />
        </div>
      )}
    </div>
  );
};

export default OnboardingTestPage; 