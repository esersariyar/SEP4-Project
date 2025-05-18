# Greenhouse Monitoring System Frontend

A React-based frontend application for monitoring greenhouse environmental conditions with real-time visualization and historical data analysis.

## Features

- Real-time temperature and humidity monitoring
- Historical data visualization with various time ranges (1h, 6h, 12h, 24h, 7d, 30d)
- Responsive dashboard with interactive charts
- User authentication and account management
- Invitation-based registration system

## Technologies Used

- React
- TypeScript
- Recharts for data visualization
- JWT authentication
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Greenhouse Monitoring Backend running

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd greenhouse-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_API_URL=http://localhost:3000
   ```

### Running the Application

For development:
```bash
npm start
```

For production build:
```bash
npm run build
```

## Main Components

- **Dashboard:** Main monitoring interface showing current sensor data and historical charts
- **Login/Register:** User authentication screens with invitation-based registration
- **Header:** Navigation component with user information
- **Charts:** Data visualization components for temperature and humidity trends

## Integration with Backend

This frontend application communicates with the Greenhouse Monitoring Backend through RESTful API calls. Make sure the backend is running before starting the frontend application.

## License

This project is licensed under the MIT License.

## Project Structure

The project is structured as follows:
- `src/`: Main source code folder
  - `components/`: React components
  - `utils/`: Utility functions and helpers
    - `formatters.ts`: Date/time and number formatting functions
    - `chartHelpers.ts`: Helper functions for chart components
    - `demoData.ts`: Data generation functions for demo mode
    - `index.ts`: Exports all utility functions
  - `assets/`: Images and other static resources
  - `types/`: TypeScript type definitions

## Utility Functions

The project uses a centralized utility functions system in the `src/utils` folder:

- To use utility functions, import them from the utils module:
  ```typescript
  import { formatTimeAgo, ensureNumber } from '../utils';
  ```

- If you need to add new utility functions:
  1. Choose the appropriate file (`formatters.ts`, `chartHelpers.ts`, etc.) or create a new one
  2. Add your function with proper documentation comments
  3. Export the function from the file
  4. The function will be automatically available through the utils index

## Development
