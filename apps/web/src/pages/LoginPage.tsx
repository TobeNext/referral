import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, apiRequest } from '../api/client';
import type { AuthResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({ email: z.string().trim().email('请输入有效邮箱').max(254), password: z.string().min(1, '请输入密码').max(72, '密码不能超过 72 个字符') });
type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const form = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: params.get('email') || '', password: '' } });
  const login = useMutation({
    mutationFn: (values: LoginValues) => apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (response) => { auth.establishSession(response); navigate(response.user.mustResetPassword ? '/reset-password' : '/', { replace: true }); }
  });
  if (auth.ready && auth.user) return <Navigate to={auth.user.mustResetPassword ? '/reset-password' : '/'} replace />;
  const message = login.error instanceof ApiClientError ? login.error.payload.message : undefined;
  return <main className="auth-page"><section className="auth-story"><p className="eyebrow">PRIVATE REFERRAL NETWORK</p><h1>每一次真诚分享，<br/>都值得被看见。</h1><p>安全登录，管理你的邀请关系与奖励记录。</p><div className="story-metric"><strong>100</strong><span>Credit / successful referral</span></div></section><section className="auth-card"><div><p className="eyebrow">WELCOME BACK</p><h2>登录账户</h2><p className="muted">使用你的邮箱和密码继续</p></div><form onSubmit={form.handleSubmit((values) => login.mutate(values))} noValidate><label htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="username" placeholder="you@example.com" {...form.register('email')}/>{form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}<label htmlFor="password">密码</label><input id="password" type="password" autoComplete="current-password" placeholder="输入密码" {...form.register('password')}/>{form.formState.errors.password && <p className="field-error">{form.formState.errors.password.message}</p>}<button className="primary-button" type="submit" disabled={login.isPending}>{login.isPending ? '正在验证…' : '安全登录'}</button>{login.isError && <p role="alert" className="form-alert">{message || '登录失败，请稍后重试'}</p>}</form><p className="security-note">还没有账户？<Link to="/register">使用邀请码注册</Link></p><p className="security-note compact-note">JWT 签名会话 · 密码不会以明文保存</p></section></main>;
}
