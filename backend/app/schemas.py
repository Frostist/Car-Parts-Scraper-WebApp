from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class RetailerBase(BaseModel):
    name: str
    website: str

class RetailerCreate(RetailerBase):
    pass

class Retailer(RetailerBase):
    id: int

    class Config:
        from_attributes = True

class CarBrandBase(BaseModel):
    name: str

class CarBrandCreate(CarBrandBase):
    pass

class CarBrand(CarBrandBase):
    id: int

    class Config:
        from_attributes = True

class PartCategoryBase(BaseModel):
    name: str

class PartCategoryCreate(PartCategoryBase):
    pass

class PartCategory(PartCategoryBase):
    id: int

    class Config:
        from_attributes = True

class PartBase(BaseModel):
    name: str
    price: float
    currency: str = "ZAR"
    url: Optional[str] = None

class PartCreate(PartBase):
    retailer_id: int
    brand_id: int
    category_id: int

class Part(PartBase):
    id: int
    last_updated: datetime
    retailer: Retailer
    brand: CarBrand
    category: PartCategory

    class Config:
        from_attributes = True

class PriceStats(BaseModel):
    brand: str
    category: str
    avg_price: float
    min_price: float
    max_price: float
    retailer_count: int

    class Config:
        from_attributes = True

class BrandStats(BaseModel):
    brand_name: str
    average_price: float
    total_parts: int
    price_distribution: List[float]
    
    class Config:
        from_attributes = True 