
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ZapIcon, SendIcon, PlusIcon, Loader2Icon, InfoIcon, GlobeIcon, DatabaseIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AirdropFormProps {
  walletConnected: boolean;
  walletAddress: string | null;
  tokenIds?: string[];
  tokenBalances?: Record<string, number>;
}

interface ApiRecipient {
  address: string;
  [key: string]: any;
}

const AirdropForm: React.FC<AirdropFormProps> = ({ 
  walletConnected, 
  walletAddress,
  tokenIds = [],
  tokenBalances = {}
}) => {
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [recipients, setRecipients] = useState('');
  const [memo, setMemo] = useState('');
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState('http://5.78.102.130:8000/sigscore/miners');
  const [apiColumnName, setApiColumnName] = useState('address');
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiData, setApiData] = useState<ApiRecipient[]>([]);
  const { toast } = useToast();

  // Fetch token balances when component mounts
  useEffect(() => {
    if (tokenIds.length > 0 && !tokenId) {
      setTokenId(tokenIds[0]);
    }
  }, [tokenIds, tokenId]);

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

    if (!tokenAmount || isNaN(Number(tokenAmount)) || Number(tokenAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid token amount",
        variant: "destructive"
      });
      return;
    }

    if (!tokenId) {
      toast({
        title: "Token ID missing",
        description: "Please enter a valid token ID",
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

    // Check if we have enough balance for this token
    if (tokenBalances[tokenId]) {
      const totalAmount = Number(tokenAmount) * recipientList.length;
      if (totalAmount > tokenBalances[tokenId]) {
        toast({
          title: "Insufficient balance",
          description: `You need ${totalAmount} tokens but only have ${tokenBalances[tokenId]}`,
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setIsAirdropping(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fakeTransactionId = Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTransactionId(fakeTransactionId);

      toast({
        title: "Airdrop initiated!",
        description: `Sending ${tokenAmount} tokens to ${recipientList.length} recipients`,
      });
      
      setTokenAmount('');
      setRecipients('');
      setMemo('');
    } catch (error) {
      console.error("Error performing airdrop:", error);
      toast({
        title: "Airdrop failed",
        description: "There was an error processing your airdrop. Please try again.",
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

  const handleAddSampleTokenId = () => {
    setTokenId('1fd6e032e8476a4b118i7a31fa1b5c250f00a6a5a5a5a1c1f6fadad123e');
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
        <CardTitle className="flex items-center gap-2 text-white pixel-text">
          <ZapIcon className="h-5 w-5" /> Token Flight Airdrop
        </CardTitle>
        <CardDescription className="text-white/80">
          Send tokens to multiple recipients at once
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={(e) => {
          e.preventDefault(); // Prevent form submission to avoid page refresh
          handleAirdrop(e);
        }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token-id" className="text-pixel-navy font-bold flex items-center gap-1">
                Token ID <InfoIcon className="h-3 w-3 text-muted-foreground" />
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="token-id" 
                  type="text" 
                  placeholder="Paste your token ID here" 
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  disabled={!walletConnected || isAirdropping}
                  className="border-2 border-pixel-navy font-mono text-sm flex-1"
                />
                {tokenIds.length > 0 && (
                  <Select
                    value={tokenId}
                    onValueChange={(value) => setTokenId(value)}
                    disabled={!walletConnected || isAirdropping}
                  >
                    <SelectTrigger className="border-2 border-pixel-navy rounded w-36 bg-white">
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenIds.map((id, index) => (
                        <SelectItem key={index} value={id}>
                          <div className="flex justify-between w-full">
                            <span>{id.substring(0, 6)}...</span>
                            {tokenBalances[id] && (
                              <span className="text-green-600 ml-2">
                                {tokenBalances[id]}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSampleTokenId}
                  disabled={!walletConnected || isAirdropping}
                  className="pixel-btn text-xs whitespace-nowrap"
                >
                  <PlusIcon className="h-3 w-3 mr-1" /> Test ID
                </Button>
              </div>
              {tokenBalances[tokenId] && (
                <p className="text-sm text-pixel-navy mt-1">
                  Available balance: <span className="font-bold">{tokenBalances[tokenId]}</span>
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="token-amount" className="text-pixel-navy font-bold">
                Token Amount (per recipient)
              </Label>
              <Input 
                id="token-amount" 
                type="number" 
                placeholder="100" 
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                disabled={!walletConnected || isAirdropping}
                className="border-2 border-pixel-navy font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="recipients" className="text-pixel-navy font-bold">
                  Recipient Addresses
                </Label>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddSampleAddresses}
                    disabled={!walletConnected || isAirdropping}
                    className="pixel-btn text-xs"
                  >
                    <PlusIcon className="h-3 w-3 mr-1" /> Test Addresses
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  <TabsTrigger value="api">API Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-2">
                  <Textarea 
                    id="recipients" 
                    placeholder="Enter recipient addresses here, one per line"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    disabled={!walletConnected || isAirdropping}
                    className="h-32 font-mono text-sm border-2 border-pixel-navy"
                  />
                </TabsContent>
                
                <TabsContent value="api" className="space-y-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-url" className="text-pixel-navy font-bold text-xs">
                      API Endpoint URL
                    </Label>
                    <Input 
                      id="api-url" 
                      type="text" 
                      placeholder="https://example.com/api/addresses" 
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      disabled={isLoadingApi}
                      className="border-2 border-pixel-navy font-mono text-xs"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="column-name" className="text-pixel-navy font-bold text-xs">
                      Address Column Name
                    </Label>
                    <Input 
                      id="column-name" 
                      type="text" 
                      placeholder="address" 
                      value={apiColumnName}
                      onChange={(e) => setApiColumnName(e.target.value)}
                      disabled={isLoadingApi}
                      className="border-2 border-pixel-navy font-mono text-xs"
                    />
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={fetchApiRecipients}
                    disabled={!walletConnected || isLoadingApi}
                    className="pixel-btn w-full bg-pixel-teal text-white hover:bg-pixel-skyblue"
                  >
                    {isLoadingApi ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <GlobeIcon className="mr-2 h-4 w-4" />
                        Import Addresses from API
                      </>
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Current recipients: {recipients.split(/[\n,]+/).filter(Boolean).length}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memo" className="text-pixel-navy font-bold">
                Memo (optional)
              </Label>
              <Input 
                id="memo" 
                type="text" 
                placeholder="Add a note to this transaction" 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                disabled={!walletConnected || isAirdropping}
                className="border-2 border-pixel-navy"
              />
            </div>
          </div>
        </form>
        
        {transactionId && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
            <h4 className="font-medium text-green-800">Transaction Submitted!</h4>
            <p className="text-sm font-mono text-green-700 break-all mt-1">
              ID: {transactionId}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-ocean-dark/10 px-6 py-4">
        <Button 
          type="button"
          onClick={handleAirdrop}
          disabled={!walletConnected || isAirdropping}
          className="pixel-btn w-full bg-pixel-navy hover:bg-pixel-blue text-white"
        >
          {isAirdropping ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <SendIcon className="mr-2 h-4 w-4" />
              Launch Airdrop
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AirdropForm;
