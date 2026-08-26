
import React from 'react';
import BottomNavBar from './BottomNavBar';
import type { Screen } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeScreen }) => {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
      <BottomNavBar activeScreen={activeScreen} />
    </div>
  );
};

export default MainLayout;
