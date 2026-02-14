export const API_URL = process.env.NODE_ENV === 'production'
  ? 'http://api.sathcademy.prasath.in/api'  // Replace with your Render URL
  : 'http://localhost:5000/api';   