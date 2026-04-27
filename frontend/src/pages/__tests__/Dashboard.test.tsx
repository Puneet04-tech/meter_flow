import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../Dashboard';

// Mock the API calls
jest.mock('../../api', () => ({
  getProfile: jest.fn().mockResolvedValue({
    email: 'test@example.com',
    stats: {
      totalRequests: 1000,
      apiCount: 5,
      keyCount: 3
    }
  }),
  getUsageStats: jest.fn().mockResolvedValue([
    { _id: '2024-01-01', count: 100, avgLatency: 150 },
    { _id: '2024-01-02', count: 200, avgLatency: 120 }
  ])
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Page', () => {
  test('renders dashboard with user stats', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
    
    expect(screen.getByText('1000')).toBeInTheDocument(); // Total requests
    expect(screen.getByText('5')).toBeInTheDocument(); // API count
    expect(screen.getByText('3')).toBeInTheDocument(); // Key count
  });

  test('displays navigation menu', () => {
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderWithProviders(<Dashboard />);
    
    // Should show loading indicators
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('displays usage charts', async () => {
    renderWithProviders(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Usage Overview')).toBeInTheDocument();
    });
    
    expect(screen.getByTestId('usage-chart')).toBeInTheDocument();
  });

  test('handles navigation clicks', async () => {
    renderWithProviders(<Dashboard />);
    
    const analyticsLink = screen.getByText('Analytics');
    fireEvent.click(analyticsLink);
    
    // Should navigate to analytics page
    expect(window.location.pathname).toBe('/analytics');
  });
});
