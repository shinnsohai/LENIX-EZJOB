# 8. Public-Facing Pages

## 8.1. Overview

This document describes the structure and content sources for all pages accessible to the public (i.e., unauthenticated users). A key architectural principle is that all dynamic content on these pages is managed via the **Admin CMS**.

## 8.2. Core Pages

### Homepage (`/`)

This is the primary landing page, designed to convert visitors. It is a multi-section page composed of several components.

*   **Content Source:** All text (headlines, testimonials, FAQs), the logo, and the hero background image are sourced dynamically from the `SiteContentContext`, which is controlled by the **Admin CMS**.
*   **Sections:**
    1.  **Hero Section:** Main headline, subheadline, and CTAs.
    2.  **How It Works:** Static explanation of the value proposition.
    3.  **Features:** Static highlight of platform features.
    4.  **Testimonials:** Dynamic list of user quotes.
    5.  **AI in Action:** Static interactive demo.
    6.  **Metrics/Credibility:** Static credibility boosters.
    7.  **Comparison Chart:** Static comparison against competitors.
    8.  **Mid-Page CTA:** Static re-engagement section.
    9.  **FAQ:** Dynamic, expandable list of frequently asked questions.
    10. **Blog/Insights:** Dynamically displays the 3 most recent blog posts.
    11. **Final CTA:** Static final call-to-action.

### Job Search Page (`/jobs`)

*   **Functionality:** A public job board where anyone can search for and view active job listings.
*   **Content Source:** In the MVP, this page uses the AI service (`generateJobs`) to populate the listings on each search. In a full-stack build, this page will query the `jobs` Firestore collection for all documents where `status` is `'Active'`.

### Blog Page (`/blog`)

*   **Functionality:** Displays a grid of all blog posts. This is a list view; individual post pages are a future feature.
*   **Content Source:** The page is fully dynamic. It fetches the list of all blog posts from the `SiteContentContext` and renders them, including their title, illustration image, author, and a content snippet.

### Quick Link Pages

These are informational pages whose content is entirely managed from the "Quick Links -> Manage Page Content" section of the Admin CMS.

*   **About Us Page (`/about`)**
    *   **Content Source:** Dynamically renders the title and paragraphs from the `aboutPageContent` object in the `SiteContentContext`.
*   **Contact Page (`/contact`)**
    *   **Content Source:** Dynamically renders all contact information (intro, email, phone, address) from the `contactPageContent` object in the `SiteContentContext`.
*   **Careers Page (`/careers`)**
    *   **Content Source:** Dynamically renders all text content from the `careersPageContent` object in the `SiteContentContext`.

### Legal Pages

These pages display important legal information. Their content is managed from the "Legal Pages" section of the Admin CMS.

*   **Privacy Policy Page (`/privacy`)**
    *   **Content Source:** Dynamically renders the text from `legalPagesContent.privacyPolicy` in the `SiteContentContext`.
*   **Terms of Service Page (`/terms`)**
    *   **Content Source:** Dynamically renders the text from `legalPagesContent.termsOfService` in the `SiteContentContent`.
