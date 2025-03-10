"""
Transaction generator module for creating unsigned Ergo transactions.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

def generate_unsigned_transaction(
    sender: str,
    recipients: List[Dict[str, Any]],
    fee: str,
    nonce: int = 1,
    timestamp: Optional[int] = None,
    extra_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate an unsigned transaction for the Ergo blockchain.
    
    Args:
        sender: The sender's address
        recipients: List of recipient objects with address, amount, and optional tokens
        fee: Transaction fee
        nonce: Transaction nonce (default: 1)
        timestamp: Optional timestamp (default: current time)
        extra_data: Optional additional transaction data
        
    Returns:
        Dict containing the transaction data
    """
    if timestamp is None:
        timestamp = int(datetime.now().timestamp() * 1000)
        
    return {
        "sender": sender,
        "recipients": recipients,
        "fee": fee,
        "nonce": nonce,
        "timestamp": timestamp,
        "data": extra_data or {}
    } 