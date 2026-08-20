import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Invitation, Referral, User } from '../database/entities';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const users = { findOneBy: jest.fn() };
  const invitations = { findOneBy: jest.fn() };
  const referrals = { countBy: jest.fn(), find: jest.fn() };
  const service = new UsersService(
    users as unknown as Repository<User>,
    invitations as unknown as Repository<Invitation>,
    referrals as unknown as Repository<Referral>
  );

  beforeEach(() => jest.clearAllMocks());

  it('rejects an unknown user before querying referral details', async () => {
    users.findOneBy.mockResolvedValue(null);
    await expect(service.getReferralSummary('missing')).rejects.toBeInstanceOf(NotFoundException);
    expect(invitations.findOneBy).not.toHaveBeenCalled();
  });

  it('returns a bounded, newest-first referral summary', async () => {
    process.env.PUBLIC_WEB_BASE_URL = 'https://example.test/';
    users.findOneBy.mockResolvedValue({ id: 'usr_alice', name: 'Alice', email: 'alice@example.com', creditBalance: 200 });
    invitations.findOneBy.mockResolvedValue({ token: 'ABC234DEF567' });
    referrals.countBy.mockResolvedValue(101);
    referrals.find.mockResolvedValue([
      { id: 'ref_1', invitee: { name: 'Bob' }, rewardCredits: 100, acceptedAt: new Date('2026-01-02T00:00:00.000Z') }
    ]);
    await expect(service.getReferralSummary('usr_alice')).resolves.toEqual({
      id: 'usr_alice',
      name: 'Alice',
      email: 'alice@example.com',
      creditBalance: 200,
      successfulReferralCount: 101,
      invitation: { token: 'ABC234DEF567', publicUrl: 'https://example.test/i/ABC234DEF567' },
      referrals: [{ id: 'ref_1', inviteeName: 'Bob', rewardCredits: 100, acceptedAt: '2026-01-02T00:00:00.000Z' }],
      hasMore: true
    });
    expect(referrals.find).toHaveBeenCalledWith(expect.objectContaining({ order: { acceptedAt: 'DESC' }, take: 100 }));
  });

  it('uses defaults when no invitation or referrals exist', async () => {
    delete process.env.PUBLIC_WEB_BASE_URL;
    users.findOneBy.mockResolvedValue({ id: 'usr_alice', name: 'Alice', email: 'alice@example.com', creditBalance: 0 });
    invitations.findOneBy.mockResolvedValue(null);
    referrals.countBy.mockResolvedValue(0);
    referrals.find.mockResolvedValue([]);
    await expect(service.getReferralSummary('usr_alice')).resolves.toMatchObject({ invitation: null, referrals: [], hasMore: false });
  });
});
