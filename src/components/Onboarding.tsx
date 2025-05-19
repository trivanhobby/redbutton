import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding, ONBOARDING_STEPS, OnboardingStep as StepType } from '../context/OnboardingContext';
import { Icon } from '@iconify/react';
import OnboardingAnimation from './onboarding/OnboardingAnimation';
import OnboardingOverview from './onboarding/OnboardingOverview';
import OnboardingGoalChat from './onboarding/OnboardingGoalChat';
import { useNavigate } from 'react-router-dom';

type OnboardingStepProps = {
  title: string;
  description: string;
};

// Placeholder component for onboarding steps
const OnboardingStepContent: React.FC<OnboardingStepProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-muted-foreground mb-8">{description}</p>
      <div className="w-64 h-64 bg-muted rounded-lg mb-8 flex items-center justify-center">
        <p className="text-muted-foreground">Illustration placeholder</p>
      </div>
    </div>
  );
};

const Onboarding: React.FC = () => {
  const { 
    isOnboarding, 
    currentStep, 
    skipOnboarding, 
    nextStep, 
    prevStep 
  } = useOnboarding();
  const navigate = useNavigate();

  if (!isOnboarding) {
    return null;
  }

  // Define the 5-step onboarding flow
  const stepContent: Record<string, { title: string; description: string } | null> = {
    animation: { title: '', description: '' },
    flow: { title: '', description: '' },
    prepareGoals: {
      title: 'Prepare to Fill in Your Goals',
      description: 'You are about to add your first goals. Use the assistant to talk about what you want to achieve. You can always add or tweak goals later from the Goals page!'
    },
    chat: null, // handled by OnboardingGoalChat
    subscription: {
      title: 'The Power of Contextual Generation',
      description: 'We can provide you with generic recommendations based on similar goals of other users, or create them entirely for you!'
    }
  };

  const ONBOARDING_FLOW: string[] = [
    'animation',
    'flow',
    'prepareGoals',
    'chat',
    'subscription'
  ];

  const content = stepContent[currentStep];

  const finishAndGoToGoals = () => {
    skipOnboarding();
    navigate('/goals');
  };

  // Popup size: large for chat step
  let popupClass = 'bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto';
  if (String(currentStep) === 'chat') {
    popupClass = 'bg-card rounded-lg shadow-xl max-w-6xl w-full max-h-[98vh] m-4 overflow-y-auto';
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={popupClass}
        >
          <div className="p-5">
            {/* Progress indicator */}
            <div className="flex justify-between mb-8">
              {ONBOARDING_FLOW.map((step) => {
                const currentStepIndex = ONBOARDING_FLOW.indexOf(String(currentStep));
                const stepIndex = ONBOARDING_FLOW.indexOf(step);
                return (
                  <div
                    key={step}
                    className={`h-2 w-full mx-1 rounded-full ${
                      String(currentStep) === step
                        ? 'bg-primary animate-pulse'
                        : currentStepIndex > stepIndex
                          ? 'bg-primary'
                          : 'bg-muted'
                    }`}
                  />
                );
              })}
            </div>

            {/* Content */}
            <div className="mb-6">
              {String(currentStep) === 'animation' && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-3xl mx-auto">
                    <OnboardingAnimation autoPlay={true} />
                  </div>
                </div>
              )}
              {String(currentStep) === 'flow' && (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4">In short</h2>
                  <div className="w-full max-w-2xl mx-auto">
                    <OnboardingOverview />
                  </div>
                </div>
              )}
              {String(currentStep) === 'prepareGoals' && content && (
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
                  <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{content.description}</p>
                </div>
              )}
              {String(currentStep) === 'chat' && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-6xl mx-auto">
                    <OnboardingGoalChat />
                  </div>
                </div>
              )}
              {String(currentStep) === 'subscription' && (
                <div className="flex flex-col items-center text-center">
                  <h2 className="text-2xl font-bold mb-4">{stepContent.subscription?.title}</h2>
                  <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{stepContent.subscription?.description}</p>
                  <div className="w-full flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      className="px-6 py-3 bg-primary text-white rounded-md hover:bg-opacity-90 text-lg font-semibold"
                      onClick={finishAndGoToGoals}
                    >
                      Subscribe
                    </button>
                    <button
                      className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-lg font-semibold"
                      onClick={finishAndGoToGoals}
                    >
                      I'm good
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={String(currentStep) === 'animation' ? skipOnboarding : prevStep}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {String(currentStep) === 'animation' ? 'Skip' : 'Back'}
              </button>

              <button
                onClick={nextStep}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                disabled={ONBOARDING_FLOW.indexOf(String(currentStep)) === -1}
              >
                {String(currentStep) === 'subscription' ? 'Finish' : 'Next'}
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Onboarding; 