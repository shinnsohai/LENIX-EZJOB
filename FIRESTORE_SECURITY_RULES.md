# Firestore Security Rules

## Issue
The application is experiencing "Missing or insufficient permissions" errors. This is because the Firestore security rules are not correctly configured to allow users to read/write their own data.

## Solution
Apply the following comprehensive security rules to your Firebase Console. These rules cover:
1.  **Worker Profiles**: Publicly readable (for search), writable only by the owner.
2.  **Employer Profiles**: Publicly readable, writable only by the owner.
3.  **Jobs**: Publicly readable, writable by the employer who created them.
4.  **Applications**: Readable/writable by the applicant (worker) and the job poster (employer).
5.  **Site Content**: Publicly readable, writable by authenticated users (for admin features).

## Rules to Copy

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated and is the owner
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // --- Worker Profiles ---
    // Allow public read for search functionality
    // Allow write only by the owner
    match /workerProfiles/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
      
      // Subcollections (projects, certifications, references)
      match /{subcollection}/{document=**} {
        allow read: if true;
        allow write: if isOwner(userId);
      }
    }

    // --- Employer Profiles ---
    match /employerProfiles/{userId} {
      allow read: if true;
      allow write: if isOwner(userId);
    }

    // --- Jobs ---
    match /jobs/{jobId} {
      allow read: if true;
      // Allow creation if authenticated
      allow create: if request.auth != null;
      // Allow update/delete only if the user is the employer who created it
      allow update, delete: if request.auth != null && resource.data.employer_id == request.auth.uid;
    }

    // --- Applications ---
    match /applications/{applicationId} {
      // Allow creation if authenticated
      allow create: if request.auth != null;
      
      // Allow read/update if user is the worker (applicant) OR the employer
      allow read, update: if request.auth != null && (
        resource.data.worker_id == request.auth.uid || 
        resource.data.employer_id == request.auth.uid
      );
      
      // Allow delete if user is the worker
      allow delete: if request.auth != null && resource.data.worker_id == request.auth.uid;
    }
    
    // --- Site Content (Admin) ---
    match /siteContent/{docId} {
      allow read: if true;
      allow write: if request.auth != null; // In production, restrict this to admin UIDs
    }
  }
}
```

## How to Apply

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project **ezjob-d058b**.
3.  Navigate to **Firestore Database** > **Rules**.
4.  Paste the code above into the editor.
5.  Click **Publish**.

## Troubleshooting
If you still see errors after applying these rules:
1.  **Logout and Login**: The "auth/invalid-credential" error suggests your local session might be stale. Click "Logout" in the app and sign in again.
2.  **Check Console**: Look for "FirebaseError" in the browser console to see if the permission error persists.
