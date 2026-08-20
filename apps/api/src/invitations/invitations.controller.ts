import { Controller, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { REQUEST_ID, RequestWithId } from '../common/request-id.middleware';
import { InvitationLinkDto, PublicInvitationDto } from './invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('users/:userId/invitation')
  @HttpCode(200)
  @ApiOkResponse({ type: InvitationLinkDto, description: 'Existing invitation' })
  @ApiCreatedResponse({ type: InvitationLinkDto, description: 'Created invitation' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async create(@Param('userId') userId: string, @Req() req: RequestWithId, @Res({ passthrough: true }) response: Response): Promise<InvitationLinkDto> {
    const result = await this.invitations.createOrReuse(userId, req[REQUEST_ID]);
    response.status(result.created ? 201 : 200);
    return result.invitation;
  }

  @Get('invitations/:code')
  @ApiOkResponse({ type: PublicInvitationDto })
  @ApiNotFoundResponse({ description: 'Invitation not found' })
  getPublic(@Param('code') code: string): Promise<PublicInvitationDto> { return this.invitations.getPublic(code); }
}
