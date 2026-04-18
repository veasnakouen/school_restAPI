import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 text-base-content">
      <div className="text-center">
        <h1 className="text-9xl font-black text-primary opacity-20">404</h1>
        <p className="text-2xl font-bold tracking-tight sm:text-4xl">Uh-oh!</p>
        <p className="mt-4 text-base-content/70">We can't find that page.</p>
        <Link
          to="/dashboard"
          className="mt-6 btn btn-primary"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
};