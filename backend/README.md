# Car Parts Price Tracker

This application tracks average spare parts prices for different car brands in South Africa.

## Setup Instructions

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000

## Features

- Web scraping of South African auto parts websites
- Database storage of parts prices
- REST API endpoints for accessing price data
- Average price calculation per car brand
