from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Retailer(Base):
    __tablename__ = "retailers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    website = Column(String, unique=True)
    parts = relationship("Part", back_populates="retailer")

class CarBrand(Base):
    __tablename__ = "car_brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    last_scraped = Column(DateTime, nullable=True)
    parts = relationship("Part", back_populates="brand", cascade="all, delete-orphan")

class PartCategory(Base):
    __tablename__ = "part_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    parts = relationship("Part", back_populates="category")

class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price = Column(Float)
    currency = Column(String, default="ZAR")
    last_updated = Column(DateTime, default=datetime.utcnow)
    url = Column(String)
    
    retailer_id = Column(Integer, ForeignKey("retailers.id"))
    brand_id = Column(Integer, ForeignKey("car_brands.id"))
    category_id = Column(Integer, ForeignKey("part_categories.id"))

    retailer = relationship("Retailer", back_populates="parts")
    brand = relationship("CarBrand", back_populates="parts")
    category = relationship("PartCategory", back_populates="parts") 