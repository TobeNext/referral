import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports an available database', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ 1: 1 }]) } as unknown as DataSource;
    await expect(new HealthController(dataSource).getHealth()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('maps a database failure to service unavailable', async () => {
    const dataSource = { query: jest.fn().mockRejectedValue(new Error('offline')) } as unknown as DataSource;
    await expect(new HealthController(dataSource).getHealth()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
