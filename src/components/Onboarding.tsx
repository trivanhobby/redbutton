import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding, ONBOARDING_STEPS, OnboardingStep as StepType } from '../context/OnboardingContext';
import { Icon } from '@iconify/react';
import OnboardingAnimation from './onboarding/OnboardingAnimation';
import OnboardingOverview from './onboarding/OnboardingOverview';
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

  if (!isOnboarding) {
    return null;
  }

  // Define step content
  const stepContent: Record<StepType, { title: string; description: string }> = {
    animation: { title: '', description: '' },
    flow: { title: '', description: '' },
    welcome: {
      title: 'Welcome to RedButton',
      description: 'Get started on your productivity journey with our guided tour.'
    },
    goals: {
      title: 'Set Meaningful Goals',
      description: 'Learn how to create and track your long-term goals.'
    },
    initiatives: {
      title: 'Break Down Into Initiatives',
      description: 'Divide your goals into manageable initiatives.'
    },
    checkins: {
      title: 'Regular Check-ins',
      description: 'Track your progress with daily and weekly check-ins.'
    },
    journal: {
      title: 'Journal Your Thoughts',
      description: 'Record your reflections and ideas in the journal.'
    },
    calendar: {
      title: 'Plan With Calendar',
      description: 'Schedule your time effectively with our calendar view.'
    },
    complete: {
      title: 'You\'re All Set!',
      description: 'You\'re now ready to use RedButton to its full potential.'
    }
  };

  // Get content for current step
  const content = stepContent[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-5">
            {/* Progress indicator */}
            <div className="flex justify-between mb-8">
              {ONBOARDING_STEPS.map((step) => {
                const currentStepIndex = ONBOARDING_STEPS.indexOf(currentStep);
                const stepIndex = ONBOARDING_STEPS.indexOf(step);
                return (
                  <div
                    key={step}
                    className={`h-2 w-full mx-1 rounded-full ${
                      currentStep === step
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
              {currentStep === 'animation' && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-3xl mx-auto">
                    <OnboardingAnimation autoPlay={true} />
                  </div>
                </div>
              )}
              {currentStep === 'flow' && (
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold mb-4">In short</h2>
                  <div className="w-full max-w-2xl mx-auto">
                    <OnboardingOverview />
                  </div>
                </div>
              )}
              {currentStep !== 'animation' && currentStep !== 'flow' && (
                <OnboardingStepContent 
                  title={content.title} 
                  description={content.description} 
                />
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8">
              <button
                onClick={currentStep === 'animation' ? skipOnboarding : prevStep}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {currentStep === 'animation' ? 'Skip' : 'Back'}
              </button>

              <button
                onClick={nextStep}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {currentStep === 'complete' ? 'Finish' : 'Next'}
                <Icon icon="mdi:arrow-right" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Onboarding; 