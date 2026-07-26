'use client';
import { useEffect, useState } from 'react';
import BottomNav from './BottomNav';
import Onboarding from './Onboarding';
import Splash from './Splash';
import TopBar from './TopBar';
import { getStoredTheme, applyTheme } from '../lib/theme';

export default function AppShell({ children }) {
  const [phase, setPhase] = useState('splash'); // splash -> onboarding -> app

  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  function handleSplashDone() {
    const done = localStorage.getItem('kleiderschrank_onboarding_done') === '1';
    setPhase(done ? 'app' : 'onboarding');
  }

  if (phase === 'splash') {
    return <Splash onDone={handleSplashDone} />;
  }

  if (phase === 'onboarding') {
    return <Onboarding onComplete={() => setPhase('app')} />;
  }

  return (
    <>
      <TopBar />
      <main className="container fade-in">{children}</main>
      <BottomNav />
    </>
  );
}
