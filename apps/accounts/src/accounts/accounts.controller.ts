import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { toAccountDTO, toBalanceDTO } from './accounts.mapper';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Post()
  async create(@Body() dto: CreateAccountDto) {
    const created = await this.accounts.createAccount(dto);
    return toAccountDTO(created);
  }

  @Get(':accountId')
  async get(@Param('accountId') accountId: string) {
    const account = await this.accounts.getAccount(accountId);
    return toAccountDTO(account);
  }

  @Get(':accountId/balance')
  async balance(@Param('accountId') accountId: string) {
    const account = await this.accounts.getBalance(accountId);
    return toBalanceDTO(account);
  }
}
