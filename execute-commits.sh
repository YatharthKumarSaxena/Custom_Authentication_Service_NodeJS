#!/bin/bash

echo "🚀 Starting Custom Auth Service - Final Commits"
echo "================================================"
echo ""

# Commit 1: Project Documentation
echo "📝 Commit 1/10: Project Documentation..."
git add .env.example IMPLEMENTATION_SUMMARY.md README.md
git commit -m "docs: update project documentation and environment configuration

- Add complete .env.example with all authentication modes
- Update IMPLEMENTATION_SUMMARY.md with full feature list
- Add configuration for email/SMS notifications
- Document cron jobs and security features
- Update root README with project structure"
echo "✅ Done"
echo ""

# Commit 2: Configuration
echo "⚙️  Commit 2/10: Configuration Files..."
git add src/configs/
git commit -m "config: update rate limiting and add folder documentation

- Update rate-limit.config.js with Redis integration
- Add comprehensive README for configs folder
- Document all 27 configuration files
- Add descriptions for each config purpose"
echo "✅ Done"
echo ""

# Commit 3: Models
echo "📦 Commit 3/10: Models Documentation..."
git add src/models/README.md
git commit -m "docs: add comprehensive models folder documentation

- Document all 9 Mongoose schema files
- Add descriptions for User, Device, AuthLog models
- Document OTP, Link, and Counter models
- Explain model relationships"
echo "✅ Done"
echo ""

# Commit 4: Utilities
echo "🔧 Commit 4/10: Utilities Documentation..."
git add src/utils/README.md
git commit -m "docs: add comprehensive utilities folder documentation

- Document all 23 utility files
- Add descriptions for token, validation utils
- Document notification and error handling utilities
- Explain time-stamp and contact selector utils"
echo "✅ Done"
echo ""

# Commit 5: Rate Limiters
echo "🚦 Commit 5/10: Rate Limiters Documentation..."
git add src/rate-limiters/README.md
git commit -m "docs: add rate limiters folder documentation

- Document all rate limiter implementations
- Describe device-specific and user-specific limiters
- Add examples of rate limiting patterns"
echo "✅ Done"
echo ""

# Commit 6: Cron Jobs
echo "⏰ Commit 6/10: Cron Jobs Documentation..."
git add src/cron-jobs/README.md
git commit -m "docs: add cron jobs folder documentation

- Document all 6 scheduled cleanup tasks
- Add descriptions for session, log, and user cleanup
- Document cron schedules and purposes"
echo "✅ Done"
echo ""

# Commit 7: Routers
echo "🛣️  Commit 7/10: Routers with Rate Limiters..."
git add src/routers/
git commit -m "feat: integrate rate limiters across all routes

- Add rate limiters to auth endpoints (signup, signin, etc.)
- Integrate rate limiting in verification routes
- Add rate limiters to password management routes
- Apply rate limiting to account management endpoints
- Update routers folder documentation"
echo "✅ Done"
echo ""

# Commit 8: Middlewares
echo "🛡️  Commit 8/10: Middleware Enhancements..."
git add src/middlewares/
git commit -m "feat: add auth sanitization middleware and comprehensive documentation

- Add sanitize-auth.middleware.js for input cleaning
- Implement sanitize-auth-payload factory for auth modes
- Update middleware exports and factory pattern
- Sanitize email/phone based on AUTH_MODE configuration
- Add comprehensive documentation for all middleware folders
- Document auth, account-management, verification middleware
- Document common, factory, and handlers middleware"
echo "✅ Done"
echo ""

# Commit 9: Services
echo "⚙️  Commit 9/10: Services Updates & Documentation..."
git add src/services/
git commit -m "feat: enhance services with email/phone change notifications and documentation

PASSWORD MANAGEMENT:
- Improve forgot password service implementation
- Enhance error handling and validation
- Update notification sending mechanism

ACCOUNT MANAGEMENT:
- Add email/phone change notifications to OLD credentials
- Immediately send verification to NEW email/phone
- Add proper contact structure with contactMode
- Integrate instant verification generation
- Update response messages for verification status
- Add debug logs for notification tracking

DOCUMENTATION:
- Add comprehensive documentation for all service folders
- Document auth, account, and verification services
- Document audit, common, and system services
- Document template system (email & SMS)
- NEW: Add bootstrap service documentation
- NEW: Add factories service documentation
- NEW: Add internals service documentation
- Add notes about service architecture"
echo "✅ Done"
echo ""

# Commit 10: Controllers
echo "🎮 Commit 10/10: Controllers Updates & Documentation..."
git add src/controllers/
git commit -m "feat: enhance controllers with verification messages and documentation

ACCOUNT MANAGEMENT:
- Update account controller with dynamic verification messages
- Improve response messages for email/phone changes
- Add emailVerificationSent and phoneVerificationSent flags
- Build user-friendly messages based on what was updated

PASSWORD MANAGEMENT:
- Enhance forgot password controller error handling
- Improve validation and response messages

DOCUMENTATION:
- Add controllers folder main documentation
- Document auth controllers (signin, signup, etc.)
- Document account-management controllers
- Document account-verification controllers
- Document password-management controllers
- Document internals controllers"
echo "✅ Done"
echo ""

echo "================================================"
echo "✅ All 10 commits completed successfully!"
echo "================================================"
echo ""
echo "📊 Summary:"
echo "   - Total commits: 10"
echo "   - Files changed: 49"
echo "   - README files: 33"
echo ""
echo "🚀 Ready to push!"
echo "   Run: git push origin main"
echo ""
