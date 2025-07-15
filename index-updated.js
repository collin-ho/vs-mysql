require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();

// Enable JSON parsing
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection on startup
async function testConnection() {
  try {
    console.log('Testing database connection...');
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    console.log('✅ Database connection successful!');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

// Call History webhook endpoint
app.post('/webhook/call', async (req, res) => {
  console.log('\n📞 CALL HISTORY WEBHOOK RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Extract data from VanillaSoft's "contact" wrapper
    const data = req.body.contact || req.body;
    
    console.log('\n📋 CALL HISTORY FIELDS:');
    Object.keys(data).forEach(key => {
      console.log(`  ${key}: ${data[key]} (${typeof data[key]})`);
    });

    // Insert into call_history table
    const insertQuery = `
      INSERT INTO call_history (
        contact_id, call_date_utc, comment, result_code, result_group,
        time_offset, username, event_date_utc, modified_utc, 
        scheduled_call_username, call_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.contactId || null,
      data.callDateUTC || null,
      data.comment || null,
      data.resultCode || null,
      data.resultGroup || null,
      data.timeOffset || null,
      data.username || null,
      data.eventDateUTC || null,
      data.modifiedTUC || data.modifiedUTC || null, // Handle typo in VS
      data.scheduledCallUsername || null,
      data.callId || null
    ];

    await pool.execute(insertQuery, values);
    console.log('✅ Call history data inserted into database');

    res.status(200).json({ 
      status: 'success', 
      message: 'Call history data saved to database',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Call history database error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to save call history data',
      error: error.message 
    });
  }
});

// Contact webhook endpoint
app.post('/webhook/contact', async (req, res) => {
  console.log('\n👤 CONTACT WEBHOOK RECEIVED:');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  try {
    // Extract data from VanillaSoft's "contact" wrapper
    const data = req.body.contact || req.body;
    
    console.log('\n📋 CONTACT FIELDS:');
    Object.keys(data).forEach(key => {
      console.log(`  ${key}: ${data[key]} (${typeof data[key]})`);
    });

    // Handle number_of_employees as JSON
    let employeeData = null;
    if (data.numberofEmployees) {
      employeeData = Array.isArray(data.numberofEmployees) 
        ? JSON.stringify(data.numberofEmployees)
        : JSON.stringify([data.numberofEmployees]);
    }

    // Insert into contacts table (use INSERT IGNORE to handle duplicates)
    const insertQuery = `
      INSERT IGNORE INTO contacts (
        contact_id, first_name, last_name, company, email, address1, address2,
        city, state, postal_code, country, annual_revenue, number_of_employees,
        number_of_owners, industry, primary_sic_code, primary_sic_code_description,
        classification, hvt, market, website, modified_utc, created_utc,
        contact_owner_username, call_flag, closed_flag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.contactId || null,
      data.firstName || null,
      data.lastName || null,
      data.company || null,
      data.email || null,
      data.address1 || null,
      data.address2 || null,
      data.city || null,
      data.state || null,
      data.postalCode || null,
      data.country || null,
      data.annualRevenue || null,
      employeeData,
      data.numberofOwners || null,
      data.industry || null,
      data.primarySICCode || null,
      data.primarySICCodeDescription || null,
      data.classification || null,
      data.hvt || null,
      data.merket || data.market || null, // Handle VS typo "merket"
      data.website || null,
      data.modifiedUTC || null,
      data.createdUTC || null,
      data.contactownerUsername || data.contactOwnerUsername || null,
      data.callFlag || null,
      data.closedFlag || null
    ];

    const result = await pool.execute(insertQuery, values);
    
    if (result[0].affectedRows > 0) {
      console.log('✅ Contact data inserted into database');
    } else {
      console.log('ℹ️ Contact already exists, skipped duplicate');
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Contact data processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Contact database error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to save contact data',
      error: error.message 
    });
  }
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
  
  console.log('\n💾 Ready to receive and save webhook data to MySQL!');
  console.log('💡 Tip: Check console output when webhooks are received');
}); 