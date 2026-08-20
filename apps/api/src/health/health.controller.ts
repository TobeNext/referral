import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}
  @Get()
  @ApiOkResponse({ schema: { example: { status: 'ok', database: 'up' } } })
  async getHealth(): Promise<{ status: 'ok'; database: 'up' }> {
    try { await this.dataSource.query('SELECT 1'); }
    catch { throw new ServiceUnavailableException({ code: 'DATABASE_UNAVAILABLE', message: '数据库不可用' }); }
    return { status: 'ok', database: 'up' };
  }
}
