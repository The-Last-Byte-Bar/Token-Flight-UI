import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface NFTDistributionConfigProps {
  selectedNFTs: { [key: string]: number };
  onConfigurationComplete: (config: DistributionConfig) => void;
}

export interface DistributionConfig {
  addresses: string[];
  isRandom: boolean;
  distributionPlan: {
    [nftId: string]: string[]; // Maps NFT IDs to recipient addresses
  };
}

export const NFTDistributionConfig: React.FC<NFTDistributionConfigProps> = ({
  selectedNFTs,
  onConfigurationComplete,
}) => {
  const [addresses, setAddresses] = useState<string>('');
  const [isRandom, setIsRandom] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const totalNFTs = Object.values(selectedNFTs).reduce((sum, count) => sum + count, 0);

  const validateAddresses = (addressList: string[]): boolean => {
    // Basic Ergo address validation - should be enhanced with proper validation
    return addressList.every(addr => addr.length >= 40 && addr.length <= 120);
  };

  const createDistributionPlan = (addressList: string[]): { [nftId: string]: string[] } => {
    const plan: { [nftId: string]: string[] } = {};
    
    if (isRandom) {
      // Random distribution
      const shuffledAddresses = [...addressList].sort(() => Math.random() - 0.5);
      let addressIndex = 0;

      for (const [nftId, quantity] of Object.entries(selectedNFTs)) {
        plan[nftId] = [];
        for (let i = 0; i < quantity; i++) {
          plan[nftId].push(shuffledAddresses[addressIndex % shuffledAddresses.length]);
          addressIndex++;
        }
      }
    } else {
      // Sequential distribution
      let addressIndex = 0;
      for (const [nftId, quantity] of Object.entries(selectedNFTs)) {
        plan[nftId] = [];
        for (let i = 0; i < quantity; i++) {
          plan[nftId].push(addressList[addressIndex % addressList.length]);
          addressIndex++;
        }
      }
    }

    return plan;
  };

  const handleSave = async () => {
    const addressList = addresses.split('\n').map(addr => addr.trim()).filter(Boolean);

    if (addressList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one recipient address",
        variant: "destructive",
      });
      return;
    }

    if (!validateAddresses(addressList)) {
      toast({
        title: "Error",
        description: "One or more addresses are invalid",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const distributionPlan = createDistributionPlan(addressList);
      
      onConfigurationComplete({
        addresses: addressList,
        isRandom,
        distributionPlan,
      });

      toast({
        title: "Success",
        description: "Distribution configuration saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create distribution plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Distribution Configuration</h2>
        <p className="text-sm text-gray-500">
          Total NFTs to distribute: {totalNFTs}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="random-mode"
            checked={isRandom}
            onCheckedChange={setIsRandom}
          />
          <Label htmlFor="random-mode">
            Random Distribution
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="addresses">
            Recipient Addresses (one per line)
          </Label>
          <Textarea
            id="addresses"
            value={addresses}
            onChange={(e) => setAddresses(e.target.value)}
            placeholder="Enter Ergo addresses..."
            className="min-h-[200px]"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </Card>
  );
}; 