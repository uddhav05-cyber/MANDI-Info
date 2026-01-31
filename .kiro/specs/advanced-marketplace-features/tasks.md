# Implementation Plan: Advanced Marketplace Features

## Overview

This implementation plan breaks down the 14 advanced marketplace features into discrete, incremental coding tasks. The plan follows a logical progression: database schema → core services → API endpoints → frontend integration → testing. Each major feature includes property-based tests to validate correctness properties from the design document.

The implementation uses TypeScript for both backend (Node.js/Express) and frontend (React), integrating with the existing PostgreSQL database and maintaining compatibility with the PWA offline mode.

## Tasks

### Phase 1: Database Schema and Migrations

- [ ] 1. Create database migration files for all new tables
  - Create migration for analytics tables (vendor_analytics, product_metrics, customer_demographics)
  - Create migration for wishlist tables (wishlists, wishlist_items, wishlist_shares)
  - Create migration for order management tables (orders, order_items, order_status_history, order_cancellations)
  - Create migration for payment tables (payment_transactions, payment_refunds)
  - Create migration for delivery tracking tables (delivery_assignments, delivery_locations, delivery_proofs)
  - Create migration for verification tables (vendor_verifications, vendor_complaints)
  - Create migration for review tables (product_reviews, review_helpful_votes, vendor_responses)
  - Create migration for campaign tables (campaigns, campaign_redemptions)
  - Create migration for comparison, voice search, chatbot, inventory, social sharing, and referral tables
  - Add all indexes and constraints as specified in design
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ]* 1.1 Write migration tests
  - Test that migrations run successfully
  - Test that rollback works correctly
  - Test that all foreign keys reference existing tables
  - _Requirements: 15.1, 15.2, 15.3_

### Phase 2: Analytics Service Implementation

- [ ] 2. Implement Analytics Service core functionality
  - [ ] 2.1 Create AnalyticsService class with sales trend aggregation
    - Implement getSalesTrends method for daily, weekly, monthly periods
    - Implement aggregation logic from order data
    - _Requirements: 1.1, 1.2_
  
  - [ ]* 2.2 Write property test for sales trend data completeness
    - **Property 1: Sales trend data completeness**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ] 2.3 Implement top products analytics
    - Implement getTopProducts method with metric parameter (views, inquiries, conversions)
    - Implement sorting and limiting logic
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 2.4 Write property test for top-N product queries
    - **Property 2: Top-N product queries**
    - **Validates: Requirements 1.3, 1.4**
  
  - [ ] 2.5 Implement conversion rate calculation
    - Implement calculateConversionRate method
    - Handle division by zero cases
    - _Requirements: 1.5_
  
  - [ ]* 2.6 Write property test for conversion rate calculation
    - **Property 3: Conversion rate calculation**
    - **Validates: Requirements 1.5**
  
  - [ ] 2.7 Implement customer demographics aggregation
    - Implement getCustomerDemographics method
    - Group by region and language
    - _Requirements: 1.6_
  
  - [ ] 2.8 Implement CSV report generation
    - Implement generateRevenueReport method
    - Format data as valid CSV with proper escaping
    - _Requirements: 1.7_
  
  - [ ]* 2.9 Write property test for CSV report format
    - **Property 4: CSV report format**
    - **Validates: Requirements 1.7**

- [ ] 3. Create Analytics API endpoints
  - Create GET /api/analytics/sales-trends endpoint
  - Create GET /api/analytics/top-products endpoint
  - Create GET /api/analytics/demographics endpoint
  - Create GET /api/analytics/reports/revenue endpoint
  - Add authentication middleware (vendor-only access)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 3.1 Write integration tests for analytics endpoints
  - Test authentication and authorization
  - Test query parameter validation
  - Test response format
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ] 4. Checkpoint - Ensure analytics tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 3: Wishlist Service Implementation

- [ ] 5. Implement Wishlist Service core functionality
  - [ ] 5.1 Create WishlistService class with CRUD operations
    - Implement createWishlist, addProduct, removeProduct, getWishlists methods
    - Implement wishlist limit validation (max 20 per buyer)
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 5.2 Write property test for wishlist persistence round-trip
    - **Property 5: Wishlist persistence round-trip**
    - **Validates: Requirements 2.1**
  
  - [ ]* 5.3 Write property test for wishlist name validation
    - **Property 6: Wishlist name validation**
    - **Validates: Requirements 2.2**
  
  - [ ]* 5.4 Write unit test for wishlist limit enforcement
    - Test creating 21st wishlist fails
    - **Property 7: Wishlist limit enforcement**
    - **Validates: Requirements 2.3**
  
  - [ ] 5.5 Implement wishlist sharing functionality
    - Implement shareWishlist method with token generation
    - Calculate 30-day expiry date
    - _Requirements: 2.4_
  
  - [ ]* 5.6 Write property test for share link expiry calculation
    - **Property 8: Share link expiry calculation**
    - **Validates: Requirements 2.4**
  
  - [ ] 5.7 Implement price monitoring background job
    - Create PriceMonitor class
    - Implement checkPriceDrops method
    - Detect 10%+ price decreases
    - Queue notifications
    - _Requirements: 2.5_
  
  - [ ] 5.8 Implement product availability tracking
    - Update wishlist items when products removed from catalog
    - _Requirements: 2.6, 2.7_
  
  - [ ]* 5.9 Write property test for product unavailability propagation
    - **Property 9: Product unavailability propagation**
    - **Validates: Requirements 2.7**

- [ ] 6. Create Wishlist API endpoints
  - Create POST /api/wishlists endpoint
  - Create GET /api/wishlists endpoint
  - Create POST /api/wishlists/:id/items endpoint
  - Create DELETE /api/wishlists/:id/items/:productId endpoint
  - Create POST /api/wishlists/:id/share endpoint
  - Create GET /api/wishlists/shared/:token endpoint
  - Add authentication middleware
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [ ]* 6.1 Write integration tests for wishlist endpoints
  - Test CRUD operations
  - Test sharing functionality
  - Test authorization (buyer can only access own wishlists)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [ ] 7. Checkpoint - Ensure wishlist tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 4: Order Management Service Implementation

- [ ] 8. Implement Order Management Service core functionality
  - [ ] 8.1 Create OrderManagementService class
    - Implement createOrder method
    - Set initial status to "confirmed"
    - _Requirements: 3.1_
  
  - [ ]* 8.2 Write property test for order creation initial status
    - **Property 10: Order creation initial status**
    - **Validates: Requirements 3.1**
  
  - [ ] 8.3 Implement order status management
    - Implement updateStatus method
    - Update timestamp on status change
    - Record status history
    - Validate status transitions
    - _Requirements: 3.2, 3.3_
  
  - [ ]* 8.4 Write property test for status change timestamp update
    - **Property 11: Status change timestamp update**
    - **Validates: Requirements 3.2**
  
  - [ ]* 8.5 Write property test for valid order status values
    - **Property 12: Valid order status values**
    - **Validates: Requirements 3.3**
  
  - [ ] 8.6 Implement order cancellation logic
    - Implement cancelOrder method
    - Check time elapsed since confirmation
    - Auto-approve if within 1 hour, require vendor approval otherwise
    - _Requirements: 3.4, 3.5_
  
  - [ ]* 8.7 Write property test for cancellation time-based approval
    - **Property 13: Cancellation time-based approval**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ] 8.8 Implement order history retrieval
    - Implement getOrderHistory method with pagination
    - Sort by creation date descending
    - Filter by user role (buyer vs vendor)
    - _Requirements: 3.6, 3.7_
  
  - [ ]* 8.9 Write property test for order history pagination and sorting
    - **Property 14: Order history pagination and sorting**
    - **Validates: Requirements 3.6**
  
  - [ ]* 8.10 Write property test for vendor order filtering
    - **Property 15: Vendor order filtering**
    - **Validates: Requirements 3.7**

- [ ] 9. Create Order Management API endpoints
  - Create POST /api/orders endpoint
  - Create GET /api/orders endpoint (with role-based filtering)
  - Create PATCH /api/orders/:id/status endpoint
  - Create POST /api/orders/:id/cancel endpoint
  - Create POST /api/orders/:id/confirm-delivery endpoint
  - Add authentication and authorization middleware
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ]* 9.1 Write integration tests for order management endpoints
  - Test order creation flow
  - Test status transitions
  - Test cancellation logic
  - Test authorization rules
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 10. Checkpoint - Ensure order management tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 5: Payment Integration Service Implementation

- [ ] 11. Implement Payment Service with gateway integration
  - [ ] 11.1 Create PaymentGatewayAdapter for Razorpay/Cashfree
    - Implement initiatePayment method
    - Implement verifyPayment method
    - Support UPI, card, wallet, netbanking methods
    - _Requirements: 4.1, 4.2_
  
  - [ ] 11.2 Create PaymentService class
    - Implement transaction recording
    - Generate receipts with all required fields
    - _Requirements: 4.3_
  
  - [ ]* 11.3 Write property test for receipt data completeness
    - **Property 16: Receipt data completeness**
    - **Validates: Requirements 4.3**
  
  - [ ] 11.4 Implement payment failure handling
    - Return failure reasons
    - Allow retry within 15 minutes
    - _Requirements: 4.4_
  
  - [ ]* 11.5 Write property test for payment failure reason
    - **Property 17: Payment failure reason**
    - **Validates: Requirements 4.4**
  
  - [ ] 11.6 Implement secure payment data storage
    - Store only transaction IDs and status
    - Never store credentials
    - _Requirements: 4.5_
  
  - [ ]* 11.7 Write property test for payment credential exclusion
    - **Property 18: Payment credential exclusion**
    - **Validates: Requirements 4.5**
  
  - [ ] 11.8 Implement refund processing
    - Implement processRefund method
    - Integrate with payment gateway refund API
    - _Requirements: 4.6_
  
  - [ ] 11.9 Implement payment history retrieval
    - Implement getPaymentHistory method with pagination
    - Include all required fields
    - _Requirements: 4.7_
  
  - [ ]* 11.10 Write property test for payment history data completeness
    - **Property 19: Payment history data completeness**
    - **Validates: Requirements 4.7**
  
  - [ ] 11.11 Implement payment timeout handling
    - Create background job to mark pending payments as failed after 10 minutes
    - Release inventory on timeout
    - _Requirements: 4.8_

- [ ] 12. Create Payment API endpoints
  - Create POST /api/payments/initiate endpoint
  - Create POST /api/payments/verify endpoint
  - Create POST /api/payments/:id/refund endpoint
  - Create GET /api/payments/history endpoint
  - Add authentication middleware
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ]* 12.1 Write integration tests for payment endpoints
  - Mock payment gateway responses
  - Test successful payment flow
  - Test payment failure handling
  - Test refund processing
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ] 13. Checkpoint - Ensure payment tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Delivery Tracking Service Implementation

- [ ] 14. Implement Delivery Tracking Service
  - [ ] 14.1 Create DeliveryTrackingService class
    - Implement assignDelivery method
    - Record assignment with timestamp
    - _Requirements: 5.1_
  
  - [ ]* 14.2 Write property test for delivery assignment recording
    - **Property 20: Delivery assignment recording**
    - **Validates: Requirements 5.1**
  
  - [ ] 14.3 Implement location tracking
    - Implement updateLocation method
    - Store GPS coordinates with accuracy
    - _Requirements: 5.2_
  
  - [ ] 14.4 Implement delivery status retrieval
    - Implement getDeliveryStatus method
    - Include delivery personnel info
    - _Requirements: 5.3, 5.5_
  
  - [ ]* 14.5 Write property test for delivery personnel information display
    - **Property 22: Delivery personnel information display**
    - **Validates: Requirements 5.5**
  
  - [ ] 14.6 Implement ETA calculation
    - Implement calculateETA method
    - Use current location, destination, average speed
    - _Requirements: 5.4_
  
  - [ ]* 14.7 Write property test for ETA calculation inputs
    - **Property 21: ETA calculation inputs**
    - **Validates: Requirements 5.4**
  
  - [ ] 14.8 Implement delivery completion with proof
    - Implement confirmDelivery method
    - Require photo or signature
    - _Requirements: 5.6_
  
  - [ ]* 14.9 Write property test for delivery proof requirement
    - **Property 23: Delivery proof requirement**
    - **Validates: Requirements 5.6**
  
  - [ ] 14.10 Implement proximity notification logic
    - Calculate distance to destination
    - Trigger notification when within 1km
    - _Requirements: 5.7_
  
  - [ ]* 14.11 Write property test for proximity notification distance
    - **Property 24: Proximity notification distance**
    - **Validates: Requirements 5.7**

- [ ] 15. Create Delivery Tracking API endpoints
  - Create POST /api/delivery/assign endpoint
  - Create POST /api/delivery/location endpoint
  - Create GET /api/delivery/:orderId/status endpoint
  - Create GET /api/delivery/:orderId/eta endpoint
  - Create POST /api/delivery/:orderId/confirm endpoint
  - Add authentication and role-based authorization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ]* 15.1 Write integration tests for delivery tracking endpoints
  - Test assignment flow
  - Test location updates
  - Test ETA calculation
  - Test delivery confirmation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 16. Checkpoint - Ensure delivery tracking tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 7: Verification Service Implementation

- [ ] 17. Implement Verification Service
  - [ ] 17.1 Create VerificationService class
    - Implement submitVerification method
    - Validate document requirements (government ID + business registration)
    - _Requirements: 6.2, 6.3_
  
  - [ ]* 17.2 Write property test for valid verification levels
    - **Property 25: Valid verification levels**
    - **Validates: Requirements 6.1**
  
  - [ ]* 17.3 Write property test for default verification level
    - **Property 26: Default verification level**
    - **Validates: Requirements 6.2**
  
  - [ ]* 17.4 Write property test for verification document requirements
    - **Property 27: Verification document requirements**
    - **Validates: Requirements 6.3**
  
  - [ ] 17.5 Implement verification review
    - Implement reviewVerification method
    - Allow approval or rejection with reason
    - _Requirements: 6.4_
  
  - [ ]* 17.6 Write property test for verification review actions
    - **Property 28: Verification review actions**
    - **Validates: Requirements 6.4**
  
  - [ ] 17.7 Implement auto-upgrade logic
    - Create background job to check upgrade criteria
    - Upgrade to "verified" when 50+ transactions AND 4.0+ rating
    - _Requirements: 6.5_
  
  - [ ]* 17.8 Write property test for auto-upgrade criteria
    - **Property 29: Auto-upgrade criteria**
    - **Validates: Requirements 6.5**
  
  - [ ] 17.9 Implement complaint-based downgrade
    - Track complaints per vendor
    - Downgrade when 5+ complaints in 30 days
    - _Requirements: 6.7_
  
  - [ ]* 17.10 Write property test for complaint-based downgrade
    - **Property 30: Complaint-based downgrade**
    - **Validates: Requirements 6.7**

- [ ] 18. Create Verification API endpoints
  - Create POST /api/verification/submit endpoint
  - Create POST /api/verification/:id/review endpoint (admin only)
  - Create GET /api/verification/:vendorId endpoint
  - Add authentication and authorization middleware
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 18.1 Write integration tests for verification endpoints
  - Test verification submission
  - Test admin review
  - Test authorization rules
  - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7_

- [ ] 19. Checkpoint - Ensure verification tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 8: Review Service Implementation

- [ ] 20. Implement Review Service
  - [ ] 20.1 Create ReviewService class
    - Implement submitReview method
    - Validate rating range (1-5)
    - Validate text length (max 1000 chars)
    - Validate media limits (5 photos OR 1 video)
    - Verify purchase before allowing review
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 20.2 Write property test for rating range validation
    - **Property 31: Rating range validation**
    - **Validates: Requirements 7.1**
  
  - [ ]* 20.3 Write property test for review text length validation
    - **Property 32: Review text length validation**
    - **Validates: Requirements 7.2**
  
  - [ ]* 20.4 Write property test for review media limits
    - **Property 33: Review media limits**
    - **Validates: Requirements 7.3**
  
  - [ ]* 20.5 Write property test for purchase verification for reviews
    - **Property 34: Purchase verification for reviews**
    - **Validates: Requirements 7.4**
  
  - [ ] 20.6 Implement review retrieval and sorting
    - Implement getProductReviews method
    - Sort by helpful votes (descending)
    - _Requirements: 7.5_
  
  - [ ]* 20.7 Write property test for review sorting by helpfulness
    - **Property 35: Review sorting by helpfulness**
    - **Validates: Requirements 7.5**
  
  - [ ] 20.8 Implement vendor response functionality
    - Implement addVendorResponse method
    - Associate response with review
    - _Requirements: 7.6_
  
  - [ ] 20.9 Implement product rating calculation
    - Implement calculateProductRating method
    - Average all ratings, round to 1 decimal
    - _Requirements: 7.7_
  
  - [ ]* 20.10 Write property test for product rating calculation
    - **Property 36: Product rating calculation**
    - **Validates: Requirements 7.7**
  
  - [ ] 20.11 Implement helpful vote tracking
    - Implement markHelpful method
    - Prevent duplicate votes from same buyer
    - _Requirements: 7.8_
  
  - [ ]* 20.12 Write property test for helpful vote uniqueness
    - **Property 37: Helpful vote uniqueness**
    - **Validates: Requirements 7.8**

- [ ] 21. Create Review API endpoints
  - Create POST /api/reviews endpoint
  - Create GET /api/reviews/product/:productId endpoint
  - Create POST /api/reviews/:id/helpful endpoint
  - Create POST /api/reviews/:id/vendor-response endpoint
  - Add authentication and authorization middleware
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ]* 21.1 Write integration tests for review endpoints
  - Test review submission with validation
  - Test helpful voting
  - Test vendor responses
  - Test authorization rules
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_

- [ ] 22. Checkpoint - Ensure review tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 9: Campaign Service Implementation

- [ ] 23. Implement Campaign Service
  - [ ] 23.1 Create CampaignService class
    - Implement createCampaign method
    - Generate unique discount codes (6-12 alphanumeric chars)
    - Validate required fields (start date, end date, discount)
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 23.2 Write property test for discount code format
    - **Property 38: Discount code format**
    - **Validates: Requirements 8.1**
  
  - [ ]* 23.3 Write property test for campaign required fields
    - **Property 39: Campaign required fields**
    - **Validates: Requirements 8.2**
  
  - [ ] 23.4 Implement discount code validation
    - Implement validateDiscountCode method
    - Check code is active and not expired
    - _Requirements: 8.3_
  
  - [ ]* 23.5 Write property test for discount code validation
    - **Property 40: Discount code validation**
    - **Validates: Requirements 8.3**
  
  - [ ] 23.6 Implement discount calculation
    - Implement applyDiscount method
    - Handle percentage and fixed amount discounts
    - Calculate savings amount
    - _Requirements: 8.4_
  
  - [ ]* 23.7 Write property test for discount calculation
    - **Property 41: Discount calculation**
    - **Validates: Requirements 8.4**
  
  - [ ] 23.8 Implement flash sale management
    - Create background job to end flash sales
    - Revert products to original pricing
    - _Requirements: 8.5, 8.6_
  
  - [ ]* 23.9 Write property test for flash sale price reversion
    - **Property 42: Flash sale price reversion**
    - **Validates: Requirements 8.6**
  
  - [ ] 23.10 Implement bundle offer logic
    - Support "buy X get Y" rules
    - _Requirements: 8.7_
  
  - [ ] 23.11 Implement campaign analytics
    - Track redemptions, revenue, conversion rate
    - _Requirements: 8.8_

- [ ] 24. Create Campaign API endpoints
  - Create POST /api/campaigns endpoint
  - Create GET /api/campaigns endpoint
  - Create POST /api/campaigns/validate endpoint
  - Create POST /api/campaigns/apply endpoint
  - Create GET /api/campaigns/:id/analytics endpoint
  - Add authentication and authorization middleware
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ]* 24.1 Write integration tests for campaign endpoints
  - Test campaign creation
  - Test discount code validation
  - Test discount application
  - Test authorization rules
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7, 8.8_

- [ ] 25. Checkpoint - Ensure campaign tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 10: Comparison, Voice Search, and Chatbot Services

- [ ] 26. Implement Comparison Service
  - [ ] 26.1 Create ComparisonService class
    - Implement addToComparison, removeFromComparison methods
    - Enforce 5-product limit with FIFO behavior
    - _Requirements: 9.1, 9.7_
  
  - [ ]* 26.2 Write property test for comparison size limit
    - **Property 43: Comparison size limit**
    - **Validates: Requirements 9.1**
  
  - [ ]* 26.3 Write property test for comparison FIFO behavior
    - **Property 45: Comparison FIFO behavior**
    - **Validates: Requirements 9.7**
  
  - [ ] 26.4 Implement comparison data retrieval
    - Fetch product details for comparison
    - Include all required fields
    - Calculate highlights (lowest price, highest rating, fastest delivery)
    - _Requirements: 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 26.5 Write property test for comparison data completeness
    - **Property 44: Comparison data completeness**
    - **Validates: Requirements 9.2**

- [ ] 27. Implement Voice Search Service
  - [ ] 27.1 Create VoiceSearchService class
    - Integrate with Google Cloud Speech-to-Text API
    - Support Hindi, Bhojpuri, Marwari, Bengali, Tamil, Telugu, English
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 27.2 Implement voice search processing
    - Implement processVoiceInput method
    - Return recognized text and search results
    - _Requirements: 10.4_
  
  - [ ]* 27.3 Write property test for voice search recognized text display
    - **Property 46: Voice search recognized text display**
    - **Validates: Requirements 10.4**
  
  - [ ] 27.4 Implement voice recognition error handling
    - Return error message on failure
    - Allow retry
    - _Requirements: 10.5_
  
  - [ ]* 27.5 Write property test for voice recognition error handling
    - **Property 47: Voice recognition error handling**
    - **Validates: Requirements 10.5**
  
  - [ ] 27.6 Implement voice commands
    - Support "go back", "show cart", "my orders"
    - _Requirements: 10.6_
  
  - [ ] 27.7 Implement offline detection
    - Display message when offline
    - _Requirements: 10.7_

- [ ] 28. Implement Chatbot Service
  - [ ] 28.1 Create ChatbotService class
    - Integrate with Dialogflow or custom NLP
    - Support multilingual responses
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ]* 28.2 Write property test for chatbot language matching
    - **Property 48: Chatbot language matching**
    - **Validates: Requirements 11.3**
  
  - [ ] 28.3 Implement escalation logic
    - Offer escalation when confidence < 0.6
    - Transfer conversation history
    - _Requirements: 11.4, 11.5_
  
  - [ ]* 28.4 Write property test for chatbot escalation offer
    - **Property 49: Chatbot escalation offer**
    - **Validates: Requirements 11.4**
  
  - [ ]* 28.5 Write property test for escalation conversation transfer
    - **Property 50: Escalation conversation transfer**
    - **Validates: Requirements 11.5**
  
  - [ ] 28.6 Implement common topic responses
    - Support shipping, returns, payments, order status, account management
    - _Requirements: 11.6_
  
  - [ ] 28.7 Implement interaction rating and logging
    - Log unhelpful interactions
    - _Requirements: 11.7_
  
  - [ ]* 28.8 Write property test for chatbot negative rating logging
    - **Property 51: Chatbot negative rating logging**
    - **Validates: Requirements 11.7**

- [ ] 29. Create Comparison, Voice Search, and Chatbot API endpoints
  - Create POST /api/comparison/add endpoint
  - Create DELETE /api/comparison/remove endpoint
  - Create GET /api/comparison endpoint
  - Create POST /api/voice-search endpoint
  - Create POST /api/chatbot/message endpoint
  - Create POST /api/chatbot/escalate endpoint
  - Add authentication middleware
  - _Requirements: 9.1, 9.2, 9.7, 10.4, 10.5, 10.6, 10.7, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 29.1 Write integration tests for these endpoints
  - Test comparison operations
  - Test voice search flow
  - Test chatbot conversation
  - _Requirements: 9.1, 9.2, 9.7, 10.4, 10.5, 11.3, 11.4, 11.5, 11.7_

- [ ] 30. Checkpoint - Ensure comparison, voice, and chatbot tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 11: Inventory Management Service

- [ ] 31. Implement Inventory Service
  - [ ] 31.1 Create InventoryService class
    - Implement updateStock method with validation
    - Validate non-negative quantities
    - _Requirements: 12.1, 12.5_
  
  - [ ]* 31.2 Write property test for stock quantity non-negative validation
    - **Property 52: Stock quantity non-negative validation**
    - **Validates: Requirements 12.1, 12.5**
  
  - [ ] 31.3 Implement stock adjustment on order operations
    - Decrement stock on order confirmation
    - Increment stock on order cancellation
    - _Requirements: 12.2, 12.8_
  
  - [ ]* 31.4 Write property test for stock adjustment on order confirmation
    - **Property 53: Stock adjustment on order confirmation**
    - **Validates: Requirements 12.2**
  
  - [ ]* 31.5 Write property test for stock adjustment on order cancellation
    - **Property 58: Stock adjustment on order cancellation**
    - **Validates: Requirements 12.8**
  
  - [ ] 31.6 Implement low stock monitoring
    - Create background job to check stock levels
    - Flag products with stock < 10
    - Send alerts to vendors
    - _Requirements: 12.3_
  
  - [ ]* 31.7 Write property test for low stock threshold detection
    - **Property 54: Low stock threshold detection**
    - **Validates: Requirements 12.3**
  
  - [ ] 31.8 Implement zero stock handling
    - Mark products as out of stock when quantity = 0
    - Hide from search results
    - _Requirements: 12.4_
  
  - [ ]* 31.9 Write property test for zero stock product hiding
    - **Property 55: Zero stock product hiding**
    - **Validates: Requirements 12.4**
  
  - [ ] 31.10 Implement inventory reporting
    - Generate reports with product name, SKU, stock, timestamp
    - _Requirements: 12.6_
  
  - [ ]* 31.11 Write property test for inventory report data completeness
    - **Property 56: Inventory report data completeness**
    - **Validates: Requirements 12.6**
  
  - [ ] 31.12 Implement bulk inventory updates
    - Parse CSV uploads
    - Validate all rows
    - Apply updates atomically (all or nothing)
    - _Requirements: 12.7_
  
  - [ ]* 31.13 Write property test for bulk inventory update atomicity
    - **Property 57: Bulk inventory update atomicity**
    - **Validates: Requirements 12.7**

- [ ] 32. Create Inventory API endpoints
  - Create GET /api/inventory endpoint
  - Create PATCH /api/inventory/:productId endpoint
  - Create POST /api/inventory/bulk-update endpoint
  - Create GET /api/inventory/report endpoint
  - Create GET /api/inventory/low-stock endpoint
  - Add authentication and authorization middleware
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ]* 32.1 Write integration tests for inventory endpoints
  - Test stock updates
  - Test bulk updates with validation
  - Test low stock alerts
  - Test authorization rules
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

- [ ] 33. Checkpoint - Ensure inventory tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 12: Social Sharing and Referral Services

- [ ] 34. Implement Social Sharing Service
  - [ ] 34.1 Create SocialSharingService class
    - Implement generateShareLink method
    - Generate unique tracking tokens
    - _Requirements: 13.3_
  
  - [ ]* 34.2 Write property test for share link tracking parameter
    - **Property 60: Share link tracking parameter**
    - **Validates: Requirements 13.3**
  
  - [ ] 34.3 Implement preview card generation
    - Create Open Graph meta tags
    - Include product image, name, price, vendor name
    - _Requirements: 13.2_
  
  - [ ]* 34.4 Write property test for share preview card completeness
    - **Property 59: Share preview card completeness**
    - **Validates: Requirements 13.2**
  
  - [ ] 34.5 Implement referral tracking
    - Record referral source when accessing via share link
    - _Requirements: 13.4_
  
  - [ ]* 34.6 Write property test for referral source recording
    - **Property 61: Referral source recording**
    - **Validates: Requirements 13.4**
  
  - [ ] 34.7 Implement image optimization
    - Optimize images for each platform's dimensions
    - Facebook: 1200x630, Instagram: 1080x1080, Twitter: 1200x675, WhatsApp: 400x400
    - _Requirements: 13.7_
  
  - [ ]* 34.8 Write property test for share image dimension validation
    - **Property 62: Share image dimension validation**
    - **Validates: Requirements 13.7**
  
  - [ ] 34.9 Implement share analytics
    - Track shares by platform
    - Track conversions
    - _Requirements: 13.5_

- [ ] 35. Implement Referral Service
  - [ ] 35.1 Create ReferralService class
    - Implement generateReferralCode method
    - Generate unique 8-character alphanumeric codes
    - _Requirements: 14.1_
  
  - [ ]* 35.2 Write property test for referral code format
    - **Property 63: Referral code format**
    - **Validates: Requirements 14.1**
  
  - [ ] 35.3 Implement referral code validation
    - Validate code exists and is active
    - _Requirements: 14.2_
  
  - [ ]* 35.4 Write property test for referral code validation
    - **Property 64: Referral code validation**
    - **Validates: Requirements 14.2**
  
  - [ ] 35.5 Implement referral tracking
    - Track registrations with referral codes
    - Track first purchases
    - Credit 100 points to referrer on first purchase
    - _Requirements: 14.3_
  
  - [ ]* 35.6 Write property test for referral points crediting
    - **Property 65: Referral points crediting**
    - **Validates: Requirements 14.3**
  
  - [ ] 35.7 Implement points redemption
    - 500 points = 50 rupee discount
    - _Requirements: 14.4_
  
  - [ ]* 35.8 Write property test for points redemption conversion
    - **Property 66: Points redemption conversion**
    - **Validates: Requirements 14.4**
  
  - [ ] 35.9 Implement referral dashboard
    - Show total referrals, pending, earned points, redeemed points
    - _Requirements: 14.5_
  
  - [ ]* 35.10 Write property test for referral dashboard data completeness
    - **Property 67: Referral dashboard data completeness**
    - **Validates: Requirements 14.5**
  
  - [ ] 35.11 Implement multiplier logic
    - Apply 2x multiplier for 10+ referrals in 30 days
    - _Requirements: 14.6_
  
  - [ ]* 35.12 Write property test for referral multiplier activation
    - **Property 68: Referral multiplier activation**
    - **Validates: Requirements 14.6**
  
  - [ ] 35.13 Implement attribution window
    - Track purchases within 90 days of registration
    - _Requirements: 14.7_
  
  - [ ]* 35.14 Write property test for referral attribution window
    - **Property 69: Referral attribution window**
    - **Validates: Requirements 14.7**

- [ ] 36. Create Social Sharing and Referral API endpoints
  - Create POST /api/share/generate endpoint
  - Create GET /api/share/preview/:shareId endpoint
  - Create GET /api/share/analytics/:contentId endpoint
  - Create POST /api/referral/generate endpoint
  - Create POST /api/referral/validate endpoint
  - Create GET /api/referral/dashboard endpoint
  - Create POST /api/referral/redeem endpoint
  - Add authentication middleware
  - _Requirements: 13.2, 13.3, 13.4, 13.5, 13.7, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ]* 36.1 Write integration tests for social sharing and referral endpoints
  - Test share link generation
  - Test referral code flow
  - Test points crediting and redemption
  - _Requirements: 13.2, 13.3, 13.4, 13.7, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ] 37. Checkpoint - Ensure social sharing and referral tests pass
  - Ensure all tests pass, ask the user if questions arise.



### Phase 13: Frontend Implementation - Analytics Dashboard

- [ ] 38. Create Vendor Analytics Dashboard UI
  - Create AnalyticsDashboard React component
  - Implement sales trends chart (daily, weekly, monthly views)
  - Implement top products display (views, inquiries, conversions)
  - Implement customer demographics visualization
  - Add CSV report download button
  - Integrate with analytics API endpoints
  - Support offline mode with cached data
  - Add loading states and error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 16.3_

- [ ]* 38.1 Write component tests for analytics dashboard
  - Test chart rendering
  - Test data fetching and display
  - Test offline mode behavior
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

### Phase 14: Frontend Implementation - Wishlist and Orders

- [ ] 39. Create Wishlist UI components
  - Create WishlistList component to display all wishlists
  - Create WishlistDetail component to show wishlist items
  - Create AddToWishlist button component
  - Implement wishlist creation modal
  - Implement wishlist sharing functionality
  - Add price drop notifications display
  - Support offline mode with cached wishlists
  - Add multilingual support
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 16.2, 17.1, 18.1_

- [ ]* 39.1 Write component tests for wishlist UI
  - Test wishlist CRUD operations
  - Test sharing functionality
  - Test offline mode
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

- [ ] 40. Create Order Management UI components
  - Create OrderList component with filtering (buyer/vendor views)
  - Create OrderDetail component with status timeline
  - Create OrderCancellation modal
  - Implement delivery confirmation UI
  - Add order status notifications
  - Support offline mode with cached order history
  - Add multilingual support
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 16.2, 17.1, 18.1_

- [ ]* 40.1 Write component tests for order management UI
  - Test order display and filtering
  - Test cancellation flow
  - Test offline mode
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

### Phase 15: Frontend Implementation - Payment and Delivery

- [ ] 41. Create Payment UI components
  - Create PaymentMethodSelector component (UPI, card, wallet)
  - Create PaymentConfirmation component
  - Integrate with payment gateway SDK
  - Display payment receipts
  - Show payment history
  - Add error handling and retry logic
  - Add multilingual support
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7, 18.1, 20.3_

- [ ]* 41.1 Write component tests for payment UI
  - Test payment method selection
  - Test error handling
  - Test receipt display
  - _Requirements: 4.1, 4.3, 4.4, 4.7_

- [ ] 42. Create Delivery Tracking UI components
  - Create DeliveryTracker component with map integration
  - Display delivery personnel information
  - Show ETA and real-time location updates
  - Implement auto-refresh every 30 seconds
  - Add proximity notifications
  - Add multilingual support
  - _Requirements: 5.3, 5.4, 5.5, 5.7, 18.1_

- [ ]* 42.1 Write component tests for delivery tracking UI
  - Test map rendering
  - Test location updates
  - Test ETA display
  - _Requirements: 5.3, 5.4, 5.5_

### Phase 16: Frontend Implementation - Reviews and Verification

- [ ] 43. Create Review UI components
  - Create ReviewForm component with rating, text, media upload
  - Create ReviewList component with sorting (helpful/recent)
  - Create VendorResponse component
  - Implement helpful voting
  - Display verification badges on reviews
  - Add multilingual support
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 18.1_

- [ ]* 43.1 Write component tests for review UI
  - Test review submission
  - Test helpful voting
  - Test vendor responses
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8_

- [ ] 44. Create Verification Badge UI components
  - Create VerificationBadge component (basic, verified, premium)
  - Display badges on vendor profiles
  - Create verification submission form (admin)
  - Add multilingual support
  - _Requirements: 6.1, 6.2, 6.6, 18.1_

- [ ]* 44.1 Write component tests for verification UI
  - Test badge display
  - Test verification form
  - _Requirements: 6.1, 6.2, 6.6_

### Phase 17: Frontend Implementation - Campaigns and Comparison

- [ ] 45. Create Campaign UI components
  - Create CampaignList component for vendors
  - Create CampaignForm component (discount codes, flash sales, bundles)
  - Create DiscountCodeInput component for buyers
  - Display flash sale countdown timers
  - Show campaign analytics
  - Add multilingual support
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 18.1_

- [ ]* 45.1 Write component tests for campaign UI
  - Test campaign creation
  - Test discount code application
  - Test countdown timer
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [ ] 46. Create Product Comparison UI components
  - Create ComparisonTable component
  - Implement add/remove from comparison
  - Highlight best values (green highlighting)
  - Display up to 5 products side-by-side
  - Add responsive mobile view (horizontal scroll or cards)
  - Add multilingual support
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 17.3, 18.1_

- [ ]* 46.1 Write component tests for comparison UI
  - Test product addition/removal
  - Test highlighting logic
  - Test responsive layout
  - _Requirements: 9.1, 9.2, 9.7_



### Phase 18: Frontend Implementation - Voice, Chatbot, and Inventory

- [ ] 47. Create Voice Search UI components
  - Create VoiceSearchButton component with microphone icon
  - Implement audio capture (10 second limit)
  - Display recognized text
  - Show voice search results
  - Support regional languages (Hindi, Bhojpuri, Marwari, Bengali, Tamil, Telugu, English)
  - Handle offline mode (display message)
  - Add error handling and retry
  - Add multilingual support
  - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7, 16.7, 18.1_

- [ ]* 47.1 Write component tests for voice search UI
  - Test audio capture
  - Test result display
  - Test offline handling
  - _Requirements: 10.1, 10.4, 10.5, 10.7_

- [ ] 48. Create Chatbot UI components
  - Create ChatWidget component (floating button)
  - Create ChatWindow component with message history
  - Implement message sending and receiving
  - Display suggested actions
  - Show escalation option when offered
  - Support multilingual conversations
  - Add interaction rating
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 18.1_

- [ ]* 48.1 Write component tests for chatbot UI
  - Test message flow
  - Test escalation
  - Test language switching
  - _Requirements: 11.3, 11.4, 11.5, 11.7_

- [ ] 49. Create Inventory Management UI components (Vendor)
  - Create InventoryList component with stock levels
  - Create StockUpdateForm component
  - Create BulkUploadModal component for CSV uploads
  - Display low stock alerts
  - Show inventory reports
  - Support offline mode with queued updates
  - Add multilingual support
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 16.4, 18.1_

- [ ]* 49.1 Write component tests for inventory UI
  - Test stock updates
  - Test bulk upload
  - Test low stock alerts
  - _Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 12.7_

### Phase 19: Frontend Implementation - Social Sharing and Referral

- [ ] 50. Create Social Sharing UI components
  - Create ShareButton component with platform options
  - Generate share preview cards
  - Track share clicks
  - Display share analytics (vendor view)
  - Add multilingual support
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 18.1_

- [ ]* 50.1 Write component tests for social sharing UI
  - Test share button
  - Test preview generation
  - Test analytics display
  - _Requirements: 13.2, 13.3, 13.4, 13.5_

- [ ] 51. Create Referral Program UI components
  - Create ReferralDashboard component
  - Display referral code and shareable links
  - Show referral statistics (total, pending, points)
  - Create PointsRedemption component
  - Display multiplier status
  - Add multilingual support
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 18.1_

- [ ]* 51.1 Write component tests for referral UI
  - Test dashboard display
  - Test points redemption
  - Test referral code sharing
  - _Requirements: 14.1, 14.4, 14.5, 14.6, 14.7_

### Phase 20: Mobile Responsiveness and Offline Mode

- [ ] 52. Implement mobile-first responsive design
  - Ensure all components work on 320px to 1920px widths
  - Implement touch-friendly buttons (44x44px minimum)
  - Optimize data tables for mobile (horizontal scroll or card views)
  - Test on various screen sizes
  - _Requirements: 17.1, 17.2, 17.3_

- [ ]* 52.1 Write responsive design tests
  - Test layout at different breakpoints
  - Test touch target sizes
  - Test mobile navigation
  - _Requirements: 17.1, 17.2, 17.3_

- [ ] 53. Implement offline mode support
  - Configure service worker for offline caching
  - Cache wishlist data for offline viewing
  - Cache order history for offline viewing
  - Cache analytics data for offline viewing
  - Implement sync queue for inventory updates
  - Display offline indicator
  - Sync queued actions on reconnection
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ]* 53.1 Write offline mode tests
  - Test offline data access
  - Test sync queue
  - Test reconnection sync
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

### Phase 21: Multilingual Support and Performance

- [ ] 54. Implement comprehensive multilingual support
  - Add translations for all UI text (Hindi, Bhojpuri, Marwari, Bengali, Tamil, Telugu, English)
  - Implement language switcher
  - Format numbers and currency using Indian conventions
  - Translate error messages
  - Translate notifications
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ]* 54.1 Write multilingual tests
  - Test language switching
  - Test number/currency formatting
  - Test translated content
  - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [ ] 55. Optimize performance for mobile networks
  - Implement image compression and lazy loading
  - Optimize API response sizes
  - Implement request caching
  - Minimize external API calls
  - Test on 3G network simulation
  - _Requirements: 17.4, 19.2, 19.3_

- [ ]* 55.1 Write performance tests
  - Test page load times
  - Test image optimization
  - Test API caching
  - _Requirements: 17.4, 19.2_

### Phase 22: Security and Integration Testing

- [ ] 56. Implement security measures
  - Validate JWT tokens on all protected endpoints
  - Implement role-based access control (buyer, vendor, delivery personnel, admin)
  - Prevent SQL injection in all queries
  - Sanitize review text to prevent XSS
  - Validate file uploads (size, type)
  - Ensure HTTPS for payment gateway communication
  - Verify no credential storage in payment transactions
  - _Requirements: 4.2, 4.5, 20.1, 20.2, 20.3, 20.4_

- [ ]* 56.1 Write security tests
  - Test authentication and authorization
  - Test input validation and sanitization
  - Test file upload validation
  - _Requirements: 4.2, 4.5, 20.1, 20.2, 20.3, 20.4_

- [ ] 57. Implement background jobs and scheduled tasks
  - Create job for analytics data aggregation (every 5 minutes)
  - Create job for price drop monitoring (hourly)
  - Create job for payment timeout handling (every minute)
  - Create job for flash sale ending (every minute)
  - Create job for low stock alerts (hourly)
  - Create job for verification auto-upgrade (daily)
  - Create job for referral multiplier checks (daily)
  - _Requirements: 1.8, 2.5, 4.8, 8.6, 12.3, 6.5, 14.6_

- [ ]* 57.1 Write tests for background jobs
  - Test job execution
  - Test job scheduling
  - Test error handling in jobs
  - _Requirements: 1.8, 2.5, 4.8, 8.6, 12.3, 6.5, 14.6_

- [ ] 58. End-to-end integration testing
  - Test complete order flow (browse → add to cart → payment → delivery → review)
  - Test wishlist flow (add → price drop → notification → purchase)
  - Test referral flow (generate code → share → registration → purchase → points)
  - Test campaign flow (create → apply discount → analytics)
  - Test verification flow (submit → review → upgrade)
  - _Requirements: All requirements_

- [ ]* 58.1 Write end-to-end tests
  - Test critical user journeys
  - Test cross-service interactions
  - Test error recovery
  - _Requirements: All requirements_

- [ ] 59. Final checkpoint - Comprehensive testing
  - Run all unit tests
  - Run all property-based tests (100 iterations each)
  - Run all integration tests
  - Run end-to-end tests
  - Verify test coverage meets requirements (80% service layer, 70% controller layer, 90% critical paths)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate cross-service interactions
- The implementation follows a bottom-up approach: database → services → APIs → frontend
- All features maintain compatibility with existing platform infrastructure
- Offline mode support is built into applicable features from the start
- Multilingual support is integrated throughout the implementation
- Security measures are implemented at every layer
