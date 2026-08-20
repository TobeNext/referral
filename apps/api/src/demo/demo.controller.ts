import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DemoService } from './demo.service';
import { ReferralSummaryDto } from '../users/referral-summary.dto';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demo: DemoService) {}
  @Get('inviter')
  @ApiOkResponse({ type: ReferralSummaryDto, description: 'Demo inviter summary' })
  getInviter(): Promise<ReferralSummaryDto> { return this.demo.getInviter(); }
}
