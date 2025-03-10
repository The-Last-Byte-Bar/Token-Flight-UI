import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Token } from '../lib/wallet';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';

interface TransactionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientAddress: string;
  amount: string;
  tokens: Array<{ token: Token; amount: string }>;
  fee: string;
  onConfirm: () => void;
  isLoading: boolean;
}

export function TransactionConfirmDialog({
  open,
  onOpenChange,
  recipientAddress,
  amount,
  tokens,
  fee,
  onConfirm,
  isLoading
}: TransactionConfirmDialogProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatTokenAmount = (token: Token, amount: string) => {
    if (token.tokenId === "ERG") {
      return `${(Number(amount) / 1000000000).toFixed(4)} ERG`;
    }

    const decimals = token.decimals || 0;
    if (decimals === 0) return amount;

    const formattedAmount = (Number(amount) / Math.pow(10, decimals)).toFixed(
      Math.min(decimals, 4)
    );
    return `${formattedAmount} ${token.name || formatAddress(token.tokenId)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Transaction</DialogTitle>
          <DialogDescription>
            Please review the transaction details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Recipient</div>
            <div className="text-sm text-muted-foreground break-all">
              {recipientAddress}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Network Fee</div>
            <div className="text-sm">
              {fee} ERG
            </div>
          </div>

          {tokens.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Tokens to Send</div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {tokens.map(({ token, amount }) => (
                    <Card key={token.tokenId} className="p-3">
                      <div className="text-sm font-medium">
                        {token.name || formatAddress(token.tokenId)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Amount: {formatTokenAmount(token, amount)}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 