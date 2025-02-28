# Car WebApp

A full-stack web application for managing and exploring car parts information. The application consists of a FastAPI backend and a React frontend with Material-UI components.

## Features

- Modern React frontend with Material-UI components
- FastAPI backend with SQLite database
- Car parts management and visualization
- Interactive data visualization using Recharts
- RESTful API endpoints
- Responsive design for all devices

## Tech Stack

### Backend
- Python 3.x
- FastAPI
- SQLAlchemy
- SQLite
- Uvicorn
- Pandas (for data processing)

### Frontend
- React 19
- Material-UI
- Axios for API calls
- React Router for navigation
- Recharts for data visualization

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be available at http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will be available at http://localhost:3000

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
Car_WebApp/
├── backend/
│   ├── app/
│   ├── data/
│   ├── car_parts.db
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── public/
    └── package.json
```

## Development

- Backend API endpoints are defined in the `backend/app` directory
- Frontend React components are located in the `frontend/src` directory
- The SQLite database file is `backend/car_parts.db`

## Contributing

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
 
