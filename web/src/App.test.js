import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from 'react-query';
import App from './App';
import brandingApi from './api/branding';

jest.mock('./api/branding', () => ({
  getBranding: jest.fn(),
}));

jest.mock('./dd/prompt-modal/prompt-modal', () => () => null);

it('renders without crashing', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
  }));
  brandingApi.getBranding.mockResolvedValue({
    name: 'Next Terminal',
    description: '',
  });

  const div = document.createElement('div');
  const root = createRoot(div);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  await act(async () => {
    root.render(
      <MemoryRouter
        initialEntries={['/login']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
      >
        <QueryClientProvider client={queryClient}>
          <App/>
        </QueryClientProvider>
      </MemoryRouter>
    );
  });

  await act(async () => {
    root.unmount();
  });
});
