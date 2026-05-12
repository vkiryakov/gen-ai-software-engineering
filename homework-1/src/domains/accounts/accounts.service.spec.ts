import { Test, TestingModule } from '@nestjs/testing';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/transaction.types';
import { TransactionsService } from '../transactions/transactions.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let transactions: jest.Mocked<Pick<TransactionsService, 'findByAccount'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: TransactionsService,
          useValue: { findByAccount: jest.fn(() => []) },
        },
      ],
    }).compile();

    service = module.get(AccountsService);
    transactions = module.get(TransactionsService);
  });

  it('returns an empty balance list for an account with no transactions', () => {
    expect(service.getBalance('acc-X')).toEqual({
      accountId: 'acc-X',
      balances: [],
    });
    expect(transactions.findByAccount).toHaveBeenCalledWith('acc-X');
  });

  it('sums deposits, withdrawals, and transfers (in/out) for one currency', () => {
    transactions.findByAccount.mockReturnValueOnce([
      tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 500 }),
      tx({
        type: TransactionType.Transfer,
        fromAccount: 'acc-A',
        toAccount: 'acc-B',
        amount: 200,
      }),
      tx({
        type: TransactionType.Transfer,
        fromAccount: 'acc-C',
        toAccount: 'acc-A',
        amount: 75,
      }),
      tx({
        type: TransactionType.Withdrawal,
        fromAccount: 'acc-A',
        amount: 25,
      }),
    ]);

    expect(service.getBalance('acc-A')).toEqual({
      accountId: 'acc-A',
      balances: [{ currency: 'USD', amount: 350 }],
    });
  });

  it('groups balances by currency and sorts alphabetically', () => {
    transactions.findByAccount.mockReturnValueOnce([
      tx({
        type: TransactionType.Deposit,
        toAccount: 'acc-A',
        amount: 100,
        currency: 'EUR',
      }),
      tx({
        type: TransactionType.Deposit,
        toAccount: 'acc-A',
        amount: 200,
        currency: 'USD',
      }),
      tx({
        type: TransactionType.Deposit,
        toAccount: 'acc-A',
        amount: 30,
        currency: 'GBP',
      }),
    ]);

    expect(service.getBalance('acc-A').balances).toEqual([
      { currency: 'EUR', amount: 100 },
      { currency: 'GBP', amount: 30 },
      { currency: 'USD', amount: 200 },
    ]);
  });

  it('ignores non-completed transactions', () => {
    transactions.findByAccount.mockReturnValueOnce([
      tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 100 }),
      tx({
        type: TransactionType.Deposit,
        toAccount: 'acc-A',
        amount: 999,
        status: TransactionStatus.Pending,
      }),
      tx({
        type: TransactionType.Withdrawal,
        fromAccount: 'acc-A',
        amount: 50,
        status: TransactionStatus.Failed,
      }),
    ]);

    expect(service.getBalance('acc-A').balances).toEqual([
      { currency: 'USD', amount: 100 },
    ]);
  });

  it('rounds to 2 decimal places to avoid float drift', () => {
    transactions.findByAccount.mockReturnValueOnce([
      tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 0.1 }),
      tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 0.2 }),
    ]);

    expect(service.getBalance('acc-A').balances).toEqual([
      { currency: 'USD', amount: 0.3 },
    ]);
  });

  describe('getSummary', () => {
    it('returns a zeroed summary for an account with no transactions', () => {
      expect(service.getSummary('acc-X')).toEqual({
        accountId: 'acc-X',
        totalDeposits: [],
        totalWithdrawals: [],
        transactionCount: 0,
        mostRecentTransactionDate: null,
      });
      expect(transactions.findByAccount).toHaveBeenCalledWith('acc-X');
    });

    it('sums deposit and withdrawal totals per currency from completed transactions', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 500,
          currency: 'USD',
        }),
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 100,
          currency: 'EUR',
        }),
        tx({
          type: TransactionType.Withdrawal,
          fromAccount: 'acc-A',
          amount: 75,
          currency: 'USD',
        }),
      ]);

      const summary = service.getSummary('acc-A');
      expect(summary.totalDeposits).toEqual([
        { currency: 'EUR', amount: 100 },
        { currency: 'USD', amount: 500 },
      ]);
      expect(summary.totalWithdrawals).toEqual([
        { currency: 'USD', amount: 75 },
      ]);
    });

    it('excludes transfers from deposit and withdrawal totals', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({
          type: TransactionType.Transfer,
          fromAccount: 'acc-B',
          toAccount: 'acc-A',
          amount: 200,
        }),
        tx({
          type: TransactionType.Transfer,
          fromAccount: 'acc-A',
          toAccount: 'acc-C',
          amount: 50,
        }),
      ]);

      const summary = service.getSummary('acc-A');
      expect(summary.totalDeposits).toEqual([]);
      expect(summary.totalWithdrawals).toEqual([]);
      expect(summary.transactionCount).toBe(2);
    });

    it('excludes non-completed transactions from totals but still counts them', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 100 }),
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 999,
          status: TransactionStatus.Pending,
        }),
        tx({
          type: TransactionType.Withdrawal,
          fromAccount: 'acc-A',
          amount: 50,
          status: TransactionStatus.Failed,
        }),
      ]);

      const summary = service.getSummary('acc-A');
      expect(summary.totalDeposits).toEqual([{ currency: 'USD', amount: 100 }]);
      expect(summary.totalWithdrawals).toEqual([]);
      expect(summary.transactionCount).toBe(3);
    });

    it('reports the latest timestamp across all transactions regardless of status', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 100,
          timestamp: '2026-01-15T10:00:00.000Z',
        }),
        tx({
          type: TransactionType.Withdrawal,
          fromAccount: 'acc-A',
          amount: 50,
          timestamp: '2026-05-01T09:30:00.000Z',
          status: TransactionStatus.Failed,
        }),
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 25,
          timestamp: '2026-03-20T14:00:00.000Z',
        }),
      ]);

      expect(service.getSummary('acc-A').mostRecentTransactionDate).toBe(
        '2026-05-01T09:30:00.000Z',
      );
    });
  });

  describe('calculateInterest', () => {
    it('returns an empty breakdown for an account with no transactions', () => {
      expect(
        service.calculateInterest('acc-X', { rate: 0.05, days: 30 }),
      ).toEqual({
        accountId: 'acc-X',
        rate: 0.05,
        days: 30,
        breakdown: [],
      });
    });

    it('applies the simple-interest formula per currency rounded to 2 decimals', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 1000,
          currency: 'USD',
        }),
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 500,
          currency: 'EUR',
        }),
      ]);

      // 1000 * 0.05 * 30/365 = 4.1095...  → 4.11
      //  500 * 0.05 * 30/365 = 2.0547...  → 2.05
      expect(
        service.calculateInterest('acc-A', { rate: 0.05, days: 30 }),
      ).toEqual({
        accountId: 'acc-A',
        rate: 0.05,
        days: 30,
        breakdown: [
          { currency: 'EUR', balance: 500, interest: 2.05 },
          { currency: 'USD', balance: 1000, interest: 4.11 },
        ],
      });
    });

    it('preserves sign so a negative balance produces negative interest', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({
          type: TransactionType.Withdrawal,
          fromAccount: 'acc-A',
          amount: 200,
        }),
      ]);

      const result = service.calculateInterest('acc-A', {
        rate: 0.1,
        days: 365,
      });
      // -200 * 0.10 * 365/365 = -20
      expect(result.breakdown).toEqual([
        { currency: 'USD', balance: -200, interest: -20 },
      ]);
    });

    it('ignores non-completed transactions when computing the principal', () => {
      transactions.findByAccount.mockReturnValueOnce([
        tx({ type: TransactionType.Deposit, toAccount: 'acc-A', amount: 100 }),
        tx({
          type: TransactionType.Deposit,
          toAccount: 'acc-A',
          amount: 999,
          status: TransactionStatus.Pending,
        }),
      ]);

      const result = service.calculateInterest('acc-A', {
        rate: 0.1,
        days: 365,
      });
      expect(result.breakdown).toEqual([
        { currency: 'USD', balance: 100, interest: 10 },
      ]);
    });
  });
});

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    fromAccount: null,
    toAccount: null,
    amount: 0,
    currency: 'USD',
    type: TransactionType.Deposit,
    timestamp: '2026-05-12T00:00:00.000Z',
    status: TransactionStatus.Completed,
    ...overrides,
  };
}
