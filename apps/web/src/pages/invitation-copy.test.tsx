import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const summary = { id: 'usr_alice', name: 'Alice', email: 'alice@example.com', creditBalance: 0, successfulReferralCount: 0, invitation: { token: 'ABC234DEF567', publicUrl: 'http://localhost:3000/i/ABC234DEF567' }, referrals: [], hasMore: false };
function renderPage() { const client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); return render(<QueryClientProvider client={client}><DashboardPage/></QueryClientProvider>); }

it('copies the complete public URL and reports success', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => summary }));
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  renderPage();
  await userEvent.click(await screen.findByRole('button', { name: '复制链接' }));
  expect(writeText).toHaveBeenCalledWith('http://localhost:3000/i/ABC234DEF567');
  expect(screen.getByRole('status')).toHaveTextContent('邀请链接已复制');
});

it('keeps the full URL visible and reports clipboard denial', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => summary }));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
  renderPage();
  await userEvent.click(await screen.findByRole('button', { name: '复制链接' }));
  expect(screen.getByDisplayValue('http://localhost:3000/i/ABC234DEF567')).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent('复制失败，请手动选择下方链接');
});
