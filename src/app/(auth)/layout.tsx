import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/">
          <h1 className="text-4xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
            Chifa.ai
          </h1>
        </Link>
      </div>
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-xl rounded-xl">
        {children}
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
