from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Order:
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float]
    timestamp: datetime
    status: str
    order_id: Optional[str] = None 