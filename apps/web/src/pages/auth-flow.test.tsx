import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthContext';
import { LoginPage } from './LoginPage';
import { ResetPasswordPage } from './ResetPasswordPage';

beforeEach(() => sessionStorage.clear());

function wrapper(initial: string, element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><AuthProvider><MemoryRouter initialEntries={[initial]}><Routes><Route path="*" element={element}/><Route path="/" element={<div>Dashboard ready</div>}/><Route path="/reset-password" element={<ResetPasswordPage/>}/></Routes></MemoryRouter></AuthProvider></QueryClientProvider>);
}

it('logs in with a temporary password and routes to mandatory reset', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accessToken: 'restricted.jwt', user: { id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: true } }) }));
  wrapper('/login?email=bob@example.com', <LoginPage/>);
  await userEvent.type(screen.getByLabelText('密码'), 'Temporary123');
  await userEvent.click(screen.getByRole('button', { name: '安全登录' }));
  expect(await screen.findByText('设置你的新密码')).toBeVisible();
  expect(sessionStorage.getItem('referral.auth')).toContain('restricted.jwt');
});

it('submits a strong confirmed password and establishes the full session', async () => {
  sessionStorage.setItem('referral.auth', JSON.stringify({ accessToken: 'restricted.jwt', user: { id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: true } }));
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: true }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'full.jwt', user: { id: 'usr_bob', name: 'Bob', email: 'bob@example.com', mustResetPassword: false } }) });
  vi.stubGlobal('fetch', fetchMock);
  wrapper('/reset-password', <ResetPasswordPage/>);
  await userEvent.type(screen.getByLabelText('当前临时密码'), 'Temporary123');
  await userEvent.type(screen.getByLabelText('新密码'), 'Permanent456');
  await userEvent.type(screen.getByLabelText('确认新密码'), 'Permanent456');
  await userEvent.click(screen.getByRole('button', { name: '保存新密码' }));
  expect(await screen.findByText('Dashboard ready')).toBeVisible();
  expect(sessionStorage.getItem('referral.auth')).toContain('full.jwt');
});
