import { Box, ErgoAddress, OutputBuilder, TransactionBuilder } from '@fleet-sdk/core';
import { SByte, SColl } from '@fleet-sdk/serializer';

// Define the Box type with its generic parameters
type ErgoBox = Box<string>;

export interface NautilusWallet {
  connect: () => Promise<boolean>;
  get_used_addresses: () => Promise<string[]>;
  get_change_address: () => Promise<string>;
  get_utxos: () => Promise<Array<any>>;
  get_balance: () => Promise<{
    nanoErgs: string;
    tokens: Array<{
      tokenId: string;
      amount: string;
      name?: string;
      decimals?: number;
    }>;
  }>;
  sign_tx: (tx: any) => Promise<any>;
  submit_tx: (tx: any) => Promise<string>;
  disconnect: () => Promise<void>;
  get_current_height: () => Promise<number>;
}

// Define the window interface augmentation
declare global {
  interface Window {
    ergoConnector?: {
      nautilus?: NautilusWallet;
    };
  }
}

export interface TokenFlightTxData {
  outputs: {
    address: string;
    amount: bigint;
    tokens?: Array<{
      tokenId: string;
      amount: string;
    }>;
  }[];
  fee: string;
  additionalData?: any;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: {
    erg: string;
    tokens: Array<{
      tokenId: string;
      amount: string;
      name?: string;
    }>;
  } | null;
}

export interface WalletApi {
  getUsedAddresses(): Promise<string[]>;
  getChangeAddress(): Promise<string>;
  getBalance(): Promise<any>;
  getContext(): Promise<{ height: number }>;
  signTx(tx: any): Promise<any>;
}

export interface Token {
  tokenId: string;
  amount: bigint;
  name?: string;
  decimals?: number;
}

export interface WalletBalance {
  nanoErgs: bigint;
  tokens: Token[];
}

interface ErgoBalanceResponse {
  nanoErgs: string;
  tokens: Array<{
    tokenId: string;
    amount: string;
    name?: string;
    decimals?: number;
  }>;
}

async function fetchErgoBalance(address: string): Promise<ErgoBalanceResponse> {
  try {
    const response = await fetch(`https://api.ergoplatform.com/api/v1/addresses/${address}/balance/confirmed`);
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    const data = await response.json();
    return {
      nanoErgs: data.nanoErgs,
      tokens: data.tokens || []
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
}

export class WalletService {
  private static instance: WalletService | null = null;
  private wallet: NautilusWallet | null = null;
  private _state: WalletState = {
    connected: false,
    address: null,
    balance: null
  };
  private initializationPromise: Promise<void>;
  private initialized: boolean = false;

  private constructor() {
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Wait for window to be defined (in case of SSR)
      if (typeof window === 'undefined') {
        return;
      }

      // Wait for ergoConnector to be injected
      let retries = 0;
      const maxRetries = 50; // 5 seconds total
      while (!window.ergoConnector && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      // If still not available, log warning but don't throw
      if (!window.ergoConnector) {
        console.warn('Ergo connector not found after waiting. Please ensure Nautilus wallet is installed.');
        return;
      }

      this.initialized = true;
    } catch (error) {
      console.error('Error during wallet initialization:', error);
      this.initialized = false;
    }
  }

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  get state(): WalletState {
    return {
      ...this._state,
      connected: this._state.connected || false,
      address: this._state.address || null,
      balance: this._state.balance || null
    };
  }

  public async connect(): Promise<boolean> {
    try {
      await this.initializationPromise;

      if (!this.initialized) {
        console.warn('Wallet service not properly initialized');
        this._state.connected = false;
        return false;
      }

      if (typeof window === 'undefined' || !window.ergoConnector?.nautilus) {
        throw new Error('Nautilus wallet not found. Please install Nautilus wallet extension.');
      }

      const nautilus = window.ergoConnector.nautilus;
      const connected = await nautilus.connect();
      if (!connected) {
        throw new Error('Failed to connect to Nautilus');
      }

      this.wallet = nautilus;
      this._state.connected = true;

      // Get initial address using the correct method name
      const addresses = await this.wallet.get_used_addresses();
      this._state.address = addresses[0] || null;

      // Get initial balance
      await this.updateBalance();

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      this._state.connected = false;
      this._state.address = null;
      this._state.balance = null;
      return false;
    }
  }

  public async getBalance(): Promise<WalletBalance | null> {
    try {
      await this.initializationPromise;

      if (!this.wallet || !this._state.address) {
        throw new Error('Wallet not connected');
      }

      // Fetch balance from Ergo Platform API
      const balance = await fetchErgoBalance(this._state.address);
      
      return {
        nanoErgs: BigInt(balance.nanoErgs),
        tokens: balance.tokens.map((token) => ({
          tokenId: token.tokenId,
          amount: BigInt(token.amount),
          name: token.name,
          decimals: token.decimals
        }))
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }

  public async buildTransaction(
    recipientAddress: string,
    amount: bigint,
    tokens: Token[],
    feeAddress: string = '9f1aNcJe7eAZCmsV59RWMcPMa1mxSUYHY4eRtLA2fHwD6Wcpu2u'
  ) {
    try {
      await this.initializationPromise;

      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      const changeAddress = await this.wallet.get_change_address();
      const inputs = await this.wallet.get_utxos();
      const height = await this.wallet.get_current_height();
      
      const recipientOutput = new OutputBuilder(amount, recipientAddress);
      const feeOutput = new OutputBuilder(BigInt(5000000000), feeAddress); // 5 ERG fee

      // Add tokens to the recipient output
      if (tokens.length > 0) {
        tokens.forEach(token => {
          recipientOutput.addTokens({
            tokenId: token.tokenId,
            amount: token.amount
          });
        });
      }

      const txBuilder = new TransactionBuilder(height)
        .from(inputs)
        .to([recipientOutput, feeOutput])
        .sendChangeTo(changeAddress)
        .payMinFee();

      const unsignedTx = txBuilder.build();
      return unsignedTx;
    } catch (error) {
      console.error('Error building transaction:', error);
      throw error;
    }
  }

  public async signAndSubmitTx(unsignedTx: any): Promise<string> {
    try {
      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      const signedTx = await this.wallet.sign_tx(unsignedTx);
      const txId = await this.wallet.submit_tx(signedTx);
      return txId;
    } catch (error) {
      console.error('Error signing and submitting transaction:', error);
      throw error;
    }
  }

  private async getInputBoxes(amount: bigint, tokens: Token[]): Promise<ErgoBox[]> {
    try {
      await this.initializationPromise;

      if (!this.wallet) {
        throw new Error('Wallet not connected');
      }

      // Get all available UTXOs from the wallet
      const utxos = await this.wallet.get_utxos();
      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      // Calculate total amount needed (including 5 ERG fee)
      const totalErgsNeeded = amount + BigInt(5000000000); // amount + 5 ERG fee

      // Create a map of required tokens
      const requiredTokens = new Map<string, bigint>();
      tokens.forEach(token => {
        requiredTokens.set(token.tokenId, token.amount);
      });

      // Track selected boxes and accumulated amounts
      const selectedBoxes: ErgoBox[] = [];
      let accumulatedErgs = BigInt(0);
      const accumulatedTokens = new Map<string, bigint>();

      // Sort UTXOs by ERG amount for better box selection
      const sortedUtxos = [...utxos].sort((a, b) => 
        Number(BigInt(b.value) - BigInt(a.value))
      );

      // Select boxes until we have enough ERGs and tokens
      for (const box of sortedUtxos) {
        selectedBoxes.push(box);
        accumulatedErgs += BigInt(box.value);

        // Track tokens in the box
        box.assets?.forEach(asset => {
          const currentAmount = accumulatedTokens.get(asset.tokenId) || BigInt(0);
          accumulatedTokens.set(asset.tokenId, currentAmount + BigInt(asset.amount));
        });

        // Check if we have enough ERGs and tokens
        if (accumulatedErgs >= totalErgsNeeded) {
          let hasEnoughTokens = true;
          for (const [tokenId, requiredAmount] of requiredTokens) {
            const availableAmount = accumulatedTokens.get(tokenId) || BigInt(0);
            if (availableAmount < requiredAmount) {
              hasEnoughTokens = false;
              break;
            }
          }

          if (hasEnoughTokens) {
            return selectedBoxes;
          }
        }
      }

      // If we get here, we don't have enough ERGs or tokens
      const missingErgs = totalErgsNeeded - accumulatedErgs;
      if (missingErgs > 0) {
        throw new Error(`Insufficient ERG balance. Missing ${missingErgs.toString()} nanoERGs`);
      }

      // Check which tokens are missing
      const missingTokens = [];
      for (const [tokenId, requiredAmount] of requiredTokens) {
        const availableAmount = accumulatedTokens.get(tokenId) || BigInt(0);
        if (availableAmount < requiredAmount) {
          missingTokens.push({
            tokenId,
            missing: (requiredAmount - availableAmount).toString()
          });
        }
      }

      throw new Error(`Insufficient token balance. Missing tokens: ${JSON.stringify(missingTokens)}`);
    } catch (error) {
      console.error('Error getting input boxes:', error);
      throw error;
    }
  }

  async updateBalance() {
    try {
      if (!this.initialized || !this.wallet) {
        throw new Error('Wallet not initialized or connected');
      }

      const balance = await this.wallet.get_balance();
      this._state.balance = {
        erg: balance.nanoErgs,
        tokens: balance.tokens.map((token: any) => ({
          tokenId: token.tokenId,
          amount: token.amount,
          name: token.name
        }))
      };
    } catch (error) {
      console.error('Failed to update balance:', error);
      this._state.balance = null;
    }
  }

  async disconnect() {
    try {
      if (this.wallet) {
        await this.wallet.disconnect();
      }
      this._state.connected = false;
      this._state.address = null;
      this._state.balance = null;
      this.wallet = null;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  }
}

// Create and export the singleton instance
export const walletService = WalletService.getInstance(); 