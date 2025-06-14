# 🎯 **Market Sharing Feature Implementation TODO**

## 📋 **Project Overview**

This document outlines the comprehensive implementation plan for adding market sharing functionality to the Kuri application. The feature will enable users to share market links after creation and provide share buttons on all market cards for external distribution.

---

## 🏗️ **Codebase Architecture Context**

### **Current Tech Stack**

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **Routing**: React Router v6
- **State Management**: React Hooks + Context API
- **Web3**: Wagmi + Viem
- **GraphQL**: Apollo Client
- **Database**: Supabase
- **Animations**: Framer Motion
- **UI Components**: Custom components with Radix UI primitives

### **Existing Route Structure**

```
├── / (Landing page)
├── /markets (Market list page)
├── /markets/:address (Market detail page) ← **ENHANCE THIS**
├── /dashboard (User dashboard)
├── /u/:identifier (User profiles)
└── /onboarding (User onboarding)
```

### **Current Design System**

- **Primary Colors**:
  - Terracotta: `#C84E31` (buttons, CTAs)
  - Gold: `#B8860B` (accents, highlights)
  - Sand: `#F5F5DC` (backgrounds)
  - Forest: `#228B22` (success states)
- **Typography**: Inter (body), General Sans (headings), DM Mono (monospace)
- **Border Radius**: 1rem (cards), 2rem (modals), rounded-xl (buttons)
- **Shadows**: Subtle with hover states
- **Animations**: 300ms transitions, hover lift effects

### **Key Components to Enhance**

- `MarketCard.tsx` - Add share button
- `CreateMarketForm.tsx` - Add post-creation share flow
- `MarketDetail.tsx` - Enhance as shareable page
- Route `/markets/:address` - Transform into share-optimized page

---

## 🎨 **UI/UX Design Guidelines**

### **Brand Consistency Requirements**

- Maintain earth-tone color palette (terracotta, gold, sand)
- Follow existing button styling patterns
- Use consistent border radius (rounded-xl for buttons, rounded-2xl for cards)
- Preserve hover animations and subtle shadows
- Maintain responsive design patterns (mobile-first approach)

### **Share Button Design Specifications**

- **Style**: Circular button with subtle shadow, consistent with existing icon buttons
- **Colors**: White background with terracotta border, hover state with terracotta background
- **Icon**: Share-2 or ExternalLink from Lucide React (already in use)
- **Position**: Top-right corner of MarketCard with absolute positioning
- **Size**: 40px × 40px (touch-friendly on mobile)

### **Share Modal Design**

- **Background**: White with rounded-2xl corners (consistent with CreateMarketForm)
- **Layout**: Similar structure to existing modals
- **Colors**: Terracotta accents, gold highlights, sand backgrounds
- **Typography**: Existing font hierarchy
- **Buttons**: Consistent with current button variants

---

## 📱 **Mobile-First Considerations**

### **Responsive Breakpoints** (Following existing patterns)

- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px

### **Mobile Optimizations**

- Native Web Share API support
- Touch-friendly button sizes (minimum 44px)
- Full-screen modals on small screens
- Swipe gestures for modal dismissal
- Optimized link copying for mobile keyboards

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation & Routing Enhancement**

**Duration**: 2-3 days  
**Priority**: Critical

#### **1.1 URL Structure & Validation**

- [ ] **File**: `src/utils/urlGenerator.ts`

  - Create `generateMarketShareUrl(address: string)` utility
  - Add contract address validation (0x + 40 hex characters)
  - Add environment-based base URL handling
  - Add address checksumming for consistency

- [ ] **File**: `src/utils/validation.ts`
  - Add `isValidContractAddress(address: string)` function
  - Add error handling for invalid addresses
  - Add redirect logic for malformed URLs

#### **1.2 Enhanced Market Detail Route**

- [ ] **File**: `src/pages/MarketDetail.tsx` (ENHANCE EXISTING)

  - Add SEO meta tags with dynamic market data
  - Add Open Graph tags for social media previews
  - Add Twitter Card meta tags
  - Improve loading states and error handling
  - Add 404 fallback for invalid market addresses

- [ ] **File**: `src/components/seo/MarketSEO.tsx` (NEW)
  - Dynamic meta tag generation component
  - Social media preview optimization
  - Market-specific title and description generation

#### **1.3 Route Security & Performance**

- [ ] Add market address validation middleware
- [ ] Implement proper loading states for shared links
- [ ] Add error boundaries for market page failures
- [ ] Add analytics tracking for shared link visits (optional)

---

### **Phase 2: Core Sharing Infrastructure**

**Duration**: 3-4 days  
**Priority**: Critical

#### **2.1 Share Utility Functions**

- [ ] **File**: `src/utils/shareUtils.ts` (NEW)
  - `copyToClipboard(text: string)` with fallback handling
  - `generateShareText(market: KuriMarket, customMessage?: string)`
  - `getShareUrl(marketAddress: string)` with environment handling
  - `detectWebShareSupport()` for browser capability detection

#### **2.2 Share Hook Development**

- [ ] **File**: `src/hooks/useShare.ts` (NEW)
  - Web Share API integration with fallbacks
  - Toast notifications for success/error states
  - Platform-specific share URL generation (Twitter, Telegram, WhatsApp)
  - Share analytics tracking (optional)

#### **2.3 Platform-Specific Share URLs**

- [ ] **File**: `src/constants/shareTemplates.ts` (NEW)
  - Default share message templates
  - Platform-specific URL patterns
  - Customizable message formatting
  - Character limit handling for different platforms

---

### **Phase 3: Market Card Share Button**

**Duration**: 2-3 days  
**Priority**: High

#### **3.1 Share Button Component**

- [ ] **File**: `src/components/ui/ShareButton.tsx` (NEW)
  - Circular button design matching brand guidelines
  - Hover animations and transitions
  - Loading states during share operations
  - Accessibility features (ARIA labels, keyboard navigation)

#### **3.2 Market Card Enhancement**

- [ ] **File**: `src/components/markets/MarketCard.tsx` (ENHANCE EXISTING)
  - Add share button to top-right corner
  - Ensure share button doesn't interfere with card click events
  - Add share button visibility logic (always visible vs hover-only)
  - Maintain responsive design across breakpoints

#### **3.3 Share Button Integration**

- [ ] Add share button click event handling
- [ ] Prevent event bubbling to card click
- [ ] Add loading states during share operations
- [ ] Add success feedback (toast notifications)

---

### **Phase 4: Share Modal & Options**

**Duration**: 3-4 days  
**Priority**: High

#### **4.1 Share Modal Component**

- [ ] **File**: `src/components/modals/ShareModal.tsx` (NEW)
  - Modal structure consistent with existing modals
  - Social media platform grid (2x3 layout)
  - Copy link section with success feedback
  - QR code generation for mobile sharing
  - Custom message editing capability

#### **4.2 Social Media Integration**

- [ ] **File**: `src/components/share/SocialShareButtons.tsx` (NEW)
  - Twitter/X share button with pre-filled text
  - Telegram share integration
  - WhatsApp share for mobile devices
  - Email share with mailto links
  - Generic social media button component

#### **4.3 Share Modal Triggers**

- [ ] Integrate modal with share buttons
- [ ] Add keyboard shortcuts (Cmd/Ctrl + Shift + S)
- [ ] Add share modal accessibility features
- [ ] Add mobile-optimized modal behavior

---

### **Phase 5: Post-Creation Share Flow**

**Duration**: 2-3 days  
**Priority**: High

#### **5.1 Create Market Form Enhancement**

- [ ] **File**: `src/components/markets/CreateMarketForm.tsx` (ENHANCE EXISTING)
  - Add share success component after market creation
  - Modify success flow to include sharing options
  - Add confetti animation for successful creation
  - Add "Share with Community" call-to-action

#### **5.2 Post-Creation Share Component**

- [ ] **File**: `src/components/markets/PostCreationShare.tsx` (NEW)
  - Success message with sharing prompt
  - Pre-generated share link display
  - Social media sharing options
  - "Invite your community" messaging
  - Navigation options (Go to Market/Continue Sharing)

#### **5.3 Create Market Success Flow**

- [ ] Add share prompt to success state
- [ ] Add automatic link generation after creation
- [ ] Add copy-to-clipboard functionality
- [ ] Add social media quick shares
- [ ] Add analytics for post-creation sharing

---

### **Phase 6: Enhanced Shareable Market Page**

**Duration**: 4-5 days  
**Priority**: Medium-High

#### **6.1 Market Hero Section**

- [ ] **File**: `src/components/markets/MarketHero.tsx` (NEW)
  - Large, prominent market card display
  - Enhanced visual design for social sharing
  - Call-to-action optimized for new visitors
  - Creator information and social proof

#### **6.2 Visitor Experience Optimization**

- [ ] **File**: `src/components/markets/MarketVisitorView.tsx` (NEW)
  - "What is this circle?" explanation section
  - "How it works" for newcomers
  - Trust indicators (member count, creator info)
  - Easy onboarding flow for visitors

#### **6.3 Social Proof Elements**

- [ ] **File**: `src/components/markets/SocialProof.tsx` (NEW)
  - Member avatars and testimonials
  - Activity feed display
  - Recent member actions
  - Trust and safety indicators

---

### **Phase 7: SEO & Social Media Optimization**

**Duration**: 2-3 days  
**Priority**: Medium

#### **7.1 Meta Tag Management**

- [ ] **File**: `src/hooks/useDynamicMeta.ts` (NEW)
  - Dynamic title generation based on market data
  - Description optimization for search engines
  - Image URL generation for social previews
  - Canonical URL handling

#### **7.2 Social Media Preview Optimization**

- [ ] Open Graph image generation
- [ ] Twitter Card optimization
- [ ] Facebook share preview testing
- [ ] LinkedIn share compatibility
- [ ] Discord/Telegram embed optimization

#### **7.3 Search Engine Optimization**

- [ ] Structured data markup for markets
- [ ] Sitemap generation for market pages
- [ ] Meta description optimization
- [ ] Title tag optimization

---

### **Phase 8: Mobile Native Integration**

**Duration**: 2-3 days  
**Priority**: Medium

#### **8.1 Web Share API Integration**

- [ ] **File**: `src/utils/nativeShare.ts` (NEW)
  - Web Share API implementation
  - Fallback to custom modal on unsupported devices
  - Share data formatting for native apps
  - Error handling for share failures

#### **8.2 Mobile-Specific Features**

- [ ] Native app detection and deep linking
- [ ] Mobile clipboard optimization
- [ ] Touch gesture support for sharing
- [ ] Mobile-optimized share text

#### **8.3 Progressive Web App Features**

- [ ] Add to home screen prompts for shared markets
- [ ] Offline support for shared market viewing
- [ ] Push notification setup for shared markets
- [ ] PWA share target registration

---

### **Phase 9: Analytics & Tracking**

**Duration**: 1-2 days  
**Priority**: Low-Medium

#### **9.1 Share Analytics**

- [ ] **File**: `src/utils/shareAnalytics.ts` (NEW)
  - Share button click tracking
  - Platform-specific share tracking
  - Conversion tracking (shares → joins)
  - Most shared markets analytics

#### **9.2 Performance Monitoring**

- [ ] Share modal load time tracking
- [ ] Social media preview generation performance
- [ ] Share link click-through rates
- [ ] User engagement with shared markets

---

### **Phase 10: Testing & Quality Assurance**

**Duration**: 2-3 days  
**Priority**: Critical

#### **10.1 Cross-Browser Testing**

- [ ] Chrome/Edge Web Share API testing
- [ ] Safari clipboard API compatibility
- [ ] Firefox share functionality
- [ ] Mobile browser testing (iOS Safari, Chrome Mobile)

#### **10.2 Social Media Platform Testing**

- [ ] Twitter/X share preview validation
- [ ] Facebook/Meta share preview testing
- [ ] LinkedIn share compatibility
- [ ] Discord/Telegram embed testing
- [ ] WhatsApp share functionality

#### **10.3 Responsive Design Testing**

- [ ] Mobile device testing (iOS/Android)
- [ ] Tablet interface optimization
- [ ] Desktop share modal functionality
- [ ] Accessibility testing (screen readers, keyboard navigation)

#### **10.4 User Experience Testing**

- [ ] Share flow usability testing
- [ ] Market page load performance testing
- [ ] Share link functionality validation
- [ ] Error state handling verification

---

## 🔗 **Technical Implementation Details**

### **Key Files to Create**

```
src/
├── components/
│   ├── modals/
│   │   └── ShareModal.tsx
│   ├── share/
│   │   ├── SocialShareButtons.tsx
│   │   └── ShareButton.tsx
│   ├── markets/
│   │   ├── MarketHero.tsx
│   │   ├── MarketVisitorView.tsx
│   │   ├── PostCreationShare.tsx
│   │   └── SocialProof.tsx
│   └── seo/
│       └── MarketSEO.tsx
├── hooks/
│   ├── useShare.ts
│   ├── useDynamicMeta.ts
│   └── useClipboard.ts
├── utils/
│   ├── shareUtils.ts
│   ├── urlGenerator.ts
│   ├── nativeShare.ts
│   ├── shareAnalytics.ts
│   └── validation.ts
└── constants/
    └── shareTemplates.ts
```

### **Key Files to Enhance**

```
src/
├── components/markets/
│   ├── MarketCard.tsx (add share button)
│   └── CreateMarketForm.tsx (add post-creation flow)
├── pages/
│   └── MarketDetail.tsx (enhance for sharing)
└── App.tsx (maintain existing routing)
```

---

## 🎯 **Success Metrics**

### **Phase Completion Criteria**

- [ ] **Phase 1-3**: Share buttons visible on all market cards
- [ ] **Phase 4-5**: Complete share modal with social media options
- [ ] **Phase 6-7**: Enhanced market pages with SEO optimization
- [ ] **Phase 8-10**: Mobile optimization and comprehensive testing

### **Quality Gates**

- [ ] All components follow existing design system
- [ ] No breaking changes to existing functionality
- [ ] Mobile responsiveness maintained across all breakpoints
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Performance impact minimal (< 5% bundle size increase)

### **Launch Readiness Checklist**

- [ ] Cross-browser compatibility verified
- [ ] Social media previews working correctly
- [ ] Share analytics implemented and tested
- [ ] Error handling comprehensive
- [ ] User acceptance testing completed

---

## 📝 **Implementation Notes**

### **Code Quality Standards**

- Follow existing TypeScript patterns and interfaces
- Maintain consistent component structure with other modal components
- Use existing utility functions where possible
- Follow established naming conventions
- Add comprehensive JSDoc comments for new utilities

### **Performance Considerations**

- Lazy load share modal components
- Optimize social media preview image generation
- Implement efficient caching for share URLs
- Minimize bundle size impact with tree shaking

### **Accessibility Requirements**

- Implement proper ARIA labels for share buttons
- Ensure keyboard navigation works correctly
- Add screen reader announcements for share actions
- Maintain focus management in share modals

### **⚠️ Critical Data Handling Guidelines**

- **NO MOCK DATA**: All components already have access to existing market data structures
- **Use Existing Interfaces**: Leverage current `KuriMarket` types and GraphQL schemas
- **No New Data Overhead**: Share functionality should work with existing market properties (address, title, description, member count, etc.)
- **Preserve Data Flow**: Maintain existing data fetching patterns and state management
- **Real Data Only**: All share URLs, previews, and meta tags must use actual market data
- **Existing API Integration**: Work with current market queries and mutations without modification

**Data Sources Already Available:**

- Market address (for URL generation)
- Market title and description (for share text)
- Member count and creator info (for social proof)
- Market status and activity (for previews)
- User authentication state (for personalized sharing)

---

**🎉 Total Estimated Timeline: 3-4 weeks**  
**👥 Recommended Team Size: 2-3 developers**  
**🔄 Testing & Review: 1 week additional**
