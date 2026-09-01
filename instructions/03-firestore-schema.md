# 3. Firestore Database Schema

## 3.1. Overview

This document defines the structure of the Firestore database. A well-designed schema is critical for application performance, scalability, and security.

## 3.2. Collections

### `users`

Stores the primary record for every authenticated user, linking their Firebase Auth UID to their role in the app.

*   **Document ID:** `auth_uid`
*   **Data Model:**
    ```typescript
    interface UserDoc {
      id: string;           // Firebase Auth UID
      identifier: string;   // User's email or phone number
      role: 'WORKER' | 'EMPLOYER';
      createdAt: Timestamp;
    }
    ```

### `workerProfiles`

Stores the detailed "Skill Passport" for each worker. There is a one-to-one relationship with a user document.

*   **Document ID:** `auth_uid` (same as the user's ID)
*   **Data Model:**
    ```typescript
    interface WorkerProfile {
      id: string;
      user_id: string; // Foreign key to users collection
      full_name: string;
      trade_or_skill: string;
      experience_years: number;
      summary?: string;
      composite_score?: number; // For AI-based ranking
      country_of_origin: string;
      experience_in_country: number;
      photo_url?: string; // URL to an image in Firebase Storage
      cv_url?: string;    // URL to a file in Firebase Storage
      status?: 'Active' | 'Suspended';
    }
    ```

### `employerProfiles`

Stores the company profile for each employer. There is a one-to-one relationship with a user document.

*   **Document ID:** `auth_uid` (same as the user's ID)
*   **Data Model:**
    ```typescript
    interface EmployerProfile {
      id: string;
      user_id: string; // Foreign key to users collection
      company_name: string;
      description?: string;
      website_url?: string;
      phone?: string;
      industry?: string;
      company_size?: string;
      year_founded?: number;
      company_logo_url?: string; // URL to an image in Firebase Storage
      status?: 'Active' | 'Suspended';
    }
    ```

### `jobs`

Stores all job postings created by employers.

*   **Document ID:** Auto-generated ID.
*   **Data Model:**
    ```typescript
    interface Job {
      id: string;
      employer_id: string;    // The auth_uid of the employer
      employer_name: string;  // Denormalized for easy display
      title: string;
      description: string;      // Often AI-generated
      required_skills: string[]; // Often AI-generated
      status: 'Active' | 'On Hold' | 'Closed';
      location: string;
      country: string;
      salary_min: number;
      salary_max: number;
      createdAt: Timestamp;
    }
    ```

### `blogPosts`

Stores all blog posts managed via the Admin CMS.

*   **Document ID:** Auto-generated ID.
*   **Data Model:**
    ```typescript
    interface BlogPost {
      id: string;
      title: string;
      content: string;
      imageUrl?: string; // URL to an image in Firebase Storage
      author: string;
      publishDate: string; // ISO string format
    }
    ```
