import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { TokenSelector } from './TokenSelector';
import { useToast } from "./ui/use-toast";
import { Token } from '../lib/wallet';

interface TokenFlightProps {
  walletAddress: string | null;
  availableTokens: Token[];
}

const TokenFlight: React.FC<TokenFlightProps> = ({ walletAddress, availableTokens }) => {
  const [selectedTokens, setSelectedTokens] = useState<Array<{ token: Token; amount: string }>>([]);
  const [recipients, setRecipients] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const { toast } = useToast();

  const handleSelectToken = (token: Token, amount: string) => {
    setSelectedTokens(prev => [...prev, { token, amount }]);
  };

  const handleRemoveToken = (tokenId: string) => {
    setSelectedTokens(prev => prev.filter(t => t.token.tokenId !== tokenId));
  };

  const handleLaunchAirdrop = async () => {
    if (selectedTokens.length === 0) {
      toast({
        title: "No Tokens Selected",
        description: "Please select at least one token to airdrop",
        variant: "destructive",
      });
      return;
    }

    if (!recipients.trim()) {
      toast({
        title: "No Recipients",
        description: "Please enter at least one recipient address",
        variant: "destructive",
      });
      return;
    }

    const recipientList = recipients.split('\n').filter(addr => addr.trim());
    if (recipientList.length === 0) {
      toast({
        title: "Invalid Recipients",
        description: "Please enter valid recipient addresses",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement the actual airdrop transaction
    console.log({
      tokens: selectedTokens,
      recipients: recipientList,
      memo
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Token Flight Airdrop</h2>
        <p className="text-gray-400">Send tokens to multiple recipients at once</p>
      </div>

      <div className="space-y-4">
        <div>
          <TokenSelector
            availableTokens={availableTokens}
            selectedTokens={selectedTokens}
            onSelectToken={handleSelectToken}
            onRemoveToken={handleRemoveToken}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Recipient Addresses
          </label>
          <Textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="Enter recipient addresses (one per line)"
            className="min-h-[150px] bg-black/20 border-gray-700 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Memo (optional)
          </label>
          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Add a note to this transaction"
            className="bg-black/20 border-gray-700 text-white"
          />
        </div>

        <Button
          onClick={handleLaunchAirdrop}
          disabled={!walletAddress || selectedTokens.length === 0 || !recipients.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Launch Airdrop
        </Button>
      </div>
    </div>
  );
};

export default TokenFlight; 