# MAKU Cross-Platform Integration Plan
## Plan Together + Travel Fund + Rewards + Off-Season + Footer Sync

---

## 🎯 Integration Requirements

### 1. **Plan Together Integration**
**Target Components:**
- Travel Fund Manager (LAXMI wallet)
- Smart Dreams
- Rewards system
- Off-Season Deals
- Gift Cards

**Integration Points:**
- Add "Invite Friends" button in Travel Fund → opens Plan Together
- Add "Plan Together" tab in Smart Dreams
- Connect collaborative budgets with LAXMI wallet
- Enable group booking for off-season deals
- Gift card sharing via Plan Together

### 2. **NFT Tier Synchronization**
**Update from:**
- Wanderer → Bronze (1% cashback)
- Explorer → Silver (3% cashback)
- Adventurer → Gold (6% cashback)
- Legend → Platinum (10% cashback)

**Files to Update:**
- `/app/frontend/src/pages/NFT.tsx`
- `/app/frontend/src/pages/Airdrop.tsx`
- `/app/frontend/src/pages/blockchain.tsx`
- Any reward calculation components

### 3. **Footer Links Audit**
**Verify Working:**
- All company links (About, Careers, Press, Credits)
- All product links (Hotels, Flights, Activities, Smart Dreams, Travel Fund, Gift Cards)
- All Smart Travel links (Dream Destinations, AI Travel DNA, Journey Planner)
- All technology links (AI Assistant, Travel Bot, Crypto Payments, etc.)
- All support links (Help Center, Community, Contact)

### 4. **Button Functionality**
**Ensure All Working:**
- NFT tier purchase buttons
- Airdrop claim buttons
- Travel Fund contribution buttons
- Smart Dreams action buttons
- Gift card purchase buttons

---

## 📋 Implementation Plan

### **Phase 1: NFT Tier Sync (30 min)**
- Update tier names in NFT.tsx
- Update tier names in Airdrop.tsx
- Update cashback percentages
- Update tier requirements (bookings: 1/10/50/100)
- Update prices ($0/$99/$299/$999)

### **Phase 2: Plan Together Integration (45 min)**
- Add collaborative budgeting feature to Travel Fund
- Add "Invite Friends" CTA in Travel Fund Manager
- Create Plan Together tab in Smart Dreams
- Add group booking option in off-season deals
- Enable gift card sharing

### **Phase 3: Footer Audit & Fix (20 min)**
- Test all footer links
- Remove broken/non-existent routes
- Add Off-Season Deals to footer
- Update Smart Travel section
- Verify all buttons work

### **Phase 4: Cross-Component Sync (25 min)**
- Ensure tier badges show consistently
- Wallet balance displays correctly
- Rewards sync across pages
- Off-season deals link from relevant sections

---

## 🔄 Integration Flow

```
Plan Together
    ↓
    ├─> Travel Fund (LAXMI) → Pool budgets, shared contributions
    ├─> Smart Dreams → Group destination voting
    ├─> Off-Season Deals → Group booking discounts
    ├─> Gift Cards → Share with travel buddies
    └─> Rewards → Split NFT rewards

NFT Tiers (Updated)
    ↓
    ├─> Bronze (1%) → $0, 1 booking required
    ├─> Silver (3%) → $99, 10 bookings required
    ├─> Gold (6%) → $299, 50 bookings required
    └─> Platinum (10%) → $999, 100 bookings required

All Components Sync With:
    ├─> LAXMI Wallet Balance
    ├─> NFT Membership Tier
    ├─> Cashback Calculator
    ├─> Off-Season Deal Matching
    └─> Gift Card Credits
```

---

## ✅ Success Criteria

- [ ] All NFT pages show Bronze/Silver/Gold/Platinum (not Wanderer/Explorer/etc.)
- [ ] Cashback percentages match (1%/3%/6%/10%)
- [ ] Plan Together accessible from Travel Fund and Smart Dreams
- [ ] All footer links tested and working
- [ ] All buttons functional (no dead clicks)
- [ ] Tier badges consistent across platform
- [ ] Group booking enabled for off-season
- [ ] Gift card sharing functional

---

## 🚀 Execution Order

1. NFT tier sync (high priority - data consistency)
2. Footer audit (high priority - broken links hurt UX)
3. Plan Together integration (medium priority - new feature enhancement)
4. Cross-component sync (medium priority - consistency)

---

**Estimated Time: 2 hours**
**Complexity: Medium-High (multiple components)**
**Risk: Low (mostly UI updates, no backend changes required)**
