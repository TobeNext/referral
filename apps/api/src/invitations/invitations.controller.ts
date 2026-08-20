import { Controller, Get, HttpCode, Param, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { REQUEST_ID, RequestWithId } from '../common/request-id.middleware';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasswordResetCompleteGuard } from '../auth/password-reset-complete.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { InvitationLinkDto, PublicInvitationDto } from './invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('invitations')
@Controller()
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('users/me/invitation')
  @UseGuards(JwtAuthGuard, PasswordResetCompleteGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: InvitationLinkDto, description: 'Existing invitation' })
  @ApiCreatedResponse({ type: InvitationLinkDto, description: 'Created invitation' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async create(
    @Req() req: RequestWithId & AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response
  ): Promise<InvitationLinkDto> {
    const result = await this.invitations.createOrReuse(req.user.id, req[REQUEST_ID]);
    response.status(result.created ? 201 : 200);
    return result.invitation;
  }

  @Get('invitations/:token')
  @ApiOkResponse({ type: PublicInvitationDto })
  @ApiNotFoundResponse({ description: 'Invitation not found' })
  getPublic(@Param('token') token: string): Promise<PublicInvitationDto> {
    return this.invitations.getPublic(token);
  }
}
