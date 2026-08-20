import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, apiRequest } from '../api/client';
import type { AcceptInvitationResult, PublicInvitation } from '../api/types';

const schema = z.object({ name: z.string().trim().min(1, '请输入姓名').max(80, '姓名不能超过 80 个字符'), email: z.string().trim().email('请输入有效邮箱').max(254, '邮箱不能超过 254 个字符') });
type FormValues = z.infer<typeof schema>;

export function InvitationPage() {
  const { token = '' } = useParams();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<AcceptInvitationResult>();
  const invitation = useQuery({ queryKey: ['invitation', token], queryFn: () => apiRequest<PublicInvitation>(`/invitations/${token}`), retry: false });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '' } });
  const accept = useMutation({
    mutationFn: (values: FormValues) => apiRequest<AcceptInvitationResult>(`/invitations/${token}/accept`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (data) => { setResult(data); queryClient.invalidateQueries({ queryKey: ['referral-summary'] }); },
    onError: (error) => console.error('referral.accept.failed', error instanceof ApiClientError ? { code: error.payload.code, requestId: error.payload.requestId } : error)
  });
  if (invitation.isPending) return <main className="centered-state"><div className="spinner"/><p>正在验证安全邀请链接…</p></main>;
  if (invitation.isError || !invitation.data) return <main className="single-card-page"><section className="auth-card error-panel"><p className="eyebrow">INVALID INVITATION</p><h1>这条邀请已无法使用</h1><p className="muted">请检查链接是否完整，或联系邀请人重新分享。</p><Link className="secondary-button" to="/login">返回登录</Link></section></main>;
  if (result) return <main className="single-card-page"><section className="auth-card success-panel"><div className="success-mark">✓</div><p className="eyebrow">ACCOUNT CREATED</p><h1>欢迎加入，{result.user.name}</h1><p>{result.referral.inviterName} 已因本次邀请获得 <strong>{result.referral.rewardCredits} Credit</strong>。</p><div className="temporary-password"><span>你的临时密码</span><code>{result.temporaryPassword}</code><small>仅显示这一次。请立即保存，并在首次登录时重置。</small></div><Link className="primary-button" to={`/login?email=${encodeURIComponent(result.user.email)}`}>使用临时密码登录</Link></section></main>;
  const errorCode = accept.error instanceof ApiClientError ? accept.error.payload.code : undefined;
  return <main className="invitation-page"><section className="invitation-message"><p className="eyebrow">A PERSONAL INVITATION</p><h1>{invitation.data.inviter.name}<br/>邀请你加入</h1><p>创建账户，开启一段值得分享的连接。</p><div className="privacy-line"><span>◇</span>链接不包含邀请人的账户信息</div></section><section className="auth-card invite-card"><div><span className="step-badge">安全注册</span><h2>创建你的账户</h2><p className="muted">系统会生成随机临时密码，仅展示一次。</p></div><form onSubmit={form.handleSubmit((values) => accept.mutate(values))} noValidate><label htmlFor="name">姓名</label><input id="name" autoComplete="name" placeholder="你的姓名" {...form.register('name')}/>{form.formState.errors.name && <p className="field-error">{form.formState.errors.name.message}</p>}<label htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')}/>{form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}<button className="primary-button" type="submit" disabled={accept.isPending}>{accept.isPending ? '正在创建安全账户…' : '接受邀请并注册'}</button>{accept.isError && <p role="alert" className="form-alert">{errorCode === 'EMAIL_ALREADY_REGISTERED' ? '该邮箱已注册，请直接登录或使用其他邮箱' : errorCode === 'INVITATION_NOT_FOUND' ? '邀请链接无效' : '注册失败，请稍后重试'}</p>}</form></section></main>;
}
