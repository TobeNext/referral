import { Body, Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { REQUEST_ID, RequestWithId } from '../common/request-id.middleware';
import { AcceptInvitationDto, AcceptInvitationResultDto } from './accept-invitation.dto';
import { ReferralsService } from './referrals.service';

@ApiTags('referrals')
@Controller('invitations')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}
  @Post(':code/accept')
  @HttpCode(201)
  @ApiCreatedResponse({ type: AcceptInvitationResultDto })
  @ApiNotFoundResponse({ description: 'Invitation not found' })
  @ApiConflictResponse({ description: 'Email already registered' })
  accept(@Param('code') code: string, @Body() input: AcceptInvitationDto, @Req() request: RequestWithId): Promise<AcceptInvitationResultDto> {
    return this.referrals.acceptInvitation(code, input, request[REQUEST_ID]);
  }
}
