import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, apiRequest } from '../api/client';
import type { AuthResponse } from '../api/types';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({
  currentPassword: z.string().min(1, '请输入当前临时密码').max(72),
  newPassword: z.string().min(10, '新密码至少 10 位').max(72).regex(/[A-Za-z]/, '需要包含字母').regex(/\d/, '需要包含数字'),
  confirmPassword: z.string().min(1, '请再次输入新密码')
}).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: '两次输入的新密码不一致' });
type ResetValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const form = useForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const reset = useMutation({ mutationFn: (values: ResetValues) => apiRequest<AuthResponse>('/auth/reset-password', { method: 'POST', body: JSON.stringify(values) }), onSuccess: (response) => { auth.establishSession(response); navigate('/', { replace: true }); } });
  const message = reset.error instanceof ApiClientError ? reset.error.payload.message : undefined;
  return <main className="single-card-page"><section className="auth-card reset-card"><div className="step-badge">首次登录 · 安全设置</div><h1>设置你的新密码</h1><p className="muted">临时密码只能用于首次登录。完成设置后，旧的登录凭证会立即失效。</p><form onSubmit={form.handleSubmit((values) => reset.mutate(values))} noValidate><label htmlFor="currentPassword">当前临时密码</label><input id="currentPassword" type="password" autoComplete="current-password" {...form.register('currentPassword')}/>{form.formState.errors.currentPassword && <p className="field-error">{form.formState.errors.currentPassword.message}</p>}<label htmlFor="newPassword">新密码</label><input id="newPassword" type="password" autoComplete="new-password" {...form.register('newPassword')}/>{form.formState.errors.newPassword && <p className="field-error">{form.formState.errors.newPassword.message}</p>}<p className="input-hint">10–72 位，同时包含字母和数字</p><label htmlFor="confirmPassword">确认新密码</label><input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')}/>{form.formState.errors.confirmPassword && <p className="field-error">{form.formState.errors.confirmPassword.message}</p>}<button className="primary-button" type="submit" disabled={reset.isPending}>{reset.isPending ? '正在更新…' : '保存新密码'}</button>{reset.isError && <p role="alert" className="form-alert">{message || '密码更新失败，请稍后重试'}</p>}</form></section></main>;
}
