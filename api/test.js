// Simple test endpoint to verify API is working
export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'success',
      message: 'StudySync AI API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    });
    return;
  }

  if (req.method === 'POST') {
    const { url } = req.body;
    res.status(200).json({
      status: 'success',
      message: 'Test endpoint received your request',
      receivedUrl: url,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(405).json({
    status: 'error',
    message: 'Method not allowed'
  });
}