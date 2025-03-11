import { jest } from '@jest/globals';
import axios, { AxiosResponse } from 'axios';
import { Explorer, TokenInfo, TokenBox } from '../explorer';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Explorer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockResponse = <T>(data: T): AxiosResponse<T> => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any
  });

  describe('getCollectionNFTs', () => {
    it('should fetch and process NFTs from a collection', async () => {
      const collectionId = 'test-collection-id';

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: collectionId,
        boxId: 'box-id-1',
        emissionAmount: 100,
        name: 'Test Collection',
        description: 'Test Description',
        type: 'NFT',
        decimals: 0
      }));

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        items: [
          {
            boxId: 'box-id-2',
            transactionId: 'tx-id-1',
            value: 1000000,
            assets: [
              {
                tokenId: 'token-id-1',
                amount: 1,
                name: 'NFT #1',
                decimals: 0,
                type: 'NFT'
              }
            ],
            additionalRegisters: {
              R7: {
                serializedValue: '0e0123',
                sigmaType: 'Coll[Byte]',
                renderedValue: 'test-metadata'
              }
            }
          }
        ],
        total: 1
      }));

      // Mock the token info response for the NFT
      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: 'token-id-1',
        boxId: 'box-id-2',
        emissionAmount: 1,
        name: 'NFT #1',
        description: 'Test NFT',
        type: 'EIP-004',
        decimals: 0
      }));

      const result = await Explorer.getCollectionNFTs(collectionId);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('token-id-1');
      expect(result[0].name).toBe('NFT #1');
    });

    it('should handle collection not found', async () => {
      const collectionId = 'non-existent-collection';

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: collectionId,
        boxId: 'box-id-3',
        emissionAmount: 0,
        name: 'Not Found',
        description: '',
        type: 'NFT',
        decimals: 0
      }));

      // Mock empty boxes search response
      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        items: [],
        total: 0
      }));

      const result = await Explorer.getCollectionNFTs(collectionId);
      expect(result).toHaveLength(0);
    });
  });

  describe('getTokenMintTx', () => {
    it('should fetch token mint transaction', async () => {
      const tokenId = 'test-token-id';

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: tokenId,
        boxId: 'box-id-4'
      }));

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        boxId: 'box-id-4',
        transactionId: 'tx-id-2'
      }));

      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: 'tx-id-2',
        inputs: [
          {
            id: 'input-id-1',
            additionalRegisters: {
              R7: '0e0123'
            }
          }
        ],
        outputs: [
          {
            id: 'output-id-1',
            assets: [
              {
                tokenId: tokenId,
                amount: 1
              }
            ]
          }
        ]
      }));

      const result = await Explorer.getTokenMintTx(tokenId);
      expect(result).toBeDefined();
      expect(result?.id).toBe('tx-id-2');
    });
  });

  describe('decodeR7Register', () => {
    it('should decode string R7 register value', () => {
      const encodedValue = '0e0123';
      const result = Explorer.decodeR7Register(encodedValue);
      expect(result).toBe('0123');
    });

    it('should decode Coll[Byte] register value', () => {
      const encodedValue = {
        serializedValue: '0e0123',
        sigmaType: 'Coll[Byte]',
        renderedValue: 'test-metadata'
      };
      const result = Explorer.decodeR7Register(encodedValue);
      expect(result).toBe('0123');
    });

    it('should handle SLong register value', () => {
      const encodedValue = {
        serializedValue: '0501',
        sigmaType: 'SLong',
        renderedValue: '-1'
      };
      const result = Explorer.decodeR7Register(encodedValue);
      expect(result).toBeNull();
    });

    it('should handle unknown sigma type', () => {
      const encodedValue = {
        serializedValue: '0123',
        sigmaType: 'Unknown',
        renderedValue: null
      };
      const result = Explorer.decodeR7Register(encodedValue);
      expect(result).toBeNull();
    });

    it('should handle string value without prefix', () => {
      const encodedValue = '0123';
      const result = Explorer.decodeR7Register(encodedValue);
      expect(result).toBe('0123');
    });
  });

  describe('getCollectionIdFromTransaction', () => {
    it('should find collection ID in direct output registers', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [{ id: 'input-id-1', additionalRegisters: {} }],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ],
            additionalRegisters: {
              R4: {
                serializedValue: '0e0123',
                sigmaType: 'Coll[Byte]',
                renderedValue: 'collection-id'
              }
            }
          }
        ]
      };

      // Mock token verification response for collection ID
      mockedAxios.get.mockResolvedValueOnce(createMockResponse<TokenInfo>({
        id: '0123',
        boxId: 'collection-box-id',
        name: 'Test Collection',
        type: 'NFT',
        emissionAmount: 1,
        decimals: 0,
        description: ''
      }));

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBe('0123');
    });

    it('should find collection ID in fetched box registers', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [{ id: 'input-id-1', additionalRegisters: {} }],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ]
          }
        ]
      };

      // Mock box response with collection ID in R4
      mockedAxios.get.mockResolvedValueOnce(createMockResponse<TokenBox>({
        boxId: 'output-id-1',
        transactionId: 'test-tx-id',
        value: 1000000,
        assets: [],
        additionalRegisters: {
          R4: {
            serializedValue: '0e0123',
            sigmaType: 'Coll[Byte]',
            renderedValue: 'collection-id'
          }
        }
      }));

      // Mock token verification response
      mockedAxios.get.mockResolvedValueOnce(createMockResponse<TokenInfo>({
        id: '0123',
        boxId: 'collection-box-id',
        name: 'Test Collection',
        type: 'NFT',
        emissionAmount: 1,
        decimals: 0,
        description: ''
      }));

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBe('0123');
    });

    it('should return null when no valid collection ID is found', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ],
            additionalRegisters: {
              R4: {
                serializedValue: '0501',
                sigmaType: 'SLong',
                renderedValue: '-1'
              }
            }
          }
        ]
      };

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBeNull();
    });

    it('should handle box fetch errors gracefully', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ]
          }
        ]
      };

      // Mock box fetch error
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch box'));

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBeNull();
    });

    it('should find collection ID in input box registers', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [
          {
            id: 'input-box-id-1',
            additionalRegisters: {}
          }
        ],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ]
          }
        ]
      };

      // Mock input box response with collection ID in R5
      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        boxId: 'input-box-id-1',
        transactionId: 'test-tx-id',
        additionalRegisters: {
          R5: {
            serializedValue: '0e0123',
            sigmaType: 'Coll[Byte]',
            renderedValue: 'collection-id'
          }
        }
      }));

      // Mock token verification response
      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: '0123',
        boxId: 'collection-box-id',
        name: 'Test Collection',
        type: 'NFT'
      }));

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBe('0123');
    });

    it('should verify token type when validating collection ID', async () => {
      const transaction = {
        id: 'test-tx-id',
        inputs: [],
        outputs: [
          {
            boxId: 'output-id-1',
            assets: [
              {
                tokenId: 'nft-token-id',
                amount: 1
              }
            ],
            additionalRegisters: {
              R4: {
                serializedValue: '0e0123',
                sigmaType: 'Coll[Byte]',
                renderedValue: 'not-a-collection'
              }
            }
          }
        ]
      };

      // Mock token verification response with non-NFT type
      mockedAxios.get.mockResolvedValueOnce(createMockResponse({
        id: '0123',
        boxId: 'token-box-id',
        name: 'Not a Collection',
        type: 'Token'  // Not an NFT type
      }));

      const result = await Explorer.getCollectionIdFromTransaction(transaction);
      expect(result).toBeNull();
    });
  });
}); 