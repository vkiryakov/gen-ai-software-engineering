export enum TransactionType {
  Deposit = 'deposit',
  Withdrawal = 'withdrawal',
  Transfer = 'transfer',
}

export enum TransactionStatus {
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export interface Transaction {
  id: string;
  fromAccount: string | null;
  toAccount: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  timestamp: string;
  status: TransactionStatus;
}
