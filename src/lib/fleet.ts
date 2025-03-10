import { FleetTransactionData } from './api';
import { TransactionBuilder, OutputBuilder } from '@fleet-sdk/core';

// Import the existing types from wallet.ts
import { NautilusWallet } from './wallet';

// Extend the existing window interface
declare global {
  interface Window {
    ergo: {
      get_current_height: () => Promise<number>;
      get_utxos: () => Promise<any[]>;
      get_change_address: () => Promise<string>;
      sign_tx: (tx: any) => Promise<any>;
      submit_tx: (tx: any) => Promise<string>;
    } | undefined;
    ergoConnector: {
      nautilus: {
        connect: () => Promise<boolean>;
      };
    } | undefined;
  }
}

export interface AirdropRequest {
  senderAddress: string;
  recipients: Array<{
    address: string;
    tokens: Array<{
      tokenId: string;
      amount: string;
    }>;
  }>;
  memo?: string;
}

export async function buildFleetTransaction(request: AirdropRequest): Promise<any> {
  try {
    // Ensure wallet is connected
    if (!window.ergo) {
      const connected = await window.ergoConnector?.nautilus?.connect();
      if (!connected) {
        throw new Error('Failed to connect to Nautilus wallet');
      }
    }

    // Get current height from Nautilus
    const height = await window.ergo?.get_current_height();
    if (!height) {
      throw new Error('Failed to get current height from Nautilus');
    }

    // Get sender's UTXOs
    const utxos = await window.ergo?.get_utxos();
    if (!utxos || !utxos.length) {
      throw new Error('No UTXOs found for sender address');
    }
    
    // Initialize transaction builder
    const txBuilder = new TransactionBuilder(height)
      .from(utxos)
      .to(request.recipients.map(recipient => 
        new OutputBuilder(
          "1000000", // Minimum ERG amount (0.001 ERG)
          recipient.address
        ).addTokens(
          recipient.tokens.map(token => ({
            tokenId: token.tokenId,
            amount: token.amount
          }))
        )
      ));

    // Add change address
    const changeAddress = await window.ergo?.get_change_address();
    if (!changeAddress) {
      throw new Error('Failed to get change address');
    }
    txBuilder.sendChangeTo(changeAddress);

    // Add minimum fee
    txBuilder.payMinFee();

    // Build the transaction
    const unsignedTx = await txBuilder.build();
    
    // Convert to EIP-12 format
    const eip12Tx = unsignedTx.toEIP12Object();
    console.log('Unsigned transaction:', eip12Tx);
    
    return eip12Tx;
  } catch (error) {
    console.error('Error building Fleet transaction:', error);
    throw error;
  }
}

export async function signAndSubmitTransaction(unsignedTx: any): Promise<string> {
  try {
    if (!window.ergo) {
      throw new Error('Wallet not connected');
    }

    console.log('Signing transaction:', unsignedTx);

    // Sign the transaction using Nautilus
    const signedTx = await window.ergo.sign_tx(unsignedTx);
    if (!signedTx) {
      throw new Error('Failed to sign transaction');
    }

    console.log('Signed transaction:', signedTx);

    // Submit the signed transaction
    const txId = await window.ergo.submit_tx(signedTx);
    if (!txId) {
      throw new Error('Failed to submit transaction');
    }

    console.log('Transaction submitted with ID:', txId);
    return txId;
  } catch (error: any) {
    console.error('Error signing/submitting transaction:', error);
    // Add more detailed error information
    if (error.info) {
      console.error('Error info:', error.info);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
} 