# 2. Authentication Module

## 2.1. Purpose

To provide a secure and distinct authentication system for the two primary user roles: **Worker** and **Employer**.

## 2.2. User Roles

The application MUST support two distinct user roles, determined at registration.

| Role      | Description                                     |
| :-------- | :---------------------------------------------- |
| `WORKER`  | A skilled tradesperson looking for jobs.        |
| `EMPLOYER`| A company or individual looking to hire workers.|

## 2.3. Firebase Integration

*   **Service:** Use **Firebase Authentication**.
*   **Providers:** Enable **Email/Password** and **Phone Number** authentication providers.
*   **User Record:** When a new user registers, their `uid` from Firebase Auth will be used as the document ID in the `users` Firestore collection. The chosen role (`WORKER` or `EMPLOYER`) MUST be stored in this user document.

## 2.4. User Flows

### Registration Flow (`/register`)

1.  The user lands on the registration page.
2.  The user MUST select their role: "I am a Worker" or "I am an Employer".
3.  The user can toggle between signing up with an email/password or a phone number.
4.  Upon successful registration:
    *   A new user is created in Firebase Authentication.
    *   A new document is created in the `users` Firestore collection with the `uid`, `identifier` (email/phone), and selected `role`.
    *   The user is automatically logged in.
    *   The user is redirected to their respective dashboard (`/worker/dashboard` or `/employer/dashboard`).

### Login Flow (`/login`)

1.  The user lands on the login page.
2.  The user can toggle between logging in with an email/password or a phone number.
3.  Upon successful login:
    *   The system retrieves the user's role from the `users` Firestore collection.
    *   Based on the role, the user is redirected to the correct dashboard.

### Protected Routes

*   Implement protected routes to ensure only authenticated users can access the dashboards.
*   The protection logic must also be role-based. A user with the `WORKER` role must NOT be able to access employer-specific routes (e.g., `/employer/dashboard`), and vice-versa.

## 2.5. Data Model (`users` collection)

*   **Document ID:** `auth_uid` from Firebase Authentication.
*   **Fields:**
    ```typescript
    interface UserDoc {
      id: string; // Same as auth_uid
      identifier: string; // email or phone number
      role: 'WORKER' | 'EMPLOYER';
      createdAt: Timestamp;
    }
    ```
