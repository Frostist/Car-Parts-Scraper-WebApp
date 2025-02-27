import aiohttp
import asyncio
from bs4 import BeautifulSoup
import json
from pathlib import Path
import logging
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from . import models, schemas
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AutoPartsScraper:
    RETAILERS = {
        "onlinecarparts": {
            "name": "Online Car Parts",
            "base_url": "https://onlinecarparts.co.za",
            "search_url": "https://onlinecarparts.co.za/search?controller=search&s={brand}+{part}"
        },
        "africaboyz": {
            "name": "AfricaBoyz Online",
            "base_url": "https://africaboyzonline.com",
            "search_url": "https://africaboyzonline.com/search?q={brand}+{part}"
        }
    }

    COMMON_PARTS = [
        "oil filter", "air filter", "brake pads", "spark plugs",
        "fuel filter", "timing belt", "water pump", "radiator",
        "clutch kit", "shock absorber", "wheel bearing"
    ]

    def __init__(self, session: Session):
        self.session = session
        self.http_session = None
        self.should_stop = False

    async def init_http_session(self):
        if not self.http_session:
            self.http_session = aiohttp.ClientSession(
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
                }
            )

    async def close_http_session(self):
        if self.http_session:
            await self.http_session.close()
            self.http_session = None

    async def fetch_page(self, url: str) -> str:
        try:
            async with self.http_session.get(url) as response:
                return await response.text()
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return ""

    def parse_price(self, price_text: str) -> float:
        """Extract and convert price string to float."""
        try:
            # Remove currency symbol, spaces, and commas
            clean_price = re.sub(r'[R\s,]', '', price_text)
            return float(clean_price)
        except (ValueError, TypeError):
            return 0.0

    async def scrape_onlinecarparts(self, brand: str, part: str) -> List[Dict[str, Any]]:
        """Scrape data from OnlineCarParts.co.za"""
        retailer = self.RETAILERS["onlinecarparts"]
        search_url = retailer["search_url"].format(brand=brand, part=part)
        html = await self.fetch_page(search_url)
        
        if not html:
            return []

        results = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # OnlineCarParts specific parsing
        for product in soup.select('article.product-miniature'):
            try:
                # Get product name from h3.product-title > a
                name_elem = product.select_one('h3.product-title a')
                # Get price from span.price
                price_elem = product.select_one('span.price')
                # Get reference number
                ref_elem = product.select_one('p.pl_reference span strong')
                # Get brand
                brand_elem = product.select_one('p.pl_manufacturer a strong')
                # Get availability
                availability_elem = product.select_one('span.pl-availability')
                # Get product URL
                url = name_elem.get('href', '') if name_elem else ''
                
                if name_elem and price_elem:
                    name = name_elem.text.strip()
                    price = self.parse_price(price_elem.text)
                    reference = ref_elem.text.strip() if ref_elem else ''
                    brand = brand_elem.text.strip() if brand_elem else ''
                    availability = availability_elem.text.strip() if availability_elem else ''
                    
                    if price > 0:
                        results.append({
                            'name': name,
                            'price': price,
                            'url': url,
                            'retailer': retailer['name'],
                            'reference': reference,
                            'brand': brand,
                            'availability': availability
                        })
            except Exception as e:
                logger.error(f"Error parsing OnlineCarParts product: {e}")
                continue
                
        return results

    async def scrape_africaboyz(self, brand: str, part: str) -> List[Dict[str, Any]]:
        """Scrape data from AfricaBoyzOnline.com"""
        retailer = self.RETAILERS["africaboyz"]
        search_url = retailer["search_url"].format(brand=brand, part=part)
        html = await self.fetch_page(search_url)
        
        if not html:
            return []

        results = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # AfricaBoyz specific parsing - updating selectors to match their HTML structure
        for product in soup.select('.products-list .product-layout'):  # Main product grid container
            try:
                name_elem = product.select_one('h4.giveMeEllipsis a')  # Product title with link
                price_elem = product.select_one('.price .price-new')  # Price container
                url_elem = name_elem if name_elem else None
                
                if name_elem and price_elem and url_elem:
                    name = name_elem.text.strip()
                    price = self.parse_price(price_elem.text)
                    url = url_elem.get('href', '')
                    if not url.startswith('http'):
                        url = f"{retailer['base_url']}{url}"
                    
                    if price > 0:
                        results.append({
                            'name': name,
                            'price': price,
                            'url': url,
                            'retailer': retailer['name']
                        })
            except Exception as e:
                logger.error(f"Error parsing AfricaBoyz product: {e}")
                continue
                
        return results

    async def update_prices(self):
        """Updates prices for all brands and common parts."""
        await self.init_http_session()
        
        try:
            brands = self.session.query(models.CarBrand).all()
            
            for brand in brands:
                if self.should_stop:
                    logger.info("Stopping price updates as requested")
                    break
                    
                for part_name in self.COMMON_PARTS:
                    if self.should_stop:
                        break
                    
                    logger.info(f"Scraping prices for {brand.name} {part_name}")
                    
                    # Scrape from all retailers
                    results = []
                    results.extend(await self.scrape_onlinecarparts(brand.name, part_name))
                    await asyncio.sleep(2)  # Delay between retailers
                    results.extend(await self.scrape_africaboyz(brand.name, part_name))
                    
                    for result in results:
                        # Get or create retailer
                        retailer = self.session.query(models.Retailer).filter_by(
                            name=result['retailer']
                        ).first()
                        
                        if not retailer:
                            retailer = models.Retailer(
                                name=result['retailer'],
                                website=self.RETAILERS["onlinecarparts"]["base_url"] 
                                if result['retailer'] == "Online Car Parts" 
                                else self.RETAILERS["africaboyz"]["base_url"]
                            )
                            self.session.add(retailer)
                            self.session.commit()
                        
                        # Get or create part category
                        category = self.session.query(models.PartCategory).filter_by(
                            name=part_name
                        ).first()
                        
                        if not category:
                            category = models.PartCategory(name=part_name)
                            self.session.add(category)
                            self.session.commit()
                        
                        # Create or update part
                        existing_part = self.session.query(models.Part).filter_by(
                            name=result['name'],
                            retailer_id=retailer.id,
                            brand_id=brand.id,
                            category_id=category.id
                        ).first()

                        if existing_part:
                            old_price = existing_part.price
                            existing_part.price = result['price']
                            existing_part.last_updated = datetime.utcnow()
                            logger.info(f"Updated price for {result['name']} from {old_price} to {result['price']}")
                        else:
                            part = models.Part(
                                name=result['name'],
                                price=result['price'],
                                url=result['url'],
                                retailer_id=retailer.id,
                                brand_id=brand.id,
                                category_id=category.id,
                                last_updated=datetime.utcnow()
                            )
                            self.session.add(part)
                    
                    self.session.commit()
                    await asyncio.sleep(2)  # Delay between searches
                    
        finally:
            await self.close_http_session()

    def stop(self):
        self.should_stop = True

async def start_price_updates(db: Session):
    """Starts the periodic price update process."""
    scraper = AutoPartsScraper(db)
    while True:
        if scraper.should_stop:
            logger.info("Scraper stopped")
            break
            
        try:
            await scraper.update_prices()
        except Exception as e:
            logger.error(f"Error updating prices: {e}")
        
        if scraper.should_stop:
            break
            
        # Wait for 6 hours before next update
        await asyncio.sleep(6 * 60 * 60)
    
    return scraper

async def scrape_parts_prices():
    """
    Scrapes car parts prices from various South African auto parts websites.
    Currently using a simplified approach with sample data.
    """
    # In a real implementation, we would scrape from actual websites
    # For now, we'll use sample data
    sample_data = {}
    
    # Get brands from database instead of hardcoded list
    brands = session.query(models.CarBrand).all()
    for brand in brands:
        # Simulate average prices for common parts
        sample_data[brand.name] = {
            "average_price": round(float(hash(brand.name) % 10000) / 100, 2)  # Generate pseudo-random prices
        }
    
    # Save the data
    data_file = Path("data/car_parts_prices.json")
    with open(data_file, "w") as f:
        json.dump(sample_data, f, indent=2)
    
    return sample_data

async def update_prices():
    """
    Updates the prices database periodically.
    """
    while True:
        logger.info("Updating car parts prices...")
        await scrape_parts_prices()
        # Wait for 6 hours before the next update
        await asyncio.sleep(6 * 60 * 60)

if __name__ == "__main__":
    asyncio.run(scrape_parts_prices()) 