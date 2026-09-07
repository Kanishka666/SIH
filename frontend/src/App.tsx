import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AnimatedTopDockVariant } from './components/AnimatedTopDock';
import { HeroHeader } from './components/HeroHeader';
import { LandscapeSectionCard } from './components/LandscapeSectionCard';
import { FoodInspectionShowcase } from './components/FoodInspectionShowcase';
import { IntroAnimationOverlay } from './components/IntroAnimationOverlay';
import { ModuleModal } from './components/ModuleModal';
import { OCRScannerModal } from './components/OCRScannerModal';
import { AuthModal } from './components/AuthModal';
import { UplinkSequence } from './components/UplinkSequence';
import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { MODULES } from './data/modules';
import { UserProfile, AuthMode, NormalizedOCRResult } from './types';
import { backendApi } from './services/backendApi';

export default function App() {
  const [activeModalId, setActiveModalId] = useState<number | null>(null);
  const [ocrScannerOpen, setOcrScannerOpen] = useState(false);
  const [scannerPresetId, setScannerPresetId] = useState<string | undefined>(undefined);
  const [dockVariant, setDockVariant] = useState<AnimatedTopDockVariant>('modern');
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Authentication & Uplink States
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('labellens_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return;
    backendApi.me().then((profile) => {
      const authenticatedUser: UserProfile = { name: profile.name, email: profile.email, role: profile.role, clearanceLevel: profile.role, token: localStorage.getItem('access_token') || '', lastLogin: new Date().toISOString() };
      setUser(authenticatedUser);
      localStorage.setItem('labellens_user', JSON.stringify(authenticatedUser));
    }).catch(() => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('labellens_user');
      setUser(null);
    });
  }, []);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [uplinkActive, setUplinkActive] = useState(false);
  const [uplinkMode, setUplinkMode] = useState<'login' | 'signup'>('login');

  const handleOpenModal = (id: number) => {
    if (id === 1) {
      // Direct launch of Interactive Drag & Drop OCR Scanner for Module 1 / "Start Scanning"
      setOcrScannerOpen(true);
      setActiveModalId(null);
    } else {
      setActiveModalId(id);
    }
  };

  const handleCloseModal = () => {
    setActiveModalId(null);
  };

  const handleScanComplete = (result: NormalizedOCRResult) => {
    void result;
  };

  const handleOpenScanner = (presetId?: string) => {
    setScannerPresetId(presetId);
    setOcrScannerOpen(true);
    setActiveModalId(null);
    setDashboardOpen(false);
  };

  const handleCloseScanner = () => {
    setOcrScannerOpen(false);
  };

  const handleOpenAuth = (mode: AuthMode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setAuthModalOpen(false);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile, mode: AuthMode) => {
    setUser(authenticatedUser);
    try {
      localStorage.setItem('labellens_user', JSON.stringify(authenticatedUser));
    } catch {
      // Ignore storage errors
    }
    setAuthModalOpen(false);
    setUplinkActive(false);
    // Open dashboard upon successful login
    setDashboardOpen(true);
  };

  const handleLogout = () => {
    setUser(null);
    setDashboardOpen(false);
    try {
      localStorage.removeItem('labellens_user');
      localStorage.removeItem('access_token');
    } catch {
      // Ignore
    }
  };

  const handleOpenDashboard = () => {
    if (user) {
      setDashboardOpen(true);
    } else {
      handleOpenAuth('login');
    }
  };

  const handleScrollToSection = (id: number) => {
    const el = document.getElementById(`module-0${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollDown = () => {
    const firstModule = document.getElementById('module-01');
    if (firstModule) {
      firstModule.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const selectedModule = activeModalId ? MODULES[activeModalId] : null;

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col selection:bg-yellow-300 selection:text-black font-mono relative overflow-x-hidden">
      {/* Animate UI-style smooth intro flow overlay */}
      <IntroAnimationOverlay />

      {/* Fixed Navigation */}
      <Navbar
        user={user}
        variant={dockVariant}
        onVariantChange={setDockVariant}
        onOpenModal={handleOpenModal}
        onScrollToSection={handleScrollToSection}
        onOpenAuth={handleOpenAuth}
        onOpenDashboard={handleOpenDashboard}
        onLogout={handleLogout}
      />

      {/* Main Landing Page Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12">
        {/* Intro Hero Section */}
        <div className="intro-reveal opacity-0 translate-y-4 transition-all duration-1000">
          <HeroHeader
            onScrollDown={handleScrollDown}
            onOpenSpecs={handleOpenModal}
          />
        </div>

        {/* Food Inspection Intelligence Showcase (Inspired by uploaded food inspection graphics) */}
        <div className="intro-reveal opacity-0 translate-y-4 transition-all duration-1000 delay-200">
          <FoodInspectionShowcase />
        </div>

        {/* Stacked Landscape Sections (Separately below each other in landscape orientation) */}
        <div className="intro-reveal opacity-0 translate-y-4 transition-all duration-1000 delay-300 flex flex-col gap-10 sm:gap-14 md:gap-18 w-full pb-16">
          <LandscapeSectionCard
            module={MODULES[1]}
            onOpenModal={handleOpenModal}
            index={0}
          />

          <LandscapeSectionCard
            module={MODULES[2]}
            onOpenModal={handleOpenModal}
            index={1}
          />

          <LandscapeSectionCard
            module={MODULES[3]}
            onOpenModal={handleOpenModal}
            index={2}
          />
        </div>
      </main>

      {/* Interactive Detail Modal for Specification Modules */}
      {selectedModule && (
        <ModuleModal
          module={selectedModule}
          onClose={handleCloseModal}
          onSelectModule={(id) => {
            if (id === 1) {
              handleOpenScanner();
            } else {
              setActiveModalId(id);
            }
          }}
          onOpenScanner={handleOpenScanner}
        />
      )}

      {/* Dashboard Component (Renders when user is logged in and dashboardOpen is true) */}
      {dashboardOpen && user && (
        <Dashboard
          user={user}
          onClose={() => setDashboardOpen(false)}
          onLaunchScanner={() => {
            setDashboardOpen(false);
            setOcrScannerOpen(true);
          }}
        />
      )}

      {/* Interactive Drag-and-Drop Neural OCR Scanner */}
      {ocrScannerOpen && (
        <OCRScannerModal
          isOpen={ocrScannerOpen}
          onClose={handleCloseScanner}
          initialPresetId={scannerPresetId}
          onScanComplete={handleScanComplete}
        />
      )}

      {/* Auth Modal with Slider Animation */}
      {authModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={handleCloseAuth}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Yellow SYS.LINK Uplink Sequence (Triggered after Login or Signup or Manual Replay) */}
      {uplinkActive && user && (
        <UplinkSequence
          user={user}
          mode={uplinkMode}
          onComplete={() => setUplinkActive(false)}
          onClose={() => setUplinkActive(false)}
        />
      )}

      {/* Engineering Footer */}
      <Footer
        onScrollToTop={handleScrollToTop}
        onOpenModal={handleOpenModal}
      />
    </div>
  );
}
