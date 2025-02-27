from sqlalchemy import create_engine, text
from ..database import SQLALCHEMY_DATABASE_URL

def migrate():
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Add last_scraped column
    with engine.connect() as connection:
        try:
            connection.execute(text("ALTER TABLE car_brands ADD COLUMN last_scraped TIMESTAMP;"))
            connection.commit()
            print("Successfully added last_scraped column to car_brands table")
        except Exception as e:
            print(f"Error adding last_scraped column: {e}")
            connection.rollback()

if __name__ == "__main__":
    migrate() 