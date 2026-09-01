# 7. Admin Dashboard (CMS)

## 7.1. Purpose

The Admin Dashboard is a comprehensive, password-protected Content Management System (CMS) for site administrators. It provides full control over the platform's dynamic content, users, and assets without requiring code changes.

## 7.2. Access

*   **Login:** Access is via a dedicated `/admin/login` page. For the MVP, authentication is handled with hardcoded credentials (`admin`/`123123`) and a session flag. In a full-stack build, this should be replaced with a proper admin role in Firebase Authentication.

## 7.3. Core Management Panels

The dashboard is organized into several management panels.

### 1. Frontpage Content

*   **Functionality:** Allows full CRUD control over the dynamic text content of the public homepage (`/`).
*   **Editable Fields:**
    *   **Hero Section:** Headline and Subheadline.
    *   **Testimonials:** Admins can add, edit, and delete testimonial entries (quote and author).
    *   **FAQs:** Admins can add, edit, and delete FAQ entries (question and answer).
*   **Data Flow:** Changes made here update the `homepageContent` state in the `SiteContentContext`.

### 2. Site Assets

*   **Functionality:** Allows the admin to upload and change key visual assets for the entire site.
*   **Editable Fields:**
    *   **Company Logo:** File upload with preview.
    *   **Homepage Hero Background:** File upload with preview.
*   **Data Flow:** Changes update the `siteAssets` state in the `SiteContentContext`. The uploaded files should be stored in Firebase Storage.

### 3. User Management (Worker & Employer)

*   **Functionality:** Provides full CRUD capabilities for all user profiles.
*   **Features:**
    *   Separate panels for "Worker Management" and "Employer Management".
    *   Displays all users in a searchable, sortable table.
    *   **Create:** Open a modal to create a new user profile from scratch.
    *   **View:** Open a read-only modal to see a user's full profile.
    *   **Edit:** Open a pre-populated modal to edit any field in a user's profile.
    *   **Delete:** Permanently remove a user profile (with confirmation).
    *   **Suspend/Reactivate:** Toggle a user's `status` between `'Active'` and `'Suspended'`.
*   **Data Flow:** Directly manipulates the `workerProfiles` and `employerProfiles` collections in Firestore.

### 4. Blog Management

*   **Functionality:** Full CRUD for blog posts.
*   **Features:**
    *   **Create/Edit Modal:** A form to write/edit a blog post, including a title, author, content (textarea), and an image upload for the post's illustration.
    *   **Delete:** Remove blog posts.
*   **Data Flow:** Changes update the `blogPosts` state in `SiteContentContext`.

### 5. Quick Links & Page Content

*   **Functionality:** A dual-purpose manager.
*   **Tabs:**
    *   **Manage Links:** Add, edit, or delete the navigation links that appear in the site's footer (e.g., "About Us", "Contact").
    *   **Manage Page Content:** A powerful editor to modify the content of the pages that the quick links point to (e.g., the text on the `/about` page).
*   **Data Flow:** Changes update the `quickLinks`, `aboutPageContent`, etc., states in `SiteContentContext`.

### 6. Legal Pages

*   **Functionality:** A simple editor for the site's legal documents.
*   **Editable Fields:** Provides two large text areas to edit the content of the "Privacy Policy" and "Terms of Service" pages.
*   **Data Flow:** Changes update the `legalPagesContent` state in `SiteContentContext`.
