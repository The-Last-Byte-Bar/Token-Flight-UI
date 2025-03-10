from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from token_flight.transaction_generator import generate_unsigned_transaction

app = FastAPI(title="Token Flight API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Recipient(BaseModel):
    address: str
    amount: int
    tokens: Optional[List[Dict[str, str]]] = None

class TransactionRequest(BaseModel):
    sender: str
    recipients: List[Recipient]
    fee: str
    data: Optional[Dict[str, Any]] = None

@app.post("/api/transaction/build")
async def build_transaction(request: TransactionRequest):
    try:
        # Convert request to Token Flight format
        tx_data = generate_unsigned_transaction(
            sender=request.sender,
            recipients=[{
                "address": r.address,
                "amount": r.amount,
                "tokens": r.tokens
            } for r in request.recipients],
            fee=request.fee,
            nonce=1,  # You might want to generate this dynamically
            timestamp=None,  # Will be set by Token Flight
            extra_data=request.data
        )
        
        # Convert to FleetSDK format
        fleet_format = {
            "outputs": [
                {
                    "address": recipient["address"],
                    "amount": recipient["amount"],
                    "tokens": recipient.get("tokens", [])
                }
                for recipient in tx_data["recipients"]
            ],
            "fee": tx_data["fee"],
            "additionalData": tx_data["data"]
        }
        
        return fleet_format
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"} 