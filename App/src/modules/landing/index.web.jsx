/**
 * index.web.jsx — Pre-login Landing Page for Web/Desktop
 *
 * Direction: Practical Agronomic Intelligence & Credibility
 * Built for demanding farmers, agricultural directors, and farm managers.
 */

import React from 'react';
import { LandingTopNav } from './components/LandingTopNav';
import { HeroCredibility } from './components/HeroCredibility';
import { WorkflowThreeSteps } from './components/WorkflowThreeSteps';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { SecurityAndOfflineTrust } from './components/SecurityAndOfflineTrust';
import { CallToActionSection } from './components/CallToActionSection';
import { FooterSection } from './components/FooterSection';

export function LandingLayout() {
  return (
    <div style={{
      backgroundColor: '#06090E',
      color: '#F8FAFC',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      position: 'relative',
      minHeight: '100vh',
    }}>
      <style>{`
        /* Scan beam animation in leaf simulator */
        @keyframes scanBeam {
          0% { top: 15%; opacity: 0.8; }
          50% { top: 80%; opacity: 1; }
          100% { top: 15%; opacity: 0.8; }
        }

        /* Responsive Grid Tweaks */
        @media (max-width: 860px) {
          .simulator-grid {
            grid-template-columns: 1fr !important;
          }
          .matrix-row {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .desktop-pill {
            display: none !important;
          }
        }
        @media (min-width: 861px) {
          .desktop-pill {
            display: flex !important;
          }
        }

        /* Smooth scroll styling */
        html {
          scroll-behavior: smooth;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #06090E; }
        ::-webkit-scrollbar-thumb { background: #1B2537; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #00F5A0; }
      `}</style>

      {/* Fixed Navigation Header */}
      <LandingTopNav />

      {/* Hero Section with Interactive Leaf Simulator */}
      <HeroCredibility />

      {/* 3 Step Workflow */}
      <WorkflowThreeSteps />

      {/* Direct Economic & Agronomic Comparison */}
      <ComparisonMatrix />

      {/* Offline AI & Data Ownership Trust */}
      <SecurityAndOfflineTrust />

      {/* Bottom Conversion Action */}
      <CallToActionSection />

      {/* Corporate High-Tech Footer */}
      <FooterSection />
    </div>
  );
}

export default LandingLayout;
