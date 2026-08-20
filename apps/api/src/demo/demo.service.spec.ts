import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  afterEach(() => delete process.env.DEMO_INVITER_ID);

  it('returns the configured inviter summary', async () => {
    process.env.DEMO_INVITER_ID = 'usr_demo';
    const users = { getReferralSummary: jest.fn().mockResolvedValue({ id: 'usr_demo' }) } as unknown as UsersService;
    await expect(new DemoService(users).getInviter()).resolves.toEqual({ id: 'usr_demo' });
  });

  it('maps a missing user to a stable demo error and preserves other errors', async () => {
    const missingUsers = { getReferralSummary: jest.fn().mockRejectedValue(new NotFoundException()) } as unknown as UsersService;
    await expect(new DemoService(missingUsers).getInviter()).rejects.toMatchObject({ response: { code: 'DEMO_INVITER_NOT_FOUND' } });
    const failure = new Error('database failed');
    const failingUsers = { getReferralSummary: jest.fn().mockRejectedValue(failure) } as unknown as UsersService;
    await expect(new DemoService(failingUsers).getInviter()).rejects.toBe(failure);
  });
});
