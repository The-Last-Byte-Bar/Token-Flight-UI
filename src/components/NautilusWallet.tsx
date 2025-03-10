import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Token } from '../lib/wallet';

declare global {
  interface Window {
    ergoConnector?: {
      nautilus?: any;
    };
    ergo?: any;
  }
}

interface NautilusWalletProps {
  onConnect: (address: string, tokens: Token[]) => void;
}

interface TokenInfo {
  id: string;
  amount: number;
  name?: string;
  decimals?: number;
  description?: string;
}

const formatTokenAmount = (amount: number, decimals: number = 0): string => {
  if (decimals === 0) return amount.toLocaleString();
  const factor = Math.pow(10, decimals);
  return (amount / factor).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const NautilusWallet: React.FC<NautilusWalletProps> = ({ onConnect }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const tokenCache = new Map<string, TokenInfo>();

  const fetchTokenMetadata = async (tokenId: string): Promise<{name?: string, decimals?: number, description?: string}> => {
    try {
      const response = await fetch(`https://api.ergoplatform.com/api/v1/tokens/${tokenId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Token ${tokenId} not found in Explorer`);
          return {};
        }
        throw new Error(`Failed to fetch token metadata: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        name: data.name || null,
        decimals: data.decimals || 0,
        description: data.description || ''
      };
    } catch (error) {
      console.warn(`Failed to fetch metadata for token ${tokenId}`, error);
      return {};
    }
  };

  const fetchTokenInfo = async (address: string): Promise<TokenInfo[]> => {
    try {
      if (!window.ergoConnector?.nautilus) {
        throw new Error('Nautilus wallet not found');
      }

      const response = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${address}/balance/confirmed`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      
      const data = await response.json();
      
      if (!data.tokens || !Array.isArray(data.tokens)) {
        console.warn('No tokens found in response');
        return [];
      }

      const tokens = await Promise.all(data.tokens.map(async (token: any) => {
        try {
          // Check cache first
          if (tokenCache.has(token.tokenId)) {
            const cachedToken = tokenCache.get(token.tokenId)!;
            return {
              ...cachedToken,
              amount: Number(token.amount)
            };
          }

          // Fetch metadata if not in cache
          const metadata = await fetchTokenMetadata(token.tokenId);
          
          const tokenInfo = {
            id: token.tokenId,
            amount: Number(token.amount),
            name: metadata.name || token.name || `Token ${token.tokenId.slice(0, 8)}...`,
            decimals: metadata.decimals || token.decimals || 0,
            description: metadata.description || ''
          };

          // Cache the token info
          tokenCache.set(token.tokenId, tokenInfo);
          
          return tokenInfo;
        } catch (error) {
          console.error(`Error processing token ${token.tokenId}:`, error);
          // Return basic token info if metadata fetch fails
          return {
            id: token.tokenId,
            amount: Number(token.amount),
            name: token.name || `Token ${token.tokenId.slice(0, 8)}...`,
            decimals: token.decimals || 0
          };
        }
      }));

      return tokens.filter(Boolean); // Remove any undefined entries
    } catch (error) {
      console.error("Error fetching token information:", error);
      return [];
    }
  };

  const convertToTokens = (tokenInfos: TokenInfo[]): Token[] => {
    return tokenInfos.map(info => ({
      tokenId: info.id,
      amount: BigInt(info.amount),
      name: info.name || 'Unnamed Token',
      decimals: info.decimals || 0
    }));
  };

  const connectWallet = async () => {
    if (!window.ergoConnector?.nautilus) {
      toast({
        title: "Nautilus Wallet not found",
        description: "Please install the Nautilus Wallet extension for your browser.",
        variant: "destructive",
      });
      
      window.open('https://chrome.google.com/webstore/detail/nautilus-wallet/gjlmehlldlphhljhpnlddaodbjjcchai', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      
      const connected = await window.ergoConnector.nautilus.connect();
      
      if (connected) {
        // Wait for ergo object to be injected
        let retries = 0;
        while (!window.ergo && retries < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }

        if (!window.ergo) {
          throw new Error('Ergo object not found after wallet connection');
        }

        // Now safe to use window.ergo
        const walletAddress = await window.ergo.get_change_address();
        setAddress(walletAddress);
        
        // Fetch token information
        const tokensInfo = await fetchTokenInfo(walletAddress);
        console.log('Fetched tokens:', tokensInfo);
        setTokens(tokensInfo);
        
        // Convert to Token type and notify parent component
        const tokens = convertToTokens(tokensInfo);
        console.log('Converted tokens for parent:', tokens);
        onConnect(walletAddress, tokens);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
        });
      }
    } catch (error) {
      console.error("Error connecting to Nautilus wallet:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not connect to Nautilus wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.ergoConnector?.nautilus) {
        await window.ergoConnector.nautilus.disconnect();
      }
      setAddress(null);
      setTokens([]);
      onConnect('', []); // Clear tokens in parent component
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from Nautilus wallet",
      });
    } catch (error) {
      console.error("Error disconnecting from Nautilus wallet:", error);
    }
  };

  return (
    <div className="mt-4 mb-8 flex justify-center">
      {!address ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="pixel-btn bg-pixel-navy text-white hover:bg-pixel-blue"
          type="button"
        >
          {isConnecting ? 'Connecting...' : 'Connect Nautilus Wallet'}
        </Button>
      ) : (
        <div className="bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg pixel-borders font-mono text-sm text-ocean-dark">
          Connected: {address.substring(0, 6)}...{address.substring(address.length - 4)}
        </div>
      )}
    </div>
  );
};

export default NautilusWallet;
