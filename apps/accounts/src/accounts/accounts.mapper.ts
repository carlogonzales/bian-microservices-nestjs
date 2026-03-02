import { Account } from '@prisma/client';
import { AccountDTO, BalanceDTO } from './account.types';

const MONEY_SCALE = 4;

export function toAccountDTO(a: Account): AccountDTO {
  return {
    accountId: a.id,
    customerId: a.customerId,
    currency: a.currency,
    status: a.status,
    balance: a.balance.toFixed(MONEY_SCALE),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function toBalanceDTO(a: Account): BalanceDTO {
  return {
    accountId: a.id,
    currency: a.currency,
    balance: a.balance.toFixed(MONEY_SCALE),
    asOf: new Date().toISOString(),
  };
}
