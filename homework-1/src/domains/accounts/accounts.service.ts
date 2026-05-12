import { Injectable } from '@nestjs/common';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transactions/transaction.types';
import { TransactionsService } from '../transactions/transactions.service';
import { CalculateInterestDto } from './dto/calculate-interest.dto';

// Day-count convention: actual days over a 365-day year.
const DAYS_PER_YEAR = 365;

export interface CurrencyBalance {
  currency: string;
  amount: number;
}

export interface AccountBalance {
  accountId: string;
  balances: CurrencyBalance[];
}

export interface AccountSummary {
  accountId: string;
  totalDeposits: CurrencyBalance[];
  totalWithdrawals: CurrencyBalance[];
  transactionCount: number;
  mostRecentTransactionDate: string | null;
}

export interface InterestEntry {
  currency: string;
  balance: number;
  interest: number;
}

export interface AccountInterest {
  accountId: string;
  rate: number;
  days: number;
  breakdown: InterestEntry[];
}

@Injectable()
export class AccountsService {
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * Compute the current balance of an account, grouped by currency.
   *
   * Only `completed` transactions are folded in — `pending` and `failed` are ignored.
   * The result is rounded to 2 decimal places per currency to dodge float drift
   * (e.g. 0.1 + 0.2 = 0.30000000000000004).
   *
   * @param accountId - Account identifier to compute the balance for.
   * @returns An {@link AccountBalance} with one entry per currency the account has touched,
   *   sorted alphabetically by currency code. Unknown accounts return an empty list.
   */
  getBalance(accountId: string): AccountBalance {
    // Pull every transaction this account participates in
    const ledger = this.transactions.findByAccount(accountId);

    // Replay completed transactions into a per-currency running total
    const totals = new Map<string, number>();
    for (const tx of ledger) {
      if (tx.status !== TransactionStatus.Completed) continue;
      this.applyTransaction(totals, accountId, tx);
    }

    return { accountId, balances: toSortedBalances(totals) };
  }

  /**
   * Compute a high-level activity summary for an account.
   *
   * Monetary totals follow the same rules as {@link getBalance}: only `completed`
   * transactions are folded in, and amounts are grouped per currency since
   * cross-currency sums aren't meaningful. Transfers are not counted toward
   * `totalDeposits` or `totalWithdrawals` — only transactions of the matching
   * type contribute. The activity metrics (`transactionCount` and
   * `mostRecentTransactionDate`) count every transaction touching the account
   * regardless of status, since users care about whether activity happened, not
   * just whether it cleared.
   *
   * @param accountId - Account identifier to summarise.
   * @returns An {@link AccountSummary}. For accounts with no transactions, the
   *   totals are empty arrays, the count is 0, and the most-recent date is null.
   */
  getSummary(accountId: string): AccountSummary {
    const ledger = this.transactions.findByAccount(accountId);

    const deposits = new Map<string, number>();
    const withdrawals = new Map<string, number>();
    let mostRecent: string | null = null;

    for (const tx of ledger) {
      if (mostRecent === null || tx.timestamp > mostRecent) {
        mostRecent = tx.timestamp;
      }

      if (tx.status !== TransactionStatus.Completed) continue;

      if (tx.type === TransactionType.Deposit && tx.toAccount === accountId) {
        deposits.set(tx.currency, (deposits.get(tx.currency) ?? 0) + tx.amount);
      } else if (
        tx.type === TransactionType.Withdrawal &&
        tx.fromAccount === accountId
      ) {
        withdrawals.set(
          tx.currency,
          (withdrawals.get(tx.currency) ?? 0) + tx.amount,
        );
      }
    }

    return {
      accountId,
      totalDeposits: toSortedBalances(deposits),
      totalWithdrawals: toSortedBalances(withdrawals),
      transactionCount: ledger.length,
      mostRecentTransactionDate: mostRecent,
    };
  }

  /**
   * Compute simple interest on each per-currency balance the account currently holds.
   *
   * Uses the standard simple-interest formula `I = P × r × t`, where:
   *  - `P` is the current per-currency balance (computed the same way as {@link getBalance}),
   *  - `r` is the annual rate supplied by the caller (decimal, e.g. `0.05` = 5%),
   *  - `t` is `days / 365` (Actual/365 day-count convention).
   *
   * The interest is computed per currency since balances aren't comparable across
   * currencies. Sign is preserved: a negative balance produces negative interest
   * (i.e. owed). Both `balance` and `interest` are rounded to 2 decimal places.
   *
   * @param accountId - Account identifier to compute interest for.
   * @param dto - Validated rate (positive number) and days (positive integer).
   * @returns An {@link AccountInterest} echoing back the inputs alongside one
   *   {@link InterestEntry} per currency the account has touched. Unknown accounts
   *   return an empty `breakdown`.
   */
  calculateInterest(
    accountId: string,
    dto: CalculateInterestDto,
  ): AccountInterest {
    const { balances } = this.getBalance(accountId);
    const timeFactor = dto.days / DAYS_PER_YEAR;

    const breakdown: InterestEntry[] = balances.map(({ currency, amount }) => ({
      currency,
      balance: amount,
      interest: round2(amount * dto.rate * timeFactor),
    }));

    return { accountId, rate: dto.rate, days: dto.days, breakdown };
  }

  /**
   * Fold a single transaction into the running per-currency totals for one account.
   *
   * Direction is decided by the transaction type and which side the account is on:
   *  - `deposit` adds when the account is the destination.
   *  - `withdrawal` subtracts when the account is the source.
   *  - `transfer` adds for the destination side, subtracts for the source side.
   *
   * @param totals - Mutable map of `currency → running balance`, updated in-place.
   * @param accountId - The account whose balance is being computed.
   * @param tx - The transaction to apply.
   */
  private applyTransaction(
    totals: Map<string, number>,
    accountId: string,
    tx: Transaction,
  ): void {
    let delta = 0;
    if (tx.type === TransactionType.Deposit && tx.toAccount === accountId) {
      delta = tx.amount;
    } else if (
      tx.type === TransactionType.Withdrawal &&
      tx.fromAccount === accountId
    ) {
      delta = -tx.amount;
    } else if (tx.type === TransactionType.Transfer) {
      if (tx.toAccount === accountId) delta = tx.amount;
      else if (tx.fromAccount === accountId) delta = -tx.amount;
    }

    totals.set(tx.currency, (totals.get(tx.currency) ?? 0) + delta);
  }
}

function toSortedBalances(totals: Map<string, number>): CurrencyBalance[] {
  return [...totals.entries()]
    .map(([currency, amount]) => ({ currency, amount: round2(amount) }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
