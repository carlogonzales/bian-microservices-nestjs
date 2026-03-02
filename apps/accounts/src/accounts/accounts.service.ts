import { Injectable } from '@nestjs/common';
import { AccountsRepository } from './accounts.repository';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountNotFoundError } from './accounts.errors';

@Injectable()
export class AccountsService {
  constructor(private readonly repo: AccountsRepository) {}

  async createAccount(dto: CreateAccountDto) {
    return await this.repo.create({
      customerId: dto.customerId,
      currency: dto.currency,
      // status defaults ACTIVE
      // balance defaults 0
    });
  }

  async getAccount(accountId: string) {
    const found = await this.repo.findById(accountId);
    if (!found) throw new AccountNotFoundError(accountId);
    return found;
  }

  async getBalance(accountId: string) {
    const found = await this.repo.findById(accountId);
    if (!found) throw new AccountNotFoundError(accountId);
    return found;
  }
}
