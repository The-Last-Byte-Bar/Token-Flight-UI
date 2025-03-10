
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface NautilusWalletProps {
  onConnect: (address: string, tokenIds?: string[], tokenBalances?: Record<string, number>) => void;
}

interface TokenInfo {
  id: string;
  amount: number;
  name?: string;
}

const NautilusWallet: React.FC<NautilusWalletProps> = ({ onConnect }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [tokenIds, setTokenIds] = useState<string[]>([]);
  const [tokenBalances, setTokenBalances] = useState<Record<string, number>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  // Check if Nautilus is installed
  const checkIfNautilusInstalled = () => {
    return window.ergoConnector && window.ergoConnector.nautilus;
  };

  // Fetch token information (simulated)
  const fetchTokenInfo = async (address: string): Promise<TokenInfo[]> => {
    try {
      // In a real implementation, we would fetch tokens from the blockchain
      // This is a simulation for demonstration purposes
      console.log("Fetching token info for address:", address);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sample token information (would normally come from wallet/blockchain)
      const sampleTokens: TokenInfo[] = [
        {
          id: '1fd6e032e8476a4b118i7a31fa1b5c250f00a6a5a5a5a1c1f6fadad123e',
          amount: 10000,
          name: 'ERG'
        },
        {
          id: '2ab7c54d89e76c3b429f12d45e78901a23bc456d78ef90a12b3c45d67e8f',
          amount: 5000,
          name: 'SigUSD'
        },
        {
          id: '3de9f01a23b45c67d89e01f23a45b67c89d01e23f45a67b89c01d23e45f6',
          amount: 25000,
          name: 'Spectrum'
        }
      ];
      
      return sampleTokens;
    } catch (error) {
      console.error("Error fetching token information:", error);
      return [];
    }
  };

  const connectWallet = async () => {
    if (!checkIfNautilusInstalled()) {
      toast({
        title: "Nautilus Wallet not found",
        description: "Please install the Nautilus Wallet extension for your browser.",
        variant: "destructive",
      });
      
      // Open Nautilus extension page
      window.open('https://chrome.google.com/webstore/detail/nautilus-wallet/gjlmehlldlphhljhpnlddaodbjjcchai', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      
      // Connect to Nautilus
      const connected = await window.ergoConnector.nautilus.connect();
      
      if (connected) {
        // This is a simulation, in a real implementation we'd get the actual address
        const walletAddress = "9f4QF8AD1nQ3nJahQVkMj8hROUsz23F7AoF2TU9vhJcA";
        setAddress(walletAddress);
        
        // Fetch token information
        const tokensInfo = await fetchTokenInfo(walletAddress);
        
        // Extract token IDs and balances
        const ids = tokensInfo.map(token => token.id);
        const balances = tokensInfo.reduce((acc, token) => {
          acc[token.id] = token.amount;
          return acc;
        }, {} as Record<string, number>);
        
        setTokenIds(ids);
        setTokenBalances(balances);
        
        // Notify parent component
        onConnect(walletAddress, ids, balances);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
        });
      }
    } catch (error) {
      console.error("Error connecting to Nautilus wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Nautilus wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.ergoConnector && window.ergoConnector.nautilus) {
        await window.ergoConnector.nautilus.disconnect();
      }
      setAddress(null);
      setTokenIds([]);
      setTokenBalances({});
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Nautilus wallet",
      });
    } catch (error) {
      console.error("Error disconnecting from Nautilus wallet:", error);
    }
  };

  return (
    <div className="mt-4 mb-8">
      {!address ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="pixel-btn bg-pixel-navy text-white hover:bg-pixel-blue"
          type="button" // Explicitly set to prevent form submission
        >
          {isConnecting ? 'Connecting...' : 'Connect Nautilus Wallet'}
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="bg-black/20 px-4 py-2 rounded font-mono text-sm text-white">
            {address.substring(0, 6)}...{address.substring(address.length - 4)}
            {tokenIds.length > 0 && (
              <span className="ml-2 bg-pixel-skyblue/80 text-xs px-2 py-0.5 rounded">
                {tokenIds.length} tokens
              </span>
            )}
          </div>
          <Button 
            onClick={disconnectWallet} 
            variant="outline" 
            className="pixel-btn bg-destructive/90 text-white hover:bg-destructive"
            type="button" // Explicitly set to prevent form submission
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};

// Update TypeScript definitions for window.ergoConnector
declare global {
  interface Window {
    ergoConnector: {
      nautilus: {
        connect: () => Promise<boolean>;
        getContext: () => Promise<string>;
        disconnect: () => Promise<void>;
      };
    };
  }
}

export default NautilusWallet;
