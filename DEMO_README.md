# 🚀 Multilingual Mandi - Demo Mode

The application is now running in **DEMO MODE** without requiring Docker, PostgreSQL, or Redis!

## 🌐 Access the Application

### Frontend
**URL:** http://localhost:5174/

The React frontend is running with Vite hot-reload enabled.

### Backend API
**URL:** http://localhost:3000/

The Express backend is running with mock data (no database required).

## 📋 Available API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/:id/qr-code` - Generate QR code for product

### WhatsApp
- `POST /api/whatsapp/share` - Generate WhatsApp share link
  ```json
  {
    "productIds": ["1", "2"],
    "language": "hi"
  }
  ```

### Vendors & Categories
- `GET /api/vendors` - Get all vendors
- `GET /api/categories` - Get all categories
- `GET /api/languages` - Get supported languages

### Health Check
- `GET /health` - Server health status

## 🧪 Test the API

### Example: Get all products
```bash
curl http://localhost:3000/api/products
```

### Example: Generate QR code
```bash
curl http://localhost:3000/api/products/1/qr-code
```

### Example: Generate WhatsApp share link
```bash
curl -X POST http://localhost:3000/api/whatsapp/share \
  -H "Content-Type: application/json" \
  -d '{"productIds": ["1"], "language": "hi"}'
```

## 📦 Mock Data

The demo includes:
- **3 Products**: Tomatoes, Potatoes, Onions
- **2 Vendors**: Fresh Mart, Green Valley
- **2 Categories**: Vegetables, Fruits
- **8 Languages**: English, Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada

## ⚠️ Limitations

- **No Data Persistence**: Changes are lost on server restart
- **No Authentication**: Auth endpoints not available in demo mode
- **No Real Translation**: Translation service requires Google Cloud API key
- **Mock Data Only**: Limited dataset for demonstration

## 🔄 Restart Servers

If you need to restart:

```bash
# Stop all processes
# Then restart:
npm run dev:demo
```

## 🐳 Full Version with Docker

To run the full version with database:

1. Install Docker Desktop
2. Run: `docker compose up -d`
3. Run: `npm run dev`

## 🎨 Features Demonstrated

✅ QR Code Generation  
✅ WhatsApp Message Formatting  
✅ Multi-language Support  
✅ Product Catalog  
✅ Vendor Management  
✅ RESTful API Design  

Enjoy exploring the Multilingual Mandi platform! 🛒
