# FundorDonate - Development Plan

A React-based crowdfunding & donation platform replicating the full functionality of Growfund Free + Growfund Pro.

---

## Project Overview

**Tech Stack:**
- **Frontend:** React 18+ with TypeScript, Vite, React Router v6, Tailwind CSS
- **Backend:** Node.js with Express/Fastify (or Next.js for SSR)
- **Database:** PostgreSQL (via Prisma ORM)
- **State Management:** Zustand or React Query (TanStack Query)
- **Payment:** PayPal REST API, Stripe, Offline payments
- **Auth:** JWT-based authentication with refresh tokens
- **File Storage:** Local/S3-compatible for media uploads

**Architecture:** Monorepo with shared packages (types, utils, UI components)

---

## Phase 1: Project Foundation & Core Infrastructure

**Duration:** ~2-3 weeks

### 1.1 Project Scaffolding
- Initialize React + TypeScript + Vite project in `FundorDonate/`
- Configure Tailwind CSS, ESLint, Prettier
- Set up monorepo structure (if using):
  ```
  FundorDonate/
  ├── apps/
  │   ├── web/              # React frontend
  │   └── api/              # Backend API
  ├── packages/
  │   ├── ui/               # Shared UI components
  │   ├── types/            # Shared TypeScript types
  │   └── utils/            # Shared utilities
  ```
- Configure path aliases, environment variables
- Set up Git with `.gitignore`, branch strategy

### 1.2 Database Schema Design (Prisma)
Based on the 11 custom tables from Growfund:

**Core Tables:**
- `users` - User accounts (id, email, username, password, role, avatar, notifications JSON, email_verified, created_at, updated_at)
- `campaigns` - Campaigns (id, slug, title, description, short_description, goal_amount, raised_amount, deadline, status, mode [donation/crowdfunding], featured_image, video_url, author_id, fundraiser_id, category_id, platform_fee, permalink, settings JSON, created_at, updated_at)
- `campaign_images` - Multiple campaign images
- `campaign_collaborators` - Campaign-collaborator mapping (campaign_id, user_id)
- `campaign_snapshots` - Historical campaign state snapshots

**Financial Tables:**
- `donations` - Donation records (id, uid, campaign_id, fund_id, user_id, amount, recovery_fee, processing_fee, tribute_type, tribute_to, notes, status, transaction_id, payment_engine, payment_method, is_anonymous, is_manual, user_info JSON, created_at)
- `pledges` - Pledge records (id, uid, campaign_id, user_id, status, pledge_option, reward_id, amount, bonus_support_amount, shipping_cost, recovery_fee, processing_fee, notes, transaction_id, payment_engine, payment_method, is_manual, reward_info JSON, user_info JSON, created_at)
- `funds` - Fund management (id, title, description, is_default, status, created_at)
- `wallets` - User wallets (id, user_id, balance, requested_amount, withdraw_amount, platform_fee, updated_at)
- `wallet_transactions` - Transaction ledger (id, wallet_id, campaign_id, reference_id, reference_type, type, amount, action, status, created_at)
- `withdrawal_requests` - Withdrawal requests (id, user_id, amount, method, status, note, attachment, payout_info JSON, created_at, updated_by, updated_at)
- `withdrawal_items` - Per-campaign withdrawal breakdowns

**Engagement Tables:**
- `rewards` - Reward tiers (id, campaign_id, title, description, amount, delivery_date, limit, status, created_at)
- `reward_items` - Individual reward items
- `bookmarks` - Campaign bookmarks (campaign_id, user_id)
- `activities` - Activity log (type, campaign_id, pledge_id, donation_id, data JSON, user_id, created_by, created_at)
- `campaign_posts` - Campaign updates
- `comments` - Campaign comments
- `categories` - Campaign categories
- `tags` - Campaign tags

### 1.3 Authentication System
- User registration (email/password, with optional fundraiser type)
- Login with JWT access + refresh tokens
- Password reset flow (email-based)
- Email verification flow
- Role-based access control (Admin, Fundraiser, Collaborator, Backer, Donor)
- Auth middleware for API routes
- Protected route wrapper for React routes

### 1.4 Core API Structure
- RESTful API with versioned endpoints (`/api/v1/...`)
- Request validation middleware
- Error handling middleware
- File upload middleware (multer)
- Rate limiting
- CORS configuration
- Logging

**Deliverables:**
- [ ] Running React app with auth pages (login, register, forgot password)
- [ ] Database schema migrated
- [ ] Auth API endpoints working
- [ ] Basic project structure in place

---

## Phase 2: Campaign Management System

**Duration:** ~3-4 weeks

### 2.1 Campaign Data Model & CRUD API
- Campaign CRUD endpoints (create, read, update, delete)
- Campaign status management (draft, pending_review, published, ended, archived)
- Campaign mode support (donation vs crowdfunding)
- Campaign image/media upload
- Campaign slug/permalink generation
- Bulk campaign actions
- Campaign trash/restore/empty-trash

### 2.2 Campaign Builder (Multi-Step Wizard)
React component replicating the Growfund campaign builder:

**Step 1 - Basic Information:**
- Campaign title
- Short description
- Full description (rich text editor)
- Featured image upload
- Campaign video URL
- Category selection
- Tags

**Step 2 - Goal & Duration:**
- Funding goal amount
- Currency selection
- Campaign deadline/date picker
- Platform fee settings (per-campaign)

**Step 3 - Rewards (Crowdfunding Mode):**
- Add/edit/remove reward tiers
- Each reward: title, description, amount, delivery date, quantity limit
- Reward item management
- Drag-and-drop reordering

**Step 4 - Additional Settings:**
- Collaborator assignment
- Fundraiser assignment (admin)
- Comment settings
- FAQ section
- Social sharing options

**Step 5 - Preview & Publish:**
- Campaign preview
- Submit for review / Publish directly

### 2.3 Campaign Listing & Discovery
- Public campaign archive page with React-powered listing
- Campaign card component (image, title, goal progress, category, author)
- Campaign filtering (by category, tag, status, mode, date range)
- Campaign sorting (newest, most funded, ending soon, popular)
- Search functionality
- Infinite scroll / pagination
- Featured campaigns section
- Campaign slider component

### 2.4 Campaign Single Page
- Campaign detail page with all information
- Campaign progress bar (goal vs raised)
- Campaign countdown timer
- Campaign image gallery / media slider
- Campaign tabs (Content, Rewards, Updates, Comments, FAQ)
- Social sharing buttons
- Bookmark/unbookmark campaign
- Donate/Pledge CTA button
- Campaign author info card
- Related campaigns section

### 2.5 Campaign Updates & Comments
- Campaign post updates (fundraiser/admin)
- Update listing with pagination
- Campaign comments system
- Comment replies
- Comment moderation

### 2.6 Categories & Tags
- Category CRUD (admin)
- Tag CRUD (admin)
- Category/tag assignment to campaigns

**Deliverables:**
- [ ] Campaign CRUD API working
- [ ] Campaign builder wizard UI complete
- [ ] Campaign listing page with filters
- [ ] Campaign single page with tabs
- [ ] Categories and tags management

---

## Phase 3: Payment Processing & Checkout

**Duration:** ~3-4 weeks

### 3.1 Payment Gateway Architecture
Abstract payment gateway system replicating Growfund's architecture:

- `PaymentGateway` interface/contract with methods:
  - `charge(amount, paymentMethod, metadata)` -> PaymentResponse
  - `refund(transactionId, amount)` -> RefundResponse
  - `verify(webhookPayload)` -> WebhookResponse
  - `getConfiguration()` -> GatewayConfig
- Gateway discovery and registration system
- Base payment gateway class with common utilities
- DTOs for all payment data transfers

### 3.2 PayPal Integration
Replicate Growfund's PayPal REST API v2 integration:
- PayPal OAuth setup
- Order creation (CAPTURE intent)
- Order capture
- Webhook handling:
  - `CHECKOUT.ORDER.APPROVED`
  - `PAYMENT.CAPTURE.COMPLETED`
  - `PAYMENT.CAPTURE.REFUNDED`
  - `VAULT.PAYMENT-TOKEN.CREATED`
- Vault setup tokens for saved payment methods
- Refund processing
- PayPal client ID/secret configuration

### 3.3 Stripe Integration
- Stripe setup (Elements, PaymentIntents)
- Card payment processing
- Webhook handling (payment_intent.succeeded, etc.)
- Stripe key configuration

### 3.4 Offline Payment
- Bank transfer instructions
- Manual payment recording by admin
- Offline payment status tracking

### 3.5 Donation Checkout Flow
React checkout page replicating Growfund:

**Donation Mode Checkout:**
1. Donor selects/enters donation amount
2. Optional: Anonymous donation toggle
3. Optional: Company donation info
4. Optional: Tribute donation (in honor/memory of someone)
5. Fee recovery option (cover processing fees)
6. Personal information form
7. Payment method selection (PayPal, Stripe, Offline)
8. Payment processing
9. Success/failure confirmation
10. Email receipt sent

**Crowdfunding/Pledge Mode Checkout:**
1. Backer selects reward tier (or no reward)
2. Pledge amount (must meet reward minimum)
3. Shipping information (if applicable)
4. Notes to fundraiser
5. Fee recovery option
6. Payment processing
7. Success/failure confirmation
8. Email confirmation sent

### 3.6 WooCommerce Integration (Optional)
- WooCommerce detection and integration
- Virtual product creation for transactions
- Cart/checkout integration
- Order status sync
- Custom checkout fields

### 3.7 Payment Confirmation & Receipts
- Payment success page
- Payment failure handling
- Receipt generation (PDF)
- E-card generation for donations
- Receipt download endpoints

**Deliverables:**
- [ ] Payment gateway architecture implemented
- [ ] PayPal integration working end-to-end
- [ ] Stripe integration working
- [ ] Offline payment flow working
- [ ] Donation checkout page complete
- [ ] Pledge checkout page complete
- [ ] Receipt generation working

---

## Phase 4: User Dashboards & Role Management

**Duration:** ~3-4 weeks

### 4.1 User Roles & Permissions System
5 roles from Growfund:
- **Admin** - Full platform control
- **Fundraiser** - Create/manage own campaigns, view earnings, request withdrawals
- **Collaborator** - Edit assigned campaigns only
- **Backer** - Pledge to campaigns, manage pledges
- **Donor** - Make donations, view history

Role-based route protection in React and API middleware.

### 4.2 Admin Dashboard (React SPA)
Main admin dashboard replicating Growfund's React SPA:

**Dashboard Home:**
- Key metrics cards (total raised, campaigns, donations, pledges)
- Revenue chart (daily/weekly/monthly/yearly)
- Recent contributions table
- Top campaigns list
- Activity feed

**Campaign Management:**
- Campaigns data table with columns (title, author, status, goal, raised, date)
- Bulk actions (publish, archive, delete)
- Campaign approval workflow
- Campaign status filters
- Campaign search

**Donation Management:**
- Donations data table
- Donation details modal
- Donation status management
- Refund processing

**Pledge Management:**
- Pledges data table
- Pledge details with reward info
- Pledge status management
- Charge backers functionality

**Donor Management:**
- Donors list with stats
- Donor detail view
- Annual receipts

**Backer Management:**
- Backers list with stats
- Backer pledge history

**Fund Management (Pro):**
- Funds CRUD
- Fund revenue tracking
- Assign campaigns to funds

**Fundraiser Management (Pro):**
- Fundraiser list with approval status
- Approve/decline fundraisers
- Fundraiser overview (campaigns, earnings, activities)
- Make user a fundraiser

**Collaborator Management:**
- Assign collaborators to campaigns
- Collaborator listing

**Analytics:**
- Revenue charts over time
- Top campaigns, backers, donors
- Contributor trends
- Revenue breakdown by fund/campaign
- Metrics cards with trends

**Categories & Tags Management:**
- CRUD for categories
- CRUD for tags

**Themes Management:**
- Frontend theme/color customization
- Logo upload

**Settings Pages:**
- General Settings (org name, location, contact)
- Page Settings (page assignments)
- Campaign Settings (login required, contributor display, comments, social shares)
- Payment Settings (engine selection, currency, platform fee, gateway config)
- Email & Notification Settings (template management)
- Security Settings (spam protection, email verification)
- Permission Settings (anonymous contributions, contributor comments)
- Advanced Settings (permalink, advanced config)
- Branding Settings (logo, colors, typography)
- PDF Receipt Settings

### 4.3 Fundraiser Dashboard
Fundraiser-specific dashboard (Pro feature):

**Overview:**
- My campaigns count and stats
- Total earnings
- Pending withdrawals
- Activity graph

**My Campaigns:**
- Campaigns I've created
- Campaign status tracking
- Post updates

**Earnings:**
- Wallet balance
- Transaction history
- Earnings by campaign

**Withdrawals:**
- Request withdrawal
- Withdrawal history
- Payout method management

### 4.4 Backer/Donor Dashboard
User-facing dashboard for donors and backers:

**Donor Dashboard:**
- Donation history
- Annual receipts
- Bookmarked campaigns
- Profile settings
- Notification preferences

**Backer Dashboard:**
- Pledge history
- Backed campaigns
- Reward delivery status
- Bookmarked campaigns
- Profile settings

### 4.5 User Profile & Settings
- Profile editing (name, avatar, bio)
- Password change
- Notification preferences
- Email preferences
- Account deletion
- Email verification status

**Deliverables:**
- [ ] Admin dashboard SPA with all sections
- [ ] Fundraiser dashboard
- [ ] Donor/Backer dashboard
- [ ] Role-based access control working
- [ ] Settings pages functional
- [ ] Analytics charts displaying

---

## Phase 5: Wallet, Withdrawals & Platform Fees

**Duration:** ~2-3 weeks

### 5.1 Wallet System
- Per-fundraiser wallet creation
- Balance tracking (earnings - withdrawals - platform fees)
- Wallet info endpoint
- Transaction history with filtering

### 5.2 Wallet Transaction Synchronization
- Sync completed donations/pledges into wallet earning transactions
- Handle both donation and crowdfunding modes
- Platform fee calculation per campaign
- Transaction types: earning, platform_fee, withdrawal_request, withdrawal_approval, withdrawal_rejection
- Transaction actions: credit, debit
- Transaction statuses: pending, completed

### 5.3 Withdrawal Management
**Fundraiser Side:**
- Request withdrawal form
- Select amount (up to available balance)
- Choose payout method (PayPal, Bank, Other)
- Bank details entry (IBAN, USD, CAD, AUD, GBP, BEFTN formats)
- Upload bank verification document
- Upload invoice attachment
- Withdrawal history

**Admin Side:**
- Withdrawal requests list
- Review withdrawal request details
- Approve/reject with notes
- Download invoice attachments
- Bank document verification
- Withdrawal status updates trigger wallet updates

### 5.4 Platform Fee System
- Global platform fee configuration (percentage or fixed)
- Per-campaign platform fee override
- Fee calculation on completed transactions
- Fee deduction from wallet
- Fee reporting in analytics

### 5.5 Recurring Payments & Scheduling
- Recurring donation support
- Scheduled task system (equivalent to Action Scheduler):
  - Charge backers with saved payment methods
  - Process queued emails
  - Handle recurring payment processing
  - Stop cancelled recurring payments
- Cron/scheduler setup

**Deliverables:**
- [ ] Wallet system operational
- [ ] Transaction sync working
- [ ] Withdrawal request/approval flow complete
- [ ] Platform fee calculation working
- [ ] Scheduled tasks configured

---

## Phase 6: Email System & Notifications

**Duration:** ~2 weeks

### 6.1 Email Infrastructure
- Email service abstraction (nodemailer/Resend/SendGrid)
- SMTP configuration in settings
- Email queue system
- Template engine (Handlebars/MJML for responsive emails)

### 6.2 Email Templates
Replicate Growfund's 40+ email templates:

**Donor Mails:**
- Donation receipt
- Donation failed notification
- Offline donation instructions

**Backer Mails:**
- Pledge created confirmation
- Pledge paid confirmation
- Pledge cancelled notification
- Pledge payment unsuccessful
- Offline pledge request
- Local pickup instructions
- Giving thank you (pledge paid)

**Fundraiser Mails:**
- Account approved/declined
- New donation notification
- New pledge notification
- Campaign funded notification
- Campaign ended notification

**Admin Mails:**
- New user registration
- Campaign submitted for review
- Withdrawal request received
- New donation/pledge alerts

**System Mails:**
- Email verification
- Password reset link
- Test email

### 6.3 Notification System
- In-app notification center
- Email notification preferences per user
- Notification batching/digest options

### 6.4 Email Template Editor
- Admin UI to customize email templates
- Preview functionality
- Restore defaults option
- Variable interpolation support

**Deliverables:**
- [ ] Email service configured
- [ ] All 40+ email templates created
- [ ] Email queue working
- [ ] Notification preferences functional
- [ ] Template editor in admin

---

## Phase 7: Analytics, Reporting & PDF Receipts

**Duration:** ~2 weeks

### 7.1 Analytics Dashboard
Replicate Growfund's analytics:

**Overview Metrics:**
- Total amount raised
- Number of campaigns
- Number of donations/pledges
- Number of backers/donors

**Charts:**
- Revenue over time (line chart - daily/weekly/monthly/yearly)
- Revenue breakdown by campaign/fund (pie/donut chart)
- Top campaigns by amount raised
- Top backers/donors by contribution
- Contributor trends over time
- Campaign performance comparison

**Filters:**
- Date range selection
- Campaign filter
- Fund filter (Pro)
- Mode filter (donation vs crowdfunding)

### 7.2 Reporting
- Campaign-specific reports
- Fund-level reports (Pro)
- Fundraiser earnings reports
- Annual donor receipts
- Exportable reports (CSV/PDF)

### 7.3 PDF Receipt Generation
Replicate Growfund's PDF receipt system:
- PDF receipt for donations
- PDF receipt for pledges
- Customizable receipt templates
- Receipt with company details, tax info
- Downloadable from admin and user dashboards
- E-card generation for donation gifts

### 7.4 Campaign Snapshots
- Historical campaign state tracking
- Snapshot on key events (funded, ended, milestone)
- Snapshot comparison view

**Deliverables:**
- [ ] Analytics dashboard with all charts
- [ ] Date range filtering working
- [ ] PDF receipt generation
- [ ] Annual receipt system
- [ ] Campaign snapshots

---

## Phase 8: Campaign Export/Import & Advanced Features

**Duration:** ~2 weeks

### 8.1 Campaign Export/Import
- Export campaign data (JSON/CSV)
- Import campaigns from export file
- Campaign duplication feature
- Bulk import

### 8.2 Migration System
- Data migration from other platforms
- Database migration runner
- Version tracking

### 8.3 Onboarding Wizard
- First-run setup wizard
- Page generation (create required pages)
- Basic settings configuration
- Sample data option

### 8.4 Social Features
- Social sharing (Facebook, Twitter, LinkedIn, WhatsApp)
- Campaign bookmarking
- Share count tracking

### 8.5 Search & Filtering
- Full-text search across campaigns
- Advanced filter combinations
- Saved searches / favorites

### 8.6 Block & Classic Theme Support
- Block theme templates (React components)
- Classic theme templates (server-rendered)
- Theme switching in admin
- Custom CSS/JS injection via branding settings

**Deliverables:**
- [ ] Campaign export/import working
- [ ] Onboarding wizard complete
- [ ] Social sharing functional
- [ ] Theme system in place

---

## Phase 9: Testing, Optimization & Deployment

**Duration:** ~2-3 weeks

### 9.1 Testing
- Unit tests for services and utilities (Vitest)
- Component tests for React components (React Testing Library)
- API integration tests
- E2E tests for critical flows (Playwright):
  - User registration and login
  - Campaign creation and publishing
  - Donation flow end-to-end
  - Pledge flow end-to-end
  - Withdrawal request and approval
- Payment gateway mock tests

### 9.2 Performance Optimization
- Code splitting and lazy loading
- Image optimization (WebP, lazy loading)
- API response caching
- Database query optimization
- Bundle size analysis
- Lighthouse audit and fixes

### 9.3 Security
- Input sanitization
- CSRF protection
- SQL injection prevention (Prisma handles this)
- XSS prevention
- Rate limiting
- File upload validation
- Payment data encryption
- Secrets management

### 9.4 Accessibility
- WCAG 2.1 compliance
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management

### 9.5 Deployment
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Staging environment
- Production environment
- Database migration strategy
- Environment variable management
- SSL/HTTPS setup
- Domain configuration

### 9.6 Documentation
- API documentation (Swagger/OpenAPI)
- Developer documentation
- User guide
- Deployment guide
- Environment setup guide

**Deliverables:**
- [ ] All tests passing
- [ ] Performance optimized
- [ ] Security audit complete
- [ ] Deployment pipeline working
- [ ] Documentation complete

---

## Phase 10: Polish & Launch

**Duration:** ~1-2 weeks

### 10.1 UI/UX Polish
- Responsive design verification across devices
- Loading states and skeletons
- Error boundaries and fallback UIs
- Toast/notification system
- Confirmation dialogs
- Form validation UX
- Empty states
- 404/500 error pages

### 10.2 Final Integration Testing
- Complete user journey testing
- Payment flow verification with real/sandbox credentials
- Email delivery testing
- Cross-browser testing
- Mobile responsiveness

### 10.3 Launch Preparation
- Production database setup
- Media storage setup (S3/CDN)
- Email service production config
- Payment gateway production credentials
- Monitoring and alerting setup (Sentry, logging)
- Backup strategy

### 10.4 Post-Launch
- Bug tracking and fixes
- User feedback collection
- Performance monitoring
- Feature iteration planning

**Deliverables:**
- [ ] Production deployment live
- [ ] Monitoring active
- [ ] Backup strategy in place
- [ ] Launch complete

---

## Summary Timeline

| Phase | Description | Duration |
|-------|-------------|----------|
| 1 | Project Foundation & Core Infrastructure | 2-3 weeks |
| 2 | Campaign Management System | 3-4 weeks |
| 3 | Payment Processing & Checkout | 3-4 weeks |
| 4 | User Dashboards & Role Management | 3-4 weeks |
| 5 | Wallet, Withdrawals & Platform Fees | 2-3 weeks |
| 6 | Email System & Notifications | 2 weeks |
| 7 | Analytics, Reporting & PDF Receipts | 2 weeks |
| 8 | Campaign Export/Import & Advanced Features | 2 weeks |
| 9 | Testing, Optimization & Deployment | 2-3 weeks |
| 10 | Polish & Launch | 1-2 weeks |
| **Total** | | **~22-31 weeks** |

---

## Key Features Reference (from Growfund)

### Free Version Features
- Dual fundraising modes (Donation + Crowdfunding)
- 5 user roles (Admin, Fundraiser, Collaborator, Backer, Donor)
- Campaign creation with rich editor
- Campaign builder wizard (5 steps)
- PayPal payment gateway (REST API v2)
- WooCommerce integration
- Offline payments
- 40+ email templates
- Campaign comments and updates
- Campaign bookmarks
- Social sharing
- Categories and tags
- Campaign filtering and search
- Analytics dashboard
- PDF receipt generation
- Migration from WP Crowdfunding
- Onboarding wizard

### Pro Version Features
- Fundraiser role management with approval workflow
- Collaborator role with limited access
- Fund management system
- Fundraiser wallet with balance tracking
- Withdrawal request/approve/reject workflow
- Platform fee configuration (per-campaign or global)
- Campaign duplication
- Anonymous donations
- Company donations
- Tribute donations
- Campaign FAQs
- Campaign scheduling
- Campaign export/import
- Email verification
- Branding customization
- Fine-grained permission settings
- Fundraiser activity logs
- Payout method management (PayPal, Bank, Other)
- Bank details document upload
- Stripe payment gateway (installable)
- Revenue analytics per fund
- Fundraiser earnings reports
- Withdrawal invoices

---

## File Structure Target

```
FundorDonate/
├── apps/
│   ├── web/                          # React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Shared UI (Button, Input, Modal, etc.)
│   │   │   │   ├── campaign/         # Campaign components
│   │   │   │   ├── checkout/         # Checkout components
│   │   │   │   ├── dashboard/        # Dashboard components
│   │   │   │   ├── analytics/        # Analytics charts
│   │   │   │   ├── email/            # Email template components
│   │   │   │   └── settings/         # Settings components
│   │   │   ├── pages/
│   │   │   │   ├── public/           # Public pages (home, campaign, checkout)
│   │   │   │   ├── admin/            # Admin dashboard pages
│   │   │   │   ├── fundraiser/       # Fundraiser dashboard
│   │   │   │   ├── donor/            # Donor dashboard
│   │   │   │   ├── auth/             # Auth pages
│   │   │   │   └── settings/         # Settings pages
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── stores/               # Zustand stores
│   │   │   ├── services/             # API service calls
│   │   │   ├── types/                # TypeScript types
│   │   │   ├── utils/                # Utility functions
│   │   │   ├── styles/               # Global styles
│   │   │   └── assets/               # Static assets
│   │   └── package.json
│   │
│   └── api/                          # Backend API
│       ├── src/
│       │   ├── controllers/          # Route handlers
│       │   ├── services/             # Business logic
│       │   ├── models/               # Prisma models
│       │   ├── middleware/            # Auth, validation, error handling
│       │   ├── routes/               # API route definitions
│       │   ├── validators/           # Input validation schemas
│       │   ├── utils/                # Utility functions
│       │   ├── config/               # Configuration
│       │   ├── jobs/                 # Scheduled tasks
│       │   └── templates/            # Email templates (MJML)
│       ├── prisma/
│       │   ├── schema.prisma         # Database schema
│       │   └── migrations/           # Database migrations
│       └── package.json
│
├── packages/
│   ├── ui/                           # Shared UI component library
│   ├── types/                        # Shared TypeScript types
│   └── utils/                        # Shared utilities
│
├── docs/                             # Documentation
├── scripts/                          # Build/deploy scripts
├── docker-compose.yml                # Local development
├── package.json                      # Root package.json
└── DEVELOPMENT_PLAN.md               # This file
```
