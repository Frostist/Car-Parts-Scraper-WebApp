from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import asyncio
import logging
from . import models, schemas, database, scraper
from .database import engine, get_db

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Car Parts Price Tracker")

# Store the scraper instance and task
scraper_instance = None
scraper_task = None

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    global scraper_instance, scraper_task
    # Start the price update task in the background
    db = next(get_db())
    scraper_instance = scraper.AutoPartsScraper(db)
    scraper_task = asyncio.create_task(scraper.start_price_updates(db))

@app.post("/scraper/stop")
async def stop_scraper():
    global scraper_instance, scraper_task
    if scraper_instance and scraper_task:
        scraper_instance.stop()
        try:
            # Wait for a short time for the task to clean up
            await asyncio.wait_for(scraper_task, timeout=5.0)
        except asyncio.TimeoutError:
            # If it doesn't finish in time, cancel it
            scraper_task.cancel()
            try:
                await scraper_task
            except asyncio.CancelledError:
                pass
        scraper_task = None
        return {"message": "Scraper stopped"}
    return {"message": "No scraper running"}

@app.post("/scraper/start")
async def start_scraper(db: Session = Depends(get_db)):
    global scraper_instance, scraper_task
    if scraper_task and not scraper_task.done():
        return {"message": "Scraper already running"}
    
    scraper_instance = scraper.AutoPartsScraper(db)
    scraper_task = asyncio.create_task(scraper.start_price_updates(db))
    return {"message": "Scraper started"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to Car Parts Price Tracker API"}

@app.get("/brands", response_model=List[schemas.CarBrand])
def get_brands(db: Session = Depends(get_db)):
    return db.query(models.CarBrand).all()

@app.post("/brands", response_model=schemas.CarBrand)
def create_brand(brand: schemas.CarBrandCreate, db: Session = Depends(get_db)):
    existing_brand = db.query(models.CarBrand).filter_by(name=brand.name).first()
    if existing_brand:
        raise HTTPException(status_code=400, detail="Brand already exists")
    
    db_brand = models.CarBrand(name=brand.name)
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand

@app.delete("/brands/{brand_name}")
def delete_brand(brand_name: str, db: Session = Depends(get_db)):
    brand = db.query(models.CarBrand).filter_by(name=brand_name).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    db.delete(brand)
    db.commit()
    return {"message": f"Brand {brand_name} deleted successfully"}

@app.get("/categories", response_model=List[schemas.PartCategory])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.PartCategory).all()

@app.get("/retailers", response_model=List[schemas.Retailer])
def get_retailers(db: Session = Depends(get_db)):
    return db.query(models.Retailer).all()

@app.get("/parts", response_model=List[schemas.Part])
def get_parts(
    brand: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        # Start with a query that includes all necessary joins
        query = db.query(models.Part).join(
            models.CarBrand,
            models.Part.brand_id == models.CarBrand.id
        ).join(
            models.PartCategory,
            models.Part.category_id == models.PartCategory.id
        ).join(
            models.Retailer,
            models.Part.retailer_id == models.Retailer.id
        )
        
        if brand:
            query = query.filter(models.CarBrand.name == brand)
        if category:
            query = query.filter(models.PartCategory.name == category)
        
        return query.all()
    except Exception as e:
        logger.error(f"Error in get_parts endpoint: {str(e)}")
        # Clean up any orphaned parts
        orphaned_parts = db.query(models.Part).filter(
            ~models.Part.brand_id.in_(
                db.query(models.CarBrand.id)
            )
        ).all()
        if orphaned_parts:
            for part in orphaned_parts:
                db.delete(part)
            db.commit()
            logger.info(f"Cleaned up {len(orphaned_parts)} orphaned parts")
        
        # Try the query again after cleanup
        query = db.query(models.Part).join(
            models.CarBrand,
            models.Part.brand_id == models.CarBrand.id
        ).join(
            models.PartCategory,
            models.Part.category_id == models.PartCategory.id
        ).join(
            models.Retailer,
            models.Part.retailer_id == models.Retailer.id
        )
        
        if brand:
            query = query.filter(models.CarBrand.name == brand)
        if category:
            query = query.filter(models.PartCategory.name == category)
        
        return query.all()

@app.get("/price-stats", response_model=List[schemas.PriceStats])
def get_price_stats(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(
            models.CarBrand.name.label('brand'),
            models.PartCategory.name.label('category'),
            func.round(func.avg(models.Part.price), 2).label('avg_price'),
            func.min(models.Part.price).label('min_price'),
            func.max(models.Part.price).label('max_price'),
            func.count(models.Retailer.id.distinct()).label('retailer_count')
        ).select_from(
            models.CarBrand
        ).join(
            models.Part, models.Part.brand_id == models.CarBrand.id
        ).join(
            models.PartCategory, models.Part.category_id == models.PartCategory.id
        ).join(
            models.Retailer, models.Part.retailer_id == models.Retailer.id
        ).group_by(
            models.CarBrand.name,
            models.PartCategory.name
        )

        if category:
            query = query.filter(models.PartCategory.name == category)

        results = query.all()
        return [schemas.PriceStats(
            brand=row.brand,
            category=row.category,
            avg_price=float(row.avg_price),
            min_price=float(row.min_price),
            max_price=float(row.max_price),
            retailer_count=row.retailer_count
        ) for row in results]
    except Exception as e:
        print(f"Error in price-stats endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/brand-stats", response_model=List[schemas.BrandStats])
def get_brand_stats(db: Session = Depends(get_db)):
    try:
        # First get the basic stats
        stats_query = db.query(
            models.CarBrand.name.label('brand_name'),
            func.round(func.avg(models.Part.price), 2).label('average_price'),
            func.count(models.Part.id).label('total_parts')
        ).join(
            models.Part, models.Part.brand_id == models.CarBrand.id
        ).group_by(
            models.CarBrand.name
        ).order_by(
            func.avg(models.Part.price).desc()
        )

        results = stats_query.all()
        
        # Then get price distributions separately
        final_results = []
        for row in results:
            # Get all prices for this brand
            prices = db.query(models.Part.price).join(
                models.CarBrand,
                models.Part.brand_id == models.CarBrand.id
            ).filter(
                models.CarBrand.name == row.brand_name
            ).all()
            
            price_list = [p[0] for p in prices]  # Extract prices from result tuples
            
            final_results.append(schemas.BrandStats(
                brand_name=row.brand_name,
                average_price=float(row.average_price),
                total_parts=row.total_parts,
                price_distribution=price_list
            ))
        
        return final_results
    except Exception as e:
        logger.error(f"Error in brand-stats endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize some sample data
def init_sample_data(db: Session):
    # Add car brands
    brands = [
        "Toyota", "Volkswagen", "Ford", "Hyundai", "Nissan",
        "BMW", "Mercedes", "Audi", "Honda", "Mazda"
    ]
    
    for brand_name in brands:
        if not db.query(models.CarBrand).filter_by(name=brand_name).first():
            brand = models.CarBrand(name=brand_name)
            db.add(brand)
    
    db.commit()

# Initialize sample data on startup
@app.on_event("startup")
def init_db():
    db = next(get_db())
    init_sample_data(db)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 