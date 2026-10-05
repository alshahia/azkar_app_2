import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProviders } from '../../components/app/AppProviders';

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
