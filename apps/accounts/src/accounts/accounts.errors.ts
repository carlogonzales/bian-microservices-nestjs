export class AccountNotFoundError extends Error {
  constructor(accountId: string) {
    super(`Account with id ${accountId} not found`);
    this.name = 'AccountNotFoundError';
  }
}
