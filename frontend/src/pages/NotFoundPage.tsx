import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <main className="container error-page" role="main">
    <div className="card error-page__card">
      <p className="error-page__code">404</p>
      <h1>Page not found</h1>
      <p>The page you requested does not exist or may have moved.</p>
      <Link className="btn-primary error-page__link" to="/">Return to LisanHealth</Link>
    </div>
  </main>
);
