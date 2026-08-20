import { Body, Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { REQUEST_ID, RequestWithId } from '../common/request-id.middleware';
import { AcceptInvitationDto, AcceptInvitationResultDto } from './accept-invitation.dto';
import { ReferralsService } from './referrals.service';

@ApiTags('referrals')
@Controller('invitations')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}
  @Post(':token/accept')
  @HttpCode(201)
  @ApiCreatedResponse({ type: AcceptInvitationResultDto })
  @ApiNotFoundResponse({ description: 'Invitation not found' })
  @ApiConflictResponse({ description: 'Email already registered' })
  accept(
    @Param('token') token: string,
    @Body() input: AcceptInvitationDto,
    @Req() request: RequestWithId
  ): Promise<AcceptInvitationResultDto> {
    return this.referrals.acceptInvitation(token, input, request[REQUEST_ID]);
  }
}
