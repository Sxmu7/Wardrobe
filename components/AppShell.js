'use client';
import { useEffect, useState } from 'react';
import BottomNav from './BottomNav';
import Onboarding from './Onboarding';
import { getStoredTheme, applyTheme } from '../lib/theme';

export default function AppShell({ children }) {
  const [ready, setReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    applyTheme(getStoredTheme());
    setOnboardingDone(localStorage.getItem('kleiderschrank_onboarding_done') === '1');
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!onboardingDone) {
    return <Onboarding onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <>
      <main className="container">{children}</main>
      <BottomNav />
    </>
  );
}
