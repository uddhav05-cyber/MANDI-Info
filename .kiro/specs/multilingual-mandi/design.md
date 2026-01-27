# Design Document: Multilingual Mandi

## Overview

The Multilingual Mandi platform is a progressive web application (PWA) that bridges traditional Indian market practices with modern technology. The system consists of three primary layers:

1. **Frontend Layer**: A mobile-first, culturally-designed web interface with offline capabilities
2. **Backend Layer**: RESTful API services handling business logic, AI integrations, and data management
3. **AI Services Layer**: Specialized microservices for translation, image recognition, and price discovery

The architecture prioritizes accessibility, performance on low-bandwidth connections, and seamless offline-to-online transitions. The design embraces Indian cultural aesthetics through custom typography, vibrant color schemes inspired by traditional markets, and motion design that reflects the energy of local mandis.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (PWA)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │Service Worker│  │ IndexedDB    │      │
│  │  (React/Vue) │  │   (Offline)  │  │   (Cache)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│         (Authentication, Rate Limiting, Routing)             │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼────────┐
│  Core Services │  │ AI Services  │  │  Data Services  │
│                │  │              │  │                 │
│ • Auth         │  │ • Translation│  │ • PostgreSQL    │
│ • Products     │  │ • Image Rec  │  │ • Redis Cache   │
│ • Vendors      │  │ • Price AI   │  │ • S3 Storage    │
│ • Negotiation  │  │              │  │                 │
└────────────────┘  └──────────────┘  └─────────────────┘
```

### Technology Stack

**Frontend:**
- Framework: React with TypeScript for type safety
- State Management: Zustand for lightweight state management
- Styling: Tailwind CSS with custom design tokens
- PWA: Workbox for service worker management
- Offline Storage: IndexedDB via Dexie.js
- QR Generation: qrcode.react library
- Image Upload: react-dropzone with compression

**Backend:**
- Runtime: Node.js with Express.js
- Language: TypeScript
- Authentication: JWT with phone-based OTP (Twilio)
- API Documentation: OpenAPI/Swagger

**AI Services:**
- Translation: Custom fine-tuned model or Google Cloud Translation API with regional dialect support
- Image Recognition: TensorFlow.js or Google Cloud Vision API
- Price Discovery: Custom ML model using historical price data

**Data Layer:**
- Primary Database: PostgreSQL for relational data
- Cache: Redis for session management and frequently accessed data
- File Storage: AWS S3 or similar for product images
- Search: Elasticsearch for multilingual product search

**Infrastructure:**
- Hosting: Cloud platform (AWS/GCP/Azure)
- CDN: CloudFlare for static assets and edge caching
- Monitoring: Application performance monitoring and error tracking

### Design Aesthetic Implementation

**Typography:**
- Primary: Mukta or Hind (Indian-designed, supports Devanagari)
- Secondary: Poppins for English content
- Accent: Custom display font for headings

**Color Scheme:**
- Primary: Vibrant saffron (#FF9933) and deep green (#138808)
- Secondary: Rich terracotta (#D2691E) and golden yellow (#FFD700)
- Neutrals: Warm grays instead of cool grays
- Backgrounds: Subtle textures inspired by fabric patterns

**Motion Design:**
- Entrance animations inspired by traditional market energy
- Micro-interactions with cultural relevance (e.g., coin flip for price updates)
- Smooth transitions that feel organic, not mechanical

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module

**Components:**
- `PhoneAuthForm`: Phone number input with country code selector
- `OTPVerification`: OTP input with resend functionality
- `UserTypeSelector`: Vendor/Buyer selection during registration
- `ProfileSetup`: Initial profile information collection

**Interfaces:**
```typescript
interface User {
  id: string;
  phoneNumber: string;
  name: string;
  userType: 'vendor' | 'buyer';
  preferredLanguage: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: Date;
  rating?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
```

#### 2. Product Management Module

**Components:**
- `ProductForm`: Add/edit product with image upload
- `ProductCard`: Display product with price and actions
- `ProductList`: Grid/list view of products
- `QRCodeGenerator`: Generate and download QR codes
- `BulkUpload`: CSV/spreadsheet upload interface

**Interfaces:**
```typescript
interface Product {
  id: string;
  vendorId: string;
  name: string;
  nameTranslations: Record<string, string>; // language code -> translated name
  category: string;
  price: number;
  unit: string; // kg, piece, dozen, etc.
  quantity: number;
  imageUrl?: string;
  qrCode?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductCategory {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  icon: string;
}
```

#### 3. Translation Module

**Components:**
- `LanguageSelector`: Dropdown for language selection
- `TranslatedText`: Component that auto-translates content
- `TranslationProvider`: Context provider for app-wide translations

**Interfaces:**
```typescript
interface Translation {
  sourceLanguage: string;
  targetLanguage: string;
  sourceText: string;
  translatedText: string;
  confidence: number;
}

interface SupportedLanguage {
  code: string; // ISO 639-1 or custom code
  name: string;
  nativeName: string;
  isRegionalDialect: boolean;
}
```

#### 4. Price Discovery Module

**Components:**
- `PriceSuggestion`: Display AI-suggested price range
- `PriceTrend`: Chart showing price history
- `PriceComparison`: Compare prices across vendors
- `MarketInsights`: Dashboard with market analytics

**Interfaces:**
```typescript
interface PriceSuggestion {
  productId: string;
  suggestedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  factors: {
    marketAverage: number;
    vendorRating: number;
    locationFactor: number;
    seasonalFactor: number;
  };
  lastUpdated: Date;
}

interface PriceHistory {
  productId: string;
  vendorId: string;
  prices: Array<{
    price: number;
    timestamp: Date;
  }>;
}
```

#### 5. Negotiation Module

**Components:**
- `NegotiationChat`: Real-time chat interface for price negotiation
- `OfferCard`: Display current offer with accept/counter actions
- `NegotiationHistory`: List of past negotiations

**Interfaces:**
```typescript
interface Negotiation {
  id: string;
  productId: string;
  buyerId: string;
  vendorId: string;
  status: 'active' | 'accepted' | 'rejected' | 'expired';
  messages: NegotiationMessage[];
  initialPrice: number;
  finalPrice?: number;
  createdAt: Date;
  expiresAt: Date;
}

interface NegotiationMessage {
  id: string;
  senderId: string;
  senderType: 'buyer' | 'vendor';
  messageType: 'offer' | 'counter' | 'accept' | 'reject' | 'message';
  price?: number;
  text?: string;
  timestamp: Date;
}
```

#### 6. Photo Recognition Module

**Components:**
- `PhotoUpload`: Camera/gallery access with preview
- `ProductRecognitionResult`: Display identified products
- `ManualProductEntry`: Fallback for failed recognition

**Interfaces:**
```typescript
interface RecognitionRequest {
  imageData: string; // base64 or blob URL
  userId: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface RecognitionResult {
  matches: Array<{
    productName: string;
    confidence: number;
    category: string;
    averagePrice: number;
    vendors: Array<{
      vendorId: string;
      vendorName: string;
      price: number;
      distance?: number;
    }>;
  }>;
  processingTime: number;
}
```

#### 7. Offline Module

**Components:**
- `OfflineIndicator`: Visual indicator of connection status
- `SyncManager`: UI for managing offline queue
- `CachedDataViewer`: Browse cached products

**Interfaces:**
```typescript
interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'product' | 'negotiation' | 'profile';
  data: any;
  timestamp: Date;
  synced: boolean;
}

interface CacheConfig {
  maxProducts: number;
  maxImages: number;
  cacheDuration: number; // milliseconds
  syncInterval: number; // milliseconds
}
```

#### 8. WhatsApp Integration Module

**Components:**
- `WhatsAppShareButton`: Generate and open WhatsApp link
- `SharePreview`: Preview message before sharing

**Interfaces:**
```typescript
interface WhatsAppMessage {
  productId: string;
  vendorName: string;
  productName: string;
  price: number;
  unit: string;
  productUrl: string;
  language: string;
}
```

### Backend API Endpoints

#### Authentication Endpoints

```
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
POST   /api/auth/refresh-token
GET    /api/auth/me
PUT    /api/auth/profile
DELETE /api/auth/account
```

#### Product Endpoints

```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
POST   /api/products/bulk-upload
GET    /api/products/categories
GET    /api/products/:id/qr-code
```

#### Vendor Endpoints

```
GET    /api/vendors
GET    /api/vendors/:id
GET    /api/vendors/:id/products
GET    /api/vendors/:id/ratings
POST   /api/vendors/:id/ratings
```

#### Price Discovery Endpoints

```
GET    /api/prices/suggestion/:productId
GET    /api/prices/history/:productId
GET    /api/prices/comparison
GET    /api/prices/trends/:category
```

#### Negotiation Endpoints

```
GET    /api/negotiations
GET    /api/negotiations/:id
POST   /api/negotiations
POST   /api/negotiations/:id/messages
PUT    /api/negotiations/:id/accept
PUT    /api/negotiations/:id/reject
```

#### Translation Endpoints

```
POST   /api/translate
GET    /api/languages
```

#### Recognition Endpoints

```
POST   /api/recognize/product
```

#### Search Endpoints

```
GET    /api/search/products
GET    /api/search/vendors
```

### Service Worker Strategy

**Caching Strategy:**
- **App Shell**: Cache-first for HTML, CSS, JS
- **Product Images**: Cache-first with fallback to network
- **API Responses**: Network-first with cache fallback
- **Static Assets**: Cache-first with periodic updates

**Offline Queue:**
- Store failed requests in IndexedDB
- Retry on connection restoration
- Provide user feedback on sync status

**Background Sync:**
- Sync offline actions when connection restored
- Update cached price data periodically
- Prefetch popular products based on user behavior

## Data Models

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('vendor', 'buyer')),
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'hi',
  location_latitude DECIMAL(10, 8),
  location_longitude DECIMAL(11, 8),
  location_address TEXT,
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Vendors Table
```sql
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(200) NOT NULL,
  shop_name_translations JSONB,
  description TEXT,
  business_hours JSONB,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_translations JSONB NOT NULL,
  category_id UUID REFERENCES categories(id),
  price DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  qr_code TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_translations JSONB NOT NULL,
  icon VARCHAR(50),
  parent_id UUID REFERENCES categories(id)
);
```

#### Price_History Table
```sql
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Negotiations Table
```sql
CREATE TABLE negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'accepted', 'rejected', 'expired')),
  initial_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);
```

#### Negotiation_Messages Table
```sql
CREATE TABLE negotiation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES negotiations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('buyer', 'vendor')),
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('offer', 'counter', 'accept', 'reject', 'message')),
  price DECIMAL(10, 2),
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Ratings Table
```sql
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, buyer_id)
);
```

### IndexedDB Schema (Offline Storage)

```typescript
// Database: multilingual-mandi-offline
// Version: 1

interface OfflineDB {
  products: {
    key: string; // product ID
    value: Product;
    indexes: {
      vendorId: string;
      category: string;
      lastAccessed: Date;
    };
  };
  
  offlineActions: {
    key: string; // action ID
    value: OfflineAction;
    indexes: {
      timestamp: Date;
      synced: boolean;
    };
  };
  
  cachedPrices: {
    key: string; // product ID
    value: {
      productId: string;
      prices: PriceHistory;
      cachedAt: Date;
    };
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following consolidations to eliminate redundancy:

**Consolidations:**
1. QR Code properties 1.1, 1.4, and 1.5 can be combined into a comprehensive round-trip property
2. WhatsApp properties 2.1 and 2.4 both test link generation and can be combined
3. Translation properties 4.2 and 4.3 test similar translation behavior and can be unified
4. Product management properties 10.1, 10.2, and 10.3 all test CRUD operations and can be combined
5. Search properties 11.3 and 11.5 both test filtering/matching and can be unified

### Testable Properties

Property 1: QR Code Round-Trip Integrity
*For any* product with name, price, vendor ID, and product ID, generating a QR code then decoding it should produce data that matches the original product information exactly.
**Validates: Requirements 1.1, 1.4, 1.5**

Property 2: QR Code Language Translation
*For any* QR code containing product information and any supported language, decoding and translating the product information should preserve all numerical values and product identifiers while translating text fields.
**Validates: Requirements 1.3**

Property 3: WhatsApp Message Link Generation
*For any* price quote, the generated WhatsApp link should be a valid URL containing the product name, price, vendor name, and a link back to the product page.
**Validates: Requirements 2.1, 2.4**

Property 4: WhatsApp Message Translation
*For any* price quote and any supported language, the WhatsApp message should be correctly formatted in the target language while preserving numerical price values.
**Validates: Requirements 2.3**

Property 5: WhatsApp Multi-Product Messages
*For any* list of products (1 to N products), the generated WhatsApp message should include all products with their respective details in a readable format.
**Validates: Requirements 2.5**

Property 6: Photo Recognition Result Structure
*For any* product recognition result, the response should include an array of matches where each match contains product name, confidence score, category, average price, and a list of vendors with their prices.
**Validates: Requirements 3.2**

Property 7: Image Format Support
*For any* valid image in JPEG, PNG, or WebP format, the photo recognition service should accept and process the image without format-related errors.
**Validates: Requirements 3.4**

Property 8: Multiple Product Matches
*For any* recognition result with multiple matches, all matches above the confidence threshold should be included in the response.
**Validates: Requirements 3.5**

Property 9: Translation Invariants
*For any* text containing numerical values and product names, translating from language A to language B should preserve all numbers and product names exactly while translating other text.
**Validates: Requirements 4.3**

Property 10: Language Preference Persistence
*For any* user who sets a language preference, logging out and logging back in should restore the same language preference.
**Validates: Requirements 4.5**

Property 11: Price Suggestion Structure
*For any* product, the price discovery engine should return a suggestion containing a price range (min and max), confidence score, and contributing factors.
**Validates: Requirements 5.1**

Property 12: Price Change Notifications
*For any* product whose price changes by more than 20%, vendors selling that product should receive a notification about the price change.
**Validates: Requirements 5.3**

Property 13: Price Trend Time Range
*For any* product category, the price trend data should include daily price points covering exactly the past 7 days.
**Validates: Requirements 5.4**

Property 14: Negotiation Message History
*For any* negotiation, all messages sent by either party should be stored and retrievable in chronological order.
**Validates: Requirements 6.2**

Property 15: Negotiation Confirmation Generation
*For any* negotiation that reaches accepted status, the system should generate confirmation records for both the buyer and vendor.
**Validates: Requirements 6.3**

Property 16: Negotiation Message Translation
*For any* negotiation message, the message should be stored in its original language and translated on-demand to each party's preferred language while preserving price values.
**Validates: Requirements 6.4**

Property 17: Offline Data Availability
*For any* of the 50 most common products, when the application is offline, the cached product data should be accessible and match the last synced version.
**Validates: Requirements 7.2**

Property 18: Offline-to-Online Sync
*For any* actions performed while offline (create, update, delete), when connectivity is restored, all queued actions should be synchronized with the server in the order they were performed.
**Validates: Requirements 7.3, 7.5**

Property 19: User Registration Data Completeness
*For any* new user registration, the stored user record should contain name, phone number, and user type (vendor or buyer).
**Validates: Requirements 9.1**

Property 20: OTP Authentication Round-Trip
*For any* phone number, requesting an OTP should generate a valid code that, when verified within the expiration window, successfully authenticates the user.
**Validates: Requirements 9.2**

Property 21: Transaction History Updates
*For any* completed transaction, both the buyer's and vendor's transaction history should be updated to include the transaction details.
**Validates: Requirements 9.3**

Property 22: Vendor Profile Data Persistence
*For any* vendor adding or updating business details (shop name, location), the stored vendor profile should contain all provided business information.
**Validates: Requirements 9.4**

Property 23: Product CRUD Operations
*For any* product, the following operations should maintain data integrity: (1) creating a product stores all required fields, (2) updating a product modifies only specified fields, (3) marking as unavailable changes only the availability status.
**Validates: Requirements 10.1, 10.2, 10.3**

Property 24: CSV Bulk Upload Parsing
*For any* valid CSV file containing product data, parsing and uploading should create product records where each record's fields match the corresponding CSV row values.
**Validates: Requirements 10.5**

Property 25: Multilingual Search
*For any* search query in any supported language, the search should return products whose names (in any language translation) match the query.
**Validates: Requirements 11.2**

Property 26: Multi-Field Search with Filters
*For any* search query and filter criteria (price range, location, rating), the results should include only products that match both the query text (in name, category, or vendor name) and all filter criteria.
**Validates: Requirements 11.3, 11.5**

Property 27: Search Result Ordering
*For any* search results, products should be ordered by relevance score (descending), and for equal relevance, by proximity to user location (ascending).
**Validates: Requirements 11.4**

Property 28: Price History Time Range
*For any* product, the price history should include all recorded prices from the past 30 days and exclude prices older than 30 days.
**Validates: Requirements 12.1**

Property 29: Vendor Price Comparison
*For any* product, when at least 3 vendors sell the same product, the price comparison should include all available vendors (minimum 3).
**Validates: Requirements 12.2**

Property 30: Average Price Calculation
*For any* product sold by multiple vendors, the displayed average market price should equal the arithmetic mean of all current vendor prices for that product.
**Validates: Requirements 12.3**

Property 31: Significant Price Change Highlighting
*For any* product whose price changes by more than 15% from its 7-day average, the price should be flagged as a significant change in the UI data.
**Validates: Requirements 12.4**

Property 32: Account Deletion Data Removal
*For any* user who deletes their account, all associated personal data (profile, transaction history, messages) should be removed from the database within the deletion operation.
**Validates: Requirements 14.4**

## Error Handling

### Error Categories

**1. Network Errors**
- Connection timeout: Retry with exponential backoff (3 attempts)
- Server unavailable: Display offline mode indicator, queue actions
- API errors (4xx, 5xx): Display user-friendly error messages in preferred language

**2. Validation Errors**
- Invalid phone number: Display format requirements
- Invalid product data: Highlight specific fields with errors
- Invalid image format: Display supported formats
- Empty required fields: Prevent submission with inline validation

**3. Authentication Errors**
- Invalid OTP: Allow retry with remaining attempts counter
- Expired OTP: Offer to resend new OTP
- Session expired: Redirect to login with return URL
- Unauthorized access: Display permission error and redirect

**4. AI Service Errors**
- Translation failure: Fall back to original language with error indicator
- Image recognition failure: Offer manual product entry
- Price discovery unavailable: Display last known prices with timestamp
- Low confidence results: Request user confirmation or additional input

**5. Data Errors**
- Product not found: Display helpful search suggestions
- Vendor not found: Redirect to vendor directory
- Negotiation expired: Display expiration message with option to restart
- Duplicate entry: Prevent submission with clear error message

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message in user's language
    details?: any; // Additional context
    retryable: boolean; // Whether the operation can be retried
    timestamp: Date;
  };
}
```

### Offline Error Handling

- Queue failed operations in IndexedDB
- Display sync status indicator
- Retry automatically when online
- Allow manual retry for failed operations
- Preserve user data during errors

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

**Unit Tests** focus on:
- Specific examples demonstrating correct behavior
- Edge cases (empty inputs, boundary values, special characters)
- Error conditions and exception handling
- Integration points between components
- UI component rendering and interactions

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Round-trip properties (encode/decode, serialize/deserialize)
- Invariants that must be preserved
- Translation and data transformation correctness

Both approaches are necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Framework Selection:**
- **JavaScript/TypeScript**: fast-check library
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property

**Test Tagging Format:**
```typescript
// Feature: multilingual-mandi, Property 1: QR Code Round-Trip Integrity
test('QR code encoding and decoding preserves product data', () => {
  fc.assert(
    fc.property(
      fc.record({
        productId: fc.uuid(),
        name: fc.string(),
        price: fc.float({ min: 0.01, max: 100000 }),
        vendorId: fc.uuid()
      }),
      (product) => {
        const qrCode = generateQRCode(product);
        const decoded = decodeQRCode(qrCode);
        expect(decoded).toEqual(product);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Frontend Testing:**
- Component unit tests: 80% coverage minimum
- Property tests for all data transformations
- Integration tests for critical user flows
- Visual regression tests for design system
- Accessibility tests (WCAG 2.1 AA compliance)

**Backend Testing:**
- API endpoint tests: 90% coverage minimum
- Property tests for all business logic
- Database integration tests
- Authentication and authorization tests
- Load tests for performance requirements

**AI Services Testing:**
- Property tests for translation invariants
- Accuracy tests for image recognition
- Price discovery algorithm validation
- Mock external AI APIs for unit tests

### Continuous Integration

- Run all tests on every commit
- Property tests run with 100 iterations in CI
- Performance tests run nightly
- Visual regression tests on UI changes
- Security scanning on dependencies

### Test Data Management

- Use factories for generating test data
- Seed database with realistic Indian market data
- Generate random but valid phone numbers
- Create diverse product catalogs for testing
- Include regional dialect test cases

### Manual Testing Checklist

- Test on actual mobile devices (Android, iOS)
- Verify offline mode in various network conditions
- Test with real WhatsApp integration
- Validate translations with native speakers
- User acceptance testing with target vendors
