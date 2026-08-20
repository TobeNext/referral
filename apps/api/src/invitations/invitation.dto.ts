import { ApiProperty } from '@nestjs/swagger';

export class InvitationLinkDto {
  @ApiProperty({ example: '7K3M9Q2X5R8T' }) token: string;
  @ApiProperty({ example: '/i/7K3M9Q2X5R8T' }) path: string;
  @ApiProperty({ example: 'http://localhost:3000/i/7K3M9Q2X5R8T' }) publicUrl: string;
}

export class PublicInviterDto { @ApiProperty({ example: 'Alice' }) name: string; }
export class PublicInvitationDto {
  @ApiProperty({ type: PublicInviterDto }) inviter: PublicInviterDto;
}
