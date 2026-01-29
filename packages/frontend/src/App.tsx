import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  price: number;
  unit: string;
  vendorId: string;
  isAvailable: boolean;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [whatsappLink, setWhatsappLink] = useState<string>('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/products');
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  const generateQRCode = async (productId: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}/qr-code`);
      const data = await response.json();
      setQrCode(data.qrCode);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const generateWhatsAppLink = async (productId: string) => {
    try {
      const response = await fetch('http://localhost:3000/api/whatsapp/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: [productId], language }),
      });
      const data = await response.json();
      setWhatsappLink(data.link);
    } catch (error) {
      console.error('Failed to generate WhatsApp link:', error);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setQrCode('');
    setWhatsappLink('');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-green-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-500 to-green-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-4xl font-bold">🛒 Multilingual Mandi</h1>
            <p className="text-orange-100 mt-2">Empowering local vendors with AI-driven tools</p>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Products List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Products</h2>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी (Hindi)</option>
                        <option value="mr">मराठी (Marathi)</option>
                        <option value="bn">বাংলা (Bengali)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                      </select>
                    </div>

                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading products...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductClick(product)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                              selectedProduct?.id === product.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <h3 className="text-xl font-semibold text-gray-800">
                              {product.nameTranslations[language] || product.name}
                            </h3>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-2xl font-bold text-green-600">
                                ₹{product.price}/{product.unit}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm ${
                                product.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.isAvailable ? 'Available' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Panel */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Actions</h2>
                    
                    {selectedProduct ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-orange-50 rounded-lg">
                          <h3 className="font-semibold text-gray-800 mb-2">Selected Product:</h3>
                          <p className="text-lg">{selectedProduct.nameTranslations[language] || selectedProduct.name}</p>
                          <p className="text-xl font-bold text-green-600 mt-1">
                            ₹{selectedProduct.price}/{selectedProduct.unit}
                          </p>
                        </div>

                        <button
                          onClick={() => generateQRCode(selectedProduct.id)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md"
                        >
                          📱 Generate QR Code
                        </button>

                        <button
                          onClick={() => generateWhatsAppLink(selectedProduct.id)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                        >
                          💬 Share on WhatsApp
                        </button>

                        {qrCode && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-2">QR Code:</h4>
                            <img src={qrCode} alt="Product QR Code" className="w-full rounded" />
                            <a
                              href={qrCode}
                              download={`product-${selectedProduct.id}-qr.png`}
                              className="mt-2 block text-center text-orange-600 hover:text-orange-700 font-semibold"
                            >
                              ⬇️ Download QR Code
                            </a>
                          </div>
                        )}

                        {whatsappLink && (
                          <div className="mt-4 p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold mb-2">WhatsApp Link:</h4>
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-all"
                            >
                              Open in WhatsApp
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">👆 Select a product to get started</p>
                        <p className="mt-2 text-sm">Generate QR codes and share on WhatsApp</p>
                      </div>
                    )}
                  </div>

                  {/* Features Info */}
                  <div className="mt-6 bg-gradient-to-br from-orange-100 to-green-100 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3">✨ Features</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>✅ QR Code Generation</li>
                      <li>✅ WhatsApp Sharing</li>
                      <li>✅ Multi-language Support</li>
                      <li>✅ Real-time Updates</li>
                      <li>✅ Mobile Responsive</li>
                    </ul>
                  </div>
                </div>
              </div>
            } />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12 py-6">
          <div className="container mx-auto px-4 text-center">
            <p>🌍 Multilingual Mandi - Demo Mode</p>
            <p className="text-sm text-gray-400 mt-2">Empowering local vendors across India</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
