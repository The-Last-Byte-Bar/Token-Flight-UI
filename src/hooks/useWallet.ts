import { useState, useEffect, useCallback } from 'react';
import { walletService, WalletBalance, Token } from '../lib/wallet';

interface UseWalletReturn {
  isConnected: boolean;
  balance: WalletBalance | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (recipientAddress: string, amount: bigint, tokens: Token[]) => Promise<string>;
}

export function useWallet(): UseWalletReturn {
  const [isConnected, setIsConnected] = useState(walletService.state.connected);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  // Update state when wallet service state changes
  useEffect(() => {
    const checkWalletState = () => {
      setIsConnected(walletService.state.connected);
    };

    // Check initial state
    checkWalletState();

    // Set up an interval to check wallet state
    const interval = setInterval(checkWalletState, 1000);

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    try {
      const connected = await walletService.connect();
      if (connected) {
        setIsConnected(true);
        const walletBalance = await walletService.getBalance();
        setBalance(walletBalance);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnected(false);
      setBalance(null);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletService.disconnect();
      setIsConnected(false);
      setBalance(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  }, []);

  const sendTransaction = useCallback(async (
    recipientAddress: string,
    amount: bigint,
    tokens: Token[]
  ): Promise<string> => {
    try {
      const unsignedTx = await walletService.buildTransaction(
        recipientAddress,
        amount,
        tokens
      );
      const txId = await walletService.signAndSubmitTx(unsignedTx);
      
      // Update balance after transaction
      const newBalance = await walletService.getBalance();
      setBalance(newBalance);
      
      return txId;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }, []);

  // Update balance periodically when connected
  useEffect(() => {
    if (!isConnected) return;

    const updateBalance = async () => {
      try {
        const newBalance = await walletService.getBalance();
        setBalance(newBalance);
      } catch (error) {
        console.error('Failed to update balance:', error);
      }
    };

    const interval = setInterval(updateBalance, 10000); // Update every 10 seconds
    updateBalance(); // Initial update

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    isConnected,
    balance,
    connect,
    disconnect,
    sendTransaction,
  };
} 