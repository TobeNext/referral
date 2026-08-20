import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, apiRequest } from '../api/client';
import type { AcceptInvitationResult } from '../api/types';

const schema = z.object({
  invitationCode: z.string().trim().min(1, '请输入邀请码').regex(/^[A-HJ-NP-Z2-9]{12}$/i, '请输入有效的 12 位邀请码'),
  name: z.string().trim().min(1, '请输入姓名').max(80, '姓名不能超过 80 个字符'),
  email: z.string().trim().email('请输入有效邮箱').max(254, '邮箱不能超过 254 个字符')
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<AcceptInvitationResult>();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { invitationCode: '', name: '', email: '' }
  });
  const register = useMutation({
    mutationFn: ({ invitationCode, name, email }: FormValues) =>
      apiRequest<AcceptInvitationResult>(`/invitations/${invitationCode.trim().toUpperCase()}/accept`, {
        method: 'POST',
        body: JSON.stringify({ name, email })
      }),
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['referral-summary'] });
    },
    onError: (error) =>
      console.error(
        'registration.by_code.failed',
        error instanceof ApiClientError ? { code: error.payload.code, requestId: error.payload.requestId } : error
      )
  });

  if (result) {
    return <main className="single-card-page"><section className="auth-card success-panel"><div className="success-mark">✓</div><p className="eyebrow">ACCOUNT CREATED</p><h1>欢迎加入，{result.user.name}</h1><p>{result.referral.inviterName} 已因本次邀请获得 <strong>{result.referral.rewardCredits} Credit</strong>。</p><div className="temporary-password"><span>你的临时密码</span><code>{result.temporaryPassword}</code><small>仅显示这一次。请立即保存，并在首次登录时重置。</small></div><Link className="primary-button" to={`/login?email=${encodeURIComponent(result.user.email)}`}>使用临时密码登录</Link></section></main>;
  }

  const errorCode = register.error instanceof ApiClientError ? register.error.payload.code : undefined;
  return <main className="auth-page"><section className="auth-story"><p className="eyebrow">REGISTER WITH A CODE</p><h1>一枚邀请码，<br/>开启新的连接。</h1><p>输入邀请人分享的 12 位邀请码，完成安全注册。</p><div className="story-metric"><strong>100</strong><span>Credit / successful referral</span></div></section><section className="auth-card invite-card"><div><span className="step-badge">邀请码注册</span><h2>创建你的账户</h2><p className="muted">已有邀请链接？直接打开链接即可，无需填写邀请码。</p></div><form onSubmit={form.handleSubmit((values) => register.mutate(values))} noValidate><label htmlFor="invitationCode">邀请码</label><input id="invitationCode" autoComplete="off" maxLength={12} placeholder="例如 ABC234DEF567" {...form.register('invitationCode', { onChange: (event) => { event.target.value = event.target.value.toUpperCase(); } })}/>{form.formState.errors.invitationCode && <p className="field-error">{form.formState.errors.invitationCode.message}</p>}<label htmlFor="name">姓名</label><input id="name" autoComplete="name" placeholder="你的姓名" {...form.register('name')}/>{form.formState.errors.name && <p className="field-error">{form.formState.errors.name.message}</p>}<label htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register('email')}/>{form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}<button className="primary-button" type="submit" disabled={register.isPending}>{register.isPending ? '正在创建安全账户…' : '使用邀请码注册'}</button>{register.isError && <p role="alert" className="form-alert">{errorCode === 'EMAIL_ALREADY_REGISTERED' ? '该邮箱已注册，请直接登录或使用其他邮箱' : errorCode === 'INVITATION_NOT_FOUND' ? '邀请码无效，请核对后重试' : '注册失败，请稍后重试'}</p>}</form><p className="security-note">已有账户？<Link to="/login">返回登录</Link></p></section></main>;
}
