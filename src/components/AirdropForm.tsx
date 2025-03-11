import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon, SendIcon, PlusIcon, Loader2Icon, InfoIcon, GlobeIcon, DatabaseIcon, LogOutIcon, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenSelector } from './TokenSelector';
import { Token } from '../lib/wallet';
import { buildFleetTransaction, signAndSubmitTransaction } from '../lib/fleet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AirdropFormProps {
  walletConnected: boolean;
  walletAddress: string | null;
  availableTokens: Token[];
  onDisconnect: () => void;
  onBack: () => void;
}

interface ApiRecipient {
  address: string;
  [key: string]: any;
}

interface ApiConfig {
  url: string;
  addressColumn: string;
}

interface DistributionMethod {
  type: 'fixed' | 'total';
  amount?: string;
}

const DEFAULT_API_ENDPOINTS = [
  {
    name: "Sigma Score Miners",
    url: "http://5.78.102.130:8000/sigscore/miners",
    addressColumn: "address"
  },
  {
    name: "Custom API",
    url: "",
    addressColumn: ""
  }
];

const AirdropForm: React.FC<AirdropFormProps> = ({ 
  walletConnected, 
  walletAddress,
  availableTokens = [],
  onDisconnect,
  onBack
}) => {
  console.log('AirdropForm received tokens:', availableTokens);

  const [selectedTokens, setSelectedTokens] = useState<Array<{ 
    token: Token; 
    amount: string;
    distributionMethod: 'fixed' | 'total';
  }>>([]);
  const [recipients, setRecipients] = useState('');
  const [memo, setMemo] = useState('');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    url: DEFAULT_API_ENDPOINTS[0].url,
    addressColumn: DEFAULT_API_ENDPOINTS[0].addressColumn
  });
  const [selectedApiEndpoint, setSelectedApiEndpoint] = useState(DEFAULT_API_ENDPOINTS[0].name);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiData, setApiData] = useState<ApiRecipient[]>([]);
  const [showApiDialog, setShowApiDialog] = useState(false);
  const { toast } = useToast();

  const handleSelectToken = (token: Token, amount: string, distributionMethod: 'fixed' | 'total') => {
    setSelectedTokens(prev => [...prev, { token, amount, distributionMethod }]);
  };

  const handleRemoveToken = (tokenId: string) => {
    setSelectedTokens(prev => prev.filter(t => t.token.tokenId !== tokenId));
  };

  const handleAddSampleAddresses = () => {
    const sampleAddresses = [
      '9f4QF8AD1nQ3nJahQVkMj8hROUsz23F7AoF2TU9vhJcA',
      '9eiuh4123J8ND9cja9chwkmsn1239cnsa92380asdcNAS',
      '9anjd913j4j1F9DN19dns9qn2140bkanskdnHasdfnqw1'
    ];
    
    setRecipients(prev => {
      const current = prev.trim();
      if (current) {
        return current + '\n' + sampleAddresses.join('\n');
      }
      return sampleAddresses.join('\n');
    });
  };

  const handleApiEndpointChange = (endpointName: string) => {
    const endpoint = DEFAULT_API_ENDPOINTS.find(e => e.name === endpointName);
    if (endpoint) {
      setSelectedApiEndpoint(endpointName);
      setApiConfig({
        url: endpoint.url,
        addressColumn: endpoint.addressColumn
      });
    }
  };

  const fetchApiRecipients = async () => {
    if (!apiConfig.url || !apiConfig.addressColumn) {
      toast({
        title: "Invalid API Configuration",
        description: "Please provide both API URL and address column name",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoadingApi(true);
      const response = await fetch(apiConfig.url);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }

      // Validate that the address column exists
      if (!data[0]?.[apiConfig.addressColumn]) {
        throw new Error(`Address column '${apiConfig.addressColumn}' not found in API response`);
      }

      setApiData(data);
      const addresses = data.map(item => item[apiConfig.addressColumn]);
      setRecipients(addresses.join('\n'));
      setShowApiDialog(false);

      toast({
        title: "Recipients Loaded",
        description: `Successfully loaded ${addresses.length} addresses from API`,
      });
    } catch (error) {
      console.error('Error fetching API data:', error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch recipients from API",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  const calculateRecipientAmount = (amount: string, recipientCount: number, distributionMethod: 'fixed' | 'total'): string => {
    if (distributionMethod === 'fixed') {
      return amount;
    }
    // For total distribution, divide the total amount by recipient count
    const totalAmount = BigInt(amount);
    return (totalAmount / BigInt(recipientCount)).toString();
  };

  const handleAirdrop = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletConnected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your Nautilus wallet first",
        variant: "destructive"
      });
      return;
    }

    if (selectedTokens.length === 0) {
      toast({
        title: "No tokens selected",
        description: "Please select at least one token to airdrop",
        variant: "destructive"
      });
      return;
    }

    const recipientList = recipients.trim().split(/[\n,]+/).filter(Boolean);
    if (recipientList.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient address",
        variant: "destructive"
      });
      return;
    }

    // Validate addresses and extract amounts if provided
    const recipientData = recipientList.map(line => {
      const [address, amount] = line.split('(').map(part => part.trim().replace(')', ''));
      if (!address.match(/^[a-zA-Z0-9]{40,60}$/)) {
        throw new Error(`Invalid address format: ${address}`);
      }
      return { address, amount };
    });

    // Check if we have enough balance for each token
    for (const { token, amount } of selectedTokens) {
      let totalAmount: bigint;
      if (amount === 'total') {
        totalAmount = BigInt(amount); // Total amount is already the full amount
      } else {
        totalAmount = BigInt(amount) * BigInt(recipientData.length);
      }

      if (totalAmount > token.amount) {
        toast({
          title: "Insufficient balance",
          description: `You need ${totalAmount.toString()} ${token.name || 'tokens'} but only have ${token.amount.toString()}`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsAirdropping(true);
      
      // Prepare recipients with token amounts
      const recipients = recipientData.map(({ address }) => ({
        address,
        tokens: selectedTokens.map(({ token, amount, distributionMethod }) => {
          const tokenAmount = distributionMethod === 'total' 
            ? (BigInt(amount) / BigInt(recipientData.length)).toString()
            : amount;
          return {
            tokenId: token.tokenId,
            amount: tokenAmount
          };
        })
      }));

      // Build Fleet transaction
      const unsignedTx = await buildFleetTransaction({
        senderAddress: walletAddress,
        recipients,
        memo: memo || undefined
      });

      // Sign and submit transaction
      const txId = await signAndSubmitTransaction(unsignedTx);
      setTransactionId(txId);

      toast({
        title: "Airdrop successful!",
        description: `Transaction ID: ${txId}`,
      });
      
      // Reset form
      setSelectedTokens([]);
      setRecipients('');
      setMemo('');
    } catch (error) {
      console.error("Error performing airdrop:", error);
      toast({
        title: "Airdrop failed",
        description: error instanceof Error ? error.message : "There was an error processing your airdrop. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAirdropping(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/60 backdrop-blur-sm pixel-borders">
      <CardHeader className="bg-ocean-dark/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <CardTitle className="flex items-center gap-2 text-white pixel-text">
                <ZapIcon className="h-5 w-5" /> Token Flight Airdrop
              </CardTitle>
              <CardDescription className="text-white/80">
                Send tokens to multiple recipients at once
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={onDisconnect}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOutIcon className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleAirdrop} className="space-y-4">
          <div className="space-y-4">
            <TokenSelector
              availableTokens={availableTokens}
              selectedTokens={selectedTokens}
              onSelectToken={handleSelectToken}
              onRemoveToken={handleRemoveToken}
            />

            <div>
              <Label htmlFor="recipients">Recipient Addresses</Label>
              <div className="flex items-center gap-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSampleAddresses}
                  disabled={!walletConnected}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Sample Addresses
                </Button>
                <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!walletConnected || isLoadingApi}
                    >
                      <GlobeIcon className="h-4 w-4 mr-1" />
                      Import from API
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>API Configuration</DialogTitle>
                      <DialogDescription>
                        Configure the API endpoint to import addresses
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>API Endpoint</Label>
                        <Select
                          value={selectedApiEndpoint}
                          onValueChange={handleApiEndpointChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select API endpoint" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_API_ENDPOINTS.map(endpoint => (
                              <SelectItem key={endpoint.name} value={endpoint.name}>
                                {endpoint.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedApiEndpoint === "Custom API" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="apiUrl">API URL</Label>
                            <Input
                              id="apiUrl"
                              value={apiConfig.url}
                              onChange={(e) => setApiConfig(prev => ({ ...prev, url: e.target.value }))}
                              placeholder="https://api.example.com/data"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="addressColumn">Address Column</Label>
                            <Input
                              id="addressColumn"
                              value={apiConfig.addressColumn}
                              onChange={(e) => setApiConfig(prev => ({ ...prev, addressColumn: e.target.value }))}
                              placeholder="address"
                            />
                          </div>
                        </>
                      )}

                      <Button
                        type="button"
                        onClick={fetchApiRecipients}
                        disabled={isLoadingApi}
                        className="w-full"
                      >
                        {isLoadingApi ? (
                          <>
                            <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Import Addresses'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Textarea
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="Enter recipient addresses, one per line"
                className="min-h-[100px]"
                disabled={!walletConnected || isAirdropping}
              />
            </div>

            <div>
              <Label htmlFor="memo">Memo (optional)</Label>
              <Input
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Add a note to this transaction"
                disabled={!walletConnected || isAirdropping}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!walletConnected || isAirdropping || selectedTokens.length === 0 || !recipients.trim()}
            >
              {isAirdropping ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Processing Airdrop...
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4 mr-2" />
                  Launch Airdrop
                </>
              )}
            </Button>
          </div>
        </form>

        {transactionId && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">
              Transaction submitted! ID: {transactionId}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AirdropForm;
