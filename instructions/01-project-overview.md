# 1. Project Overview: EZJOB AI-Powered Job Board

## 1.1. Mission Statement

EZJOB's mission is to bridge the gap between skilled tradespeople (e.g., plumbers, electricians, welders) and the employers who need their expertise. We empower workers to showcase their skills debt-free and help employers find the best talent faster and smarter using AI.

## 1.2. Target Audience

*   **Workers:** Skilled trade workers, often including migrant workers, looking for fair-paying, reliable employment. They need a simple, mobile-first way to create a professional profile and apply for jobs.
*   **Employers:** Companies in the construction, manufacturing, and home services industries who need to hire verified, skilled talent quickly. They need tools to simplify job posting and candidate screening.

## 1.3. Core Value Proposition

*   **For Workers:** A "Digital Skill Passport" that validates their expertise and helps them stand out.
*   **For Employers:** An AI-powered platform that automates job description writing and intelligently ranks candidates, drastically reducing hiring time.

## 1.4. Technology Stack (Full-Stack Vision)

*   **Frontend:** React with TypeScript and Tailwind CSS.
*   **Backend:** Firebase (Serverless)
    *   **Database:** Firestore
    *   **Authentication:** Firebase Authentication (Email/Password, Phone)
    *   **Server-side Logic:** Cloud Functions for Firebase
    *   **File Storage:** Firebase Storage (for CVs, profile photos, logos)
*   **AI:** Google Gemini API (via Cloud Functions)

## 1.5. Key Application Modules

1.  **Authentication:** Dual-role user system (Worker/Employer).
2.  **Worker Dashboard:** Management of the "Skill Passport" (profile).
3.  **Employer Dashboard:** Full CRUD for job postings and company profiles.
4.  **AI Services:** AI-driven content generation and candidate matching.
5.  **Job Search:** Public, searchable listing of all active jobs.
6.  **Admin CMS:** A comprehensive dashboard for site administrators to manage all users, content, and site assets.
7.  **Public & Legal Pages:** Dynamic and static content pages managed via the Admin CMS.
