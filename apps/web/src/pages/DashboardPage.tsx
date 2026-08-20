import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest } from '../api/client';
import type { InvitationLink, ReferralSummary } from '../api/types';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [copyMessage, setCopyMessage] = useState<string>();
  const summary = useQuery({ queryKey: ['referral-summary'], queryFn: () => apiRequest<ReferralSummary>('/users/me/referral-summary') });
  const create = useMutation({ mutationFn: () => apiRequest<InvitationLink>('/users/me/invitation', { method: 'POST' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referral-summary'] }) });
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

  if (summary.isPending) return <main className="centered-state"><div className="spinner"/><p>正在整理你的邀请数据…</p></main>;
  if (summary.isError || !summary.data) return <main className="single-card-page"><section className="panel error-panel"><p className="eyebrow">CONNECTION ISSUE</p><h1>暂时无法加载</h1><p className="muted">服务可能正在启动，请稍后重试。</p><button className="primary-button" onClick={() => summary.refetch()}>重新加载</button></section></main>;
  return <main className="dashboard"><section className="dashboard-intro"><div><p className="eyebrow">REFERRAL OVERVIEW</p><h1>你好，{summary.data.name}</h1><p>分享一条安全链接，让每一次成功邀请都清晰可见。</p></div><div className="credit-orbit"><span>可用余额</span><strong>{summary.data.creditBalance}</strong><small>Credit</small></div></section><section className="panel invitation-panel"><div className="panel-copy"><span className="section-index">01</span><h2>专属邀请链接</h2><p>链接使用随机短 token，不包含你的账号、邮箱或用户标识。</p></div>{invitation ? <div className="link-box"><label htmlFor="invitation-url">安全短链接</label><div className="input-with-status"><input id="invitation-url" readOnly value={invitation.publicUrl}/><span>已启用</span></div><div className="actions"><button className="primary-button" onClick={copyLink}>复制链接</button><a className="secondary-button" href={invitation.publicUrl}>预览页面</a></div>{copyMessage && <p role="status" className={copyMessage.startsWith('复制失败') ? 'error-text' : 'success-text'}>{copyMessage}</p>}</div> : <div className="generate-area"><p>生成后可重复使用，每位成功注册的新用户奖励 100 Credit。</p><button className="primary-button" disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? '正在安全生成…' : '生成邀请链接'}</button></div>}{create.isError && <p className="error-text">生成失败，请稍后重试</p>}</section><section className="stats"><article className="metric-card"><span>成功邀请</span><strong>{summary.data.successfulReferralCount}</strong><small>位新成员</small></article><article className="metric-card"><span>累计奖励</span><strong>{summary.data.creditBalance}</strong><small>Credit</small></article><article className="metric-card"><span>链接状态</span><strong className="metric-word">{invitation ? '有效' : '待生成'}</strong><small>服务端安全引用</small></article></section><section className="panel records-panel"><div className="section-heading"><div><span className="section-index">02</span><h2>邀请记录</h2></div><button className="ghost-button" onClick={() => summary.refetch()}>刷新数据</button></div>{summary.data.referrals.length === 0 ? <div className="empty"><span>↗</span><p>还没有成功邀请记录</p><small>分享上方链接，第一笔奖励会出现在这里。</small></div> : <div className="referral-list">{summary.data.referrals.map((referral) => <article key={referral.id}><div className="avatar">{referral.inviteeName.slice(0, 1).toUpperCase()}</div><div><strong>{referral.inviteeName}</strong><span>{new Date(referral.acceptedAt).toLocaleString('zh-CN')}</span></div><b>+{referral.rewardCredits} Credit</b></article>)}</div>}</section></main>;
}
