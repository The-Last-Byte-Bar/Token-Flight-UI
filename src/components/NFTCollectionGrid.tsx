import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NFTMetadata } from '@/lib/explorer';

interface NFTCollectionGridProps {
  nfts: NFTMetadata[];
  onSelectionChange: (selection: { [key: string]: number }) => void;
}

export const NFTCollectionGrid: React.FC<NFTCollectionGridProps> = ({
  nfts,
  onSelectionChange,
}) => {
  const [selectedNFTs, setSelectedNFTs] = useState<{ [key: string]: number }>({});
  const [filter, setFilter] = useState('');

  const handleQuantityChange = (nftId: string, quantity: number) => {
    const newSelection = {
      ...selectedNFTs,
      [nftId]: quantity,
    };
    
    // Remove NFTs with quantity 0
    if (quantity === 0) {
      delete newSelection[nftId];
    }
    
    setSelectedNFTs(newSelection);
    onSelectionChange(newSelection);
  };

  const filteredNFTs = nfts.filter(nft => 
    nft.name.toLowerCase().includes(filter.toLowerCase()) ||
    nft.description?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search NFTs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-gray-500">
          {filteredNFTs.length} NFTs found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredNFTs.map((nft) => (
          <Card key={nft.id} className="p-4 space-y-3">
            {nft.imageUrl && (
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <div className="space-y-2">
              <h3 className="font-bold truncate">{nft.name}</h3>
              {nft.description && (
                <p className="text-sm text-gray-500 line-clamp-2">
                  {nft.description}
                </p>
              )}
              {nft.attributes && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(nft.attributes).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={selectedNFTs[nft.id] || 0}
                  onChange={(e) => handleQuantityChange(nft.id, parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">Quantity</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredNFTs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No NFTs found matching your search
        </div>
      )}
    </div>
  );
}; 