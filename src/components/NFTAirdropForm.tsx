import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft } from "lucide-react";
import { NFTCollectionLookup } from './NFTCollectionLookup';
import { NFTCollectionGrid } from './NFTCollectionGrid';
import { NFTDistributionConfig, DistributionConfig } from './NFTDistributionConfig';
import { buildFleetTransaction, signAndSubmitTransaction } from '@/lib/fleet';
import { Token } from '@/lib/wallet';
import { NFTMetadata } from '@/lib/explorer';

interface NFTAirdropFormProps {
  walletAddress: string;
  availableTokens: Token[];
  onDisconnect: () => void;
  onBack: () => void;
}

export const NFTAirdropForm: React.FC<NFTAirdropFormProps> = ({
  walletAddress,
  availableTokens,
  onDisconnect,
  onBack
}) => {
  const [step, setStep] = useState<'lookup' | 'select' | 'distribute'>('lookup');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [collectionNFTs, setCollectionNFTs] = useState<NFTMetadata[]>([]);
  const [selectedNFTs, setSelectedNFTs] = useState<{ [key: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleCollectionFound = (id: string, nfts: NFTMetadata[]) => {
    setCollectionId(id);
    setCollectionNFTs(nfts);
    setStep('select');
  };

  const handleNFTSelection = (selection: { [key: string]: number }) => {
    setSelectedNFTs(selection);
  };

  const handleDistributionComplete = async (config: DistributionConfig) => {
    try {
      setIsProcessing(true);

      // Prepare transaction data
      const recipients = Object.entries(config.distributionPlan).flatMap(([nftId, addresses]) =>
        addresses.map(address => ({
          address,
          tokens: [{
            tokenId: nftId,
            amount: '1'
          }]
        }))
      );

      // Build and submit transaction
      const unsignedTx = await buildFleetTransaction({
        senderAddress: walletAddress,
        recipients
      });

      const txId = await signAndSubmitTransaction(unsignedTx);

      toast({
        title: "NFT Airdrop Successful!",
        description: `Transaction ID: ${txId}`,
      });

      // Reset form
      setStep('lookup');
      setCollectionId(null);
      setCollectionNFTs([]);
      setSelectedNFTs({});
    } catch (error) {
      console.error('Error performing NFT airdrop:', error);
      toast({
        title: "Airdrop Failed",
        description: error instanceof Error ? error.message : "There was an error processing your NFT airdrop.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="pixel-btn bg-white text-ocean-dark hover:bg-gray-100 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDisconnect}
            className="pixel-btn bg-white text-ocean-dark hover:bg-gray-100"
          >
            Disconnect Wallet
          </Button>
        </div>
      </div>

      <Card className="bg-white/30 backdrop-blur-sm p-6 pixel-borders">
        {step === 'lookup' && (
          <NFTCollectionLookup onCollectionFound={handleCollectionFound} />
        )}

        {step === 'select' && collectionNFTs.length > 0 && (
          <div className="space-y-4">
            <NFTCollectionGrid
              nfts={collectionNFTs}
              onSelectionChange={handleNFTSelection}
            />
            {Object.keys(selectedNFTs).length > 0 && (
              <Button
                onClick={() => setStep('distribute')}
                className="pixel-btn bg-pixel-navy text-white hover:bg-pixel-blue w-full"
              >
                Continue to Distribution
              </Button>
            )}
          </div>
        )}

        {step === 'distribute' && (
          <NFTDistributionConfig
            selectedNFTs={selectedNFTs}
            onConfigurationComplete={handleDistributionComplete}
          />
        )}
      </Card>
    </div>
  );
}; 