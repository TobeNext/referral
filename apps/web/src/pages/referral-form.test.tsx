import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { InvitationPage } from './InvitationPage';

function renderPage(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/i/ABC234DEF567']}><Routes><Route path="/i/:token" element={<InvitationPage/>}/></Routes></MemoryRouter></QueryClientProvider>);
}

it('validates fields and shows a successful reward result', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ inviter: { name: 'Alice' } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ user: { id: 'usr_bob', name: 'Bob', email: 'bob@example.com' }, referral: { id: 'ref_1', inviterName: 'Alice', rewardCredits: 100, acceptedAt: new Date().toISOString() }, temporaryPassword: 'Rabc1234567897' }) });
  renderPage(fetchMock);
  await userEvent.click(await screen.findByRole('button', { name: '接受邀请并注册' }));
  expect(await screen.findByText('请输入姓名')).toBeVisible();
  await userEvent.type(screen.getByLabelText('姓名'), 'Bob');
  await userEvent.type(screen.getByLabelText('邮箱'), 'bob@example.com');
  await userEvent.click(screen.getByRole('button', { name: '接受邀请并注册' }));
  expect(await screen.findByText('欢迎加入，Bob')).toBeVisible();
  expect(screen.getByText(/100 Credit/)).toBeVisible();
  expect(screen.getByText('Rabc1234567897')).toBeVisible();
});

it('maps duplicate email error to a clear message', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ inviter: { name: 'Alice' } }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ statusCode: 409, code: 'EMAIL_ALREADY_REGISTERED', message: '该邮箱已注册', requestId: 'req-1' }) });
  renderPage(fetchMock);
  await userEvent.type(await screen.findByLabelText('姓名'), 'Bob');
  await userEvent.type(screen.getByLabelText('邮箱'), 'bob@example.com');
  await userEvent.click(screen.getByRole('button', { name: '接受邀请并注册' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('该邮箱已注册，请直接登录或使用其他邮箱');
});
