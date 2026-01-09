# 📱 Termux Setup Guide - Laptop to Mobile SMS Bridge

## 🎯 Overview
Laptop se commands run karo → SSH via WiFi → Mobile Termux → Real SMS

---

## 📱 Part 1: Mobile Setup (One-Time)

### Step 1: Termux Basic Setup

```bash
# Storage permission
termux-setup-storage

# Update packages
pkg update && pkg upgrade -y

# Install required packages
pkg install termux-api openssh nodejs -y

# Test SMS permission
termux-sms-list
# Allow SMS permissions in popup
```

### Step 2: SSH Server Setup

```bash
# Set password for SSH access
passwd
# Enter password: termux123 (or apna password)

# Start SSH server
sshd

# Check if running
pgrep sshd
# Should show a process ID
```

### Step 3: Get Mobile IP Address

```bash
# Get IP address
ifconfig wlan0 | grep 'inet '
# Example output: inet 192.168.1.100

# Or simpler:
ip -4 addr show wlan0 | grep inet
```

**Note down your IP address!** Example: `192.168.1.100`

### Step 4: Check Username

```bash
whoami
# Example output: u0_a123
```

**Note down your username!** Example: `u0_a123`

---

## 💻 Part 2: Laptop Setup

### Step 1: Test SSH Connection

```bash
# Test connection (replace with your mobile IP and username)
ssh -p 8022 u0_a123@192.168.1.100
# Enter password when asked: termux123

# If successful, you'll see Termux prompt
# Type: exit
```

### Step 2: Setup SSH Key (Optional - No Password Needed)

```bash
# Generate SSH key (if not already exists)
ssh-keygen -t rsa -b 4096
# Press Enter for all prompts (default location)

# Copy key to Termux
ssh-copy-id -p 8022 u0_a123@192.168.1.100
# Enter password: termux123

# Test passwordless login
ssh -p 8022 u0_a123@192.168.1.100
# Should login without password now!
```

### Step 3: Test SMS from Laptop

```bash
# Single command to send SMS via SSH
ssh -p 8022 u0_a123@192.168.1.100 "termux-sms-send -n '+919456974451' 'Test from laptop via SSH!'"
```

✅ **SMS should arrive on +919456974451!**

---

## ⚙️ Part 3: Configure .env (Laptop)

Edit your `.env` file:

```env
# SMS Configuration
SMS_MODE=termux-ssh
SMS_ENABLED=true
TEST_PHONE_NUMBER=+919456974451

# Termux SSH Details
TERMUX_IP=192.168.1.100      # Your mobile IP
TERMUX_PORT=8022
TERMUX_USER=u0_a123           # Your Termux username
```

---

## 🧪 Part 4: Test from Project

```bash
# Test single SMS
node src/testing/quick-sms-test.js

# Test all SMS templates
node src/testing/test-sms-templates.js
```

---

## 🔧 Troubleshooting

### ❌ Connection Refused
```bash
# On mobile (Termux):
sshd                    # Start SSH server
pgrep sshd              # Verify it's running
```

### ❌ Wrong IP Address
```bash
# On mobile (Termux):
ip -4 addr show wlan0 | grep inet
# Update TERMUX_IP in .env
```

### ❌ Permission Denied
```bash
# On laptop:
ssh-copy-id -p 8022 u0_a123@192.168.1.100
# Re-enter password
```

### ❌ SMS Not Sending
```bash
# On mobile (Termux):
termux-sms-list         # Re-check permissions
# Allow SMS permissions
```

---

## 📋 Quick Reference

**Start SSH Server (Mobile):**
```bash
sshd
```

**Stop SSH Server (Mobile):**
```bash
pkill sshd
```

**Check SSH Status (Mobile):**
```bash
pgrep sshd
```

**Send SMS from Laptop:**
```bash
ssh -p 8022 u0_a123@192.168.1.100 "termux-sms-send -n '+919456974451' 'Test message'"
```

---

## ✅ Final Checklist

- [ ] Termux installed on mobile
- [ ] Termux:API installed on mobile
- [ ] SSH server running on mobile (`sshd`)
- [ ] Mobile IP address noted
- [ ] Termux username noted
- [ ] SSH connection tested from laptop
- [ ] SMS permissions granted
- [ ] `.env` configured with Termux details
- [ ] Test SMS successful

---

## 🚀 Ready to Use!

Now you can run SMS commands from laptop, and they'll execute on mobile via SSH!

```bash
node src/testing/test-sms-templates.js
```

All SMS will be sent from your mobile! 📱✅