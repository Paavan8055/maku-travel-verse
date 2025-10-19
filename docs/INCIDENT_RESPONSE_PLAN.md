# MAKU.Travel Incident Response Plan

## Quick Reference

**Emergency Contacts:**
- Primary On-Call: [Phone Number]
- Secondary On-Call: [Phone Number]
- CTO Escalation: [Phone Number]

**Key Links:**
- Status Page: https://status.maku.travel
- Sentry Dashboard: https://sentry.io/maku-travel
- Netlify Dashboard: https://app.netlify.com
- MongoDB Atlas: https://cloud.mongodb.com
- Supabase Dashboard: https://app.supabase.com

---

## Incident Classification

### P0 - Critical (Response Time: Immediate)

**Definition:** Complete service outage or critical functionality broken

**Examples:**
- Website completely down
- Payment processing not working
- Database inaccessible
- Mass user lockouts
- Data breach or security incident

**Response SLA:** 15 minutes
**Communication:** Every 30 minutes until resolved

---

### P1 - High (Response Time: 30 minutes)

**Definition:** Major functionality degraded affecting many users

**Examples:**
- Search functionality broken
- Blockchain features unavailable
- Slow API responses (>5s)
- Travel Fund creation failing
- Authentication issues for subset of users

**Response SLA:** 30 minutes
**Communication:** Every hour until resolved

---

### P2 - Medium (Response Time: 4 hours)

**Definition:** Non-critical features affected or minor performance issues

**Examples:**
- UI rendering issues
- Analytics not tracking
- Admin dashboard errors
- Slow page loads (<5s but degraded)
- Minor API errors (< 5% failure rate)

**Response SLA:** 4 hours
**Communication:** Daily updates

---

### P3 - Low (Response Time: Next business day)

**Definition:** Cosmetic issues or minor bugs

**Examples:**
- Typos or formatting issues
- Console warnings
- Minor accessibility issues
- Feature requests

**Response SLA:** Next business day
**Communication:** As needed

---

## Incident Response Process

### Phase 1: Detection & Alert (0-5 minutes)

**Automated Detection:**
- Sentry error spike alert
- Uptime monitor ping failure
- Performance threshold breach
- Error rate threshold (>1%)

**Manual Detection:**
- User report via support
- Team member observation
- Social media mention

**Actions:**
1. Acknowledge alert within 5 minutes
2. Create incident in tracking system
3. Assign severity level (P0-P3)
4. Notify on-call engineer

---

### Phase 2: Triage & Assessment (5-15 minutes)

**Assessment Questions:**
- [ ] What is the user impact?
- [ ] How many users affected?
- [ ] What functionality is broken?
- [ ] Is data at risk?
- [ ] Is this a security issue?

**Initial Checks:**
```bash
# Check service status
curl https://maku.travel/health
curl https://api.maku.travel/api/health

# Check Sentry for error patterns
# Open Sentry dashboard and review last 15 minutes

# Check server resources
ssh production-server
top  # CPU/Memory usage
df -h  # Disk space

# Check database
mongosh "mongodb+srv://..." --eval "db.stats()"
```

**Decision Tree:**

```
Is site completely down?
├─ YES → P0: Enable maintenance mode, investigate immediately
└─ NO  → Continue

Is payment/critical feature broken?
├─ YES → P0: Investigate and escalate
└─ NO  → Continue

Are >50% of users affected?
├─ YES → P1: High priority response
└─ NO  → Continue

Is this a security issue?
├─ YES → P0: Security protocol, escalate to CTO
└─ NO  → P1 or P2 depending on impact
```

---

### Phase 3: Communication (Immediate)

**Internal Communication:**

```
Slack #incidents channel:

🚨 [P0/P1/P2] INCIDENT DECLARED

**Impact:** [Brief description]
**Affected:** [Number/percentage of users]
**Started:** [Time]
**Status:** Investigating

**Actions Taken:**
- [List actions]

**Next Update:** [Time]
**Point of Contact:** @engineer-name
```

**External Communication (P0/P1 only):**

**Status Page Update:**
```
Status: Investigating
Component: [Affected service]
Started: [Time]

We're currently investigating reports of [issue]. 
Our team is actively working on a resolution. 
Updates will be posted every 30 minutes.

Next Update: [Time]
```

**Social Media (P0 only):**
```
Tweet:

We're aware of issues accessing maku.travel and 
are working on a fix. Follow https://status.maku.travel 
for updates. We appreciate your patience.
```

---

### Phase 4: Investigation & Diagnosis (15-45 minutes)

**Systematic Investigation:**

**1. Recent Changes:**
```bash
# Check recent deployments
git log --oneline -10

# Check Netlify deploys
# Review last 3 deployments in dashboard

# Check configuration changes
git diff HEAD~5 -- '*.env' '*.toml' '*.yml'
```

**2. Error Analysis:**
```bash
# Sentry: Look for patterns
- Common error messages
- Affected endpoints
- User agents/browsers
- Geographic distribution

# Backend logs
sudo tail -f /var/log/supervisor/maku-backend.err.log | grep ERROR

# Frontend errors
# Check browser console in Sentry session replay
```

**3. Resource Check:**
```bash
# Server resources
free -h  # Memory
df -h    # Disk
top      # CPU

# Database performance
# Check MongoDB Atlas metrics
# Look for slow queries

# Network connectivity
ping api.maku.travel
curl -I https://api.maku.travel/api/health
```

**4. Dependency Status:**
```bash
# Check external services
curl https://status.mongodb.com
curl https://status.supabase.com
# Check Polygon RPC status

# Test connections
node scripts/validate-environment.js
```

**Common Root Causes:**

| Issue | Symptoms | Quick Check |
|-------|----------|-------------|
| **Deployment Bug** | Errors after recent deploy | Check Sentry for new errors |
| **Database Connection** | 500 errors, timeouts | `mongosh` connection test |
| **Environment Vars** | Missing data, config errors | Check .env files |
| **Resource Exhaustion** | Slow responses, timeouts | `top`, `df -h`, `free` |
| **External API Down** | Specific feature broken | Test external API endpoints |
| **Rate Limiting** | 429 errors | Check rate limit logs |
| **Certificate Expired** | SSL warnings | `openssl s_client -connect maku.travel:443` |

---

### Phase 5: Resolution & Fix (Varies)

**Hotfix Process:**

```bash
# Create hotfix branch
git checkout -b hotfix/issue-description

# Make minimal changes to fix issue
# Test locally
yarn test:e2e --grep "critical"

# Commit and push
git commit -m "hotfix: [description]"
git push origin hotfix/issue-description

# Deploy via Netlify/platform
# Or for backend:
ssh production
cd maku-travel
git pull
sudo supervisorctl restart maku-backend
```

**Temporary Workarounds:**

**Disable Feature:**
```typescript
// Feature flag to disable broken feature
const FEATURE_ENABLED = false;

if (FEATURE_ENABLED) {
  // Broken feature code
}
```

**Fallback Mode:**
```python
# Fallback to cached data if API fails
try:
    data = fetch_from_api()
except Exception:
    data = get_cached_data()
```

**Maintenance Mode:**
```bash
# Enable maintenance page
cp maintenance.html dist/index.html
# Deploy
```

---

### Phase 6: Verification (10-30 minutes)

**Verification Checklist:**

- [ ] Error rate returned to normal (<0.1%)
- [ ] Affected functionality working
- [ ] No new errors in Sentry
- [ ] Performance metrics normal
- [ ] User reports stopped
- [ ] Monitoring stable for 15 minutes

**Testing:**
```bash
# Run smoke tests
cd /app/frontend
yarn test:e2e --grep "smoke"

# Test affected functionality manually
# Test on multiple browsers/devices
```

---

### Phase 7: Communication & Closure (15 minutes)

**Update Status Page:**
```
Status: Resolved
Duration: [Time]

Issue has been resolved. All systems are operational.
The issue was caused by [brief explanation].
We've implemented [fix] to prevent recurrence.

If you continue experiencing issues, please contact support.
```

**Internal Communication:**
```
Slack #incidents:

✅ INCIDENT RESOLVED

**Duration:** [X hours Y minutes]
**Root Cause:** [Brief explanation]
**Fix Applied:** [What we did]
**Affected Users:** [Number/percentage]

**Post-Mortem:** Will be conducted within 48 hours
**Follow-up Tasks:** [Ticket links]
```

**Close Incident:**
- Mark incident as resolved in tracking system
- Update timeline with all actions taken
- Archive communication threads
- Schedule post-mortem (P0/P1 only)

---

## Post-Incident Activities

### Post-Mortem (P0/P1 within 48 hours)

**Template:**

```markdown
# Post-Mortem: [Incident Title]

**Date:** [Date]
**Duration:** [Start] to [End] ([Duration])
**Severity:** P0/P1
**Impact:** [Number] users affected

## Timeline

**[Time]:** Incident detected
**[Time]:** Response began
**[Time]:** Root cause identified
**[Time]:** Fix deployed
**[Time]:** Verified resolved

## Root Cause

[Detailed explanation of what caused the incident]

## What Went Well

- [Positive aspect 1]
- [Positive aspect 2]

## What Went Wrong

- [Issue 1]
- [Issue 2]

## Action Items

1. [ ] [Preventive measure] - Owner: [Name] - Due: [Date]
2. [ ] [Process improvement] - Owner: [Name] - Due: [Date]
3. [ ] [Documentation update] - Owner: [Name] - Due: [Date]

## Lessons Learned

[Key takeaways for future incidents]
```

---

## Runbooks for Common Incidents

### Runbook 1: Website Down (P0)

**Symptoms:**
- 502/503 errors
- Site unreachable
- Uptime monitor alerts

**Quick Diagnosis:**
```bash
# Check frontend hosting
curl -I https://maku.travel
# If 502/503: Backend issue
# If timeout: DNS/network issue

# Check backend
ssh production-server
sudo supervisorctl status maku-backend
# If STOPPED: restart it
sudo supervisorctl start maku-backend
```

**Resolution Steps:**
1. Enable maintenance mode
2. Restart backend service
3. Check logs for errors
4. Verify database connectivity
5. Redeploy if needed
6. Monitor for 15 minutes

**Prevention:**
- Implement health checks
- Add auto-restart on failure
- Set up load balancer

---

### Runbook 2: Payment Failures (P0)

**Symptoms:**
- Users can't complete bookings
- Payment errors in Sentry
- Support tickets about payments

**Quick Diagnosis:**
```bash
# Check payment provider status
curl https://status.stripe.com

# Check payment logs
grep -i "payment" /var/log/maku/backend.log | tail -50

# Test payment endpoint
curl -X POST https://api.maku.travel/api/checkout/test
```

**Resolution Steps:**
1. Check provider API status
2. Verify API keys valid
3. Check rate limits
4. Review recent code changes
5. Enable fallback payment method
6. Contact provider support if needed

---

### Runbook 3: Database Connection Issues (P0)

**Symptoms:**
- 500 errors across site
- "Connection refused" in logs
- All features broken

**Quick Diagnosis:**
```bash
# Test database connection
mongosh "mongodb+srv://..." --eval "db.stats()"

# Check connection string
echo $MONGO_URL

# Check MongoDB Atlas status
# Visit dashboard and check cluster status
```

**Resolution Steps:**
1. Verify MongoDB Atlas cluster running
2. Check IP whitelist (if using)
3. Verify credentials valid
4. Check connection string format
5. Review connection pool settings
6. Restart backend if needed

---

### Runbook 4: Slow Performance (P1)

**Symptoms:**
- Page loads >5 seconds
- API responses slow
- User complaints

**Quick Diagnosis:**
```bash
# Check server resources
top
free -h
df -h

# Check database performance
# MongoDB Atlas → Performance tab

# Check API response times
curl -w "@curl-format.txt" https://api.maku.travel/api/health
```

**Resolution Steps:**
1. Identify slow endpoint (Sentry performance)
2. Check database slow queries
3. Review recent code changes
4. Scale resources if needed
5. Add caching if appropriate
6. Optimize database queries

---

## Escalation Procedures

### When to Escalate

**Immediate Escalation (to CTO):**
- Data breach or security incident
- Unable to resolve P0 in 1 hour
- Legal/compliance issue
- Media attention

**Escalation Chain:**
```
On-Call Engineer
    ↓
Senior Engineer
    ↓
Engineering Lead
    ↓
CTO
    ↓
CEO (if needed)
```

### How to Escalate

1. Call next person in chain
2. Provide brief situation summary
3. Share incident tracking link
4. Continue working while awaiting response

---

## Tools & Resources

**Monitoring:**
- Sentry: https://sentry.io/maku-travel
- UptimeRobot: https://uptimerobot.com

**Deployment:**
- Netlify: https://app.netlify.com
- GitHub Actions: https://github.com/org/repo/actions

**Infrastructure:**
- MongoDB Atlas: https://cloud.mongodb.com
- Supabase: https://app.supabase.com

**Communication:**
- Slack: #incidents channel
- Status Page: https://status.maku.travel

---

## Training & Drills

**Quarterly Incident Drill:**
- Simulate P0/P1 incident
- Test response time
- Validate runbooks
- Update procedures

**New Team Member Onboarding:**
- Review this document
- Shadow on-call rotation
- Practice using tools
- Complete drill scenario

---

*Last Updated: 2025-01-19*
*Next Review: 2025-04-19*
*Owner: DevOps Team*
