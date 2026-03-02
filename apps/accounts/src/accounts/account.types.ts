export type AccountId = string;

export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

export type AccountDTO = {
  accountId: AccountId;
  customerId: string;
  currency: string;
  status: AccountStatus;
  balance: string; // always string for API
  createdAt: string;
  updatedAt: string;
};

export type BalanceDTO = {
  accountId: AccountId;
  currency: string;
  balance: string;
  asOf: string;
};
