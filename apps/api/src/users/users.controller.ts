import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ReferralSummaryDto } from './referral-summary.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get(':userId/referral-summary')
  @ApiOkResponse({ type: ReferralSummaryDto, description: 'Referral summary ordered by acceptedAt descending' })
  getSummary(@Param('userId') userId: string): Promise<ReferralSummaryDto> { return this.users.getReferralSummary(userId); }
}
