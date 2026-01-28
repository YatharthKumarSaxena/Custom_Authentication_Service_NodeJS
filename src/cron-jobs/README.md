# 📁 Cron Jobs

> Welcome! I am the README file of this folder to assist you in understanding its structure and purpose.

## 📋 Folder Purpose
This folder contains scheduled background tasks that run automatically at specified intervals. These cron jobs handle database cleanup, session management, and data maintenance operations.

## 📂 Folder Structure

| File/Folder | Type | Description |
|------------|------|-------------|
| cleanup-auth-logs.job.js | File | Removes old authentication log entries |
| cleanup-expired-sessions.job.js | File | Deletes expired user sessions |
| cleanup-inactive-devices.job.js | File | Removes devices not used for extended periods |
| cleanup-used-verifications.job.js | File | Deletes used OTPs and verification links |
| delete-deactivated-users.job.js | File | Permanently removes deactivated user accounts |
| index.js | File | Initializes and schedules all cron jobs |

## 🔗 Key Files
- **cleanup-expired-sessions.job.js**: Maintains session hygiene by removing expired entries
- **cleanup-auth-logs.job.js**: Prevents log table bloat by archiving old entries
- **cleanup-inactive-devices.job.js**: Removes devices inactive beyond threshold
- **cleanup-used-verifications.job.js**: Cleans up OTPs and links after use
- **delete-deactivated-users.job.js**: Completes account deletion after grace period
- **index.js**: Registers all jobs with the cron scheduler

## 📝 Notes
- All jobs run on schedules defined in cron.config.js
- Jobs are executed using node-cron or similar scheduler
- Each job logs its execution status for monitoring
- Jobs handle errors gracefully to prevent crashes
- Schedules should be configured for off-peak hours
- Database operations are batched for performance
- Jobs can be enabled/disabled via configuration
