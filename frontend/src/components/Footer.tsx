import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => (
  <footer className="site-footer" role="contentinfo">
    <div className="container">
      <span>© 2026 Yeabsera Andnet · LisanHealth</span>
      <nav aria-label="Legal and safety information">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/medical-safety">Medical Safety</Link>
        <Link to="/data-deletion">Data Deletion</Link>
      </nav>
    </div>
  </footer>
);
