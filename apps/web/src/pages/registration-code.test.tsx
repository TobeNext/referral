import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter><RegisterPage/></MemoryRouter></QueryClientProvider>);
}

it('registers with a normalized invitation code', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { id: 'usr_bob', name: 'Bob', email: 'bob@example.com' }, referral: { id: 'ref_1', inviterName: 'Alice', rewardCredits: 100, acceptedAt: new Date().toISOString() }, temporaryPassword: 'Rabc1234567897' }) });
  renderPage(fetchMock);
  await userEvent.type(screen.getByLabelText('邀请码'), 'abc234def567');
  await userEvent.type(screen.getByLabelText('姓名'), 'Bob');
  await userEvent.type(screen.getByLabelText('邮箱'), 'bob@example.com');
  await userEvent.click(screen.getByRole('button', { name: '使用邀请码注册' }));
  expect(await screen.findByText('欢迎加入，Bob')).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith('/api/invitations/ABC234DEF567/accept', expect.objectContaining({ method: 'POST' }));
});

it('validates invitation code locally and maps a missing code response', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ statusCode: 404, code: 'INVITATION_NOT_FOUND', message: '邀请链接无效', requestId: 'req-1' }) });
  renderPage(fetchMock);
  await userEvent.click(screen.getByRole('button', { name: '使用邀请码注册' }));
  expect(await screen.findByText('请输入邀请码')).toBeVisible();
  expect(fetchMock).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText('邀请码'), 'ABC234DEF567');
  await userEvent.type(screen.getByLabelText('姓名'), 'Bob');
  await userEvent.type(screen.getByLabelText('邮箱'), 'bob@example.com');
  await userEvent.click(screen.getByRole('button', { name: '使用邀请码注册' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('邀请码无效，请核对后重试');
});

it('keeps invitation-link registration free of a code field', async () => {
  const { InvitationPage } = await import('./InvitationPage');
  const { Route, Routes } = await import('react-router-dom');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ inviter: { name: 'Alice' } }) }));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/i/ABC234DEF567']}><Routes><Route path="/i/:token" element={<InvitationPage/>}/></Routes></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByLabelText('姓名')).toBeVisible();
  expect(screen.queryByLabelText('邀请码')).not.toBeInTheDocument();
});
