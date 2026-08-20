import { ApiProperty } from '@nestjs/swagger';

export class SummaryInvitationDto {
  @ApiProperty({ example: '7K3M9Q2X5R8T' }) token: string;
  @ApiProperty({ example: 'http://localhost:3000/i/7K3M9Q2X5R8T' }) publicUrl: string;
}

export class ReferralSummaryItemDto {
  @ApiProperty() id: string;
  @ApiProperty() inviteeName: string;
  @ApiProperty() rewardCredits: number;
  @ApiProperty({ format: 'date-time' }) acceptedAt: string;
}

export class ReferralSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ format: 'email' }) email: string;
  @ApiProperty() creditBalance: number;
  @ApiProperty() successfulReferralCount: number;
  @ApiProperty({ type: SummaryInvitationDto, nullable: true }) invitation: SummaryInvitationDto | null;
  @ApiProperty({ type: [ReferralSummaryItemDto] }) referrals: ReferralSummaryItemDto[];
  @ApiProperty() hasMore: boolean;
}
