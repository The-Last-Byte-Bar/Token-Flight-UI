const API_URL = import.meta.env.VITE_TOKEN_FLIGHT_API_URL || 'http://localhost:8000';

export interface Recipient {
  address: string;
  amount: bigint;
  tokens?: Array<{
    tokenId: string;
    amount: string;
  }>;
}

export interface TransactionRequest {
  sender: string;
  recipients: Recipient[];
  fee: string;
  data?: Record<string, any>;
}

export interface FleetTransactionData {
  outputs: {
    address: string;
    amount: bigint;
    tokens?: Array<{
      tokenId: string;
      amount: string;
    }>;
  }[];
  fee: string;
  additionalData?: Record<string, any>;
}

export async function buildTransaction(request: TransactionRequest): Promise<FleetTransactionData> {
  const response = await fetch(`${API_URL}/api/transaction/build`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...request,
      recipients: request.recipients.map(r => ({
        ...r,
        amount: r.amount.toString(),
      })),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to build transaction');
  }

  const data = await response.json();
  
  // Convert amounts to BigInt
  return {
    ...data,
    outputs: data.outputs.map((output: any) => ({
      ...output,
      amount: BigInt(output.amount),
    })),
  };
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/api/health`);
  
  if (!response.ok) {
    throw new Error('Service is not healthy');
  }
  
  return response.json();
} 