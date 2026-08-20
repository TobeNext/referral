import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PasswordResetCompleteGuard } from '../auth/password-reset-complete.guard';
import { UsersService } from './users.service';
import { ReferralSummaryDto } from './referral-summary.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me/referral-summary')
  @UseGuards(JwtAuthGuard, PasswordResetCompleteGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: ReferralSummaryDto, description: 'Referral summary ordered by acceptedAt descending' })
  getSummary(@Req() request: AuthenticatedRequest): Promise<ReferralSummaryDto> {
    return this.users.getReferralSummary(request.user.id);
  }
}
