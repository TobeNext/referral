import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../api/client';
import type { InvitationLink, ReferralSummary } from '../api/types';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [copyMessage, setCopyMessage] = useState<string>();
  const summary = useQuery({ queryKey: ['demo-inviter'], queryFn: () => apiRequest<ReferralSummary>('/demo/inviter') });
  const create = useMutation({ mutationFn: (userId: string) => apiRequest<InvitationLink>(`/users/${userId}/invitation`, { method: 'POST' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['demo-inviter'] }) });
  const invitation = create.data ?? summary.data?.invitation;

  async function copyLink() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.publicUrl);
      setCopyMessage('邀请链接已复制');
    } catch (error) {
      console.error('invitation.copy.failed', error);
      setCopyMessage('复制失败，请手动选择下方链接');
    }
  }

  if (summary.isPending) return <main><section className="panel"><p>正在加载邀请人信息…</p></section></main>;
  if (summary.isError || !summary.data) return <main><section className="panel error-panel"><h1>暂时无法加载</h1><button onClick={() => summary.refetch()}>重试</button></section></main>;
  return <main className="dashboard"><section className="hero panel"><div><p className="eyebrow">INVITER DASHBOARD</p><h1>你好，{summary.data.name}</h1><p>生成专属链接，邀请朋友加入并赢取 Credit。</p></div><div className="credit"><strong>{summary.data.creditBalance}</strong><span>Credit</span></div></section><section className="panel invitation-panel"><div><h2>你的邀请链接</h2><p>邀请码可重复使用，每位成功注册的新用户奖励 100 Credit。</p></div>{invitation ? <div className="link-box"><label htmlFor="invitation-url">完整邀请链接</label><input id="invitation-url" readOnly value={invitation.publicUrl}/><div className="actions"><button onClick={copyLink}>复制邀请链接</button><a className="secondary-button" href={invitation.publicUrl}>打开链接</a></div>{copyMessage && <p role="status" className={copyMessage.startsWith('复制失败') ? 'error-text' : 'success-text'}>{copyMessage}</p>}</div> : <button disabled={create.isPending} onClick={() => create.mutate(summary.data.id)}>{create.isPending ? '正在生成…' : '生成邀请链接'}</button>}{create.isError && <p className="error-text">生成失败，请稍后重试</p>}</section><section className="stats"><article className="panel"><span>成功邀请</span><strong>{summary.data.successfulReferralCount}</strong></article><article className="panel"><span>累计奖励</span><strong>{summary.data.creditBalance} Credit</strong></article></section><section className="panel"><div className="section-heading"><h2>邀请记录</h2><button className="text-button" onClick={() => summary.refetch()}>刷新</button></div>{summary.data.referrals.length === 0 ? <p className="empty">还没有成功邀请记录，分享链接开始吧。</p> : <div className="referral-list">{summary.data.referrals.map((referral) => <article key={referral.id}><div className="avatar">{referral.inviteeName.slice(0, 1).toUpperCase()}</div><div><strong>{referral.inviteeName}</strong><span>{new Date(referral.acceptedAt).toLocaleString('zh-CN')}</span></div><b>+{referral.rewardCredits} Credit</b></article>)}</div>}</section></main>;
}
