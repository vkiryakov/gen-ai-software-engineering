import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { stringify } from 'csv/sync';
import { parseFrom, parseTo } from '../../common/utils';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.types';
import { TransactionsRepository } from './transactions.repository';

interface ResolvedAccounts {
  fromAccount: string | null;
  toAccount: string | null;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly repo: TransactionsRepository) {}

  /**
   * Create and persist a new transaction.
   *
   * @param dto - Client payload describing the transaction to record.
   * @returns The freshly persisted transaction with a generated id, ISO timestamp,
   *   and a resolved status (defaults to {@link TransactionStatus.Completed}).
   * @throws BadRequestException if the account fields don't match the transaction type.
   */
  create(dto: CreateTransactionDto): Transaction {
    // Validate account fields against the transaction type
    const { fromAccount, toAccount } = this.resolveAccounts(dto);

    // Build the record with a generated id and timestamp
    const transaction: Transaction = {
      id: randomUUID(),
      fromAccount,
      toAccount,
      amount: dto.amount,
      currency: dto.currency,
      type: dto.type,
      timestamp: new Date().toISOString(),
      status: dto.status ?? TransactionStatus.Completed,
    };

    // Persist and return
    return this.repo.save(transaction);
  }

  /**
   * List transactions, optionally narrowed by account, type, and/or date range.
   *
   * Date range bounds are inclusive. Bare YYYY-MM-DD values are expanded to cover
   * the full UTC day — `from=2024-01-01` starts at 00:00:00.000Z and
   * `to=2024-01-31` extends through 23:59:59.999Z. Full ISO 8601 datetimes are
   * used as-is.
   *
   * @param dto - Optional filter. Omitted or empty fields are no-ops.
   * @returns Matching transactions in insertion order.
   */
  find(dto: FindTransactionsDto): Transaction[] {
    return this.repo.find({
      accountId: dto.accountId,
      type: dto.type,
      from: parseFrom(dto.from),
      to: parseTo(dto.to),
    });
  }

  /**
   * Look up a transaction by its generated id.
   *
   * @param id - UUID assigned at creation time.
   * @returns The matching transaction.
   * @throws NotFoundException if no transaction with this id exists.
   */
  findById(id: string): Transaction {
    const transaction = this.repo.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction "${id}" not found`);
    }
    return transaction;
  }

  /**
   * Find every transaction that touches a given account, in either direction.
   *
   * @param accountId - Account identifier to filter by.
   * @returns Transactions where the account appears as `fromAccount` or `toAccount`.
   */
  findByAccount(accountId: string): Transaction[] {
    return this.repo.findByAccount(accountId);
  }

  /**
   * Serialise every transaction as RFC 4180 CSV using `csv-stringify`.
   *
   * A header row is always emitted (even when there are no transactions) so the
   * output is self-describing; nullable account fields render as empty cells.
   *
   * @returns A CSV document with columns:
   *   `id,fromAccount,toAccount,amount,currency,type,timestamp,status`.
   */
  exportCsv(): string {
    return stringify(this.repo.findAll(), {
      header: true,
      columns: [
        'id',
        'fromAccount',
        'toAccount',
        'amount',
        'currency',
        'type',
        'timestamp',
        'status',
      ],
      record_delimiter: '\r\n',
    });
  }

  /**
   * Normalise and validate the account fields against the declared transaction type.
   *
   * Each type has a different shape:
   *  - `deposit` requires `toAccount` only.
   *  - `withdrawal` requires `fromAccount` only.
   *  - `transfer` requires both, and they must differ.
   *
   * @param dto - Incoming create payload.
   * @returns A {@link ResolvedAccounts} pair where unused sides are `null`.
   * @throws BadRequestException when the account fields don't satisfy the type's contract.
   */
  private resolveAccounts(dto: CreateTransactionDto): ResolvedAccounts {
    switch (dto.type) {
      case TransactionType.Deposit:
        if (!dto.toAccount) {
          throw new BadRequestException('"toAccount" is required for deposits');
        }
        return { fromAccount: null, toAccount: dto.toAccount };

      case TransactionType.Withdrawal:
        if (!dto.fromAccount) {
          throw new BadRequestException(
            '"fromAccount" is required for withdrawals',
          );
        }
        return { fromAccount: dto.fromAccount, toAccount: null };

      case TransactionType.Transfer:
        if (!dto.fromAccount || !dto.toAccount) {
          throw new BadRequestException(
            'transfers require both "fromAccount" and "toAccount"',
          );
        }
        if (dto.fromAccount === dto.toAccount) {
          throw new BadRequestException(
            '"fromAccount" and "toAccount" must differ for transfers',
          );
        }
        return { fromAccount: dto.fromAccount, toAccount: dto.toAccount };
    }
  }
}
