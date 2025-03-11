import { Explorer } from '../explorer';

/**
 * This test file is for validating NFT collection detection
 * with the specific wallet and tokens mentioned.
 */

// The token ID we're testing with
const TEST_TOKEN_ID = '4b0446611cd32c1412d962ba94ce5ef803ad6b3d543f7d5a0880cb63e97a338a';

// The wallet address from the logs
const WALLET_ADDRESS = '9gUDVVx75KyZ783YLECKngb1wy8KVwEfk3byjdfjUyDVAELAPUN';

// Function to test collection detection
async function testCollectionDetection() {
  console.log('Starting collection detection test...');
  console.log('Testing with token ID:', TEST_TOKEN_ID);
  
  try {
    // 1. Get the mint transaction for the token
    console.log('Fetching mint transaction...');
    const mintTx = await Explorer.getTokenMintTx(TEST_TOKEN_ID);
    if (!mintTx) {
      throw new Error('Mint transaction not found');
    }
    console.log('Mint transaction found:', mintTx.id);
    
    // Log all outputs from the transaction to examine their structures
    console.log('Transaction outputs:');
    mintTx.outputs.forEach((output, index) => {
      console.log(`Output ${index}:`, {
        boxId: output.boxId,
        assets: output.assets,
        registers: output.additionalRegisters
      });
    });
    
    // 2. Extract collection identifier from the transaction
    console.log('Extracting collection identifier...');
    const collectionIdentifier = await Explorer.getCollectionIdFromTransaction(mintTx);
    console.log('Collection identifier:', collectionIdentifier);
    
    // 3. Check both approaches
    // Approach 1: Use the token ID itself as the collection ID
    console.log('APPROACH 1: Test using token ID as collection ID');
    
    // For demonstration, we'll simulate having a list of tokens
    // In a real app, you would get these from the wallet
    const userTokens = [
      TEST_TOKEN_ID,
      // Add some test tokens that might be in the same collection
      '43e8803ca559976ad631d69807311f5476daaa1271efcbdfb4695e5ee0d8856e'
    ];
    
    // Find tokens that have this token ID in their R7 register
    console.log('Looking for tokens that reference this token ID in R7...');
    try {
      // This would be equivalent to assuming the token ID itself is the collection ID
      // We can use our Explorer class to attempt this
      const tokenBox = await Explorer.getTokenBox(TEST_TOKEN_ID);
      console.log('Token box data:', tokenBox);
      
      // Log the token's registers to see what they contain
      if (tokenBox) {
        console.log('Token registers:', tokenBox.additionalRegisters);
      }
    } catch (error) {
      console.error('Error in approach 1:', error);
    }
    
    // Approach 2: Use the R7 register value as collection identifier
    // This is what our current implementation does
    console.log('APPROACH 2: Test using R7 value as collection identifier');
    
    if (collectionIdentifier) {
      console.log('Searching for tokens with R7 value:', collectionIdentifier);
      
      // Check our test tokens to see which ones have the same R7 value
      for (const tokenId of userTokens) {
        try {
          const isInCollection = await Explorer.isPartOfCollection(tokenId, collectionIdentifier);
          console.log(`Token ${tokenId} is in collection: ${isInCollection}`);
          
          // If it's in the collection, get its metadata
          if (isInCollection) {
            const box = await Explorer.getTokenBox(tokenId);
            if (box) {
              console.log('Collection token metadata:', {
                id: tokenId,
                name: box.additionalRegisters.R4?.renderedValue,
                description: box.additionalRegisters.R5?.renderedValue,
                r7Value: box.additionalRegisters.R7?.renderedValue
              });
            }
          }
        } catch (error) {
          console.error(`Error checking token ${tokenId}:`, error);
        }
      }
    }
    
    // Print conclusions
    console.log('\n=== TEST CONCLUSIONS ===');
    console.log(`Token ID: ${TEST_TOKEN_ID}`);
    console.log(`R7 Value: ${collectionIdentifier}`);
    console.log('Based on the test results, we should be able to determine which approach is correct');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testCollectionDetection().catch(console.error);

export {}; 