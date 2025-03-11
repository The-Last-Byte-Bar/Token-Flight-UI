import axios from 'axios';

// Using the public Ergo platform API instead of local server
const EXPLORER_API_URL = 'https://api.ergoplatform.com/api/v1';

export interface Transaction {
  id: string;
  inputs: Array<{
    id: string;
    additionalRegisters: {
      R7?: string;
      [key: string]: string | undefined;
    };
  }>;
  outputs: Array<{
    boxId: string;
    assets: Array<{
      tokenId: string;
      amount: number;
    }>;
    additionalRegisters?: {
      R4?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
      R5?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
      R6?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
      R7?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
      R8?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
      R9?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    };
  }>;
}

export interface TokenBox {
  boxId: string;
  transactionId: string;
  value: number;
  assets: Array<{
    tokenId: string;
    amount: number;
    name?: string;
    decimals?: number;
    type?: string;
  }>;
  additionalRegisters: {
    R4?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    R5?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    R6?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    R7?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    R8?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
    R9?: { serializedValue: string; sigmaType: string; renderedValue: string | null };
  };
}

export interface TokenInfo {
  id: string;
  boxId: string;
  emissionAmount: number;
  name: string;
  description: string;
  type: string;
  decimals: number;
}

export interface BoxInfo {
  id: string;
  transactionId: string;
  value: number;
  creationHeight: number;
  ergoTree: string;
  assets: Array<{
    tokenId: string;
    amount: number;
  }>;
}

export interface NFTMetadata {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  collectionId?: string;
  attributes?: Record<string, any>;
  isCollectionToken?: boolean; // Indicates if this is the parent collection token
}

interface ExplorerResponse<T> {
  items: T[];
  total: number;
}

export class Explorer {
  static async getTokenBox(tokenId: string): Promise<TokenBox | null> {
    try {
      console.log('Fetching token box for token ID:', tokenId);
      // First get token information to find its current box
      const tokenResponse = await axios.get<TokenInfo>(`${EXPLORER_API_URL}/tokens/${tokenId}`);
      const boxId = tokenResponse.data.boxId;
      
      console.log('Found box ID:', boxId);
      
      if (!boxId) {
        throw new Error('Token box not found');
      }

      // Get the box data which contains registers
      const boxResponse = await axios.get<TokenBox>(`${EXPLORER_API_URL}/boxes/${boxId}`);
      console.log('Retrieved box data:', boxResponse.data);
      return boxResponse.data;
    } catch (error) {
      console.error('Error fetching token box:', error);
      return null;
    }
  }

  static decodeR7Register(r7Value: string | { serializedValue: string; sigmaType: string; renderedValue: string | null }): string | null {
    console.log('Decoding R7 register value:', r7Value);
    
    try {
      if (typeof r7Value === 'string') {
        // Handle direct hex string
        return r7Value.startsWith('0e') ? r7Value.slice(2) : r7Value;
      }

      // For object values, check the sigma type
      switch (r7Value.sigmaType) {
        case 'Coll[Byte]':
        case 'Coll[SByte]':
          // For NFT collections, we just want the raw rendered or serialized value
          // This is typically a small identifier, not a full token ID
          return r7Value.renderedValue || 
                (r7Value.serializedValue.startsWith('0e') ? 
                 r7Value.serializedValue.slice(2) : 
                 r7Value.serializedValue);
        case 'SLong':
          // For SLong types, this might be a collection identifier
          console.log('Found SLong type in R7, returning raw value');
          return r7Value.renderedValue || r7Value.serializedValue;
        default:
          console.log('Unexpected sigma type:', r7Value.sigmaType);
          return null;
      }
    } catch (error) {
      console.error('Error decoding R7 register:', error);
      return null;
    }
  }

  static async getCollectionNFTs(collectionId: string): Promise<NFTMetadata[]> {
    try {
      console.log('Looking up collection:', collectionId);
      // First verify the collection token exists
      const collectionInfo = await axios.get<TokenInfo>(`${EXPLORER_API_URL}/tokens/${collectionId}`);
      
      if (!collectionInfo.data) {
        throw new Error('Collection token not found');
      }

      console.log('Collection info:', collectionInfo.data);

      // Search for boxes that contain NFTs with R7 register matching our collection ID
      const response = await axios.get<ExplorerResponse<TokenBox>>(`${EXPLORER_API_URL}/boxes/search`, {
        params: {
          registers: {
            R7: collectionId
          }
        }
      });

      console.log('Found boxes:', response.data.items.length);

      const nfts: NFTMetadata[] = [];
      
      // Process each box to extract NFT information
      for (const box of response.data.items) {
        console.log('Processing box:', box.boxId);
        if (box.assets && box.assets.length > 0) {
          for (const asset of box.assets) {
            console.log('Processing asset:', asset.tokenId);
            // Get token info for each asset
            const tokenInfo = await axios.get<TokenInfo>(`${EXPLORER_API_URL}/tokens/${asset.tokenId}`);
            
            if (tokenInfo.data && tokenInfo.data.type === 'EIP-004') {
              console.log('Found NFT:', tokenInfo.data.name);
              nfts.push({
                id: asset.tokenId,
                name: tokenInfo.data.name,
                description: tokenInfo.data.description,
                collectionId,
                imageUrl: tokenInfo.data.description?.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif)/i)?.[0],
                attributes: {},
                isCollectionToken: false
              });
            }
          }
        }
      }

      console.log('Total NFTs found:', nfts.length);
      return nfts;
    } catch (error) {
      console.error('Error fetching collection NFTs:', error);
      throw new Error('Failed to fetch collection NFTs');
    }
  }

  static async getCollectionIdFromTransaction(tx: Transaction): Promise<string | null> {
    try {
      // First check if this token is referenced as a collection by other NFTs
      const tokenId = tx.outputs[0]?.assets?.find(asset => asset.amount === 1)?.tokenId;
      if (tokenId) {
        console.log('Checking if token is a collection:', tokenId);
        try {
          // Search for boxes that have this token ID in their R7 register
          const response = await axios.get<ExplorerResponse<TokenBox>>(`${EXPLORER_API_URL}/boxes/search`, {
            params: {
              registers: {
                R7: tokenId
              }
            }
          });

          if (response.data.items.length > 0) {
            console.log(`Found ${response.data.items.length} NFTs referencing this token as collection`);
            // This token is a collection token
            return tokenId;
          }
          console.log('No NFTs found referencing this token as collection');
        } catch (error) {
          console.error('Error searching for collection references:', error);
        }
      }

      // If not a collection itself, check if it belongs to a collection
      for (const output of tx.outputs) {
        const nftAsset = output.assets?.find(asset => asset.amount === 1);
        if (nftAsset) {
          console.log('Found NFT output:', output.boxId);
          
          // Check R7 register for collection identifier
          const r7Value = output.additionalRegisters?.R7;
          if (r7Value) {
            console.log('Checking R7 register in output:', r7Value);
            const decoded = this.decodeR7Register(r7Value);
            
            if (decoded) {
              console.log('Found collection identifier in R7:', decoded);
              // This is an identifier, not a full token ID
              return decoded;
            }
          }

          // If not found in output, check box data
          try {
            console.log('Fetching box data for:', output.boxId);
            const boxResponse = await axios.get<TokenBox>(`${EXPLORER_API_URL}/boxes/${output.boxId}`);
            const box = boxResponse.data;
            
            const r7Value = box.additionalRegisters.R7;
            if (r7Value) {
              console.log('Checking R7 register in box:', r7Value);
              const decoded = this.decodeR7Register(r7Value);
              
              if (decoded) {
                console.log('Found collection identifier in box R7:', decoded);
                return decoded;
              }
            }
          } catch (error) {
            console.error('Error fetching box data:', error);
          }
        }
      }
      
      console.log('No collection ID found');
      return null;
    } catch (error) {
      console.error('Error getting collection ID from transaction:', error);
      return null;
    }
  }

  static async getTokenMintTx(tokenId: string): Promise<Transaction | null> {
    try {
      console.log('Fetching mint transaction for token:', tokenId);
      // First get token information
      const tokenResponse = await axios.get<TokenInfo>(`${EXPLORER_API_URL}/tokens/${tokenId}`);
      console.log('Token response:', tokenResponse.data);
      
      if (!tokenResponse.data) {
        throw new Error('Token information not found');
      }

      const boxId = tokenResponse.data.boxId;
      console.log('Found box ID:', boxId);
      
      if (!boxId) {
        throw new Error('Token minting box not found');
      }

      // Get the box data to find the transaction
      const boxResponse = await axios.get<TokenBox>(`${EXPLORER_API_URL}/boxes/${boxId}`);
      console.log('Box response:', boxResponse.data);
      
      if (!boxResponse.data) {
        throw new Error('Box data not found');
      }

      const txId = boxResponse.data.transactionId;
      console.log('Found transaction ID:', txId);

      if (!txId) {
        throw new Error('Minting transaction not found');
      }

      // Get the full transaction data
      const txResponse = await axios.get<Transaction>(`${EXPLORER_API_URL}/transactions/${txId}`);
      console.log('Retrieved transaction data:', txResponse.data);
      
      if (!txResponse.data) {
        throw new Error('Transaction data not found');
      }

      // Try to find collection ID in transaction
      const collectionId = await this.getCollectionIdFromTransaction(txResponse.data);
      if (collectionId) {
        console.log('Found collection ID in transaction:', collectionId);
      } else {
        console.log('No collection ID found in transaction');
      }

      return txResponse.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Network error fetching mint transaction:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      } else {
        console.error('Error fetching mint transaction:', error);
      }
      throw new Error('Failed to fetch token information');
    }
  }

  static async isPartOfCollection(tokenId: string, collectionIdentifier: string): Promise<boolean> {
    try {
      // Get the box data for the token
      const box = await this.getTokenBox(tokenId);
      if (!box || !box.additionalRegisters.R7) {
        return false;
      }
      
      // Decode the R7 register
      const tokenR7Value = this.decodeR7Register(box.additionalRegisters.R7);
      
      // Compare with the collection identifier
      return tokenR7Value === collectionIdentifier;
    } catch (error) {
      console.error('Error checking if token is part of collection:', error);
      return false;
    }
  }

  // New method to find all tokens in a collection
  static async findTokensInCollection(collectionIdentifier: string, userTokenIds: string[]): Promise<string[]> {
    console.log('Finding tokens in collection with identifier:', collectionIdentifier);
    
    const collectionTokens: string[] = [];
    
    for (const tokenId of userTokenIds) {
      const isInCollection = await this.isPartOfCollection(tokenId, collectionIdentifier);
      if (isInCollection) {
        console.log('Token is part of collection:', tokenId);
        collectionTokens.push(tokenId);
      }
    }
    
    return collectionTokens;
  }

  /**
   * Alternative method to find tokens in a collection using the Collection Token approach
   * where the collection is identified by a parent token ID and NFTs reference it
   */
  static async findTokensInCollectionByTokenId(collectionTokenId: string, userTokenIds: string[]): Promise<string[]> {
    console.log('Finding tokens in collection with token ID:', collectionTokenId);
    
    // This might be the token ID itself
    if (userTokenIds.includes(collectionTokenId)) {
      console.log('Collection token ID found in wallet');
    }
    
    // Find tokens that reference this collection token ID
    const collectionTokens: string[] = [];
    
    for (const tokenId of userTokenIds) {
      try {
        // Skip the collection token itself
        if (tokenId === collectionTokenId) continue;
        
        const box = await this.getTokenBox(tokenId);
        if (!box || !box.additionalRegisters.R7) continue;
        
        const r7Value = this.decodeR7Register(box.additionalRegisters.R7);
        
        // Check if the R7 value matches the collection token ID or references it somehow
        if (r7Value === collectionTokenId) {
          console.log('Found token referencing collection:', tokenId);
          collectionTokens.push(tokenId);
        }
        
        // Also check if R7 points to a token ID (some collections use a different approach)
        try {
          const r7TokenResponse = await axios.get<TokenInfo>(`${EXPLORER_API_URL}/tokens/${r7Value}`);
          if (r7TokenResponse.status === 200 && r7Value === collectionTokenId) {
            console.log('Found token with R7 referencing collection token:', tokenId);
            collectionTokens.push(tokenId);
          }
        } catch (error) {
          // R7 doesn't point to a valid token, which is expected in many cases
        }
      } catch (error) {
        console.error(`Error checking token ${tokenId}:`, error);
      }
    }
    
    return collectionTokens;
  }

  /**
   * Find all tokens in a wallet that belong to the same collection as the specified token
   */
  static async findCollectionByToken(tokenId: string, userTokenIds: string[]): Promise<{collectionId: string, tokens: string[]}> {
    console.log('Finding collection for token:', tokenId);
    
    try {
      // Step 1: Get the mint transaction for the token to extract its R7 value
      const mintTx = await this.getTokenMintTx(tokenId);
      if (!mintTx) {
        throw new Error('Mint transaction not found');
      }
      
      // Step 2: Get collection identifier from the transaction's R7 register
      const collectionIdentifier = await this.getCollectionIdFromTransaction(mintTx);
      if (!collectionIdentifier) {
        throw new Error('No collection identifier found in token');
      }
      
      console.log('Found collection identifier:', collectionIdentifier);
      
      // Step 3: Find all tokens in the wallet with the same R7 value
      const collectionTokens: string[] = [];
      
      // First add the token we looked up
      if (userTokenIds.includes(tokenId)) {
        collectionTokens.push(tokenId);
      }
      
      // Then check other wallet tokens
      for (const id of userTokenIds) {
        // Skip the token we already checked
        if (id === tokenId) continue;
        
        try {
          const box = await this.getTokenBox(id);
          if (!box || !box.additionalRegisters.R7) continue;
          
          const r7Value = this.decodeR7Register(box.additionalRegisters.R7);
          
          // If R7 value matches our collection identifier, this token belongs to the same collection
          if (r7Value === collectionIdentifier) {
            console.log('Found token in same collection:', id);
            collectionTokens.push(id);
          }
        } catch (error) {
          console.error(`Error checking token ${id}:`, error);
        }
      }
      
      return { collectionId: collectionIdentifier, tokens: collectionTokens };
    } catch (error) {
      console.error('Error finding collection by token:', error);
      return { collectionId: '', tokens: [] };
    }
  }

  /**
   * Utility method to decode hex string to readable text
   */
  static decodeHexToString(hex: string | null | undefined): string | null {
    if (!hex) return null;
    
    try {
      // Remove 0e prefix if present (common in Ergo register serialization)
      const cleanHex = hex.startsWith('0e') ? hex.slice(2) : hex;
      
      // Convert hex to string
      let str = '';
      for (let i = 0; i < cleanHex.length; i += 2) {
        const hexByte = cleanHex.substr(i, 2);
        const byte = parseInt(hexByte, 16);
        
        // Only include printable ASCII characters
        if (byte >= 32 && byte <= 126) {
          str += String.fromCharCode(byte);
        }
      }
      
      // If result looks like a URL or readable text, return it
      if (str.match(/^[a-zA-Z0-9\s.,_\-:/?&=@]+$/) && str.length > 3) {
        return str;
      }
      
      return null;
    } catch (error) {
      console.error('Error decoding hex to string:', error);
      return null;
    }
  }
} 