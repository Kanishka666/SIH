import React, { useState } from 'react';
import { AnimatedTopDock, AnimatedTopDockVariant } from './AnimatedTopDock';
import { UserProfile, AuthMode } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onOpenModal: (id: number) => void;
  onScrollToSection: (id: number) => void;
  onOpenAuth: (mode: AuthMode) => void;
  onOpenDashboard: () => void;
  onLogout: () => void;
  variant?: AnimatedTopDockVariant;
  onVariantChange?: (variant: AnimatedTopDockVariant) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenModal,
  onScrollToSection,
  onOpenAuth,
  onOpenDashboard,
  onLogout,
  variant,
  onVariantChange,
}) => {
  const [activeVariant, setActiveVariant] = useState<AnimatedTopDockVariant>(variant || 'modern');

  const handleVariantChange = (v: AnimatedTopDockVariant) => {
    setActiveVariant(v);
    onVariantChange?.(v);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#111111]/95 backdrop-blur-md border-b border-white/10 transition-all h-16 flex items-center">
      <AnimatedTopDock
        variant={variant || activeVariant}
        user={user}
        onOpenModal={onOpenModal}
        onScrollToSection={onScrollToSection}
        onOpenAuth={onOpenAuth}
        onOpenDashboard={onOpenDashboard}
        onLogout={onLogout}
        onVariantChange={handleVariantChange}
      />
    </header>
  );
};

