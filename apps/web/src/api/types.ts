export type InvitationLink = { token: string; path?: string; publicUrl: string };
export type ReferralItem = { id: string; inviteeName: string; rewardCredits: number; acceptedAt: string };
export type ReferralSummary = { id: string; name: string; email: string; creditBalance: number; successfulReferralCount: number; invitation: InvitationLink | null; referrals: ReferralItem[]; hasMore: boolean };
export type PublicInvitation = { inviter: { name: string } };
export type AcceptInvitationResult = { user: { id: string; name: string; email: string }; referral: { id: string; inviterName: string; rewardCredits: number; acceptedAt: string }; temporaryPassword: string };
export type AuthUser = { id: string; name: string; email: string; mustResetPassword: boolean };
export type AuthResponse = { accessToken: string; user: AuthUser };
