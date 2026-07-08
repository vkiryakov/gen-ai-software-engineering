import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from './transaction.types';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: jest.Mocked<TransactionsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: {
            save: jest.fn((t: Transaction) => t),
            findAll: jest.fn(() => []),
            findById: jest.fn(() => null),
            findByAccount: jest.fn(() => []),
            find: jest.fn(() => []),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    repo = module.get(TransactionsRepository);
  });

  describe('create', () => {
    it('persists a deposit with a UUID, ISO timestamp, default status, and null fromAccount', () => {
      const dto: CreateTransactionDto = {
        toAccount: 'acc-A',
        amount: 100,
        currency: 'USD',
        type: TransactionType.Deposit,
      };

      const result = service.create(dto);

      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
      expect(result).toMatchObject({
        fromAccount: null,
        toAccount: 'acc-A',
        amount: 100,
        currency: 'USD',
        type: TransactionType.Deposit,
        status: TransactionStatus.Completed,
      });
      expect(repo.save).toHaveBeenCalledWith(result);
    });

    it('persists a withdrawal with null toAccount', () => {
      const result = service.create({
        fromAccount: 'acc-A',
        amount: 50,
        currency: 'USD',
        type: TransactionType.Withdrawal,
      });

      expect(result.fromAccount).toBe('acc-A');
      expect(result.toAccount).toBeNull();
    });

    it('persists a transfer with both accounts populated', () => {
      const result = service.create({
        fromAccount: 'acc-A',
        toAccount: 'acc-B',
        amount: 25,
        currency: 'EUR',
        type: TransactionType.Transfer,
      });

      expect(result.fromAccount).toBe('acc-A');
      expect(result.toAccount).toBe('acc-B');
    });

    it('respects an explicit status from the DTO', () => {
      const result = service.create({
        toAccount: 'acc-A',
        amount: 1,
        currency: 'USD',
        type: TransactionType.Deposit,
        status: TransactionStatus.Pending,
      });

      expect(result.status).toBe(TransactionStatus.Pending);
    });

    it('throws BadRequest when a deposit has no toAccount', () => {
      expect(() =>
        service.create({
          amount: 10,
          currency: 'USD',
          type: TransactionType.Deposit,
        }),
      ).toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('throws BadRequest when a withdrawal has no fromAccount', () => {
      expect(() =>
        service.create({
          amount: 10,
          currency: 'USD',
          type: TransactionType.Withdrawal,
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequest when a transfer is missing an account', () => {
      expect(() =>
        service.create({
          fromAccount: 'acc-A',
          amount: 10,
          currency: 'USD',
          type: TransactionType.Transfer,
        }),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequest when a transfer uses the same account on both sides', () => {
      expect(() =>
        service.create({
          fromAccount: 'acc-A',
          toAccount: 'acc-A',
          amount: 10,
          currency: 'USD',
          type: TransactionType.Transfer,
        }),
      ).toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('returns the transaction when present', () => {
      const tx = makeTx({ id: 'tx-1' });
      repo.findById.mockReturnValueOnce(tx);

      expect(service.findById('tx-1')).toBe(tx);
      expect(repo.findById).toHaveBeenCalledWith('tx-1');
    });

    it('throws NotFound when missing', () => {
      repo.findById.mockReturnValueOnce(null);

      expect(() => service.findById('missing')).toThrow(NotFoundException);
    });
  });

  describe('find', () => {
    it('passes accountId and type filters through to the repository unchanged', () => {
      const txs = [makeTx({ id: 'a' })];
      repo.find.mockReturnValueOnce(txs);

      const result = service.find({
        accountId: 'ACC-00001',
        type: TransactionType.Transfer,
      });

      expect(result).toBe(txs);
      expect(repo.find).toHaveBeenCalledWith({
        accountId: 'ACC-00001',
        type: TransactionType.Transfer,
        from: undefined,
        to: undefined,
      });
    });

    it('expands a bare YYYY-MM-DD "from" to start-of-day UTC', () => {
      service.find({ from: '2024-01-01' });

      const { from } = repo.find.mock.calls[0][0];
      expect(from?.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    it('expands a bare YYYY-MM-DD "to" to end-of-day UTC', () => {
      service.find({ to: '2024-01-31' });

      const { to } = repo.find.mock.calls[0][0];
      expect(to?.toISOString()).toBe('2024-01-31T23:59:59.999Z');
    });

    it('passes full ISO datetimes through verbatim', () => {
      service.find({
        from: '2024-01-15T10:30:00.000Z',
        to: '2024-01-15T18:00:00.000Z',
      });

      const { from, to } = repo.find.mock.calls[0][0];
      expect(from?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
      expect(to?.toISOString()).toBe('2024-01-15T18:00:00.000Z');
    });

    it('treats an empty filter as a list-all', () => {
      const txs = [makeTx({ id: 'a' }), makeTx({ id: 'b' })];
      repo.find.mockReturnValueOnce(txs);

      expect(service.find({})).toBe(txs);
      expect(repo.find).toHaveBeenCalledWith({
        accountId: undefined,
        type: undefined,
        from: undefined,
        to: undefined,
      });
    });
  });
});

function makeTx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx',
    fromAccount: null,
    toAccount: 'acc-A',
    amount: 1,
    currency: 'USD',
    type: TransactionType.Deposit,
    timestamp: new Date().toISOString(),
    status: TransactionStatus.Completed,
    ...overrides,
  };
}
