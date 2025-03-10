import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

interface Transaction {
  id: string;
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

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent transactions from your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {transactions.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <Card key={tx.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {tx.type === 'send' ? 'Sent' : 'Received'} {tx.amount} ERG
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatAddress(tx.address)}
                      </div>
                      {tx.tokens && tx.tokens.length > 0 && (
                        <div className="mt-2 text-sm">
                          <div className="font-medium">Tokens:</div>
                          {tx.tokens.map((token) => (
                            <div key={token.tokenId} className="text-muted-foreground">
                              {token.name || formatAddress(token.tokenId)}: {token.amount}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 