export interface NFTMetadata {
  tokenId: string;
  name: string;
  description?: string;
  collectionId?: string;
  collectionName?: string;
  imageUrl?: string;
  attributes?: Record<string, string | number>;
}

export interface NFTCollection {
  collectionId: string;
  name: string;
  description?: string;
  tokens: NFTMetadata[];
}

export interface NFTDistributionOptions {
  type: 'random' | 'sequential';
  collectionId: string;
  recipientCount: number;
}

export async function isNFT(tokenId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.ergoplatform.com/api/v1/tokens/${tokenId}`);
    const data = await response.json();
    
    // Check if token has R7 or R9 registers which typically indicate NFTs
    return data.emissionAmount === '1' || 
           (data.additionalRegisters && 
            (data.additionalRegisters.R7 || data.additionalRegisters.R9));
  } catch (error) {
    console.error(`Error checking if token ${tokenId} is NFT:`, error);
    return false;
  }
}

export async function getNFTMetadata(tokenId: string): Promise<NFTMetadata | null> {
  try {
    const response = await fetch(`https://api.ergoplatform.com/api/v1/tokens/${tokenId}`);
    const data = await response.json();

    if (!await isNFT(tokenId)) {
      return null;
    }

    // Extract collection info from R7 or R9 registers if available
    let collectionInfo = null;
    if (data.additionalRegisters?.R7) {
      try {
        collectionInfo = JSON.parse(atob(data.additionalRegisters.R7));
      } catch (e) {
        console.warn('Failed to parse R7 register:', e);
      }
    }

    return {
      tokenId,
      name: data.name || `NFT ${tokenId.slice(0, 8)}...`,
      description: data.description,
      collectionId: collectionInfo?.collectionId || undefined,
      collectionName: collectionInfo?.collection || undefined,
      imageUrl: data.imageUrl,
      attributes: collectionInfo?.attributes || {}
    };
  } catch (error) {
    console.error(`Error fetching NFT metadata for token ${tokenId}:`, error);
    return null;
  }
}

export async function groupNFTsByCollection(nfts: NFTMetadata[]): Promise<NFTCollection[]> {
  const collections = new Map<string, NFTCollection>();

  for (const nft of nfts) {
    if (!nft.collectionId) continue;

    if (!collections.has(nft.collectionId)) {
      collections.set(nft.collectionId, {
        collectionId: nft.collectionId,
        name: nft.collectionName || `Collection ${nft.collectionId.slice(0, 8)}...`,
        tokens: []
      });
    }

    collections.get(nft.collectionId)!.tokens.push(nft);
  }

  return Array.from(collections.values());
}

export function distributeNFTs(
  collection: NFTCollection,
  options: NFTDistributionOptions
): NFTMetadata[] {
  const { type, recipientCount } = options;
  const availableTokens = [...collection.tokens];

  if (type === 'random') {
    // Randomly select NFTs
    const selectedNFTs: NFTMetadata[] = [];
    for (let i = 0; i < recipientCount && availableTokens.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableTokens.length);
      selectedNFTs.push(availableTokens.splice(randomIndex, 1)[0]);
    }
    return selectedNFTs;
  } else {
    // Sequential distribution - take first N tokens
    return availableTokens.slice(0, recipientCount);
  }
} 