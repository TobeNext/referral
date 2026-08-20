import { ApiProperty } from '@nestjs/swagger';

export class InvitationLinkDto {
  @ApiProperty({ example: 'ABC123' }) code: string;
  @ApiProperty({ example: '/ref/ABC123' }) path: string;
  @ApiProperty({ example: 'http://localhost:3000/ref/ABC123' }) publicUrl: string;
}

export class PublicInviterDto { @ApiProperty({ example: 'Alice' }) name: string; }
export class PublicInvitationDto {
  @ApiProperty({ example: 'ABC123' }) code: string;
  @ApiProperty({ type: PublicInviterDto }) inviter: PublicInviterDto;
}
