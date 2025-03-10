import { walletService } from './wallet';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface TrackedTransaction {
  id: string;
  status: TransactionStatus;
  confirmations: number;
  timestamp: number;
  type: 'send' | 'receive';
  amount: string;
  address: string;
  tokens?: Array<{
    tokenId: string;
    amount: string;
    name?: string;
  }>;
}

class TransactionTracker {
  private static instance: TransactionTracker;
  private transactions: Map<string, TrackedTransaction> = new Map();
  private pollingInterval: number | null = null;

  private constructor() {
    // Load saved transactions from localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsed = JSON.parse(savedTransactions);
      this.transactions = new Map(Object.entries(parsed));
    }
  }

  public static getInstance(): TransactionTracker {
    if (!TransactionTracker.instance) {
      TransactionTracker.instance = new TransactionTracker();
    }
    return TransactionTracker.instance;
  }

  public addTransaction(transaction: Omit<TrackedTransaction, 'status' | 'confirmations'>) {
    const trackedTx: TrackedTransaction = {
      ...transaction,
      status: 'pending',
      confirmations: 0
    };
    this.transactions.set(transaction.id, trackedTx);
    this.saveToLocalStorage();
    this.startPolling();
  }

  public getTransaction(txId: string): TrackedTransaction | undefined {
    return this.transactions.get(txId);
  }

  public getAllTransactions(): TrackedTransaction[] {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  private async checkTransactionStatus(txId: string) {
    try {
      const response = await fetch(`https://api.ergoplatform.com/api/v1/transactions/${txId}`);
      const data = await response.json();

      const tx = this.transactions.get(txId);
      if (!tx) return;

      if (data.numConfirmations >= 1) {
        tx.status = 'confirmed';
        tx.confirmations = data.numConfirmations;
      }

      this.transactions.set(txId, tx);
      this.saveToLocalStorage();

      // If all transactions are confirmed, stop polling
      if (Array.from(this.transactions.values()).every(t => t.status === 'confirmed')) {
        this.stopPolling();
      }
    } catch (error) {
      console.error(`Error checking transaction ${txId}:`, error);
      const tx = this.transactions.get(txId);
      if (tx && Date.now() - tx.timestamp > 3600000) { // 1 hour timeout
        tx.status = 'failed';
        this.transactions.set(txId, tx);
        this.saveToLocalStorage();
      }
    }
  }

  private startPolling() {
    if (this.pollingInterval) return;

    this.pollingInterval = window.setInterval(() => {
      const pendingTxs = Array.from(this.transactions.values())
        .filter(tx => tx.status === 'pending')
        .map(tx => tx.id);

      pendingTxs.forEach(txId => this.checkTransactionStatus(txId));
    }, 10000); // Check every 10 seconds
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private saveToLocalStorage() {
    const obj = Object.fromEntries(this.transactions);
    localStorage.setItem('transactions', JSON.stringify(obj));
  }
}

export const transactionTracker = TransactionTracker.getInstance(); 