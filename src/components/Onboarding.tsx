import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding, ONBOARDING_STEPS, OnboardingStep as StepType } from '../context/OnboardingContext';
import { Icon } from '@iconify/react';
import OnboardingAnimation from './onboarding/OnboardingAnimation';
import OnboardingOverview from './onboarding/OnboardingOverview';
import OnboardingGoalChat from './onboarding/OnboardingGoalChat';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';

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
  const { products, status, isLoading, error, createCheckoutSession } = useSubscription();

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

  const handleSubscribe = async (productId: string) => {
    const url = await createCheckoutSession(productId);
    if (url) {
      window.location.href = url;
    }
  };

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
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-500 mb-4">{error}</div>
                  ) : (
                    <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Monthly Plan */}
                      <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
                        <h3 className="text-xl font-semibold mb-2">{products.monthly.name}</h3>
                        <p className="text-muted-foreground mb-4 flex-grow">{products.monthly.description}</p>
                        <div className="text-sm text-muted-foreground mb-4">
                          {products.monthly.trialDays}-day free trial
                        </div>
                        <button
                          onClick={() => handleSubscribe(products.monthly.id)}
                          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Subscribe Monthly
                        </button>
                      </div>

                      {/* Yearly Plan */}
                      <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
                        <h3 className="text-xl font-semibold mb-2">{products.yearly.name}</h3>
                        <p className="text-muted-foreground mb-4 flex-grow">{products.yearly.description}</p>
                        <div className="text-sm text-muted-foreground mb-4">
                          {products.yearly.trialDays}-day free trial
                        </div>
                        <button
                          onClick={() => handleSubscribe(products.yearly.id)}
                          className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Subscribe Yearly
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="mt-6 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-lg font-semibold"
                    onClick={finishAndGoToGoals}
                  >
                    I'm good for now
                  </button>
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

              {String(currentStep) !== 'subscription' && (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  disabled={ONBOARDING_FLOW.indexOf(String(currentStep)) === -1}
                >
                  Next
                  <span className="text-xl">→</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Onboarding; 