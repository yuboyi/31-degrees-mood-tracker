import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, BarChart3, Calendar, Settings } from 'lucide-react';
import { clsx } from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  if (location.pathname.startsWith('/business')) {
    return <>{children}</>;
  }

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/add', icon: Plus, label: 'Log mood' },
    { path: '/history', icon: Calendar, label: 'History' },
    { path: '/stats', icon: BarChart3, label: 'Insights' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">31 Degrees Mood Tracker</h1>
          <p className="text-sm text-gray-500">Capture how you feel and turn it into actionable insight.</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="animate-fade-in">{children}</div>
      </main>

      <nav className="safe-area-pb fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex flex-col items-center justify-center px-2 py-3 text-xs font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  <Icon size={20} className="mb-1" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="h-20" />
    </div>
  );
};

export default Layout;
