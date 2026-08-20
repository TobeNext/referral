export type InvitationLink = { code: string; path?: string; publicUrl: string };
export type ReferralItem = { id: string; inviteeName: string; rewardCredits: number; acceptedAt: string };
export type ReferralSummary = { id: string; name: string; email: string; creditBalance: number; successfulReferralCount: number; invitation: InvitationLink | null; referrals: ReferralItem[]; hasMore: boolean };
export type PublicInvitation = { code: string; inviter: { name: string } };
export type AcceptInvitationResult = { user: { id: string; name: string; email: string }; referral: { id: string; inviterName: string; rewardCredits: number; acceptedAt: string } };
