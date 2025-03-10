import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { Token } from '../lib/wallet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader2 } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { Separator } from './ui/separator';
import { TransactionHistory } from './TransactionHistory';
import { TransactionConfirmDialog } from './TransactionConfirmDialog';
import { transactionTracker, TrackedTransaction } from '../lib/transactionTracker';
import { tokenMetadataCache } from '../lib/tokenMetadataCache';

export function WalletManager() {
  const { isConnected, balance, connect, disconnect, sendTransaction } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<Array<{ token: Token; amount: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);
  const [estimatedFee, setEstimatedFee] = useState('0.1'); // Default 0.1 ERG fee

  // Load transactions from tracker
  useEffect(() => {
    if (isConnected) {
      setTransactions(transactionTracker.getAllTransactions());
    }
  }, [isConnected]);

  // Update token metadata
  useEffect(() => {
    if (balance?.tokens) {
      balance.tokens.forEach(async (token) => {
        const metadata = await tokenMetadataCache.getTokenMetadata(token.tokenId);
        if (metadata) {
          token.name = metadata.name;
          token.decimals = metadata.decimals;
        }
      });
    }
  }, [balance?.tokens]);

  const handleConnect = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await connect();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
      setTxId(null);
      setSelectedTokens([]);
      setTransactions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const handleSelectToken = (token: Token, amount: string) => {
    setSelectedTokens(prev => [...prev, { token, amount }]);
  };

  const handleRemoveToken = (tokenId: string) => {
    setSelectedTokens(prev => prev.filter(t => t.token.tokenId !== tokenId));
  };

  const handleConfirmTransaction = async () => {
    try {
      setError(null);
      setTxId(null);
      setIsLoading(true);
      setShowConfirmDialog(false);

      // Convert ERG amount to nanoERGs (1 ERG = 1000000000 nanoERGs)
      const nanoErgs = BigInt(Math.floor(parseFloat(amount) * 1000000000));
      
      // Convert selected tokens to the format expected by sendTransaction
      const tokens = selectedTokens.map(({ token, amount }) => ({
        ...token,
        amount: BigInt(amount)
      }));

      const id = await sendTransaction(recipientAddress, nanoErgs, tokens);
      
      // Add transaction to tracker
      const transaction = {
        id,
        timestamp: Date.now(),
        type: 'send' as const,
        amount: amount,
        address: recipientAddress,
        tokens: selectedTokens.map(({ token, amount }) => ({
          tokenId: token.tokenId,
          amount: amount,
          name: token.name
        }))
      };
      
      transactionTracker.addTransaction(transaction);
      setTransactions(transactionTracker.getAllTransactions());

      setTxId(id);
      setRecipientAddress('');
      setAmount('');
      setSelectedTokens([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    if (!recipientAddress || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate ERG amount
    const ergAmount = parseFloat(amount);
    if (isNaN(ergAmount) || ergAmount <= 0) {
      setError('Invalid ERG amount');
      return;
    }

    // Convert to nanoERGs for comparison
    const nanoErgs = BigInt(Math.floor(ergAmount * 1000000000));
    if (balance && nanoErgs > balance.nanoErgs) {
      setError('Insufficient ERG balance');
      return;
    }

    setShowConfirmDialog(true);
  };

  // Estimate transaction fee based on input count and token count
  useEffect(() => {
    const baseSize = 500; // Base transaction size in bytes
    const inputSize = 100; // Size per input
    const tokenSize = 50; // Size per token
    
    // Estimate total size
    const totalSize = baseSize + 
      (selectedTokens.length * tokenSize) +
      (Math.ceil(parseFloat(amount || '0') / 0.1) * inputSize);
    
    // Calculate fee (minimum 0.1 ERG)
    const calculatedFee = Math.max(0.1, Math.ceil(totalSize / 1000) * 0.001);
    setEstimatedFee(calculatedFee.toFixed(3));
  }, [amount, selectedTokens]);

  // Add ERG as a token for the TokenSelector
  const availableTokens = React.useMemo(() => {
    if (!balance) return [];
    
    const ergToken: Token = {
      tokenId: "ERG",
      amount: balance.nanoErgs,
      name: "ERG",
      decimals: 9
    };

    return [ergToken, ...balance.tokens];
  }, [balance]);

  return (
    <div className="space-y-4 p-4">
      {!isConnected ? (
        <Button
          onClick={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Transaction</CardTitle>
              <CardDescription>Send ERG and tokens to another address</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter recipient address"
                  />
                </div>

                {/* Token Selector */}
                {balance && (
                  <TokenSelector
                    availableTokens={availableTokens}
                    selectedTokens={selectedTokens}
                    onSelectToken={handleSelectToken}
                    onRemoveToken={handleRemoveToken}
                  />
                )}

                <div className="text-sm text-muted-foreground">
                  Estimated Fee: {estimatedFee} ERG
                </div>

                <div className="space-x-2 pt-4">
                  <Button
                    onClick={handleSendClick}
                    disabled={isLoading || !recipientAddress || selectedTokens.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    disabled={isLoading}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <TransactionHistory transactions={transactions} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {txId && (
        <Alert>
          <AlertTitle>Transaction Submitted</AlertTitle>
          <AlertDescription>
            Transaction ID: {txId}
          </AlertDescription>
        </Alert>
      )}

      <TransactionConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        recipientAddress={recipientAddress}
        amount={amount}
        tokens={selectedTokens}
        fee={estimatedFee}
        onConfirm={handleConfirmTransaction}
        isLoading={isLoading}
      />
    </div>
  );
} 