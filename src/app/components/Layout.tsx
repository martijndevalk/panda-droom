import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef9f3] via-[#f0fdf4] to-[#e0f9ff] relative overflow-hidden">
      {/* Subtiele decoratieve elementen voor een vriendelijke sfeer */}
      <div className="absolute inset-0 opacity-70 pointer-events-none">
        <div className="absolute top-12 left-8 w-64 h-64 bg-yellow-200/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-16 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-accent/20 rounded-full blur-[80px]" />
        <div className="absolute top-52 right-1/2 -translate-x-1/2 w-48 h-48 bg-pink-200/30 rounded-[40%] blur-[70px]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_50%)] pointer-events-none" />
      
      {/* Main content area */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
