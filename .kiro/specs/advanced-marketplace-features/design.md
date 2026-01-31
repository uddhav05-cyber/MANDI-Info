# Design Document: Advanced Marketplace Features

## Overview

This design document describes the architecture and implementation approach for 14 advanced marketplace features being added to the Multilingual Mandi platform. These features enhance the platform with vendor analytics, buyer wishlists, order management, payment integration, delivery tracking, vendor verification, product reviews, promotional campaigns, multi-vendor comparison, voice search, chatbot support, inventory management, social sharing, and a referral program.

The design follows a modular architecture where each feature is implemented as a separate service module that integrates with the existing platform infrastructure. All features maintain compatibility with the existing PostgreSQL database, support offline mode where applicable, provide mobile-first responsive interfaces, and support regional languages.

### Design Principles

1. **Modularity**: Each feature is self-contained with clear interfaces
2. **Scalability**: Design supports growth in users and data volume
3. **Offline-First**: Critical features work without connectivity
4. **Mobile-First**: All interfaces optimized for mobile devices
5. **Multilingual**: Full support for regional Indian languages
6. **Security**: Payment and user data protected with industry standards
7. **Performance**: Fast response times even on slow networks

## Architecture

### System Architecture

The advanced marketplace features integrate into the existing three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (React PWA with Offline Support, Regional Language UI)     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Analytics   │  │   Wishlist   │  │    Order     │     │
│  │   Service    │  │   Service    │  │  Management  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Payment    │  │   Delivery   │  │ Verification │     │
│  │   Service    │  │   Tracking   │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Review     │  │  Campaign    │  │  Comparison  │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Voice     │  │   Chatbot    │  │  Inventory   │     │
│  │   Search     │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │    Social    │  │   Referral   │                        │
│  │   Sharing    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                      │  │
│  │  (Existing + New Tables for Advanced Features)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘


External Services Integration:
- Payment Gateway (Razorpay/Cashfree for UPI, cards, wallets)
- Speech Recognition API (Google Cloud Speech-to-Text)
- AI Chatbot Service (Dialogflow or custom NLP)
- SMS/Push Notification Service
- Map Service (Google Maps API for delivery tracking)

### Service Communication

Services communicate through:
1. **REST APIs**: Synchronous request-response for user-facing operations
2. **Event Queue**: Asynchronous processing for notifications, analytics updates
3. **Shared Database**: Direct database access for read operations
4. **Cache Layer**: Redis for session data, frequently accessed data

## Components and Interfaces

### 1. Analytics Service

**Purpose**: Aggregate and present vendor business metrics

**Core Components**:
- `AnalyticsAggregator`: Computes metrics from transaction data
- `MetricsCalculator`: Calculates conversion rates, trends
- `ReportGenerator`: Creates downloadable CSV reports
- `DashboardController`: Handles API requests for dashboard data

**Key Interfaces**:
```typescript
interface AnalyticsService {
  getSalesTrends(vendorId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<SalesTrend[]>
  getTopProducts(vendorId: string, metric: 'views' | 'inquiries' | 'conversions', limit: number): Promise<ProductMetric[]>
  getCustomerDemographics(vendorId: string): Promise<Demographics>
  generateRevenueReport(vendorId: string, startDate: Date, endDate: Date): Promise<ReportFile>
}

interface SalesTrend {
  period: string
  revenue: number
  transactionCount: number
  timestamp: Date
}

interface ProductMetric {
  productId: string
  productName: string
  metricValue: number
  conversionRate?: number
}
```

**Data Flow**:
1. Transaction events trigger analytics updates
2. Aggregator processes events in 5-minute batches
3. Metrics stored in `vendor_analytics` table
4. Dashboard queries pre-computed metrics

### 2. Wishlist Service

**Purpose**: Manage buyer product collections and price alerts

**Core Components**:
- `WishlistManager`: CRUD operations for wishlists
- `PriceMonitor`: Tracks price changes and triggers alerts
- `ShareLinkGenerator`: Creates shareable wishlist URLs
- `NotificationDispatcher`: Sends price drop alerts

**Key Interfaces**:
```typescript
interface WishlistService {
  createWishlist(buyerId: string, name: string): Promise<Wishlist>
  addProduct(wishlistId: string, productId: string): Promise<void>
  removeProduct(wishlistId: string, productId: string): Promise<void>
  getWishlists(buyerId: string): Promise<Wishlist[]>
  shareWishlist(wishlistId: string): Promise<ShareLink>
  checkPriceDrops(): Promise<void> // Background job
}

interface Wishlist {
  id: string
  buyerId: string
  name: string
  products: WishlistProduct[]
  createdAt: Date
  updatedAt: Date
}

interface WishlistProduct {
  productId: string
  addedAt: Date
  currentPrice: number
  originalPrice: number
  available: boolean
}
```

**Data Flow**:
1. Buyer adds product → Record in `wishlist_items` table
2. Background job checks prices hourly
3. Price drop ≥10% → Notification queued
4. Share link generated with 30-day expiry token



### 3. Order Management Service

**Purpose**: Track orders through their lifecycle from creation to delivery

**Core Components**:
- `OrderManager`: Creates and updates orders
- `StatusTracker`: Manages order state transitions
- `CancellationHandler`: Processes cancellation requests and refunds
- `OrderHistoryProvider`: Retrieves order records with pagination

**Key Interfaces**:
```typescript
interface OrderManagementService {
  createOrder(buyerId: string, items: OrderItem[], paymentId: string): Promise<Order>
  updateStatus(orderId: string, newStatus: OrderStatus, metadata?: any): Promise<Order>
  cancelOrder(orderId: string, reason: string): Promise<CancellationResult>
  getOrderHistory(userId: string, role: 'buyer' | 'vendor', page: number): Promise<PaginatedOrders>
  confirmDelivery(orderId: string, buyerId: string): Promise<void>
}

type OrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded'

interface Order {
  id: string
  buyerId: string
  vendorId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentId: string
  createdAt: Date
  updatedAt: Date
  statusHistory: StatusChange[]
}

interface StatusChange {
  status: OrderStatus
  timestamp: Date
  metadata?: any
}

interface CancellationResult {
  success: boolean
  refundInitiated: boolean
  requiresApproval: boolean
}
```

**State Machine**:
```
pending → confirmed → in_transit → delivered
   ↓          ↓
cancelled  cancelled → refunded
```

**Business Rules**:
- Cancellation within 1 hour: Automatic approval
- Cancellation after 1 hour: Requires vendor approval
- Status changes trigger buyer notifications within 2 minutes
- Delivery confirmation prompt sent 24 hours after delivery status

### 4. Payment Service

**Purpose**: Process payments securely through external gateways

**Core Components**:
- `PaymentGatewayAdapter`: Interfaces with Razorpay/Cashfree
- `TransactionManager`: Records payment transactions
- `RefundProcessor`: Handles refund requests
- `ReceiptGenerator`: Creates payment receipts

**Key Interfaces**:
```typescript
interface PaymentService {
  initiatePayment(orderId: string, amount: number, method: PaymentMethod): Promise<PaymentSession>
  verifyPayment(sessionId: string, gatewayResponse: any): Promise<PaymentResult>
  processRefund(transactionId: string, amount: number, reason: string): Promise<RefundResult>
  getPaymentHistory(userId: string, page: number): Promise<PaginatedTransactions>
  generateReceipt(transactionId: string): Promise<Receipt>
}

type PaymentMethod = 'upi' | 'card' | 'wallet' | 'netbanking'

interface PaymentSession {
  sessionId: string
  orderId: string
  amount: number
  gatewayUrl: string
  expiresAt: Date
}

interface PaymentResult {
  success: boolean
  transactionId: string
  orderId: string
  amount: number
  method: PaymentMethod
  timestamp: Date
  gatewayReference: string
}

interface Receipt {
  transactionId: string
  orderId: string
  amount: number
  timestamp: Date
  buyerDetails: any
  vendorDetails: any
  items: any[]
  pdfUrl: string
}
```

**Security Measures**:
- All payment gateway communication over HTTPS
- No storage of card/UPI credentials
- Only transaction IDs and status stored
- PCI DSS compliance through gateway
- Payment timeout after 10 minutes



### 5. Delivery Tracking Service

**Purpose**: Provide real-time delivery location and status updates

**Core Components**:
- `DeliveryAssignmentManager`: Assigns orders to delivery personnel
- `LocationTracker`: Records and retrieves GPS coordinates
- `ETACalculator`: Estimates delivery time based on location and traffic
- `ProofOfDeliveryHandler`: Manages delivery confirmation with photo/signature

**Key Interfaces**:
```typescript
interface DeliveryTrackingService {
  assignDelivery(orderId: string, deliveryPersonId: string): Promise<DeliveryAssignment>
  updateLocation(deliveryPersonId: string, latitude: number, longitude: number): Promise<void>
  getDeliveryStatus(orderId: string): Promise<DeliveryStatus>
  calculateETA(orderId: string): Promise<ETAEstimate>
  confirmDelivery(orderId: string, proof: DeliveryProof): Promise<void>
}

interface DeliveryAssignment {
  orderId: string
  deliveryPersonId: string
  assignedAt: Date
  pickupLocation: Location
  deliveryLocation: Location
}

interface DeliveryStatus {
  orderId: string
  deliveryPerson: {
    name: string
    phone: string
  }
  currentLocation: Location
  estimatedArrival: Date
  lastUpdated: Date
}

interface Location {
  latitude: number
  longitude: number
  accuracy: number
}

interface DeliveryProof {
  type: 'photo' | 'signature'
  data: string // Base64 encoded
  timestamp: Date
}
```

**Real-time Updates**:
- Delivery personnel app sends location every 30 seconds
- Buyer app polls for updates every 30 seconds when tracking active
- Proximity notification when within 1km of destination
- WebSocket connection for live tracking (optional enhancement)

### 6. Verification Service

**Purpose**: Manage vendor verification levels and badges

**Core Components**:
- `VerificationManager`: Handles verification requests and approvals
- `DocumentValidator`: Validates submitted documents
- `BadgeCalculator`: Determines verification level based on criteria
- `AutoUpgradeProcessor`: Automatically upgrades based on performance

**Key Interfaces**:
```typescript
interface VerificationService {
  submitVerification(vendorId: string, documents: Document[]): Promise<VerificationRequest>
  reviewVerification(requestId: string, approved: boolean, reason?: string): Promise<void>
  getVerificationLevel(vendorId: string): Promise<VerificationLevel>
  checkAutoUpgrade(vendorId: string): Promise<void> // Background job
  downgradeForComplaints(vendorId: string): Promise<void>
}

type VerificationLevel = 'basic' | 'verified' | 'premium'

interface Document {
  type: 'government_id' | 'business_registration' | 'address_proof'
  fileUrl: string
  uploadedAt: Date
}

interface VerificationRequest {
  id: string
  vendorId: string
  documents: Document[]
  status: 'pending' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: Date
  reason?: string
}
```

**Verification Criteria**:
- Basic: Default for all new vendors
- Verified: Documents approved OR (50+ transactions AND 4.0+ rating)
- Premium: Manual approval by admin for exceptional vendors
- Downgrade: 5+ complaints in 30 days → drop one level



### 7. Review Service

**Purpose**: Manage product reviews, ratings, and vendor responses

**Core Components**:
- `ReviewManager`: CRUD operations for reviews
- `RatingCalculator`: Computes average product ratings
- `MediaUploadHandler`: Processes photo/video attachments
- `HelpfulnessTracker`: Manages helpful votes
- `VendorResponseHandler`: Allows vendor replies to reviews

**Key Interfaces**:
```typescript
interface ReviewService {
  submitReview(buyerId: string, productId: string, review: ReviewInput): Promise<Review>
  getProductReviews(productId: string, sortBy: 'helpful' | 'recent'): Promise<Review[]>
  markHelpful(reviewId: string, buyerId: string): Promise<void>
  addVendorResponse(reviewId: string, vendorId: string, response: string): Promise<void>
  calculateProductRating(productId: string): Promise<number>
  verifyPurchase(buyerId: string, productId: string): Promise<boolean>
}

interface ReviewInput {
  rating: number // 1-5
  text?: string // Max 1000 chars
  media?: MediaFile[] // Max 5 photos or 1 video
}

interface Review {
  id: string
  buyerId: string
  productId: string
  rating: number
  text?: string
  media: MediaFile[]
  helpfulCount: number
  createdAt: Date
  vendorResponse?: VendorResponse
  verified: boolean // Purchased product
}

interface VendorResponse {
  vendorId: string
  text: string
  createdAt: Date
}

interface MediaFile {
  type: 'photo' | 'video'
  url: string
  thumbnailUrl?: string
}
```

**Review Display Logic**:
- Sort by helpful votes (descending) by default
- Show "Verified Purchase" badge for buyers who purchased
- Display vendor response below review with distinct styling
- Prevent duplicate helpful votes from same buyer
- Rating calculation: Average of all ratings, rounded to 1 decimal

### 8. Campaign Service

**Purpose**: Create and manage promotional campaigns

**Core Components**:
- `CampaignManager`: CRUD operations for campaigns
- `DiscountCodeGenerator`: Creates unique promo codes
- `DiscountCalculator`: Applies discounts to prices
- `FlashSaleScheduler`: Manages time-limited sales
- `CampaignAnalytics`: Tracks campaign performance

**Key Interfaces**:
```typescript
interface CampaignService {
  createCampaign(vendorId: string, campaign: CampaignInput): Promise<Campaign>
  validateDiscountCode(code: string, orderId: string): Promise<DiscountValidation>
  applyDiscount(orderId: string, code: string): Promise<DiscountedOrder>
  getCampaignAnalytics(campaignId: string): Promise<CampaignMetrics>
  endFlashSale(campaignId: string): Promise<void>
}

type CampaignType = 'discount_code' | 'flash_sale' | 'bundle_offer' | 'seasonal'

interface CampaignInput {
  type: CampaignType
  name: string
  startDate: Date
  endDate: Date
  discountType: 'percentage' | 'fixed'
  discountValue: number
  applicableProducts: string[]
  bundleRules?: BundleRules
}

interface Campaign {
  id: string
  vendorId: string
  type: CampaignType
  name: string
  code?: string // For discount codes
  startDate: Date
  endDate: Date
  discountType: 'percentage' | 'fixed'
  discountValue: number
  applicableProducts: string[]
  bundleRules?: BundleRules
  active: boolean
}

interface BundleRules {
  buyQuantity: number
  getQuantity: number
  productId: string
}

interface CampaignMetrics {
  totalRedemptions: number
  revenueGenerated: number
  conversionRate: number
  uniqueUsers: number
}
```

**Campaign Types**:
1. **Discount Code**: Alphanumeric code (6-12 chars) for percentage/fixed discount
2. **Flash Sale**: Time-limited sale with countdown timer
3. **Bundle Offer**: Buy X get Y rules
4. **Seasonal**: Holiday/festival promotions



### 9. Comparison Service

**Purpose**: Enable side-by-side product comparison across vendors

**Core Components**:
- `ComparisonManager`: Manages comparison sessions
- `ProductFetcher`: Retrieves product details for comparison
- `HighlightCalculator`: Identifies best values (price, rating, delivery)
- `ComparisonRenderer`: Formats comparison data for display

**Key Interfaces**:
```typescript
interface ComparisonService {
  addToComparison(sessionId: string, productId: string): Promise<ComparisonSession>
  removeFromComparison(sessionId: string, productId: string): Promise<ComparisonSession>
  getComparison(sessionId: string): Promise<ComparisonResult>
  clearComparison(sessionId: string): Promise<void>
}

interface ComparisonSession {
  id: string
  buyerId: string
  productIds: string[] // Max 5
  createdAt: Date
  expiresAt: Date
}

interface ComparisonResult {
  products: ComparisonProduct[]
  highlights: ComparisonHighlights
}

interface ComparisonProduct {
  productId: string
  name: string
  price: number
  vendorRating: number
  deliveryTime: number // in days
  available: boolean
  imageUrl: string
}

interface ComparisonHighlights {
  lowestPrice: string // productId
  highestRating: string // productId
  fastestDelivery: string // productId
}
```

**Comparison Rules**:
- Maximum 5 products simultaneously
- Adding 6th product removes oldest
- Highlight best values in green
- Gray out unavailable products
- Session expires after 24 hours

### 10. Voice Search Service

**Purpose**: Enable voice-based product search in regional languages

**Core Components**:
- `AudioCaptureHandler`: Captures microphone input
- `SpeechRecognitionAdapter`: Interfaces with Google Cloud Speech-to-Text
- `LanguageDetector`: Identifies spoken language
- `SearchQueryProcessor`: Converts speech to search query
- `VoiceCommandHandler`: Processes navigation commands

**Key Interfaces**:
```typescript
interface VoiceSearchService {
  startVoiceCapture(): Promise<AudioSession>
  processVoiceInput(audioData: Blob, language: string): Promise<VoiceSearchResult>
  executeVoiceCommand(command: string): Promise<CommandResult>
  getSupportedLanguages(): string[]
}

interface AudioSession {
  sessionId: string
  maxDuration: number // 10 seconds
  startedAt: Date
}

interface VoiceSearchResult {
  recognizedText: string
  confidence: number
  language: string
  searchResults: Product[]
}

interface CommandResult {
  command: string
  action: 'navigate' | 'search' | 'unknown'
  target?: string
  executed: boolean
}
```

**Supported Languages**:
- Hindi, Bhojpuri, Marwari, Bengali, Tamil, Telugu, English

**Voice Commands**:
- "go back" → Navigate to previous page
- "show cart" → Open shopping cart
- "my orders" → View order history

**Offline Handling**:
- Voice search requires internet connectivity
- Display clear message when offline
- Fallback to text search



### 11. Chatbot Service

**Purpose**: Provide 24/7 automated customer support

**Core Components**:
- `IntentClassifier`: Identifies user query intent
- `ResponseGenerator`: Creates contextual responses
- `ConversationManager`: Maintains conversation state
- `EscalationHandler`: Transfers to human support when needed
- `MultilingualProcessor`: Handles regional language queries

**Key Interfaces**:
```typescript
interface ChatbotService {
  sendMessage(sessionId: string, message: string, language: string): Promise<ChatbotResponse>
  startConversation(userId: string, language: string): Promise<ConversationSession>
  escalateToHuman(sessionId: string): Promise<EscalationResult>
  rateInteraction(sessionId: string, helpful: boolean): Promise<void>
}

interface ConversationSession {
  sessionId: string
  userId: string
  language: string
  startedAt: Date
  messages: Message[]
}

interface Message {
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
  intent?: string
}

interface ChatbotResponse {
  text: string
  intent: string
  confidence: number
  suggestedActions?: Action[]
  escalationOffered: boolean
}

interface Action {
  label: string
  type: 'link' | 'command'
  target: string
}

interface EscalationResult {
  ticketId: string
  estimatedWaitTime: number
  conversationHistory: Message[]
}
```

**Supported Topics**:
- Shipping policies and delivery times
- Return and refund policies
- Payment methods and issues
- Order status inquiries
- Account management

**Escalation Triggers**:
- Confidence < 0.6 for 2 consecutive responses
- User explicitly requests human support
- Complex issues requiring manual intervention

### 12. Inventory Service

**Purpose**: Track and manage product stock levels

**Core Components**:
- `StockManager`: Updates stock quantities
- `LowStockMonitor`: Detects and alerts on low inventory
- `BulkUpdateProcessor`: Handles CSV bulk updates
- `InventoryReportGenerator`: Creates inventory reports
- `StockReservationHandler`: Reserves stock during checkout

**Key Interfaces**:
```typescript
interface InventoryService {
  updateStock(productId: string, quantity: number, operation: 'set' | 'increment' | 'decrement'): Promise<StockUpdate>
  getStock(productId: string): Promise<StockInfo>
  reserveStock(productId: string, quantity: number, orderId: string): Promise<Reservation>
  releaseReservation(reservationId: string): Promise<void>
  checkLowStock(vendorId: string): Promise<LowStockAlert[]>
  bulkUpdateStock(vendorId: string, updates: StockUpdate[]): Promise<BulkUpdateResult>
  generateInventoryReport(vendorId: string): Promise<InventoryReport>
}

interface StockUpdate {
  productId: string
  previousQuantity: number
  newQuantity: number
  operation: string
  timestamp: Date
}

interface StockInfo {
  productId: string
  quantity: number
  reserved: number
  available: number
  lastUpdated: Date
}

interface Reservation {
  id: string
  productId: string
  quantity: number
  orderId: string
  expiresAt: Date
}

interface LowStockAlert {
  productId: string
  productName: string
  currentStock: number
  threshold: number
}

interface BulkUpdateResult {
  totalRows: number
  successCount: number
  failureCount: number
  errors: BulkUpdateError[]
}
```

**Stock Management Rules**:
- Order confirmation decrements stock
- Order cancellation increments stock
- Stock < 10 triggers low stock alert
- Stock = 0 hides product from search
- Bulk updates are atomic (all or nothing)
- Stock reservations expire after 15 minutes



### 13. Social Sharing Service

**Purpose**: Enable product and campaign sharing on social media

**Core Components**:
- `ShareLinkGenerator`: Creates trackable share links
- `PreviewCardGenerator`: Creates Open Graph meta tags
- `ReferralTracker`: Tracks social referral sources
- `ImageOptimizer`: Optimizes images for each platform
- `AnalyticsCollector`: Tracks share and conversion metrics

**Key Interfaces**:
```typescript
interface SocialSharingService {
  generateShareLink(contentType: 'product' | 'campaign', contentId: string, platform: SocialPlatform): Promise<ShareLink>
  generatePreviewCard(contentType: 'product' | 'campaign', contentId: string): Promise<PreviewCard>
  trackShare(shareId: string, platform: SocialPlatform): Promise<void>
  trackReferral(shareId: string, userId: string): Promise<void>
  getShareAnalytics(contentId: string): Promise<ShareMetrics>
}

type SocialPlatform = 'facebook' | 'instagram' | 'twitter' | 'whatsapp'

interface ShareLink {
  shareId: string
  url: string
  platform: SocialPlatform
  expiresAt: Date
}

interface PreviewCard {
  title: string
  description: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  url: string
}

interface ShareMetrics {
  totalShares: number
  sharesByPlatform: Record<SocialPlatform, number>
  clickThroughs: number
  conversions: number
  conversionRate: number
}
```

**Platform-Specific Image Dimensions**:
- Facebook: 1200x630px
- Instagram: 1080x1080px
- Twitter: 1200x675px
- WhatsApp: 400x400px

**Share Link Format**:
`https://platform.com/p/{productId}?ref={shareId}`

### 14. Referral Service

**Purpose**: Manage user referral program and rewards

**Core Components**:
- `ReferralCodeGenerator`: Creates unique referral codes
- `ReferralTracker`: Tracks referral registrations and purchases
- `RewardCalculator`: Computes reward points
- `PointsManager`: Manages point balances and redemptions
- `MultiplierHandler`: Applies bonus multipliers

**Key Interfaces**:
```typescript
interface ReferralService {
  generateReferralCode(userId: string): Promise<ReferralCode>
  validateReferralCode(code: string): Promise<ReferralValidation>
  trackReferralRegistration(referralCode: string, newUserId: string): Promise<void>
  trackReferralPurchase(newUserId: string): Promise<void>
  getPointsBalance(userId: string): Promise<PointsBalance>
  redeemPoints(userId: string, points: number): Promise<RedemptionResult>
  getReferralDashboard(userId: string): Promise<ReferralDashboard>
  checkMultiplierEligibility(userId: string): Promise<void>
}

interface ReferralCode {
  code: string // 8 alphanumeric chars
  userId: string
  createdAt: Date
  active: boolean
}

interface ReferralValidation {
  valid: boolean
  referrerId: string
  expiresAt?: Date
}

interface PointsBalance {
  userId: string
  totalEarned: number
  totalRedeemed: number
  currentBalance: number
  multiplier: number
}

interface RedemptionResult {
  success: boolean
  pointsRedeemed: number
  discountAmount: number
  newBalance: number
}

interface ReferralDashboard {
  totalReferrals: number
  pendingReferrals: number
  earnedPoints: number
  redeemedPoints: number
  currentBalance: number
  multiplier: number
  multiplierExpiresAt?: Date
}
```

**Reward Rules**:
- New user registration: 0 points (pending)
- First purchase by referred user: 100 points to referrer
- 500 points = 50 rupee discount
- 10+ referrals in 30 days: 2x multiplier for next 30 days
- Attribution window: 90 days from registration



## Data Models

### Database Schema

#### Analytics Tables

```sql
CREATE TABLE vendor_analytics (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES users(id),
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  revenue DECIMAL(10,2),
  transaction_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vendor_id, period_type, period_start)
);

CREATE TABLE product_metrics (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  vendor_id UUID REFERENCES users(id),
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customer_demographics (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES users(id),
  region VARCHAR(100),
  language VARCHAR(50),
  buyer_count INTEGER,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

#### Wishlist Tables

```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY,
  wishlist_id UUID REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  added_at TIMESTAMP DEFAULT NOW(),
  original_price DECIMAL(10,2),
  UNIQUE(wishlist_id, product_id)
);

CREATE TABLE wishlist_shares (
  id UUID PRIMARY KEY,
  wishlist_id UUID REFERENCES wishlists(id),
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_wishlist_buyer ON wishlists(buyer_id);
CREATE INDEX idx_wishlist_items_product ON wishlist_items(product_id);
```

#### Order Management Tables

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES users(id),
  total_amount DECIMAL(10,2),
  status VARCHAR(20), -- 'pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'refunded'
  payment_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10,2),
  subtotal DECIMAL(10,2)
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_cancellations (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  requested_by UUID REFERENCES users(id),
  reason TEXT,
  approved BOOLEAN,
  refund_initiated BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_status ON orders(status);
```

#### Payment Tables

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  method VARCHAR(50), -- 'upi', 'card', 'wallet', 'netbanking'
  status VARCHAR(20), -- 'pending', 'success', 'failed', 'refunded'
  gateway_reference VARCHAR(255),
  gateway_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES payment_transactions(id),
  amount DECIMAL(10,2),
  reason TEXT,
  status VARCHAR(20), -- 'pending', 'processed', 'failed'
  gateway_refund_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX idx_payment_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_user ON payment_transactions(user_id);
```

#### Delivery Tracking Tables

```sql
CREATE TABLE delivery_assignments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  delivery_person_id UUID REFERENCES users(id),
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),
  assigned_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_locations (
  id UUID PRIMARY KEY,
  delivery_person_id UUID REFERENCES users(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  accuracy DECIMAL(6,2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_proofs (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  delivery_person_id UUID REFERENCES users(id),
  proof_type VARCHAR(20), -- 'photo', 'signature'
  proof_data TEXT, -- Base64 or file URL
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_delivery_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_person ON delivery_locations(delivery_person_id);
```



#### Verification Tables

```sql
CREATE TABLE vendor_verifications (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES users(id),
  level VARCHAR(20) DEFAULT 'basic', -- 'basic', 'verified', 'premium'
  documents JSONB,
  status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vendor_complaints (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES users(id),
  complainant_id UUID REFERENCES users(id),
  reason TEXT,
  status VARCHAR(20), -- 'open', 'resolved', 'dismissed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_verification_vendor ON vendor_verifications(vendor_id);
CREATE INDEX idx_complaints_vendor ON vendor_complaints(vendor_id);
```

#### Review Tables

```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  buyer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT CHECK (LENGTH(text) <= 1000),
  media JSONB, -- Array of media files
  helpful_count INTEGER DEFAULT 0,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, buyer_id)
);

CREATE TABLE review_helpful_votes (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, buyer_id)
);

CREATE TABLE vendor_responses (
  id UUID PRIMARY KEY,
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES users(id),
  text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_product ON product_reviews(product_id);
CREATE INDEX idx_reviews_buyer ON product_reviews(buyer_id);
```

#### Campaign Tables

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES users(id),
  type VARCHAR(50), -- 'discount_code', 'flash_sale', 'bundle_offer', 'seasonal'
  name VARCHAR(255),
  code VARCHAR(12) UNIQUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  discount_type VARCHAR(20), -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2),
  applicable_products JSONB, -- Array of product IDs
  bundle_rules JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campaign_redemptions (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  discount_applied DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_vendor ON campaigns(vendor_id);
CREATE INDEX idx_campaigns_code ON campaigns(code);
CREATE INDEX idx_redemptions_campaign ON campaign_redemptions(campaign_id);
```

#### Comparison Tables

```sql
CREATE TABLE comparison_sessions (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  product_ids JSONB, -- Array of up to 5 product IDs
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_comparison_buyer ON comparison_sessions(buyer_id);
```

#### Voice Search Tables

```sql
CREATE TABLE voice_search_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  recognized_text TEXT,
  language VARCHAR(50),
  confidence DECIMAL(3,2),
  results_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_voice_search_user ON voice_search_logs(user_id);
```

#### Chatbot Tables

```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  language VARCHAR(50),
  messages JSONB, -- Array of messages
  escalated BOOLEAN DEFAULT FALSE,
  ticket_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE chatbot_ratings (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES chatbot_conversations(id),
  helpful BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chatbot_user ON chatbot_conversations(user_id);
```

#### Inventory Tables

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) UNIQUE,
  vendor_id UUID REFERENCES users(id),
  quantity INTEGER CHECK (quantity >= 0),
  reserved INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  order_id UUID REFERENCES orders(id),
  quantity INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE stock_history (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  previous_quantity INTEGER,
  new_quantity INTEGER,
  operation VARCHAR(50),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_vendor ON inventory(vendor_id);
CREATE INDEX idx_reservations_order ON stock_reservations(order_id);
```



#### Social Sharing Tables

```sql
CREATE TABLE social_shares (
  id UUID PRIMARY KEY,
  content_type VARCHAR(50), -- 'product', 'campaign'
  content_id UUID,
  user_id UUID REFERENCES users(id),
  platform VARCHAR(50), -- 'facebook', 'instagram', 'twitter', 'whatsapp'
  share_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE social_referrals (
  id UUID PRIMARY KEY,
  share_id UUID REFERENCES social_shares(id),
  referred_user_id UUID REFERENCES users(id),
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shares_content ON social_shares(content_type, content_id);
CREATE INDEX idx_shares_user ON social_shares(user_id);
CREATE INDEX idx_referrals_share ON social_referrals(share_id);
```

#### Referral Tables

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  code VARCHAR(8) UNIQUE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_registrations (
  id UUID PRIMARY KEY,
  referral_code_id UUID REFERENCES referral_codes(id),
  referred_user_id UUID REFERENCES users(id) UNIQUE,
  first_purchase_completed BOOLEAN DEFAULT FALSE,
  points_awarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_points (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  total_earned INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  multiplier_expires_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_redemptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points_redeemed INTEGER,
  discount_amount DECIMAL(10,2),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_registrations_referred ON referral_registrations(referred_user_id);
CREATE INDEX idx_referral_points_user ON referral_points(user_id);
```

### Data Relationships

Key relationships between new and existing tables:

1. **Orders** → Links buyers, vendors, products, payments, delivery
2. **Wishlists** → Links buyers to products with price tracking
3. **Reviews** → Links buyers to products with vendor responses
4. **Campaigns** → Links vendors to products with redemptions
5. **Inventory** → Links products to stock levels and reservations
6. **Referrals** → Links users to referred users with points tracking
7. **Analytics** → Aggregates data from orders, products, and users

### Data Integrity Constraints

1. **Foreign Key Cascades**: Deleting a wishlist cascades to wishlist_items
2. **Check Constraints**: Ratings 1-5, stock quantity ≥ 0, review text ≤ 1000 chars
3. **Unique Constraints**: One review per buyer per product, unique referral codes
4. **Indexes**: Optimized for common queries (user lookups, product searches)



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancy Analysis:**
- Properties 1.3 and 1.4 (top 10 viewed/inquired products) can be combined into a single property about top-N queries
- Properties 9.3, 9.4, 9.5 (highlighting best values) are UI concerns and not testable as properties
- Stock increment (12.2) and decrement (12.8) can be combined into a general stock adjustment property
- Multiple "contains required fields" properties can be consolidated where they test similar structures

**Consolidated Properties:**
The following properties represent the unique, non-redundant correctness guarantees for the system.

### Analytics Properties

**Property 1: Sales trend data completeness**
*For any* vendor and time period (daily, weekly, monthly), the sales trends returned SHALL contain revenue amounts and transaction counts for each period.
**Validates: Requirements 1.1, 1.2**

**Property 2: Top-N product queries**
*For any* vendor and metric type (views, inquiries, conversions), querying top products with limit N SHALL return at most N products sorted by that metric in descending order.
**Validates: Requirements 1.3, 1.4**

**Property 3: Conversion rate calculation**
*For any* product with inquiry count I and order count O where I > 0, the conversion rate SHALL equal (O / I) * 100 rounded to two decimal places.
**Validates: Requirements 1.5**

**Property 4: CSV report format**
*For any* revenue report generated, the output SHALL be valid CSV format with headers and properly escaped values.
**Validates: Requirements 1.7**

### Wishlist Properties

**Property 5: Wishlist persistence round-trip**
*For any* buyer and product, adding the product to a wishlist then querying that wishlist SHALL return the product in the wishlist items.
**Validates: Requirements 2.1**

**Property 6: Wishlist name validation**
*For any* string composed entirely of whitespace or empty string, creating a wishlist with that name SHALL be rejected.
**Validates: Requirements 2.2**

**Property 7: Wishlist limit enforcement**
*For any* buyer with 20 existing wishlists, attempting to create a 21st wishlist SHALL fail with an appropriate error.
**Validates: Requirements 2.3**

**Property 8: Share link expiry calculation**
*For any* wishlist share link generated at time T, the expiry timestamp SHALL be T + 30 days.
**Validates: Requirements 2.4**

**Property 9: Product unavailability propagation**
*For any* product that is removed from the catalog, all wishlist items containing that product SHALL be marked as unavailable.
**Validates: Requirements 2.7**

### Order Management Properties

**Property 10: Order creation initial status**
*For any* order created after successful payment, the initial status SHALL be "confirmed".
**Validates: Requirements 3.1**

**Property 11: Status change timestamp update**
*For any* order status change, the order's updated_at timestamp SHALL be set to the current time.
**Validates: Requirements 3.2**

**Property 12: Valid order status values**
*For any* order status update, the new status SHALL be one of: pending, confirmed, in_transit, delivered, cancelled, refunded.
**Validates: Requirements 3.3**

**Property 13: Cancellation time-based approval**
*For any* order cancellation requested within 1 hour of confirmation, the cancellation SHALL be automatically approved; for cancellations after 1 hour, vendor approval SHALL be required.
**Validates: Requirements 3.4, 3.5**

**Property 14: Order history pagination and sorting**
*For any* user's order history query with page size 20, the results SHALL be sorted by creation date descending and contain at most 20 orders per page.
**Validates: Requirements 3.6**

**Property 15: Vendor order filtering**
*For any* vendor viewing orders, the returned orders SHALL only include orders containing products belonging to that vendor.
**Validates: Requirements 3.7**



### Payment Properties

**Property 16: Receipt data completeness**
*For any* successful payment, the generated receipt SHALL contain transaction ID, amount, timestamp, and order details.
**Validates: Requirements 4.3**

**Property 17: Payment failure reason**
*For any* failed payment, the system SHALL return a non-empty failure reason string.
**Validates: Requirements 4.4**

**Property 18: Payment credential exclusion**
*For any* payment transaction stored, the database record SHALL NOT contain card numbers, CVV, UPI PIN, or any authentication credentials.
**Validates: Requirements 4.5**

**Property 19: Payment history data completeness**
*For any* payment history query, each transaction SHALL include date, amount, status, and order reference.
**Validates: Requirements 4.7**

### Delivery Tracking Properties

**Property 20: Delivery assignment recording**
*For any* order assigned to delivery personnel, a delivery assignment record SHALL be created with a timestamp.
**Validates: Requirements 5.1**

**Property 21: ETA calculation inputs**
*For any* ETA calculation, the algorithm SHALL use current location, destination location, and average speed as inputs.
**Validates: Requirements 5.4**

**Property 22: Delivery personnel information display**
*For any* order in delivery status, the tracking information SHALL include delivery personnel name and phone number.
**Validates: Requirements 5.5**

**Property 23: Delivery proof requirement**
*For any* delivery completion, the system SHALL require either a photo or digital signature as proof.
**Validates: Requirements 5.6**

**Property 24: Proximity notification distance**
*For any* delivery personnel location update, if the distance to destination is less than 1 kilometer, a proximity check SHALL return true.
**Validates: Requirements 5.7**

### Verification Properties

**Property 25: Valid verification levels**
*For any* vendor verification level, the value SHALL be one of: basic, verified, premium.
**Validates: Requirements 6.1**

**Property 26: Default verification level**
*For any* newly registered vendor, the initial verification level SHALL be "basic".
**Validates: Requirements 6.2**

**Property 27: Verification document requirements**
*For any* verification submission, the documents SHALL include at least one government ID and one business registration document.
**Validates: Requirements 6.3**

**Property 28: Verification review actions**
*For any* verification review, the action SHALL be either approval or rejection, and if rejected, SHALL include a reason.
**Validates: Requirements 6.4**

**Property 29: Auto-upgrade criteria**
*For any* vendor with 50 or more successful transactions AND average rating >= 4.0, the verification level SHALL be automatically upgraded to "verified".
**Validates: Requirements 6.5**

**Property 30: Complaint-based downgrade**
*For any* vendor with 5 or more complaints in the last 30 days, the verification level SHALL be downgraded by one tier (premium→verified, verified→basic, basic remains basic).
**Validates: Requirements 6.7**

### Review Properties

**Property 31: Rating range validation**
*For any* review submission, the star rating SHALL be an integer between 1 and 5 inclusive.
**Validates: Requirements 7.1**

**Property 32: Review text length validation**
*For any* review with text content, the text length SHALL be at most 1000 characters.
**Validates: Requirements 7.2**

**Property 33: Review media limits**
*For any* review submission, the media attachments SHALL be either up to 5 photos OR 1 video, not both.
**Validates: Requirements 7.3**

**Property 34: Purchase verification for reviews**
*For any* review submission, the system SHALL verify that the buyer has purchased the product before allowing the review.
**Validates: Requirements 7.4**

**Property 35: Review sorting by helpfulness**
*For any* product's reviews sorted by helpful, the reviews SHALL be ordered by helpful_count in descending order.
**Validates: Requirements 7.5**

**Property 36: Product rating calculation**
*For any* product with N reviews having ratings R1, R2, ..., RN, the product rating SHALL equal (R1 + R2 + ... + RN) / N rounded to one decimal place.
**Validates: Requirements 7.7**

**Property 37: Helpful vote uniqueness**
*For any* buyer and review, the buyer SHALL be able to mark the review as helpful at most once.
**Validates: Requirements 7.8**

### Campaign Properties

**Property 38: Discount code format**
*For any* generated discount code, the code SHALL be alphanumeric, unique, and between 6 and 12 characters in length.
**Validates: Requirements 8.1**

**Property 39: Campaign required fields**
*For any* campaign creation, the input SHALL include start date, end date, and either discount percentage or fixed discount amount.
**Validates: Requirements 8.2**

**Property 40: Discount code validation**
*For any* discount code application, the code SHALL be validated as active (current date between start and end dates) before being applied.
**Validates: Requirements 8.3**

**Property 41: Discount calculation**
*For any* order with discount code applied, if discount type is percentage P, the discounted price SHALL be original_price * (1 - P/100); if fixed amount F, the discounted price SHALL be max(0, original_price - F).
**Validates: Requirements 8.4**

**Property 42: Flash sale price reversion**
*For any* flash sale campaign, when the current time exceeds the end date, all applicable products SHALL revert to their original pricing.
**Validates: Requirements 8.6**



### Comparison Properties

**Property 43: Comparison size limit**
*For any* comparison session, the number of products SHALL be at most 5.
**Validates: Requirements 9.1**

**Property 44: Comparison data completeness**
*For any* product in a comparison, the data SHALL include product name, price, vendor rating, delivery time, and availability status.
**Validates: Requirements 9.2**

**Property 45: Comparison FIFO behavior**
*For any* comparison session with 5 products, adding a 6th product SHALL remove the oldest (first added) product from the comparison.
**Validates: Requirements 9.7**

### Voice Search Properties

**Property 46: Voice search recognized text display**
*For any* completed voice search, the response SHALL include both the recognized text and the search results.
**Validates: Requirements 10.4**

**Property 47: Voice recognition error handling**
*For any* failed voice recognition, the system SHALL return an error message indicating the failure.
**Validates: Requirements 10.5**

### Chatbot Properties

**Property 48: Chatbot language matching**
*For any* chatbot query in language L, the response SHALL be in the same language L.
**Validates: Requirements 11.3**

**Property 49: Chatbot escalation offer**
*For any* chatbot query where confidence is below 0.6, the response SHALL include an offer to escalate to human support.
**Validates: Requirements 11.4**

**Property 50: Escalation conversation transfer**
*For any* escalation to human support, the conversation history SHALL be included in the escalation data.
**Validates: Requirements 11.5**

**Property 51: Chatbot negative rating logging**
*For any* chatbot interaction rated as unhelpful, a log entry SHALL be created containing the conversation ID and timestamp.
**Validates: Requirements 11.7**

### Inventory Properties

**Property 52: Stock quantity non-negative validation**
*For any* product stock update, the new quantity SHALL be greater than or equal to zero.
**Validates: Requirements 12.1, 12.5**

**Property 53: Stock adjustment on order confirmation**
*For any* order confirmation with quantity Q, the product stock SHALL be decremented by Q.
**Validates: Requirements 12.2**

**Property 54: Low stock threshold detection**
*For any* product with stock quantity less than 10, the system SHALL flag it as low stock.
**Validates: Requirements 12.3**

**Property 55: Zero stock product hiding**
*For any* product with stock quantity equal to zero, the product SHALL be marked as out of stock and excluded from search results.
**Validates: Requirements 12.4**

**Property 56: Inventory report data completeness**
*For any* inventory report, each product entry SHALL include product name, SKU, current stock quantity, and last updated timestamp.
**Validates: Requirements 12.6**

**Property 57: Bulk inventory update atomicity**
*For any* bulk inventory update, either all stock updates SHALL succeed or none SHALL be applied (atomic transaction).
**Validates: Requirements 12.7**

**Property 58: Stock adjustment on order cancellation**
*For any* order cancellation with quantity Q, the product stock SHALL be incremented by Q.
**Validates: Requirements 12.8**

### Social Sharing Properties

**Property 59: Share preview card completeness**
*For any* social media share, the preview card SHALL include product image URL, product name, price, and vendor name.
**Validates: Requirements 13.2**

**Property 60: Share link tracking parameter**
*For any* generated share link, the URL SHALL contain a unique tracking parameter for referral attribution.
**Validates: Requirements 13.3**

**Property 61: Referral source recording**
*For any* product access via a share link with tracking parameter, a referral record SHALL be created with the source platform.
**Validates: Requirements 13.4**

**Property 62: Share image dimension validation**
*For any* platform P in {facebook, instagram, twitter, whatsapp}, the generated share image SHALL match the recommended dimensions for platform P.
**Validates: Requirements 13.7**

### Referral Properties

**Property 63: Referral code format**
*For any* generated referral code, the code SHALL be exactly 8 alphanumeric characters and unique across all users.
**Validates: Requirements 14.1**

**Property 64: Referral code validation**
*For any* registration with referral code, the code SHALL be validated to exist and be active before accepting the registration.
**Validates: Requirements 14.2**

**Property 65: Referral points crediting**
*For any* referred user completing their first purchase, exactly 100 reward points SHALL be credited to the referrer's account.
**Validates: Requirements 14.3**

**Property 66: Points redemption conversion**
*For any* redemption of 500 points, the discount amount SHALL be exactly 50 rupees.
**Validates: Requirements 14.4**

**Property 67: Referral dashboard data completeness**
*For any* referral dashboard query, the data SHALL include total referrals, pending referrals, earned points, and redeemed points.
**Validates: Requirements 14.5**

**Property 68: Referral multiplier activation**
*For any* user with 10 or more successful referrals in the last 30 days, a 2x points multiplier SHALL be applied for the next 30 days.
**Validates: Requirements 14.6**

**Property 69: Referral attribution window**
*For any* referred user's purchase within 90 days of registration, the purchase SHALL be attributed to the referrer; purchases after 90 days SHALL NOT be attributed.
**Validates: Requirements 14.7**



## Error Handling

### Error Categories

1. **Validation Errors**: Invalid input data (400 Bad Request)
   - Empty wishlist names
   - Invalid rating values (not 1-5)
   - Negative stock quantities
   - Invalid discount codes

2. **Authorization Errors**: Insufficient permissions (403 Forbidden)
   - Buyer trying to access vendor analytics
   - Vendor trying to modify another vendor's products
   - Non-purchaser trying to review a product

3. **Not Found Errors**: Resource doesn't exist (404 Not Found)
   - Invalid order ID
   - Non-existent wishlist
   - Invalid referral code

4. **Business Logic Errors**: Operation violates business rules (422 Unprocessable Entity)
   - Exceeding wishlist limit (20)
   - Cancelling order after approval window
   - Applying expired discount code
   - Insufficient points for redemption

5. **External Service Errors**: Third-party service failures (502 Bad Gateway)
   - Payment gateway timeout
   - Speech recognition API failure
   - Map service unavailable

6. **Rate Limiting Errors**: Too many requests (429 Too Many Requests)
   - Excessive API calls
   - Spam prevention for reviews

### Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "specific_field",
      "reason": "detailed explanation"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "uuid"
  }
}
```

### Error Handling Strategies

**Retry Logic**:
- Payment gateway failures: Retry up to 3 times with exponential backoff
- Speech recognition failures: Allow immediate user retry
- External API timeouts: Retry once after 2 seconds

**Graceful Degradation**:
- Voice search unavailable → Fall back to text search
- Chatbot service down → Display contact information for human support
- Map service unavailable → Show text-based delivery status
- Analytics service slow → Show cached data with staleness indicator

**User-Friendly Messages**:
- Technical errors translated to user-friendly language
- Regional language support for all error messages
- Actionable guidance (e.g., "Try again" vs "Contact support")

**Logging and Monitoring**:
- All errors logged with context (user ID, request ID, timestamp)
- Critical errors trigger alerts (payment failures, data corruption)
- Error rate monitoring with thresholds

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Specific discount calculations (10% off 100 rupees = 90 rupees)
- Edge cases (empty wishlists, zero stock, expired campaigns)
- Error conditions (invalid inputs, missing data, authorization failures)
- Integration points between services

**Property-Based Tests**: Verify universal properties across all inputs
- Universal correctness properties (see Correctness Properties section)
- Comprehensive input coverage through randomization
- Catch edge cases that manual test cases might miss

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Testing Library**: 
- TypeScript/JavaScript: fast-check
- Python: Hypothesis
- Java: jqwik

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test references its design document property
- Tag format: `Feature: advanced-marketplace-features, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
// Feature: advanced-marketplace-features, Property 36: Product rating calculation
describe('Product Rating Calculation', () => {
  it('should calculate average rating correctly for any set of reviews', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 100 }),
        (ratings) => {
          const product = createProductWithReviews(ratings);
          const calculatedRating = calculateProductRating(product.id);
          const expectedRating = roundToOneDecimal(
            ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          );
          expect(calculatedRating).toBe(expectedRating);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

**Unit Test Coverage**:
- Service layer: 80% code coverage minimum
- Controller layer: 70% code coverage minimum
- Critical paths (payment, order management): 90% coverage minimum

**Property Test Coverage**:
- Each correctness property (1-69) implemented as a property-based test
- All business logic calculations tested with properties
- All data transformations tested with round-trip properties

### Integration Testing

**API Integration Tests**:
- End-to-end flows (create order → payment → delivery → review)
- Cross-service interactions (order creation triggers inventory update)
- External service mocking (payment gateway, speech API)

**Database Integration Tests**:
- Transaction atomicity (bulk inventory updates)
- Cascade deletes (wishlist deletion removes items)
- Constraint enforcement (unique referral codes)

### Performance Testing

**Load Testing**:
- Analytics dashboard: 100 concurrent vendors
- Product search: 1000 concurrent buyers
- Payment processing: 50 transactions per second

**Stress Testing**:
- Large wishlists (1000+ products)
- Bulk inventory updates (10,000+ products)
- High-volume campaigns (100,000+ redemptions)

### Security Testing

**Authentication Tests**:
- Verify JWT token validation
- Test session expiration
- Check role-based access control

**Authorization Tests**:
- Vendor can only access own analytics
- Buyer can only modify own wishlists
- Admin-only verification approval

**Input Validation Tests**:
- SQL injection prevention
- XSS prevention in review text
- File upload validation (size, type)

**Payment Security Tests**:
- No credential storage
- HTTPS enforcement
- PCI DSS compliance verification

### Offline Mode Testing

**Offline Functionality Tests**:
- Wishlist viewing with cached data
- Order history with cached data
- Analytics dashboard with cached data
- Queue synchronization on reconnection

**Offline Limitations Tests**:
- Voice search requires connectivity
- Payment requires connectivity
- Real-time delivery tracking requires connectivity

### Multilingual Testing

**Language Support Tests**:
- All UI text translatable
- Error messages in user's language
- Number/currency formatting (Indian conventions)
- Voice search in regional languages

### Mobile Testing

**Responsive Design Tests**:
- Screen sizes: 320px to 1920px width
- Touch target sizes (44x44px minimum)
- Mobile network performance (3G simulation)
- Offline mode on mobile devices

### Continuous Integration

**CI Pipeline**:
1. Lint and format check
2. Unit tests (fast feedback)
3. Property-based tests (100 iterations)
4. Integration tests
5. Build and package
6. Deploy to staging

**Test Execution Time**:
- Unit tests: < 2 minutes
- Property tests: < 5 minutes
- Integration tests: < 10 minutes
- Total CI time: < 20 minutes

