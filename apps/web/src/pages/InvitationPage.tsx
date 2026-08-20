import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, apiRequest } from '../api/client';
import type { AcceptInvitationResult, PublicInvitation } from '../api/types';

const schema = z.object({ name: z.string().trim().min(1, '请输入姓名').max(80, '姓名不能超过 80 个字符'), email: z.string().trim().email('请输入有效邮箱').max(254, '邮箱不能超过 254 个字符') });
type FormValues = z.infer<typeof schema>;

export function InvitationPage() {
  const { code = '' } = useParams();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<AcceptInvitationResult>();
  const invitation = useQuery({ queryKey: ['invitation', code], queryFn: () => apiRequest<PublicInvitation>(`/invitations/${code}`), retry: false });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '' } });
  const accept = useMutation({
    mutationFn: (values: FormValues) => apiRequest<AcceptInvitationResult>(`/invitations/${code}/accept`, { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: (data) => { setResult(data); queryClient.invalidateQueries({ queryKey: ['demo-inviter'] }); },
    onError: (error) => console.error('referral.accept.failed', error instanceof ApiClientError ? { code: error.payload.code, requestId: error.payload.requestId } : error)
  });
  if (invitation.isPending) return <main><section className="panel invite-card"><p>正在验证邀请链接…</p></section></main>;
  if (invitation.isError || !invitation.data) return <main><section className="panel invite-card error-panel"><p className="eyebrow">INVALID INVITATION</p><h1>邀请链接无效</h1><p>请检查链接是否完整，或联系邀请人重新分享。</p></section></main>;
  if (result) return <main><section className="panel invite-card success-panel"><div className="success-mark">✓</div><p className="eyebrow">WELCOME</p><h1>注册成功，{result.user.name}</h1><p>{result.referral.inviterName} 已因本次成功邀请获得 <strong>{result.referral.rewardCredits} Credit</strong>。</p></section></main>;
  const errorCode = accept.error instanceof ApiClientError ? accept.error.payload.code : undefined;
  return <main><section className="panel invite-card"><p className="eyebrow">YOU'RE INVITED</p><h1>{invitation.data.inviter.name} 邀请你加入</h1><p>填写姓名和邮箱即可完成注册。</p><form onSubmit={form.handleSubmit((values) => accept.mutate(values))} noValidate><label htmlFor="name">姓名</label><input id="name" autoComplete="name" {...form.register('name')}/>{form.formState.errors.name && <p className="field-error">{form.formState.errors.name.message}</p>}<label htmlFor="email">邮箱</label><input id="email" type="email" autoComplete="email" {...form.register('email')}/>{form.formState.errors.email && <p className="field-error">{form.formState.errors.email.message}</p>}<button type="submit" disabled={accept.isPending}>{accept.isPending ? '正在注册…' : '接受邀请并注册'}</button>{accept.isError && <p role="alert" className="error-text">{errorCode === 'EMAIL_ALREADY_REGISTERED' ? '该邮箱已注册，请使用其他邮箱' : errorCode === 'INVITATION_NOT_FOUND' ? '邀请链接无效' : '注册失败，请稍后重试'}</p>}</form><div className="invite-code">邀请码 <strong>{invitation.data.code}</strong></div></section></main>;
}
