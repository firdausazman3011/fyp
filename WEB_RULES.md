# UniConnect: Community Monitoring and Support Platform

---

## Overview

UniConnect is a web-based platform designed to support community interaction and activity management.

The system allows users to participate in community activities and submit activity suggestions. Administrators manage activities and review user submissions to ensure proper organization within the community.

This system is developed with a focus on university students within a residential college setting as the implementation context, while remaining adaptable for other environments.

---

## Color System

### Primary Colors
- Primary: #E7717D
- Secondary: #AFD275

### Background Colors
- Main Background: #F9FAFB
- Card Background: #FFFFFF

### Text Colors
- Primary Text: #2D2D2D
- Secondary Text: #6B7280
- White Text: #FFFFFF

### Status Colors
- Approved: #AFD275
- Pending: #FFE8A3
- Rejected: #E7717D

### UI Elements
- Border: #E5E7EB
- Sidebar Background: #7E685A

---

## Responsive Interface Design

- Fully responsive and mobile-friendly
- Adapts to desktop, tablet, and mobile screens
- Sidebar becomes collapsible on smaller screens
- Content stacks vertically on mobile
- Buttons remain accessible and easy to interact with

---

## System Roles

### User
Users can:
- Register (Name, Email, Password)
- Login and logout
- Reset password (SMTP)
- Change password
- Delete account
- Upload and view profile picture
- Access Community Activities
- Access Activity Suggestion

---

### Admin
Admins can:
- Login only (no registration)
- Logout
- Change password
- Reset password (Forgot Password)
- Manage Community Activities
- Manage Activity Suggestions

---

## Admin Account Behavior

- Admin accounts are pre-created
- No profile page for admin
- Admin can:
  - Change password
  - Reset password
- Admin cannot:
  - Register
  - Delete account
  - Edit profile
- Admin performs system management only

---

## Authentication System

### User Registration
- Name is required
- Email must end with: @siswa.um.edu.my
- Email must be unique
- Password must be strong (>8 characters, uppercase, lowercase, symbol)

---

### Login
- Email and password required for both User and Admin

---

### Forgot Password (SMTP)

User and Admin:
1. Click "Forgot Password"
2. Enter email
3. Receive reset link
4. Reset password

---

## UI Structure

## Header and Footer Implementation

---

### 1. Authentication Pages (Login, Register, Forgot Password)

These pages use a minimal layout.

#### Header
- Display ONLY:
  - System name or logo (UniConnect)
- Positioned at top or center

#### Footer
- NOT required
- Can be omitted for simplicity

#### Restrictions
- Do NOT include:
  - Sidebar
  - Profile dropdown
  - Full navigation menu

---

### 2. Main Application Pages (After Login)

These pages use the full system layout.

---

### Header (Top Navigation Bar)

The header must be:
- Visible on ALL main pages
- Fixed at the top
- Consistent across User and Admin views

---

#### Header Content (Left Side)
- System name or logo: "UniConnect"

---

#### Header Content (Right Side - User)

- Profile picture (clickable)
- Dropdown menu:
  - View Profile (Name, Email, Profile Picture)
  - Change Password
  - Delete Account
  - Logout

---

#### Header Content (Right Side - Admin)

- Change Password
- Logout

---

### Sidebar

- Displayed ONLY after login
- Positioned on the left side

#### User Sidebar
- Home
- Community Activities
- Activity Suggestion

#### Admin Sidebar
- Dashboard
- Manage Activities
- Review Suggestions

---

### Footer

The footer must:
- Be visible on ALL main pages (after login)
- Be positioned at the bottom

---

#### Footer Content
- System name: UniConnect
- Description: "Community Monitoring and Support Platform"
- Copyright text

---

#### Footer Style
- Background color: #7E685A
- Text color: #FFFFFF
- Text alignment: center

---

### Behavior Rules

- Header and Sidebar must always remain visible during navigation
- Footer must remain consistent across all main pages
- Authentication pages must NOT use the main header or sidebar
- Layout must remain responsive for mobile devices

### Top Navigation Bar (User)

Always visible on all pages.

- Profile picture (top right)
- Dropdown menu:
  - View Profile (Name, Email, Profile Picture)
  - Change Password
  - Delete Account
  - Logout

---

### Top Navigation Bar (Admin)

Always visible on all pages.

- Change Password
- Logout

---

## Sidebar Navigation

### User Sidebar
- Home
- Community Activities
- Activity Suggestion

---

### Admin Sidebar
- Dashboard
- Manage Activities
- Review Suggestions

---

## User Home (After Login)

User is directed to Home page.

Displays:
- 3–4 upcoming activities (as activity posts)
- Latest suggestion status:
  - Pending
  - Approved
  - Rejected

---

## Admin Dashboard

Admin is directed to Dashboard.

Displays:
- Total Users
- Total Upcoming Activities
- Total Pending Suggestions

---

## Module 1: Community Activities

Separate from Activity Suggestion.

---

### User Functions
- View activity posts
- Join activities
- Confirm attendance

---

### Admin Functions
- Create activities
- Edit activities
- Delete activities
- View participants
- View attendance records

---

## Activity Post Design

Each activity is displayed as a card.

### Structure

1. Image (Top)
- Required

2. Title
- Color: #2D2D2D

3. Description
- Color: #6B7280

4. Details
- Date
- Time
- Location
- Organizer

5. Participation Info
- Number of participants
- Attendance status

6. Button
- Join / Joined
- Background: #E7717D
- Text: #FFFFFF

---

### Required Fields
- title
- description
- date
- time
- location
- organizer
- image

---

## Module 2: Activity Suggestion

Separate module.

---

### User Functions
- Submit suggestion
- View status:
  - Pending
  - Approved
  - Rejected

---

### Admin Functions
- Review suggestions
- Approve / Reject
- Convert approved suggestions into activities

---

### Suggestion Fields
- title
- description
- date
- location

---

## System Flow

1. User registers  
2. User logs in  
3. User views Home  
4. User submits suggestion  
5. Admin reviews  
6. Admin approves  
7. Activity created  
8. Users join and attend  

---

## System Rules

- Modules must remain separate
- Sidebar navigation must be used
- Only approved suggestions become activities
- Only upcoming approved activities are shown
- Each activity must include an image
- One email per account
- Admin controls all activity data

---

## Enhanced Rules for Implementation

### Input Validation Rules

- Trim whitespace for all text fields before saving
- Disallow empty or whitespace-only values for required fields
- Enforce title length: 5-100 characters
- Enforce description length: 20-1000 characters
- Date and time must not be in the past when creating new activities
- Location and organizer must each be 2-100 characters

---

### Role and Permission Rules

- User can only edit or delete their own profile data
- User cannot access admin routes, APIs, or admin dashboard data
- Admin can manage activities and suggestions but cannot register through public registration
- Any unauthorized access attempt must return an access denied response and redirect to the appropriate page

---

### Activity Lifecycle Rules

- Activity status must support: Draft, Published, Completed, Cancelled
- Only Published activities are visible to users in Community Activities
- Completed and Cancelled activities are hidden from "upcoming" lists
- Admin can mark attendance only for Published or Completed activities
- Users cannot join a Cancelled or Completed activity

---

### Suggestion Workflow Rules

- Suggestion status must support: Pending, Approved, Rejected
- Every suggestion must store submitter information and submission timestamp
- Rejected suggestions should include an optional admin remark for transparency
- Approved suggestions can be converted into an activity once only
- Once converted, suggestion should be marked as Converted or linked to created activity ID

---

### Notification and Feedback Rules

- Show success and error toast/alert messages for all critical actions (login, reset password, submit suggestion, approve/reject, create/update activity)
- Show clear inline validation messages near invalid fields
- Confirm destructive actions (Delete Account, Delete Activity, Reject Suggestion) with a confirmation dialog
- On password reset request, always return a generic success message to prevent email enumeration

---

### Data and Audit Rules

- Store created_at and updated_at timestamps for users, activities, and suggestions
- Record admin actions for suggestion review and activity management in an audit log
- Keep participant join records with joined_at timestamp
- Keep attendance records with status and confirmed_at timestamp

---

### Quality, Accessibility, and Security Rules

- Ensure keyboard accessibility for all navigation menus, forms, and dialogs
- Maintain sufficient text contrast against backgrounds
- Sanitize all user-provided text before rendering
- Protect state-changing requests with CSRF protection
- Use secure password hashing (e.g., bcrypt or Argon2)
- Enforce authenticated routes using session or token middleware