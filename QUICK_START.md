# 🚀 Quick Start - Multilingual Mandi Demo

## ✅ Your Application is Running!

### 🌐 Open in Browser

**Frontend:** http://localhost:5174/  
**Backend API:** http://localhost:3000/

## 🎯 What's Working

✅ **Frontend Server** - React app with Vite  
✅ **Backend API** - Express server with mock data  
✅ **QR Code Generation** - Create scannable product codes  
✅ **WhatsApp Integration** - Generate share links  
✅ **Multi-language Support** - 8 Indian languages  
✅ **Product Catalog** - Browse mock products  

## 🧪 Try These Features

### 1. View Products
Open: http://localhost:3000/api/products

### 2. Generate QR Code
Open: http://localhost:3000/api/products/1/qr-code

### 3. Test WhatsApp Sharing
```bash
curl -X POST http://localhost:3000/api/whatsapp/share \
  -H "Content-Type: application/json" \
  -d "{\"productIds\": [\"1\"], \"language\": \"hi\"}"
```

## 📱 Frontend Features

The frontend at http://localhost:5174/ includes:
- Product catalog UI
- QR code display
- WhatsApp share buttons
- Language selector
- Culturally-relevant design (saffron, green colors)
- Mobile-responsive layout

## 🔧 Development

### Stop Servers
Close the terminal or press `Ctrl+C`

### Restart Servers
```bash
npm run dev:demo
```

### View Logs
Check the terminal where you ran the command

## 📚 Documentation

- **Full README**: See `DEMO_README.md`
- **API Docs**: See `packages/backend/src/routes/TRANSLATION_API.md`
- **QR Service**: See `packages/backend/src/services/QR_SERVICE.md`
- **WhatsApp Service**: See `packages/backend/src/services/WHATSAPP_SERVICE.md`

## 🐳 Upgrade to Full Version

To run with real database:

1. Install Docker Desktop
2. Run: `docker compose up -d`
3. Run: `npm run migrate`
4. Run: `npm run dev`

## 💡 Tips

- Changes to code auto-reload (hot reload enabled)
- Mock data resets on server restart
- Frontend connects to backend automatically
- CORS is enabled for local development

---

**Enjoy exploring the Multilingual Mandi platform!** 🛒🌍
