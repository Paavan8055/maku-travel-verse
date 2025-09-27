# 🔄 Security Rotation Templates
## Maku.Travel - Emergency Response Procedures

**Document Type**: Security Response Templates  
**Last Updated**: 25 September 2025, 19:00 AEST  
**Security Level**: INTERNAL USE ONLY

---

## 🚨 **Emergency Secret Rotation**

### **API Key Rotation Template**
```bash
# Emergency rotation script template
#!/bin/bash

echo "🚨 EMERGENCY SECRET ROTATION INITIATED"
echo "Timestamp: $(date)"

# 1. Backup current configuration
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# 2. Generate new secrets
NEW_ENCRYPTION_KEY=$(openssl rand -base64 32)
NEW_SESSION_SECRET=$(openssl rand -hex 32)

# 3. Update environment variables
echo "ENCRYPTION_KEY=${NEW_ENCRYPTION_KEY}" >> .env.new
echo "SESSION_SECRET=${NEW_SESSION_SECRET}" >> .env.new

# 4. Provider API key rotation
echo "# Provider API Keys - ROTATED $(date)" >> .env.new
echo "EXPEDIA_API_KEY=[NEW_KEY_REQUIRED]" >> .env.new
echo "AMADEUS_API_KEY=[NEW_KEY_REQUIRED]" >> .env.new

# 5. Database credential rotation
echo "MONGO_URL=[NEW_CONNECTION_STRING]" >> .env.new
echo "SUPABASE_ANON_KEY=[NEW_SUPABASE_KEY]" >> .env.new

# 6. Replace old configuration
mv .env.new .env

echo "✅ SECRET ROTATION COMPLETE"
echo "🔧 MANUAL ACTIONS REQUIRED:"
echo "  - Update provider dashboards with new API keys"
echo "  - Restart all services"
echo "  - Validate all integrations"
echo "  - Update monitoring dashboards"
```

### **Incident Response Checklist**
```
IMMEDIATE (0-15 minutes):
- [ ] Identify scope of exposure
- [ ] Disable compromised credentials
- [ ] Alert security team
- [ ] Begin incident logging

SHORT TERM (15-60 minutes):
- [ ] Rotate all potentially affected secrets
- [ ] Update environment configurations
- [ ] Restart affected services
- [ ] Validate system functionality

MEDIUM TERM (1-24 hours):
- [ ] Audit access logs for unauthorized usage
- [ ] Update monitoring and alerting
- [ ] Communicate with affected partners
- [ ] Document lessons learned

LONG TERM (1-7 days):
- [ ] Review and enhance security measures
- [ ] Update incident response procedures
- [ ] Implement additional monitoring
- [ ] Conduct security training if needed
```

---

## 🔐 **Provider-Specific Rotation Procedures**

### **Expedia Group**
```
ROTATION STEPS:
1. Login to Expedia Partner Solutions dashboard
2. Generate new API key and shared secret
3. Update EXPEDIA_API_KEY and EXPEDIA_SHARED_SECRET
4. Test authentication with new credentials
5. Validate booking flow functionality
```

### **Amadeus API**
```
ROTATION STEPS:
1. Access Amadeus for Developers portal
2. Regenerate API key and secret
3. Update AMADEUS_API_KEY configuration
4. Test hotel/flight search functionality
5. Verify rate limiting and quotas
```

### **Database Credentials**
```
MONGODB ROTATION:
1. Create new database user with appropriate permissions
2. Update MONGO_URL connection string
3. Test database connectivity
4. Remove old user access

SUPABASE ROTATION:
1. Generate new anon key in Supabase dashboard
2. Update SUPABASE_ANON_KEY configuration
3. Test API access and RLS policies
4. Validate edge function connectivity
```

---

## 📊 **Post-Rotation Validation**

### **System Health Checks**
```bash
# Validation script template
#!/bin/bash

echo "🔍 POST-ROTATION VALIDATION"

# Test provider connectivity
curl -f "${BACKEND_URL}/api/expedia/health" || echo "❌ Expedia integration failed"
curl -f "${BACKEND_URL}/api/smart-dreams/providers" || echo "❌ Provider registry failed"

# Test database connectivity  
curl -f "${BACKEND_URL}/api/health" || echo "❌ Database connectivity failed"

# Test AI services
curl -f "${BACKEND_URL}/api/ai/free-chat" -d '{"query":"test"}' || echo "❌ AI services failed"

echo "✅ VALIDATION COMPLETE"
```

### **Monitoring Setup**
```
ALERTS TO CONFIGURE:
- API key expiration warnings (30 days before)
- Unusual API usage patterns
- Failed authentication attempts
- Database connection failures
- Secret rotation schedule reminders
```

---

## 🎯 **Recovery Procedures**

### **Rollback Plan**
```
IF ROTATION FAILS:
1. Restore from .env.backup file
2. Restart services with old configuration
3. Investigate rotation failure
4. Plan alternate rotation strategy
5. Schedule maintenance window for retry
```

### **Emergency Contacts**
```
ESCALATION PATH:
1. Security Team Lead: [CONTACT_INFO]
2. DevOps Engineer: [CONTACT_INFO]  
3. Platform Owner: [CONTACT_INFO]
4. Provider Support: [PROVIDER_CONTACTS]
```

**Note**: This template should be customized with actual contact information and specific organizational procedures.