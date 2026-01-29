# Implementation Plan: Multilingual Mandi

## Overview

This implementation plan breaks down the Multilingual Mandi platform into discrete, incremental coding tasks. The approach follows a layered architecture: starting with core infrastructure and data models, then building backend services, followed by frontend components, and finally integrating AI services and offline capabilities. Each task builds on previous work, ensuring no orphaned code and continuous integration.

## Tasks

- [-] 1. Project setup and infrastructure
  - Initialize monorepo structure with frontend (React + TypeScript) and backend (Node.js + Express + TypeScript)
  - Configure TypeScript, ESLint, Prettier for both projects
  - Set up PostgreSQL database with Docker Compose for local development
  - Configure Redis for caching
  - Set up testing frameworks (Jest for backend, Vitest + React Testing Library for frontend, fast-check for property tests)
  - Create environment configuration files
  - _Requirements: 15.1, 15.3_

- [ ] 2. Database schema and models
  - [x] 2.1 Create database migration scripts for all tables
    - Write SQL migrations for users, vendors, products, categories, price_history, negotiations, negotiation_messages, and ratings tables
    - Add indexes for frequently queried fields (phone_number, vendor_id, product_id, category_id)
    - _Requirements: 9.1, 10.1, 12.1_

  - [x] 2.2 Implement TypeScript data models and ORM setup
    - Set up Prisma or TypeORM as ORM
    - Define TypeScript interfaces matching database schema
    - Create repository pattern for data access
    - _Requirements: 9.1, 10.1_

  - [x] 2.3 Write property test for data model CRUD operations

    - **Property 23: Product CRUD Operations**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 3. Authentication system
  - [x] 3.1 Implement phone-based OTP authentication
    - Create OTP generation and storage (Redis with TTL)
    - Integrate Twilio or similar SMS service for OTP delivery
    - Implement OTP verification endpoint
    - Generate JWT tokens on successful verification
    - _Requirements: 9.2_

  - [x] 3.2 Create authentication middleware and user management
    - Write JWT verification middleware
    - Implement user registration endpoint
    - Create user profile endpoints (GET, PUT)
    - Add account deletion endpoint
    - _Requirements: 9.1, 14.4_

  - [x] 3.3 Write property test for OTP authentication round-trip

    - **Property 20: OTP Authentication Round-Trip**
    - **Validates: Requirements 9.2**

  - [x] 3.4 Write property test for user registration data completeness

    - **Property 19: User Registration Data Completeness**
    - **Validates: Requirements 9.1**

  - [x] 3.5 Write property test for account deletion data removal

    - **Property 32: Account Deletion Data Removal**
    - **Validates: Requirements 14.4**

- [ ] 4. Core product and vendor services
  - [x] 4.1 Implement product catalog API endpoints
    - Create product CRUD endpoints (GET, POST, PUT, DELETE)
    - Implement product listing with pagination
    - Add product availability toggle
    - Create product categories endpoint
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.2 Implement vendor profile and management
    - Create vendor profile endpoints
    - Add vendor product listing endpoint
    - Implement vendor rating system
    - _Requirements: 9.4, 9.5_

  - [x] 4.3 Write property test for product CRUD operations

    - **Property 23: Product CRUD Operations**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [x] 4.4 Write property test for vendor profile data persistence


    - **Property 22: Vendor Profile Data Persistence**
    - **Validates: Requirements 9.4**

- [x] 5. Translation service integration
  - [x] 5.1 Set up translation service
    - Integrate Google Cloud Translation API or custom translation service
    - Create translation caching layer in Redis
    - Implement language detection
    - Add support for Hindi, English, Bhojpuri, Marwari, and 5 other regional dialects
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Create translation API endpoints
    - Implement POST /api/translate endpoint
    - Create GET /api/languages endpoint
    - Add translation middleware for automatic content translation
    - _Requirements: 4.2_

  - [ ]* 5.3 Write property test for translation invariants
    - **Property 9: Translation Invariants**
    - **Validates: Requirements 4.3**

  - [ ]* 5.4 Write property test for language preference persistence
    - **Property 10: Language Preference Persistence**
    - **Validates: Requirements 4.5**

- [x] 6. QR code generation system
  - [x] 6.1 Implement QR code generation and decoding
    - Create QR code generation service using qrcode library
    - Implement QR code data encoding (product ID, name, price, vendor ID)
    - Add QR code decoding functionality
    - Create endpoint GET /api/products/:id/qr-code
    - _Requirements: 1.1, 1.4_

  - [ ]* 6.2 Write property test for QR code round-trip integrity
    - **Property 1: QR Code Round-Trip Integrity**
    - **Validates: Requirements 1.1, 1.4, 1.5**

  - [ ]* 6.3 Write property test for QR code language translation
    - **Property 2: QR Code Language Translation**
    - **Validates: Requirements 1.3**

- [x] 7. WhatsApp integration
  - [x] 7.1 Implement WhatsApp message generation
    - Create WhatsApp link generator with product details
    - Format messages in multiple languages
    - Support multi-product messages
    - Add product page URL to messages
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [ ]* 7.2 Write property test for WhatsApp message link generation
    - **Property 3: WhatsApp Message Link Generation**
    - **Validates: Requirements 2.1, 2.4**

  - [ ]* 7.3 Write property test for WhatsApp message translation
    - **Property 4: WhatsApp Message Translation**
    - **Validates: Requirements 2.3**

  - [ ]* 7.4 Write property test for WhatsApp multi-product messages
    - **Property 5: WhatsApp Multi-Product Messages**
    - **Validates: Requirements 2.5**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Price discovery and history system
  - [x] 9.1 Implement price history tracking
    - Create price_history table insert on product price updates
    - Implement GET /api/prices/history/:productId endpoint
    - Add automatic price recording on product updates
    - _Requirements: 12.1_

  - [x] 9.2 Build AI-driven price discovery engine
    - Create price analysis service that calculates market averages
    - Implement price suggestion algorithm considering vendor rating, location, and market data
    - Create GET /api/prices/suggestion/:productId endpoint
    - Add price trend calculation for categories
    - _Requirements: 5.1, 5.4_

  - [x] 9.3 Implement price comparison and notifications
    - Create price comparison endpoint across vendors
    - Implement price change detection and notification system
    - Add significant price change highlighting logic
    - _Requirements: 5.3, 12.2, 12.4_

  - [ ]* 9.4 Write property test for price suggestion structure
    - **Property 11: Price Suggestion Structure**
    - **Validates: Requirements 5.1**

  - [ ]* 9.5 Write property test for price trend time range
    - **Property 13: Price Trend Time Range**
    - **Validates: Requirements 5.4**

  - [ ]* 9.6 Write property test for price history time range
    - **Property 28: Price History Time Range**
    - **Validates: Requirements 12.1**

  - [ ]* 9.7 Write property test for average price calculation
    - **Property 30: Average Price Calculation**
    - **Validates: Requirements 12.3**

- [x] 10. Negotiation system
  - [x] 10.1 Implement negotiation API
    - Create negotiation CRUD endpoints
    - Implement negotiation message endpoints
    - Add accept/reject negotiation endpoints
    - Create negotiation expiration job (24-hour timeout)
    - _Requirements: 6.2, 6.3_

  - [x] 10.2 Add real-time negotiation notifications
    - Set up WebSocket or Server-Sent Events for real-time updates
    - Implement notification delivery within 5 seconds
    - Add message translation for negotiation messages
    - _Requirements: 6.1, 6.4_

  - [ ]* 10.3 Write property test for negotiation message history
    - **Property 14: Negotiation Message History**
    - **Validates: Requirements 6.2**

  - [ ]* 10.4 Write property test for negotiation confirmation generation
    - **Property 15: Negotiation Confirmation Generation**
    - **Validates: Requirements 6.3**

  - [ ]* 10.5 Write property test for negotiation message translation
    - **Property 16: Negotiation Message Translation**
    - **Validates: Requirements 6.4**

- [x] 11. Search and discovery system
  - [x] 11.1 Set up Elasticsearch for product search
    - Configure Elasticsearch instance
    - Create product index with multilingual fields
    - Implement index synchronization on product changes
    - _Requirements: 11.2_

  - [x] 11.2 Implement search API with filters
    - Create GET /api/search/products endpoint
    - Add support for multilingual queries
    - Implement filters (price range, location, vendor rating)
    - Add relevance and proximity-based sorting
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

  - [ ]* 11.3 Write property test for multilingual search
    - **Property 25: Multilingual Search**
    - **Validates: Requirements 11.2**

  - [ ]* 11.4 Write property test for multi-field search with filters
    - **Property 26: Multi-Field Search with Filters**
    - **Validates: Requirements 11.3, 11.5**

  - [ ]* 11.5 Write property test for search result ordering
    - **Property 27: Search Result Ordering**
    - **Validates: Requirements 11.4**

- [x] 12. Photo recognition service
  - [x] 12.1 Integrate image recognition AI
    - Set up Google Cloud Vision API or TensorFlow.js model
    - Create image upload and processing endpoint
    - Implement product matching from recognition results
    - Add support for JPEG, PNG, WebP formats
    - Return vendor prices for identified products
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 12.2 Write property test for photo recognition result structure
    - **Property 6: Photo Recognition Result Structure**
    - **Validates: Requirements 3.2**

  - [ ]* 12.3 Write property test for image format support
    - **Property 7: Image Format Support**
    - **Validates: Requirements 3.4**

  - [ ]* 12.4 Write property test for multiple product matches
    - **Property 8: Multiple Product Matches**
    - **Validates: Requirements 3.5**

  - [ ]* 12.5 Write unit test for low confidence handling
    - Test that low confidence results trigger additional information request
    - _Requirements: 3.3_

- [x] 13. Bulk product upload
  - [x] 13.1 Implement CSV parsing and bulk upload
    - Create CSV parser for product data
    - Implement validation for bulk upload data
    - Add POST /api/products/bulk-upload endpoint
    - Return detailed success/error report for each row
    - _Requirements: 10.5_

  - [ ]* 13.2 Write property test for CSV bulk upload parsing
    - **Property 24: CSV Bulk Upload Parsing**
    - **Validates: Requirements 10.5**

- [x] 14. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Frontend foundation and design system
  - [x] 15.1 Set up React application with routing
    - Initialize React app with Vite
    - Configure React Router for navigation
    - Set up Zustand for state management
    - Configure Tailwind CSS with custom design tokens
    - _Requirements: 13.1_

  - [x] 15.2 Implement culturally-relevant design system
    - Create custom color palette (saffron, green, terracotta, golden yellow)
    - Configure Mukta/Hind fonts for Indian languages
    - Add Poppins for English content
    - Create reusable UI components (buttons, inputs, cards)
    - Implement motion design utilities
    - Add atmospheric background patterns
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 15.3 Write unit tests for design system constraints
    - Test that Inter/Roboto fonts are not used
    - Test that purple gradients on white are not used
    - _Requirements: 8.1, 8.2_

- [x] 16. Authentication UI
  - [x] 16.1 Build phone authentication flow
    - Create PhoneAuthForm component
    - Build OTPVerification component
    - Implement UserTypeSelector component
    - Add ProfileSetup component
    - Connect to authentication API
    - _Requirements: 9.1, 9.2_

  - [ ]* 16.2 Write unit tests for authentication components
    - Test phone number validation
    - Test OTP input handling
    - Test user type selection
    - _Requirements: 9.1, 9.2_

- [x] 17. Language selection and translation UI
  - [x] 17.1 Implement language selection system
    - Create LanguageSelector component
    - Build TranslationProvider context
    - Implement TranslatedText component
    - Add browser language detection
    - Persist language preference to localStorage
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ]* 17.2 Write unit tests for language components
    - Test language switching
    - Test translation rendering
    - Test preference persistence
    - _Requirements: 4.2, 4.5_

- [x] 18. Product management UI
  - [x] 18.1 Build product catalog components
    - Create ProductForm component for add/edit
    - Build ProductCard component
    - Implement ProductList with grid/list views
    - Add image upload with compression
    - Connect to product API endpoints
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 18.2 Implement QR code generation UI
    - Create QRCodeGenerator component
    - Add download QR code functionality
    - Display QR code in modal
    - _Requirements: 1.1, 1.2_

  - [x] 18.3 Build bulk upload interface
    - Create BulkUpload component
    - Add CSV file upload with validation
    - Display upload progress and results
    - _Requirements: 10.5_

  - [ ]* 18.4 Write unit tests for product components
    - Test product form validation
    - Test image upload handling
    - Test QR code display
    - _Requirements: 10.1, 1.1_

- [x] 19. Search and discovery UI
  - [x] 19.1 Build search interface
    - Create SearchBar component with multilingual support
    - Implement SearchResults component
    - Add SearchFilters component (price, location, rating)
    - Display search results with sorting
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 19.2 Write unit tests for search components
    - Test search input handling
    - Test filter application
    - Test result rendering
    - _Requirements: 11.3, 11.5_

- [x] 20. Price discovery and comparison UI
  - [x] 20.1 Build price display components
    - Create PriceSuggestion component
    - Implement PriceTrend chart component
    - Build PriceComparison component
    - Add MarketInsights dashboard
    - _Requirements: 5.1, 5.4, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 20.2 Write unit tests for price components
    - Test price suggestion display
    - Test trend chart rendering
    - Test comparison table
    - _Requirements: 5.1, 12.2_

- [x] 21. Negotiation UI
  - [x] 21.1 Build negotiation interface
    - Create NegotiationChat component
    - Implement OfferCard component
    - Build NegotiationHistory component
    - Add real-time message updates
    - Connect to negotiation API and WebSocket
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 21.2 Write unit tests for negotiation components
    - Test message sending
    - Test offer acceptance/rejection
    - Test real-time updates
    - _Requirements: 6.2, 6.3_

- [x] 22. Photo recognition UI
  - [x] 22.1 Build photo upload and recognition interface
    - Create PhotoUpload component with camera/gallery access
    - Implement ProductRecognitionResult component
    - Add ManualProductEntry fallback component
    - Display vendor prices for identified products
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [ ]* 22.2 Write unit tests for photo recognition components
    - Test image upload handling
    - Test recognition result display
    - Test manual entry fallback
    - _Requirements: 3.2, 3.3_

- [x] 23. WhatsApp sharing UI
  - [x] 23.1 Implement WhatsApp share functionality
    - Create WhatsAppShareButton component
    - Build SharePreview component
    - Generate WhatsApp links with product data
    - Support multi-product sharing
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 23.2 Write unit tests for WhatsApp components
    - Test link generation
    - Test message formatting
    - Test multi-product sharing
    - _Requirements: 2.1, 2.5_

- [x] 24. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Progressive Web App (PWA) setup
  - [x] 25.1 Configure service worker with Workbox
    - Set up Workbox for service worker generation
    - Implement app shell caching strategy
    - Configure image caching with cache-first strategy
    - Set up API response caching with network-first strategy
    - Add offline page
    - _Requirements: 7.1_

  - [x] 25.2 Implement offline data storage
    - Set up IndexedDB with Dexie.js
    - Create offline database schema
    - Implement caching for 50 most common products
    - Add offline action queue
    - _Requirements: 7.2, 7.5_

  - [x] 25.3 Build offline sync system
    - Create SyncManager component
    - Implement background sync for queued actions
    - Add OfflineIndicator component
    - Build CachedDataViewer component
    - Handle online/offline transitions
    - _Requirements: 7.3, 7.4, 7.5_

  - [ ]* 25.4 Write property test for offline data availability
    - **Property 17: Offline Data Availability**
    - **Validates: Requirements 7.2**

  - [ ]* 25.5 Write property test for offline-to-online sync
    - **Property 18: Offline-to-Online Sync**
    - **Validates: Requirements 7.3, 7.5**

  - [ ]* 25.6 Write unit test for service worker caching
    - Test that essential resources are cached on first load
    - _Requirements: 7.1_

- [x] 26. Mobile responsiveness and touch optimization
  - [x] 26.1 Implement responsive layouts
    - Add responsive breakpoints for all components
    - Test layouts from 320px to 2560px width
    - Optimize for portrait and landscape orientations
    - Ensure touch-friendly interface elements (min 44px touch targets)
    - _Requirements: 13.1, 13.2, 13.4, 13.5_

  - [ ]* 26.2 Write visual regression tests
    - Test responsive layouts at key breakpoints
    - Test touch target sizes
    - _Requirements: 13.1, 13.2_

- [x] 27. Performance optimization
  - [x] 27.1 Implement performance optimizations
    - Add code splitting for routes
    - Implement lazy loading for images
    - Optimize bundle size with tree shaking
    - Add Redis caching for frequently accessed data
    - Implement database query optimization with indexes
    - _Requirements: 15.2, 15.3_

  - [ ]* 27.2 Write performance tests
    - Test initial load time on simulated 3G
    - Test API response times
    - _Requirements: 13.3, 15.2_

- [x] 28. Security implementation
  - [x] 28.1 Implement security measures
    - Configure TLS 1.3 for all connections
    - Implement password hashing with bcrypt
    - Add rate limiting middleware
    - Implement CORS configuration
    - Add input sanitization and validation
    - Set up security headers (helmet.js)
    - _Requirements: 14.1, 14.3_

  - [ ]* 28.2 Write security tests
    - Test TLS configuration
    - Test password hashing
    - Test rate limiting
    - _Requirements: 14.1, 14.3_

- [x] 29. Transaction history and ratings
  - [x] 29.1 Implement transaction tracking
    - Create transaction history endpoints
    - Update transaction history on negotiation completion
    - Build transaction history UI component
    - _Requirements: 9.3_

  - [x] 29.2 Implement rating system
    - Create rating submission endpoint
    - Build rating display on vendor profiles
    - Add rating submission UI
    - Calculate and update vendor average ratings
    - _Requirements: 9.5_

  - [ ]* 29.3 Write property test for transaction history updates
    - **Property 21: Transaction History Updates**
    - **Validates: Requirements 9.3**

- [x] 30. Final integration and end-to-end testing
  - [x] 30.1 Integration testing
    - Write end-to-end tests for critical user flows
    - Test vendor registration and product listing flow
    - Test buyer search and negotiation flow
    - Test offline-to-online sync flow
    - Test WhatsApp sharing flow
    - Test photo recognition flow
    - _Requirements: All_

  - [x] 30.2 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on Android and iOS devices
    - Verify PWA installation on mobile
    - Test offline mode on various network conditions
    - _Requirements: 13.1, 13.4, 7.2_

- [x] 31. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: infrastructure → backend → frontend → PWA features
- All code should be written in TypeScript for type safety
- Design system must avoid generic tech aesthetics (no Inter/Roboto, no purple gradients)
- Offline functionality is critical and should be thoroughly tested
- Translation and multilingual support should be integrated throughout, not added as an afterthought
