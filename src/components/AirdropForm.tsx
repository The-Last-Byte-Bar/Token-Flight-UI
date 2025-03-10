import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon, SendIcon, PlusIcon, Loader2Icon, InfoIcon, GlobeIcon, DatabaseIcon, LogOutIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TokenSelector } from './TokenSelector';
import { Token } from '../lib/wallet';
import { buildFleetTransaction, signAndSubmitTransaction } from '../lib/fleet';

interface AirdropFormProps {
  walletConnected: boolean;
  walletAddress: string | null;
  availableTokens: Token[];
  onDisconnect: () => void;
}

interface ApiRecipient {
  address: string;
  [key: string]: any;
}

const AirdropForm: React.FC<AirdropFormProps> = ({ 
  walletConnected, 
  walletAddress,
  availableTokens = [],
  onDisconnect
}) => {
  console.log('AirdropForm received tokens:', availableTokens);

  const [selectedTokens, setSelectedTokens] = useState<Array<{ token: Token; amount: string }>>([]);
  const [recipients, setRecipients] = useState('');
  const [memo, setMemo] = useState('');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('http://5.78.102.130:8000/sigscore/miners');
  const [apiColumnName, setApiColumnName] = useState('address');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiData, setApiData] = useState<ApiRecipient[]>([]);
  const { toast } = useToast();

  const handleSelectToken = (token: Token, amount: string) => {
    setSelectedTokens(prev => [...prev, { token, amount }]);
  };

  const handleRemoveToken = (tokenId: string) => {
    setSelectedTokens(prev => prev.filter(t => t.token.tokenId !== tokenId));
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

    const invalidAddresses = recipientList.filter(addr => !addr.trim().match(/^[a-zA-Z0-9]{40,60}$/));
    if (invalidAddresses.length > 0) {
      toast({
        title: "Invalid addresses",
        description: `Some addresses appear to be invalid: ${invalidAddresses.map(a => a.substring(0, 8) + '...').join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Check if we have enough balance for each token
    for (const { token, amount } of selectedTokens) {
      const totalAmount = BigInt(amount) * BigInt(recipientList.length);
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
      const recipients = recipientList.map(address => ({
        address,
        tokens: selectedTokens.map(({ token, amount }) => ({
          tokenId: token.tokenId,
          amount: amount
        }))
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

  const fetchApiRecipients = async () => {
    if (!apiUrl) {
      toast({
        title: "API URL required",
        description: "Please enter a valid API URL",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoadingApi(true);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("API did not return an array of data");
      }
      
      setApiData(data);

      // Extract addresses based on column name
      if (data.length > 0) {
        const addresses = data
          .filter(item => item[apiColumnName])
          .map(item => item[apiColumnName]);
          
        if (addresses.length === 0) {
          toast({
            title: "No valid addresses found",
            description: `Column '${apiColumnName}' not found or contains no valid data`,
            variant: "destructive"
          });
          return;
        }

        // Add to recipients textarea
        setRecipients(prev => {
          const current = prev.trim();
          if (current) {
            return current + '\n' + addresses.join('\n');
          }
          return addresses.join('\n');
        });
        
        toast({
          title: "Addresses imported",
          description: `Successfully imported ${addresses.length} addresses from API`,
        });
      } else {
        toast({
          title: "No data found",
          description: "The API returned an empty array",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching API data:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to fetch data from API",
        variant: "destructive"
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/60 backdrop-blur-sm pixel-borders">
      <CardHeader className="bg-ocean-dark/20">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-white pixel-text">
              <ZapIcon className="h-5 w-5" /> Token Flight Airdrop
            </CardTitle>
            <CardDescription className="text-white/80">
              Send tokens to multiple recipients at once
            </CardDescription>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchApiRecipients}
                  disabled={!walletConnected || isLoadingApi}
                >
                  {isLoadingApi ? (
                    <>
                      <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <GlobeIcon className="h-4 w-4 mr-1" />
                      Import from API
                    </>
                  )}
                </Button>
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
