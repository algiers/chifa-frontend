'use client';

import React from 'react';

export default function ChatV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full bg-gray-900">
      {children}
    </div>
  );
}