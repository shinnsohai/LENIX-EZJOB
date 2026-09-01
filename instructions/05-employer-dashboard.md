# 5. Employer Dashboard Module

## 5.1. Purpose

The Employer Dashboard is the command center for employers to manage their company profile, post job listings, and find qualified candidates.

## 5.2. Core Features

The dashboard uses a tabbed interface to separate three main functionalities: **"My Job Postings"**, **"Company Profile"**, and **"Search Workers"**.

### 5.2.1. Company Profile Management (CRUD)

*   **Firebase Integration:**
    *   Profile data is stored in the `employerProfiles` Firestore collection.
    *   The company logo is uploaded to **Firebase Storage**, and the URL is stored in the `company_logo_url` field.
*   **Flow:** Similar to the worker profile, employers can create, view, and edit their company profile.
*   **Fields:** The form MUST include all fields from the `EmployerProfile` interface (e.g., `company_name`, `industry`, `description`, `company_logo_url`).

### 5.2.2. Job Postings Management (Full CRUD)

This is a primary function of the dashboard, available under the "My Job Postings" tab.

*   **Firebase Integration:** Job data is stored in the `jobs` Firestore collection.
*   **Flow:**
    1.  **Create:** The "Post New Job" button opens a form. The employer enters basic details (`title`, `location`, `salary`).
    2.  **AI Integration:** Upon submission, a **Cloud Function** is triggered. It calls the Gemini API to generate the `description` and `required_skills` fields based on the job title.
    3.  **Read:** The main view lists all jobs posted by the logged-in employer. Each job card displays key details and its current `status`.
    4.  **Update:** An "Edit" button on each job card opens a form pre-populated with the job's data, allowing the employer to modify any field.
    5.  **Delete:** A "Delete" button (with a confirmation prompt) allows for the permanent removal of a job posting.
    6.  **Status Control:** Employers can change a job's status between `Active`, `On Hold`, and `Closed`.

### 5.2.3. Applicant & Worker Search (Per Job)

For each individual job posting, there are two primary actions for finding talent:

1.  **View Applicants:**
    *   **Flow:** This shows a list of workers who have actively applied for the job.
    *   **Backend Logic:** This will require querying an `applications` collection in the future. For the MVP, this triggers an AI call to generate a list of *simulated* realistic applicants.
2.  **Search Workers (AI-Powered):**
    *   **Flow:** This is a proactive search. Clicking this triggers a Cloud Function that calls the Gemini API.
    *   **AI Prompt:** The AI is asked to generate a list of 5 ideal (but fictional) worker profiles from the database who would be a strong match for the job, sorted by a `composite_score`.
    *   **See `06-ai-services.md` for detailed prompt instructions.**

### 5.2.4. Enhanced Worker Search

This is a standalone feature available under the "Search Workers" tab.

*   **Flow:** This panel provides a form with multiple filters (`skill`, `min. experience`, `country of origin`).
*   **AI Integration:** Submitting the form triggers a Cloud Function that calls the Gemini API.
*   **AI Prompt:** The AI is asked to generate a list of 10 fictional worker profiles that match the specified criteria.
*   **Purpose:** This allows employers to proactively search the entire talent pool, independent of a specific job posting, to discover and invite potential candidates.
