// This file is now redundant since the functionality has been moved to the server
// The client-side API call will now go to the server endpoint
// This file is kept for compatibility but will redirect to the server

export default async function handler(req, res) {
  // Redirect to server endpoint
  res.status(501).json({
    error: 'This endpoint has been moved to the backend server',
    serverEndpoint: '/api/pdf-process'
  });
}