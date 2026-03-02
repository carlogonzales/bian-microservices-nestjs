import { PrismaService } from '../prisma/prisma.service';
import { Account, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AccountCreateInput): Promise<Account> {
    return this.prisma.account.create({ data });
  }

  findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id } });
  }
}
