// Base/authoritative UI-chrome strings (English). Every other locale file
// must satisfy this same key shape — see locales/index.ts's UIStrings type.
// Scope note: this covers the persistent app chrome (Header, Footer) that
// renders on every page, wired up first since it's what the language
// switcher actually needs to prove itself end to end. Individual page
// content (HomePage, JobSearchPage, etc.) is translated incrementally,
// page by page, same as the rest of this project's craft passes.
const en = {
    'nav.findJobs': 'Find Jobs',
    'nav.adminConsole': 'Admin Console',
    'nav.employerStudio': 'Employer Studio',
    'nav.forEmployers': 'For Employers',
    'nav.skillPassport': 'Skill Passport',
    'nav.appliedJobs': 'Applied Jobs',
    'nav.insights': 'Insights',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.register': 'Register',

    'header.toggleTheme': 'Toggle light and dark theme',
    'header.switchToLight': 'Switch to Light Theme (White background)',
    'header.switchToDark': 'Switch to Dark Theme (Black background)',
    'header.openMenu': 'Open navigation menu',
    'header.closeMenu': 'Close navigation menu',
    'header.language': 'Language',

    'footer.tagline': 'A Clarity E&C Holding enterprise solution powered by LENIX technology. Precision recruitment and authenticated skill credentialing for the skilled trades.',
    'footer.aiEngineActive': 'AI Engine Active',
    'footer.platformNavigation': 'Platform Navigation',
    'footer.searchAllJobs': 'Search All Jobs',
    'footer.complianceTrust': 'Compliance & Trust',
    'footer.privacyPolicy': 'Privacy Policy',
    'footer.termsOfService': 'Terms of Service',
    'footer.dataSecurity': 'Enterprise-Grade Data Security',
    'footer.stayAhead': 'Stay Ahead',
    'footer.newsletterBlurb': 'Get real-time alerts for high-priority skilled trade requisitions.',
    'footer.emailPlaceholder': 'work@company.com',
    'footer.join': 'Join',
    'footer.newsletterInvalidEmail': 'Please enter a valid email address.',
    'footer.newsletterSuccess': 'You are subscribed! Watch your inbox for alerts.',
    'footer.newsletterError': 'Something went wrong. Please try again later.',
    'footer.rightsReserved': 'All rights reserved.',
    'footer.regions': 'Singapore • Malaysia • Regional Hubs',
    'footer.console': 'Console',
};

export default en;
