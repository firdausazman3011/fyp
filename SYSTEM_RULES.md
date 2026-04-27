# UniConnect – Community Monitoring and Support Platform

## 1. Overview
UniConnect is a centralized platform designed to improve communication, engagement, and service management within a community (e.g., university residential community). It enables users to participate in activities, share information, and access services while allowing management to monitor and control operations efficiently.

---

## 2. User Roles

### 2.1 User (Student)
- Must register using a valid university student email
- Can access all community features

### 2.2 Management (Admin)
- Cannot sign up
- Account is pre-created
- Has full control over moderation and system management

---

## 3. Authentication Module

### 3.1 Sign Up (User Only)

#### Email Requirements
- Must follow format: `____@siswa.um.edu.my`
- Example: `ali123@siswa.um.edu.my`

#### Email Validation
- Must end with `@siswa.um.edu.my`
- Must be unique in database  
- Error: Email already registered.

---

### 3.2 Password Policy

Password must satisfy ALL conditions:
- Minimum 8 characters
- At least one uppercase letter (A–Z)
- At least one number (0–9)
- At least one symbol: !@#$%^&*

#### Error Messages
- Password must be at least 8 characters!
- Password must include at least one uppercase letter!
- Password must include at least one number!
- Password must include at least one symbol (!@#$%^&*)!

---

### 3.3 Login (User & Management)
- Email + Password required

#### Validation
- Error: Invalid email or password.

---

### 3.4 Forgot Password
- User enters registered email
- System sends password reset link to email

#### Reset Rules
- Reset link is time-limited (e.g., 15–30 minutes)
- Link can only be used once

#### Validation
- Error: Email not registered.
- Error: Reset link expired or invalid.
- New password must follow password policy
- New password **cannot be the same as old password**

---

## 4. System Modules

### 4.1 Community Activities

#### User Functions
- View available events (with images/PDF)
- Join events
- Confirm attendance (self check-in)

#### Management Functions
- Add, edit, delete events (with images/PDF)
- View participants
- View attendance records

---

### 4.2 Activity Suggestion

#### User Functions
- Suggest activities (optional image/PDF)
- View suggestion status (Pending / Approved / Rejected)

#### Management Functions
- Review suggestions
- Approve or reject
- Convert approved suggestions into activities

---

### 4.3 Community Forum

#### User Functions
- Create posts (with images/PDF)
- Reply to posts
- Edit/delete own posts

#### Management Functions
- Monitor posts
- Reply when necessary
- Remove inappropriate/spam posts (including files)

---

### 4.4 Community Announcements

#### User Functions
- View announcements (with images/PDF)

#### Management Functions
- Add, edit, delete announcements (with images/PDF)

---

### 4.5 Community Polls

#### User Functions
- Vote polls
- View results

#### Management Functions
- Create polls
- Monitor results

> Note: File upload is **not supported** in polls.

---

### 4.6 Lost and Found Board

#### User Functions
- Post lost/found items:
  - Title
  - Description
  - Location
  - Collection details
  - Upload image(s)/PDF
- View listings (with files)
- Mark as resolved

#### Management Functions
- Monitor posts
- Remove spam/inappropriate content (including files)

---

### 4.7 Community Facility Booking

#### User Functions
- View facilities (with images/PDF)
- Request booking
- View status
- Cancel booking

#### Management Functions
- Add/edit/delete facilities (with images/PDF)
- Approve/reject bookings
- Manage availability
- View booking history

---

### 4.8 Community Marketplace

#### User Functions
- List items:
  - Name
  - Description
  - Price (optional)
  - Contact info
  - Upload image(s)/PDF
- View listings (with files)
- Edit/delete own listings
- Contact seller

#### Management Functions
- Monitor listings
- Remove prohibited or inappropriate items (including files)

---

## 5. File Upload Support (Images & Documents)

### Supported Modules
- Community Activities
- Activity Suggestion
- Community Forum
- Community Announcements
- Lost and Found
- Facility Booking
- Marketplace

### Not Supported
- Community Polls

---

### Supported File Types
- Images: JPG, JPEG, PNG
- Documents: PDF

---

### File Size Limits
- Images: Maximum 5MB
- PDF: Maximum 10MB

---

### Validation
- Error: Only JPG, JPEG, PNG, and PDF files are allowed.
- Error: Image size must not exceed 5MB.
- Error: PDF file size must not exceed 10MB.

---

### Storage Structure
- `/uploads/activities/`
- `/uploads/suggestions/`
- `/uploads/forum/`
- `/uploads/announcements/`
- `/uploads/lost-found/`
- `/uploads/facilities/`
- `/uploads/marketplace/`

---

### Security Measures
- Rename files (e.g., `file_12345.jpg`, `doc_12345.pdf`)
- Validate file type and size
- Prevent executable file uploads
- Store files securely (outside public root if possible)

---

## 6. Optional Enhancements

- Multiple file upload (max 3–5 files per post)
- Image preview / PDF viewer
- Download option for documents
- File compression for performance
- Drag-and-drop upload UI

---

## 7. Summary

UniConnect provides:
- Secure authentication system
- Strong validation rules
- File-supported modules (images + PDF)
- Full community interaction features
- Effective management and moderation control

The system improves communication, transparency, and engagement within the community.