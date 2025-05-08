import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

export type OnboardingStep = 'animation' | 'flow' | 'welcome' | 'goals' | 'initiatives' | 'checkins' | 'journal' | 'calendar' | 'complete';

interface OnboardingContextType {
  isOnboarding: boolean;
  currentStep: OnboardingStep;
  startOnboarding: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: OnboardingStep) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'animation',
  'flow',
  'welcome',
  'goals',
  'initiatives',
  'checkins',
  'journal',
  'calendar',
  'complete'
];

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, updateSettings } = useData();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('animation');

  // Check if onboarding should be shown when the app loads
  useEffect(() => {
    if (data.settings?.hasCompletedOnboarding === false) {
      setIsOnboarding(true);
    }
  }, [data.settings?.hasCompletedOnboarding]);

  const startOnboarding = () => {
    setIsOnboarding(true);
    setCurrentStep('animation');
  };

  const skipOnboarding = () => {
    setIsOnboarding(false);
    updateSettings({ hasCompletedOnboarding: true });
  };

  const completeOnboarding = () => {
    setIsOnboarding(false);
    updateSettings({ hasCompletedOnboarding: true });
  };

  const nextStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex + 1]);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(ONBOARDING_STEPS[currentIndex - 1]);
    }
  };

  const goToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        currentStep,
        startOnboarding,
        skipOnboarding,
        completeOnboarding,
        nextStep,
        prevStep,
        goToStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 