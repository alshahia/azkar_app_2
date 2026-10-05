import React from 'react';
import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';
import { AppInitializer } from './AppInitializer';

export function AppShell() {
  return (
    <AppProviders>
      <AppInitializer>
        <AppRouter />
      </AppInitializer>
    </AppProviders>
  );
}
