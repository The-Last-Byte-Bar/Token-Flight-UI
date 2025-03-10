interface TokenMetadata {
  tokenId: string;
  name: string;
  decimals: number;
  description?: string;
  iconUrl?: string;
}

class TokenMetadataCache {
  private static instance: TokenMetadataCache;
  private cache: Map<string, TokenMetadata> = new Map();
  private fetchPromises: Map<string, Promise<TokenMetadata>> = new Map();

  private constructor() {
    // Load cached metadata from localStorage
    const savedMetadata = localStorage.getItem('tokenMetadata');
    if (savedMetadata) {
      const parsed = JSON.parse(savedMetadata);
      this.cache = new Map(Object.entries(parsed));
    }
  }

  public static getInstance(): TokenMetadataCache {
    if (!TokenMetadataCache.instance) {
      TokenMetadataCache.instance = new TokenMetadataCache();
    }
    return TokenMetadataCache.instance;
  }

  public async getTokenMetadata(tokenId: string): Promise<TokenMetadata | null> {
    // Check cache first
    const cached = this.cache.get(tokenId);
    if (cached) return cached;

    // Check if we're already fetching this token
    let fetchPromise = this.fetchPromises.get(tokenId);
    if (fetchPromise) return fetchPromise;

    // Fetch new metadata
    fetchPromise = this.fetchTokenMetadata(tokenId);
    this.fetchPromises.set(tokenId, fetchPromise);

    try {
      const metadata = await fetchPromise;
      this.cache.set(tokenId, metadata);
      this.saveToLocalStorage();
      return metadata;
    } catch (error) {
      console.error(`Error fetching metadata for token ${tokenId}:`, error);
      return null;
    } finally {
      this.fetchPromises.delete(tokenId);
    }
  }

  private async fetchTokenMetadata(tokenId: string): Promise<TokenMetadata> {
    try {
      const response = await fetch(`https://api.ergoplatform.com/api/v1/tokens/${tokenId}`);
      const data = await response.json();

      return {
        tokenId,
        name: data.name || tokenId.slice(0, 8),
        decimals: data.decimals || 0,
        description: data.description,
        iconUrl: data.iconUrl
      };
    } catch (error) {
      console.error(`Failed to fetch metadata for token ${tokenId}:`, error);
      return {
        tokenId,
        name: tokenId.slice(0, 8),
        decimals: 0
      };
    }
  }

  private saveToLocalStorage() {
    const obj = Object.fromEntries(this.cache);
    localStorage.setItem('tokenMetadata', JSON.stringify(obj));
  }
}

export const tokenMetadataCache = TokenMetadataCache.getInstance(); 