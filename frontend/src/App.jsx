import React, { useState, useEffect } from 'react';
import TripForm from "./components/TripForm";

// ---------- SVG Icons (inline for simplicity) ----------
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PlaneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------- Navigation links ----------
const navLinks = [
  { label: 'Home', href: '#' },
  { label: 'Destinations', href: '#' },
  { label: 'Itineraries', href: '#' },
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
];

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add subtle shadow to header on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <div className="app">
      {/* =====================================
          GLOBAL STYLES & ANIMATIONS
      ====================================== */}
      <style>{`
        /* ---------- Base & Theme ---------- */
        :root {
          --bg-primary: #f8faff;
          --bg-secondary: #ffffff;
          --bg-glass: rgba(255, 255, 255, 0.65);
          --bg-glass-heavy: rgba(255, 255, 255, 0.85);
          --text-primary: #1a1a2e;
          --text-secondary: #4a4a6a;
          --text-muted: #8888aa;
          --accent-1: #6c5ce7;
          --accent-2: #00b4d8;
          --accent-3: #ff6b6b;
          --gradient-hero: linear-gradient(135deg, #e0e7ff 0%, #f0f4ff 30%, #e8f4f8 70%, #fce4ec 100%);
          --gradient-accent: linear-gradient(135deg, #6c5ce7, #00b4d8);
          --shadow-sm: 0 2px 8px rgba(108, 92, 231, 0.08);
          --shadow-md: 0 8px 32px rgba(108, 92, 231, 0.12);
          --shadow-lg: 0 16px 48px rgba(108, 92, 231, 0.16);
          --shadow-glow: 0 0 40px rgba(108, 92, 231, 0.2);
          --radius-sm: 12px;
          --radius-md: 20px;
          --radius-lg: 28px;
          --radius-full: 9999px;
          --transition-smooth: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          --transition-bounce: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: var(--bg-primary);
          color: var(--text-primary);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow-x: hidden;
        }

        .app {
          min-height: 100vh;
          position: relative;
        }

        /* ---------- Animated Background Orbs ---------- */
        .app::before {
          content: '';
          position: fixed;
          top: -20%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(108, 92, 231, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          animation: orbFloat1 20s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .app::after {
          content: '';
          position: fixed;
          bottom: -20%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, transparent 70%);
          border-radius: 50%;
          animation: orbFloat2 25s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 5%) scale(1.1); }
          66% { transform: translate(-3%, 8%) scale(0.95); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-5%, -5%) scale(1.15); }
          66% { transform: translate(4%, -3%) scale(0.9); }
        }

        /* ---------- Header ---------- */
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 16px 24px;
          transition: var(--transition-smooth);
        }

        .header--scrolled {
          background: var(--bg-glass-heavy);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: var(--shadow-sm);
          padding: 10px 24px;
        }

        .header__inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--accent-1);
          letter-spacing: -0.02em;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .logo:hover {
          transform: scale(1.02);
          filter: drop-shadow(0 0 12px rgba(108, 92, 231, 0.3));
        }

        .logo svg {
          animation: planeBob 3s ease-in-out infinite;
        }

        @keyframes planeBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        /* ---------- Desktop Navigation ---------- */
        .nav--desktop {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav__link {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          transition: var(--transition-smooth);
          position: relative;
          overflow: hidden;
        }

        .nav__link::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--gradient-accent);
          opacity: 0;
          transition: var(--transition-smooth);
          border-radius: var(--radius-full);
          z-index: -1;
        }

        .nav__link:hover {
          color: #fff;
          transform: translateY(-2px);
        }

        .nav__link:hover::before {
          opacity: 1;
        }

        .nav__link::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          width: 0;
          height: 2px;
          background: var(--accent-1);
          transition: var(--transition-smooth);
          transform: translateX(-50%);
          border-radius: 2px;
        }

        .nav__link:hover::after {
          width: 60%;
          background: #fff;
        }

        /* ---------- Menu Toggle (Mobile) ---------- */
        .menu-toggle {
          display: none;
          background: var(--bg-glass);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.15);
          color: var(--text-primary);
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .menu-toggle:hover {
          background: var(--accent-1);
          color: #fff;
          transform: scale(1.05);
          box-shadow: var(--shadow-glow);
        }

        /* ---------- Mobile Navigation Drawer ---------- */
        .nav--mobile {
          position: fixed;
          top: 0;
          right: -100%;
          width: min(320px, 85vw);
          height: 100vh;
          background: var(--bg-glass-heavy);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow: var(--shadow-lg);
          transition: right 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 1001;
          padding: 80px 32px 32px;
          overflow-y: auto;
        }

        .nav--mobile-open {
          right: 0;
        }

        .nav__mobile-inner {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav__link--mobile {
          font-size: 1.1rem;
          padding: 14px 20px;
          border-radius: var(--radius-sm);
          opacity: 0;
          transform: translateX(20px);
          animation: slideInLink 0.4s ease forwards;
        }

        .nav--mobile-open .nav__link--mobile {
          animation: slideInLink 0.4s ease forwards;
        }

        .nav--mobile-open .nav__link--mobile:nth-child(1) { animation-delay: 0.05s; }
        .nav--mobile-open .nav__link--mobile:nth-child(2) { animation-delay: 0.1s; }
        .nav--mobile-open .nav__link--mobile:nth-child(3) { animation-delay: 0.15s; }
        .nav--mobile-open .nav__link--mobile:nth-child(4) { animation-delay: 0.2s; }
        .nav--mobile-open .nav__link--mobile:nth-child(5) { animation-delay: 0.25s; }

        @keyframes slideInLink {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .nav__mobile-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(108, 92, 231, 0.2), transparent);
          margin: 16px 0;
        }

        .nav__mobile-tagline {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-style: italic;
          padding: 0 20px;
        }

        /* ---------- Backdrop ---------- */
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(26, 26, 46, 0.3);
          backdrop-filter: blur(4px);
          z-index: 999;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ---------- Hero Section ---------- */
        .hero {
          position: relative;
          min-height: 85vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--gradient-hero);
          overflow: hidden;
          padding: 120px 24px 80px;
        }

        /* Animated grid pattern overlay */
        .hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(108, 92, 231, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 92, 231, 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
          pointer-events: none;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        /* Floating particles */
        .hero::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(2px 2px at 20% 30%, rgba(108, 92, 231, 0.3), transparent),
            radial-gradient(2px 2px at 80% 20%, rgba(0, 180, 216, 0.3), transparent),
            radial-gradient(1px 1px at 50% 60%, rgba(108, 92, 231, 0.4), transparent),
            radial-gradient(1px 1px at 10% 80%, rgba(0, 180, 216, 0.3), transparent),
            radial-gradient(2px 2px at 90% 70%, rgba(255, 107, 107, 0.2), transparent),
            radial-gradient(1px 1px at 40% 10%, rgba(108, 92, 231, 0.3), transparent);
          background-size: 100% 100%;
          animation: particleFloat 15s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.05); opacity: 1; }
        }

        .hero__content {
          position: relative;
          z-index: 2;
          text-align: center;
          max-width: 720px;
          animation: heroReveal 1s ease-out;
        }

        @keyframes heroReveal {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 20px;
          background: var(--bg-glass-heavy);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 92, 231, 0.2);
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent-1);
          letter-spacing: 0.02em;
          margin-bottom: 24px;
          animation: badgePulse 3s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(108, 92, 231, 0.1);
        }

        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 20px rgba(108, 92, 231, 0.1); }
          50% { box-shadow: 0 0 30px rgba(108, 92, 231, 0.25); }
        }

        .hero h1 {
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #1a1a2e 0%, #6c5ce7 50%, #00b4d8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 16px;
          animation: shimmer 4s ease-in-out infinite;
          background-size: 200% 200%;
        }

        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .hero p {
          font-size: clamp(1rem, 2vw, 1.35rem);
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 8px;
          animation: heroReveal 1s ease-out 0.2s both;
        }

        .hero__subtext {
          font-size: clamp(0.85rem, 1.5vw, 1rem) !important;
          color: var(--text-muted) !important;
          font-weight: 400 !important;
          max-width: 480px;
          margin: 0 auto !important;
          animation: heroReveal 1s ease-out 0.4s both !important;
        }

        /* ---------- Main Content ---------- */
        .main-content {
          position: relative;
          z-index: 1;
          max-width: 900px;
          margin: 0 auto;
          padding: 0 24px 80px;
          margin-top: -40px;
        }

        .main-content > * {
          animation: contentReveal 0.8s ease-out 0.6s both;
        }

        @keyframes contentReveal {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ---------- Footer ---------- */
        .footer {
          position: relative;
          z-index: 1;
          background: var(--bg-glass-heavy);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(108, 92, 231, 0.08);
          padding: 48px 24px 32px;
        }

        .footer__inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .footer__brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          font-size: 1.1rem;
          color: var(--accent-1);
        }

        .footer__links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }

        .footer__link {
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.85rem;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          transition: var(--transition-smooth);
        }

        .footer__link:hover {
          color: var(--accent-1);
          background: rgba(108, 92, 231, 0.06);
          transform: translateY(-2px);
        }

        .footer__copy {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-align: center;
        }

        /* ---------- Responsive ---------- */
        @media (max-width: 768px) {
          .nav--desktop {
            display: none;
          }

          .menu-toggle {
            display: flex;
          }

          .header {
            padding: 12px 16px;
          }

          .header--scrolled {
            padding: 8px 16px;
          }

          .hero {
            min-height: 70vh;
            padding: 100px 20px 60px;
          }

          .main-content {
            padding: 0 16px 60px;
            margin-top: -30px;
          }

          .footer {
            padding: 32px 16px 24px;
          }

          .footer__links {
            gap: 4px;
          }
        }

        @media (max-width: 480px) {
          .hero h1 {
            font-size: 2rem;
          }

          .hero__badge {
            font-size: 0.7rem;
            padding: 6px 14px;
          }
        }

        /* ---------- Reduced Motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* =====================================
          HEADER
      ====================================== */}
      <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
        <div className="header__inner">
          <div className="logo">
            <PlaneIcon />
            <span>TripAdapt AI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav nav--desktop">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="nav__link">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Hamburger button (visible on mobile) */}
          <button
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <nav className={`nav nav--mobile ${isMenuOpen ? 'nav--mobile-open' : ''}`}>
          <div className="nav__mobile-inner">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="nav__link nav__link--mobile"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="nav__mobile-divider" />
            <p className="nav__mobile-tagline">
              Adaptive travel, planned in real time.
            </p>
          </div>
        </nav>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {isMenuOpen && (
        <div className="backdrop" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* =====================================
          HERO
      ====================================== */}
      <section className="hero">
        <div className="hero__content">
          <span className="hero__badge">✨ AI-Powered Itineraries</span>
          <h1>TripAdapt AI</h1>
          <p>Real-Time Adaptive Travel Itinerary</p>
          <p className="hero__subtext">
            Plan smarter. Travel better. Let AI adapt your journey as it happens.
          </p>
        </div>
      </section>

      {/* =====================================
          MAIN CONTENT
      ====================================== */}
      <main className="main-content">
        <TripForm />
      </main>

      {/* =====================================
          FOOTER
      ====================================== */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <PlaneIcon />
            <span>TripAdapt AI</span>
          </div>
          <div className="footer__links">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="footer__link">
                {link.label}
              </a>
            ))}
          </div>
          <div className="footer__copy">
            © {new Date().getFullYear()} TripAdapt AI · Adaptive travel, planned in real time.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;