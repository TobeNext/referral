import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ example: 'Bob', minLength: 1, maxLength: 80 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : String(value ?? ''))
  @IsString()
  @Length(1, 80)
  name: string;

  @ApiProperty({ example: 'bob@example.com', maxLength: 254 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : String(value ?? ''))
  @IsString()
  @MaxLength(254)
  @IsEmail()
  email: string;
}

export class AcceptedUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
}

export class AcceptedReferralDto {
  @ApiProperty() id: string;
  @ApiProperty() inviterName: string;
  @ApiProperty() rewardCredits: number;
  @ApiProperty() acceptedAt: string;
}

export class AcceptInvitationResultDto {
  @ApiProperty({ type: AcceptedUserDto }) user: AcceptedUserDto;
  @ApiProperty({ type: AcceptedReferralDto }) referral: AcceptedReferralDto;
  @ApiProperty({ description: 'One-time temporary password. It is never persisted as plaintext.', writeOnly: true }) temporaryPassword: string;
}
