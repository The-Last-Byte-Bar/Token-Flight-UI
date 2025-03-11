import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Image } from "lucide-react";

interface AirdropTypeSelectorProps {
  onSelect: (type: 'token' | 'nft') => void;
}

export const AirdropTypeSelector: React.FC<AirdropTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto p-4">
      <Card 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 transition-all cursor-pointer pixel-borders"
        onClick={() => onSelect('token')}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Coins className="w-12 h-12 text-pixel-teal" />
            <h3 className="text-xl font-bold text-ocean-dark">Token Airdrop</h3>
            <p className="text-ocean-dark/80">
              Distribute fungible tokens to multiple addresses at once.
              Perfect for token distributions and rewards.
            </p>
            <Button 
              className="pixel-btn bg-pixel-navy text-white hover:bg-pixel-blue"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('token');
              }}
            >
              Select Token Airdrop
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-white/30 backdrop-blur-sm hover:bg-white/40 transition-all cursor-pointer pixel-borders"
        onClick={() => onSelect('nft')}
      >
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Image className="w-12 h-12 text-pixel-teal" />
            <h3 className="text-xl font-bold text-ocean-dark">NFT Airdrop</h3>
            <p className="text-ocean-dark/80">
              Distribute NFTs from your collections randomly or sequentially.
              Perfect for NFT drops and community rewards.
            </p>
            <Button 
              className="pixel-btn bg-pixel-navy text-white hover:bg-pixel-blue"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('nft');
              }}
            >
              Select NFT Airdrop
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 