// Simple test script for collection detection

// Imports would normally be from our Explorer class
import axios from 'axios';

// Constants
const EXPLORER_API_URL = 'https://api.ergoplatform.com/api/v1';
const TEST_TOKEN_ID = '4b0446611cd32c1412d962ba94ce5ef803ad6b3d543f7d5a0880cb63e97a338a';
const SAMPLE_WALLET_TOKENS = [
  '4b0446611cd32c1412d962ba94ce5ef803ad6b3d543f7d5a0880cb63e97a338a',
  '43e8803ca559976ad631d69807311f5476daaa1271efcbdfb4695e5ee0d8856e'
];

// Simplified decoder function
function decodeR7Register(r7Value) {
  if (!r7Value) return null;
  console.log('Decoding R7 register value:', r7Value);
  
  try {
    if (typeof r7Value === 'string') {
      return r7Value.startsWith('0e') ? r7Value.slice(2) : r7Value;
    }

    // For object values, check the sigma type
    switch (r7Value.sigmaType) {
      case 'Coll[Byte]':
      case 'Coll[SByte]':
        return r7Value.renderedValue || 
              (r7Value.serializedValue.startsWith('0e') ? 
               r7Value.serializedValue.slice(2) : 
               r7Value.serializedValue);
      case 'SLong':
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

// Test functions
async function getTokenBox(tokenId) {
  try {
    console.log('Fetching token box for token ID:', tokenId);
    const tokenResponse = await axios.get(`${EXPLORER_API_URL}/tokens/${tokenId}`);
    const boxId = tokenResponse.data.boxId;
    
    console.log('Found box ID:', boxId);
    
    if (!boxId) {
      throw new Error('Token box not found');
    }

    const boxResponse = await axios.get(`${EXPLORER_API_URL}/boxes/${boxId}`);
    console.log('Retrieved box data with registers:', {
      boxId: boxResponse.data.boxId,
      r7: boxResponse.data.additionalRegisters.R7
    });
    return boxResponse.data;
  } catch (error) {
    console.error('Error fetching token box:', error);
    return null;
  }
}

async function getTokenMintTx(tokenId) {
  try {
    console.log('Fetching mint transaction for token:', tokenId);
    const tokenResponse = await axios.get(`${EXPLORER_API_URL}/tokens/${tokenId}`);
    
    if (!tokenResponse.data) {
      throw new Error('Token information not found');
    }

    const boxId = tokenResponse.data.boxId;
    console.log('Found box ID:', boxId);
    
    if (!boxId) {
      throw new Error('Token minting box not found');
    }

    const boxResponse = await axios.get(`${EXPLORER_API_URL}/boxes/${boxId}`);
    
    if (!boxResponse.data) {
      throw new Error('Box data not found');
    }

    const txId = boxResponse.data.transactionId;
    console.log('Found transaction ID:', txId);

    if (!txId) {
      throw new Error('Minting transaction not found');
    }

    const txResponse = await axios.get(`${EXPLORER_API_URL}/transactions/${txId}`);
    
    if (!txResponse.data) {
      throw new Error('Transaction data not found');
    }

    return txResponse.data;
  } catch (error) {
    console.error('Error fetching mint transaction:', error);
    throw new Error('Failed to fetch token information');
  }
}

async function runCollectionTest() {
  console.log('=== COLLECTION DETECTION TEST ===');
  console.log('Testing token ID:', TEST_TOKEN_ID);
  console.log('Wallet tokens to check:', SAMPLE_WALLET_TOKENS);
  
  try {
    // Get the mint transaction
    const mintTx = await getTokenMintTx(TEST_TOKEN_ID);
    console.log('Mint transaction ID:', mintTx.id);
    
    // Extract R7 from first output (if present)
    let collectionIdentifier = null;
    
    // Look for NFT outputs in transaction
    for (const output of mintTx.outputs) {
      const nftAsset = output.assets?.find(asset => asset.amount === 1);
      if (nftAsset) {
        console.log('Found NFT output:', output.boxId);
        
        if (output.additionalRegisters?.R7) {
          const r7Value = decodeR7Register(output.additionalRegisters.R7);
          console.log('Decoded R7 value:', r7Value);
          collectionIdentifier = r7Value;
        }
      }
    }
    
    console.log('Collection identifier from transaction:', collectionIdentifier);
    
    // Now let's check boxes for our sample wallet tokens
    console.log('\n=== CHECKING WALLET TOKENS ===');
    
    for (const tokenId of SAMPLE_WALLET_TOKENS) {
      console.log(`\nChecking token: ${tokenId}`);
      const box = await getTokenBox(tokenId);
      
      if (!box) {
        console.log('Box not found for token');
        continue;
      }
      
      // Check if R7 matches our collection identifier
      const r7Value = box.additionalRegisters.R7 ? 
                      decodeR7Register(box.additionalRegisters.R7) : 
                      null;
                      
      console.log('Token R7 value:', r7Value);
      
      if (r7Value === collectionIdentifier) {
        console.log('✅ This token is part of the same collection!');
      } else {
        console.log('❌ Token is not part of the collection');
      }
      
      // For testing the alternate approach - if this token's ID is used as R7 in other tokens
      if (tokenId === TEST_TOKEN_ID) {
        console.log('\nChecking if other tokens reference this token ID:', tokenId);
        
        for (const otherTokenId of SAMPLE_WALLET_TOKENS) {
          if (otherTokenId === tokenId) continue;
          
          const otherBox = await getTokenBox(otherTokenId);
          if (!otherBox) continue;
          
          const otherR7 = otherBox.additionalRegisters.R7 ? 
                          decodeR7Register(otherBox.additionalRegisters.R7) : 
                          null;
          
          if (otherR7 === tokenId) {
            console.log(`Token ${otherTokenId} references our test token!`);
          }
        }
      }
    }
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Token ID:', TEST_TOKEN_ID);
    console.log('Collection identifier (R7 value):', collectionIdentifier);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runCollectionTest().catch(console.error); 