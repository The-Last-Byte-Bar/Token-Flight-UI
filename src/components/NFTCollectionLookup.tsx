import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Explorer } from '@/lib/explorer';

interface NFTCollectionLookupProps {
  onCollectionFound: (collectionId: string, nfts: any[]) => void;
  walletTokens?: string[]; // Add walletTokens prop for the tokens in user's wallet
}

export const NFTCollectionLookup: React.FC<NFTCollectionLookupProps> = ({ 
  onCollectionFound, 
  walletTokens = [] 
}) => {
  const [tokenId, setTokenId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const lookupCollection = async () => {
    if (!tokenId) {
      toast({
        title: "Error",
        description: "Please enter a token ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Looking up collection for token:', tokenId);
      console.log('Available wallet tokens:', walletTokens.length);
      
      // Use the collection detection method based on R7 register values
      const { collectionId, tokens } = await Explorer.findCollectionByToken(tokenId, walletTokens);
      
      if (!collectionId) {
        throw new Error('Collection identifier not found');
      }
      
      console.log('Found collection identifier:', collectionId);
      console.log('Collection tokens:', tokens);
      
      if (tokens.length === 0) {
        // If no tokens found with the same R7 value in the wallet, just return the original token
        console.log('No wallet tokens in this collection. Showing just the lookup token.');
        
        const box = await Explorer.getTokenBox(tokenId);
        if (!box) {
          throw new Error('Failed to retrieve token details');
        }
        
        // Get basic metadata for the token
        const nameRaw = box.additionalRegisters.R4?.renderedValue || tokenId.substring(0, 8);
        const descriptionRaw = box.additionalRegisters.R5?.renderedValue || '';
        const imageUrlRaw = box.additionalRegisters.R9?.renderedValue || '';
        
        const name = Explorer.decodeHexToString(nameRaw) || nameRaw;
        const description = Explorer.decodeHexToString(descriptionRaw) || descriptionRaw;
        const imageUrl = Explorer.decodeHexToString(imageUrlRaw) || imageUrlRaw;
        
        const collectionNFTs = [{
          id: tokenId,
          name,
          description,
          imageUrl,
          collectionId,
          isCollectionToken: true
        }];
        
        onCollectionFound(collectionId, collectionNFTs);
        
        toast({
          title: "Token Found",
          description: `Found token, but no collection tokens in wallet`,
        });
      } else {
        // Get metadata for each token in the collection
        const metadataPromises = tokens.map(async (id) => {
          try {
            const box = await Explorer.getTokenBox(id);
            if (!box) return null;
            
            // Extract token metadata from the box's additional registers
            const nameRaw = box.additionalRegisters.R4?.renderedValue || id.substring(0, 8);
            const descriptionRaw = box.additionalRegisters.R5?.renderedValue || '';
            const imageUrlRaw = box.additionalRegisters.R9?.renderedValue || '';
            
            // Try to decode hex values to readable text
            const name = Explorer.decodeHexToString(nameRaw) || nameRaw;
            const description = Explorer.decodeHexToString(descriptionRaw) || descriptionRaw;
            const imageUrl = Explorer.decodeHexToString(imageUrlRaw) || imageUrlRaw;
            
            return {
              id,
              name,
              description,
              imageUrl,
              collectionId,
              r7Value: box.additionalRegisters.R7?.renderedValue || null
            };
          } catch (error) {
            console.error('Error fetching token metadata:', error);
            return null;
          }
        });
        
        const collectionNFTs = (await Promise.all(metadataPromises)).filter(Boolean);
        
        if (collectionNFTs.length === 0) {
          throw new Error('Failed to retrieve metadata for collection NFTs');
        }
        
        onCollectionFound(collectionId, collectionNFTs);
        
        toast({
          title: "Success",
          description: `Found collection with ${collectionNFTs.length} NFTs`,
        });
      }
    } catch (error) {
      console.error('Collection lookup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to lookup collection",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">NFT Collection Lookup</h2>
        <p className="text-sm text-gray-500">
          Enter a token ID from the collection to find all related NFTs.
        </p>
        <div className="flex gap-4">
          <Input
            placeholder="Enter Token ID"
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={lookupCollection}
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? "Looking up..." : "Find Collection"}
          </Button>
        </div>
      </div>
    </Card>
  );
}; 