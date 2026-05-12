import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.types';
import { TransactionsRepository } from './transactions.repository';

describe('TransactionsRepository.find', () => {
  let repo: TransactionsRepository;

  beforeEach(() => {
    repo = new TransactionsRepository();
    repo.save(
      makeTx({
        id: 'd-1',
        type: TransactionType.Deposit,
        fromAccount: null,
        toAccount: 'ACC-00001',
        timestamp: '2024-01-05T12:00:00.000Z',
      }),
    );
    repo.save(
      makeTx({
        id: 'w-1',
        type: TransactionType.Withdrawal,
        fromAccount: 'ACC-00001',
        toAccount: null,
        timestamp: '2024-01-20T12:00:00.000Z',
      }),
    );
    repo.save(
      makeTx({
        id: 't-1',
        type: TransactionType.Transfer,
        fromAccount: 'ACC-00001',
        toAccount: 'ACC-00002',
        timestamp: '2024-02-10T12:00:00.000Z',
      }),
    );
    repo.save(
      makeTx({
        id: 't-2',
        type: TransactionType.Transfer,
        fromAccount: 'ACC-00003',
        toAccount: 'ACC-00002',
        timestamp: '2024-03-01T12:00:00.000Z',
      }),
    );
  });

  it('returns everything when the filter is empty', () => {
    expect(repo.find({}).map((t) => t.id)).toEqual([
      'd-1',
      'w-1',
      't-1',
      't-2',
    ]);
  });

  it('matches an account on either side', () => {
    expect(repo.find({ accountId: 'ACC-00001' }).map((t) => t.id)).toEqual([
      'd-1',
      'w-1',
      't-1',
    ]);
    expect(repo.find({ accountId: 'ACC-00002' }).map((t) => t.id)).toEqual([
      't-1',
      't-2',
    ]);
  });

  it('filters by transaction type', () => {
    expect(
      repo.find({ type: TransactionType.Transfer }).map((t) => t.id),
    ).toEqual(['t-1', 't-2']);
  });

  it('applies inclusive date bounds', () => {
    const from = new Date('2024-01-01T00:00:00.000Z');
    const to = new Date('2024-01-31T23:59:59.999Z');

    expect(repo.find({ from, to }).map((t) => t.id)).toEqual(['d-1', 'w-1']);
  });

  it('treats the upper bound as inclusive at the millisecond level', () => {
    const to = new Date('2024-01-05T12:00:00.000Z');

    expect(repo.find({ to }).map((t) => t.id)).toEqual(['d-1']);
  });

  it('combines account, type, and date filters with AND semantics', () => {
    const result = repo.find({
      accountId: 'ACC-00002',
      type: TransactionType.Transfer,
      from: new Date('2024-02-01T00:00:00.000Z'),
      to: new Date('2024-02-28T23:59:59.999Z'),
    });

    expect(result.map((t) => t.id)).toEqual(['t-1']);
  });
});

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    fromAccount: null,
    toAccount: null,
    amount: 1,
    currency: 'USD',
    type: TransactionType.Deposit,
    timestamp: new Date().toISOString(),
    status: TransactionStatus.Completed,
    ...overrides,
  };
}
