import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class DemoService {
  constructor(private readonly users: UsersService) {}
  async getInviter() {
    const id = process.env.DEMO_INVITER_ID || 'usr_alice';
    try {
      return await this.users.getReferralSummary(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw new NotFoundException({ code: 'DEMO_INVITER_NOT_FOUND', message: 'Demo 邀请人不存在' });
      throw error;
    }
  }
}
