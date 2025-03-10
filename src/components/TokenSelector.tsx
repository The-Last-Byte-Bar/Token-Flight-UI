import React from 'react';
import { Token } from '../lib/wallet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface TokenSelectorProps {
  availableTokens: Token[];
  selectedTokens: Array<{ token: Token; amount: string }>;
  onSelectToken: (token: Token, amount: string) => void;
  onRemoveToken: (tokenId: string) => void;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  availableTokens,
  selectedTokens,
  onSelectToken,
  onRemoveToken,
}) => {
  console.log('TokenSelector received tokens:', availableTokens);
  
  const [selectedToken, setSelectedToken] = React.useState<Token | null>(null);
  const [tokenAmount, setTokenAmount] = React.useState("");
  const [amountError, setAmountError] = React.useState<string | null>(null);

  // Log when selection changes
  const handleTokenSelect = (tokenId: string) => {
    console.log('Token selected:', tokenId);
    const token = availableTokens.find(t => t.tokenId === tokenId);
    console.log('Found token:', token);
    if (token) {
      setSelectedToken(token);
      setTokenAmount("");
      setAmountError(null);
    }
  };

  const validateAmount = (amount: string, token: Token) => {
    if (!amount) return "Amount is required";
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return "Amount must be a positive number";

    // For ERG (native token)
    if (token.tokenId === "ERG") {
      if (numAmount < 0.001) return "Minimum amount is 0.001 ERG";
      if (numAmount > Number(token.amount) / 1000000000) return "Insufficient balance";
      return null;
    }

    // For other tokens
    const decimals = token.decimals || 0;
    const minAmount = 1 / Math.pow(10, decimals);
    const maxAmount = Number(token.amount) / Math.pow(10, decimals);

    if (numAmount < minAmount) return `Minimum amount is ${minAmount}`;
    if (numAmount > maxAmount) return "Insufficient balance";

    return null;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setTokenAmount(newAmount);
    
    if (selectedToken) {
      const error = validateAmount(newAmount, selectedToken);
      setAmountError(error);
    }
  };

  const handleAddToken = () => {
    if (selectedToken && tokenAmount && !amountError) {
      // Convert amount to token's decimal places
      const decimals = selectedToken.decimals || 0;
      const amount = selectedToken.tokenId === "ERG" 
        ? (Number(tokenAmount) * 1000000000).toString() // Convert ERG to nanoERG
        : (Number(tokenAmount) * Math.pow(10, decimals)).toString();
      
      onSelectToken(selectedToken, amount);
      setSelectedToken(null);
      setTokenAmount("");
      setAmountError(null);
    }
  };

  const formatBalance = (token: Token): string => {
    if (token.tokenId === "ERG") {
      return `${(Number(token.amount) / 1000000000).toFixed(4)} ERG`;
    }
    
    const decimals = token.decimals || 0;
    if (decimals === 0) return token.amount.toString();
    
    const amount = Number(token.amount) / Math.pow(10, decimals);
    return amount.toFixed(Math.min(decimals, 4));
  };

  // Add ERG to available tokens if not already present
  const allTokens = React.useMemo(() => {
    const hasErg = availableTokens.some(t => t.tokenId === "ERG");
    if (!hasErg) {
      return [
        {
          tokenId: "ERG",
          amount: BigInt(0), // Will be updated from wallet
          name: "ERG",
          decimals: 9
        },
        ...availableTokens
      ];
    }
    return availableTokens;
  }, [availableTokens]);

  // Filter out tokens that are already selected
  const availableTokensFiltered = allTokens.filter(
    token => !selectedTokens.some(st => st.token.tokenId === token.tokenId)
  );

  console.log('Filtered available tokens:', availableTokensFiltered);

  return (
    <div className="space-y-4">
      <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg pixel-borders">
        <Label className="text-sm font-medium text-ocean-dark mb-2 block">Add Tokens</Label>
        <div className="flex gap-2">
          <Select 
            value={selectedToken?.tokenId} 
            onValueChange={handleTokenSelect}
          >
            <SelectTrigger className="flex-grow bg-white border-gray-200 text-ocean-dark">
              <SelectValue placeholder="Select a token" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200">
              {availableTokensFiltered.map((token) => (
                <SelectItem 
                  key={token.tokenId} 
                  value={token.tokenId}
                  className="text-ocean-dark hover:bg-gray-100"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{token.name || 'Unnamed Token'}</span>
                    <span className="text-sm text-gray-600">
                      Balance: {formatBalance(token)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            value={tokenAmount}
            onChange={handleAmountChange}
            placeholder={selectedToken ? `Amount (min ${
              selectedToken.tokenId === "ERG" ? "0.001" : 
              (1 / Math.pow(10, selectedToken.decimals || 0))
            })` : "Amount"}
            className={`w-32 bg-white border-gray-200 text-ocean-dark ${
              amountError ? 'border-red-500' : ''
            }`}
          />

          <Button 
            onClick={handleAddToken}
            disabled={!selectedToken || !tokenAmount || !!amountError}
            variant="secondary"
            className="bg-pixel-teal hover:bg-pixel-teal/90 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {amountError && (
          <p className="text-red-500 text-sm mt-1">{amountError}</p>
        )}
      </div>

      {selectedTokens.length > 0 && (
        <div className="bg-white/30 backdrop-blur-sm p-4 rounded-lg pixel-borders space-y-2">
          <Label className="text-sm font-medium text-ocean-dark mb-2 block">Selected Tokens</Label>
          {selectedTokens.map(({ token, amount }) => (
            <div key={token.tokenId} className="flex items-center justify-between p-2 bg-white/50 rounded">
              <span className="text-ocean-dark font-medium">
                {token.name || 'Unnamed Token'}: {
                  token.tokenId === "ERG" 
                    ? `${(Number(amount) / 1000000000).toFixed(4)} ERG`
                    : `${token.decimals 
                        ? (Number(amount) / Math.pow(10, token.decimals)).toFixed(Math.min(token.decimals, 4))
                        : amount
                      }`
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveToken(token.tokenId)}
                className="text-ocean-dark hover:text-ocean-dark/70 hover:bg-white/20"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenSelector; 