require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// Enable JSON parsing
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false // For self-signed certificates
  } : false
};

// Test database connection on startup
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('Server will still start for testing webhook payloads...');
  }
}

// Call History webhook endpoint
app.post('/webhook/call', async (req, res) => {
  console.log('\n📞 CALL HISTORY WEBHOOK RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  // Log individual fields to understand the structure
  const payload = req.body;
  console.log('\n📋 CALL HISTORY FIELDS:');
  Object.keys(payload).forEach(key => {
    console.log(`  ${key}: ${payload[key]} (${typeof payload[key]})`);
  });

  // TODO: Insert into database once schema is defined
  // For now, just acknowledge receipt
  res.status(200).json({ 
    status: 'received', 
    message: 'Call history data logged successfully',
    timestamp: new Date().toISOString()
  });
});

// Contact webhook endpoint
app.post('/webhook/contact', async (req, res) => {
  console.log('\n👤 CONTACT WEBHOOK RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Log individual fields to understand the structure
  const payload = req.body;
  console.log('\n📋 CONTACT FIELDS:');
  Object.keys(payload).forEach(key => {
    console.log(`  ${key}: ${payload[key]} (${typeof payload[key]})`);
  });

  // TODO: Insert into database once schema is defined
  // For now, just acknowledge receipt
  res.status(200).json({ 
    status: 'received', 
    message: 'Contact data logged successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /webhook/call',
      'POST /webhook/contact',
      'GET /health'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VanillaSoft to MySQL Webhook Server',
    endpoints: {
      'Call History': 'POST /webhook/call',
      'Contact Data': 'POST /webhook/contact',
      'Health Check': 'GET /health'
    },
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 VanillaSoft Webhook Server running on http://localhost:${PORT}`);
  console.log(`📡 Call History endpoint: http://localhost:${PORT}/webhook/call`);
  console.log(`👤 Contact endpoint: http://localhost:${PORT}/webhook/contact`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  // Test database connection
  await testConnection();
  
  console.log('\n📝 Ready to receive and log webhook data!');
  console.log('💡 Tip: Check console output when webhooks are received');
}); 