import { Injectable } from '@nestjs/common';
import { Transaction, TransactionType } from './transaction.types';

export interface TransactionFilter {
  accountId?: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
}

@Injectable()
export class TransactionsRepository {
  private readonly transactions: Transaction[] = [];

  save(transaction: Transaction): Transaction {
    this.transactions.push(transaction);
    return transaction;
  }

  findAll(): Transaction[] {
    return [...this.transactions];
  }

  findById(id: string): Transaction | null {
    return this.transactions.find((t) => t.id === id) ?? null;
  }

  findByAccount(accountId: string): Transaction[] {
    return this.transactions.filter(
      (t) => t.fromAccount === accountId || t.toAccount === accountId,
    );
  }

  find(filter: TransactionFilter): Transaction[] {
    const fromMs = filter.from?.getTime();
    const toMs = filter.to?.getTime();

    return this.transactions.filter((t) => {
      if (
        filter.accountId &&
        t.fromAccount !== filter.accountId &&
        t.toAccount !== filter.accountId
      ) {
        return false;
      }
      if (filter.type && t.type !== filter.type) return false;

      if (fromMs !== undefined || toMs !== undefined) {
        const tsMs = Date.parse(t.timestamp);
        if (fromMs !== undefined && tsMs < fromMs) return false;
        if (toMs !== undefined && tsMs > toMs) return false;
      }

      return true;
    });
  }
}
