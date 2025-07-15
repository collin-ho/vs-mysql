# VanillaSoft to MySQL Webhook Server

This project receives webhook data from VanillaSoft and forwards it to a MySQL database. It's designed to capture Call History and Contact data streams.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

1. Copy the config template:
   ```bash
   cp config-template.env .env
   ```

2. Edit `.env` with your actual database credentials:
   ```bash
   # MySQL Database Configuration
   DB_HOST=70.60.99.114
   DB_PORT=3306
   DB_USER=CogentDataAdmin
   DB_PASS=your_actual_password
   DB_NAME=your_database_name
   
   # SSL Configuration
   DB_SSL=true
   
   # Server Configuration
   PORT=3000
   ```

### 3. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000` and test the database connection.

## 📡 Webhook Endpoints

- **Call History**: `POST /webhook/call`
- **Contact Data**: `POST /webhook/contact`
- **Health Check**: `GET /health`

## 🧪 Testing

Test the webhooks with the included sample data:

```bash
# Test Call History endpoint
curl -X POST http://localhost:3000/webhook/call \
  -H "Content-Type: application/json" \
  -d @call_payload.json

# Test Contact endpoint
curl -X POST http://localhost:3000/webhook/contact \
  -H "Content-Type: application/json" \
  -d @contact_payload.json
```

## 📊 Understanding the Data

Currently, the server **logs all incoming webhook data** to the console. This helps you:

1. **See exactly** what VanillaSoft sends
2. **Understand field types** and formats
3. **Design the database schema** based on real data

### Sample Output
When a webhook is received, you'll see detailed logs like:
```
📞 CALL HISTORY WEBHOOK RECEIVED:
Timestamp: 2025-01-15T19:30:00.000Z
Headers: {...}
Body: {...}

📋 CALL HISTORY FIELDS:
  callDateUTC: 2025-01-15T14:30:00Z (string)
  comment: Initial contact call (string)
  contactId: 12345 (string)
  ...
```

## 🗄️ Next Steps: Database Schema

Once you see the actual data from VanillaSoft, we can:

1. **Analyze the real payload structure**
2. **Design MySQL tables** that match the data types
3. **Add database insertion logic** to replace the current logging
4. **Handle edge cases** (null values, data validation, etc.)

### Suggested Approach:
1. Configure VanillaSoft to send test webhooks to `http://localhost:3000`
2. Review the console logs to understand the data structure
3. Create MySQL tables based on the actual field types and sizes
4. Update the webhook handlers to insert data into the database

## 🔧 VanillaSoft Configuration

Configure these endpoints in VanillaSoft's "Outgoing Web Leads":

- **Call History Stream**: `http://localhost:3000/webhook/call`
- **Contact Stream**: `http://localhost:3000/webhook/contact`

Use JSON format and map the fields according to the field mapping tables in your playbook.

## 📁 Project Structure

```
vs-webhook-sql/
├── package.json              # Dependencies and scripts
├── index.js                  # Main server file
├── config-template.env       # Environment variables template
├── call_payload.json         # Sample call history data
├── contact_payload.json      # Sample contact data
└── README.md                 # This file
```

## 🛠️ Dependencies

- **express**: Web server framework
- **mysql2**: MySQL client with Promise support
- **dotenv**: Environment variable management

## 📝 Logging

The server provides detailed logging for:
- Database connection status
- Incoming webhook headers and payloads
- Individual field analysis
- Server startup and health

## 🔒 Security Notes

- SSL is enabled for database connections
- Environment variables keep credentials secure
- TODO: Add HMAC signature verification for production use

## 🎯 Production Deployment

For production, you'll need to:
1. Deploy this server to a public endpoint
2. Update VanillaSoft webhook URLs to point to your production server
3. Move database credentials to a secure vault (like Workato's vault)
4. Add proper error handling and retry logic
5. Implement HMAC signature verification

---

**Current Status**: 🟡 **Data Discovery Phase**
- ✅ Server setup complete
- ✅ Webhook endpoints ready
- 🔄 Waiting for real VanillaSoft data to design database schema 