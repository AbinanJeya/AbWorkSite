import { useEffect, useState } from 'react';
import ActionProofSection from './components/landing/ActionProofSection.jsx';
import DownloadSection from './components/landing/DownloadSection.jsx';
import FooterSection from './components/landing/FooterSection.jsx';
import HeroSection from './components/landing/HeroSection.jsx';
import NavBar from './components/landing/NavBar.jsx';
import ShowcaseSection from './components/landing/ShowcaseSection.jsx';
import TrustSection from './components/landing/TrustSection.jsx';
import WhyItSticksSection from './components/landing/WhyItSticksSection.jsx';
import { useLandingEffects } from './hooks/useLandingEffects.js';

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useLandingEffects(setNavScrolled);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 961px)');
    const handleBreakpointChange = (event) => {
      if (event.matches) {
        setNavOpen(false);
      }
    };

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, []);

  const closeNav = () => {
    setNavOpen(false);
  };

  return (
    <div className="launch-page">
      <NavBar
        navOpen={navOpen}
        navScrolled={navScrolled}
        onClose={closeNav}
        onToggle={() => setNavOpen((currentValue) => !currentValue)}
      />
      <HeroSection onPrimaryClick={closeNav} onSecondaryClick={closeNav} />
      <ActionProofSection />
      <ShowcaseSection />
      <WhyItSticksSection />
      <TrustSection />
      <DownloadSection />
      <FooterSection />
    </div>
  );
}
