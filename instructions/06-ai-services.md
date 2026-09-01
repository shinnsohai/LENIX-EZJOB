# 6. AI Services (Google Gemini API)

## 6.1. Overview

All interactions with the Google Gemini API MUST be handled securely within **Cloud Functions for Firebase**. The client-side application should never call the API directly. The recommended model for these tasks is `gemini-2.5-flash` due to its balance of speed and capability.

For structured data, all calls MUST use the `responseMimeType: "application/json"` and `responseSchema` configuration options.

## 6.2. Schemas

### Job Schema
```javascript
const jobSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'A unique UUID for the job' },
            employer_name: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING, description: 'A detailed job description of at least 100 words.' },
            required_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            status: { type: Type.STRING, description: 'Should always be "Active".' },
            location: { type: Type.STRING },
            country: { type: Type.STRING },
            salary_min: { type: Type.INTEGER },
            salary_max: { type: Type.INTEGER },
        },
        required: ['id', 'employer_name', 'title', 'description', 'required_skills', 'status', 'location', 'country', 'salary_min', 'salary_max'],
    },
};
```

### Worker Profile Schema
```javascript
const workerProfileSchema = {
     type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: 'A unique UUID for the worker' },
            full_name: { type: Type.STRING },
            trade_or_skill: { type: Type.STRING },
            experience_years: { type: Type.INTEGER },
            summary: { type: Type.STRING, description: 'A 2-3 sentence summary of skills.' },
            composite_score: { type: Type.INTEGER, description: 'A score from 0-100 for match quality.' },
            country_of_origin: { type: Type.STRING },
            experience_in_country: { type: Type.INTEGER }
        },
        required: ['id', 'full_name', 'trade_or_skill', 'experience_years', 'summary', 'country_of_origin', 'experience_in_country'],
    },
};
```

## 6.3. Core Functions

### Function 1: Generate Job Listings

*   **Trigger:** Called from the public Job Search page.
*   **Purpose:** To generate a list of sample jobs for demonstration.
*   **Input:** `query` (string).
*   **Prompt Example:**
    ```
    Generate a list of 5 realistic, diverse job listings for skilled trades. The query is: "${query}". Include realistic locations, countries, and salary ranges. Make sure descriptions are detailed and compelling. Set the status of all jobs to "Active".
    ```
*   **Required `responseSchema`:** `jobSchema`

### Function 2: Generate Job Details

*   **Trigger:** Called when an employer creates a new job.
*   **Purpose:** To auto-generate a professional job description and a list of required skills.
*   **Input:** `jobTitle` (string), `companyName` (string).
*   **Prompt Example:**
    ```
    Create a detailed job description and a list of required skills for the job title: "${jobTitle}" at company "${companyName}". The description should be professional and at least 100 words. Provide 5-7 key skills.
    ```
*   **Required `responseSchema`:**
    ```javascript
    const jobDetailsSchema = {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING, description: 'A detailed job description of at least 100 words.' },
            required_skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'An array of 5-7 key skills for the job.'
            }
        },
        required: ['description', 'required_skills']
    };
    ```

### Function 3: Generate Simulated Applicants

*   **Trigger:** Called when an employer clicks "View Applicants" on a job (for MVP simulation).
*   **Purpose:** To generate a list of realistic, fictional candidates who might apply for a job.
*   **Input:** `jobTitle` (string), `jobCountry` (string).
*   **Prompt Example:**
    ```
    Generate a list of 3 diverse, fictional but realistic skilled worker profiles who would be a good fit to apply for the job: "${jobTitle}". The job is located in ${jobCountry}. For each applicant, provide their country_of_origin and their experience_in_country (years of experience specifically in ${jobCountry}).
    ```
*   **Required `responseSchema`:** `workerProfileSchema`.

### Function 4: AI Worker Search & Ranking

*   **Trigger:** Called when an employer clicks "Search Workers" on a job.
*   **Purpose:** To simulate searching the entire worker database and finding the best matches for a job.
*   **Input:** `jobTitle` (string), `jobCountry` (string).
*   **Prompt Example:**
    ```
    Generate a list of 5 diverse, fictional skilled worker profiles who would be a strong match for the job: "${jobTitle}". The job is located in ${jobCountry}. For each profile, include a "composite_score" from 0 to 100, where 100 is a perfect match. The scores should be varied and realistic. The list should be sorted by the composite_score in descending order. Also provide their country_of_origin and their experience_in_country (years of experience specifically in ${jobCountry}).
    ```
*   **Required `responseSchema`:** `workerProfileSchema`.

### Function 5: Search Workers By Filters

*   **Trigger:** Called from the "Enhanced Worker Search" panel on the employer dashboard.
*   **Purpose:** To generate a pool of workers based on specific search criteria.
*   **Input:** `filters` (object containing `skill`, `experience`, `country`).
*   **Prompt Example:**
    ```
    Generate a list of 10 diverse, fictional skilled worker profiles. They should have the primary skill of "${skill}". They must have at least ${experience} years of experience. They must originate from "${country}". For each worker, provide a realistic summary, country of origin, and years of experience.
    ```
*   **Required `responseSchema`:** `workerProfileSchema`.
