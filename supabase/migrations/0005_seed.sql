-- Seed data for public.site_content and public.blog_posts.
-- This replaces the old app's runtime "seed on first anonymous page load"
-- behaviour (SiteContentContext used to call saveSiteContent() from any
-- visitor's browser the first time a doc was missing) with a one-time,
-- reviewable migration. site_content.data holds the content value directly
-- (array or object) — no more Firestore's array-wrapper-vs-bare-object split.

insert into public.site_content (id, data) values
('quickLinks', $json$[
  {"id": "ql1", "text": "About Us", "url": "/about"},
  {"id": "ql2", "text": "Contact", "url": "/contact"},
  {"id": "ql3", "text": "Careers", "url": "/careers"},
  {"id": "ql4", "text": "Blog", "url": "/blog"}
]$json$::jsonb),

('legalPages', $json$
{
  "privacyPolicy": "Your privacy is important to us. It is EZJOB by LENIX's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate. We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.",
  "termsOfService": "By accessing the website at EZJOB by LENIX, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site. The materials contained in this website are protected by applicable copyright and trademark law."
}
$json$::jsonb),

('aboutPage', $json$
{
  "title": "About EZJOB by LENIX",
  "paragraph1": "EZJOB by LENIX was engineered with a clear mission: to accelerate and empower the skilled trades and technical workforce through state-of-the-art AI matching and verified digital credentialing.",
  "paragraph2": "We eliminate friction in industrial staffing by fusing precision matchmaking with structural integrity.",
  "paragraph3": "By combining the LENIX intelligence engine with verified Skill Passports, workers showcase authenticated certifications and real-world project portfolios, while employers fill critical roles with unmatched speed.",
  "paragraph4": "Whether you are a certified heavy equipment operator, an electrical specialist, or a tier-1 general contractor, EZJOB by LENIX is your enterprise partner for high-performance workforce solutions."
}
$json$::jsonb),

('contactPage', $json$
{
  "title": "Contact EZJOB by LENIX",
  "intro": "Have inquiries about enterprise matching, custom integrations, or skilled workforce verification? Connect directly with our team.",
  "email": "support@lenix.ai",
  "phone": "+65 6800 5800",
  "addressLine1": "LENIX Innovation Hub, 100 Marina Boulevard",
  "addressLine2": "Singapore 018983"
}
$json$::jsonb),

('careersPage', $json$
{
  "title": "Careers at LENIX",
  "intro": "Join our team building the next generation of AI-powered workforce intelligence and skilled trade infrastructure.",
  "openRolesTitle": "Current Opportunities",
  "openRolesText": "We are expanding our AI engineering and talent verification teams. Reach out with your portfolio to",
  "resumeEmail": "careers@lenix.ai"
}
$json$::jsonb),

('homepage', $json$
{
  "hero": {
    "headline": "Engineering the Future of Work. Instant AI-Powered Matching.",
    "subheadline": "EZJOB by LENIX matches elite industrial and technical talent with leading enterprises in real-time."
  },
  "testimonials": [
    {"id": "t1", "quote": "Matched and deployed 5 certified structural welders within 24 hours. The AI compatibility score was spot-on.", "author": "— Regional Project Director, Singapore"},
    {"id": "t2", "quote": "My verified Skill Passport got me hired on a tier-1 energy project with zero paperwork hassle.", "author": "— Senior Heavy Equipment Specialist, Malaysia"},
    {"id": "t3", "quote": "The integrity verification saved our site compliance team hundreds of vetting hours.", "author": "— VP of Talent Acquisition, Infrastructure Corp"}
  ],
  "faqs": [
    {"id": "f1", "q": "What is EZJOB by LENIX?", "a": "EZJOB by LENIX is an AI-driven recruitment and skill verification platform specifically engineered for the skilled trades, construction, electrical, and heavy industrial sectors."},
    {"id": "f2", "q": "How does the Digital Skill Passport work?", "a": "Workers build a verified digital passport featuring credentials, certifications, video demos, and track records. The system computes a profile integrity score that fast-tracks placement."},
    {"id": "f3", "q": "How does the AI Job Studio help employers?", "a": "Employers can type simple job parameters, and our Gemini-powered engine instantly crafts comprehensive, industry-tailored job requisitions and candidate match criteria."},
    {"id": "f4", "q": "Is the platform secure and compliant?", "a": "Yes. We utilize enterprise Supabase (Postgres) infrastructure with row-level security, strict data access policies, and verified identity workflows."}
  ]
}
$json$::jsonb),

('assets', $json$
{
  "logoUrl": "/assets/lenix-logo-light.png",
  "heroBackgroundUrl": ""
}
$json$::jsonb)

on conflict (id) do nothing;

insert into public.blog_posts (id, title, content, image_url, author, publish_date) values
(
  gen_random_uuid(),
  'Top 10 High-Velocity Construction & Engineering Jobs',
  'An in-depth look at the most in-demand roles in the industrial sector, from structural engineers to certified heavy machinery operators. We explore salary expectations and required certifications.',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop',
  'LENIX Intelligence Team',
  '2025-08-15T10:00:00Z'
),
(
  gen_random_uuid(),
  'How LENIX AI Engine Is Revolutionizing Skilled Trades Recruitment',
  'Discover how precision matching and verified skill passports connect top industrial talent with infrastructure projects in minutes rather than weeks.',
  'https://images.unsplash.com/photo-1678453140515-aa21c81c2dfd?q=80&w=2070&auto=format&fit=crop',
  'LENIX AI Labs',
  '2025-08-10T14:30:00Z'
),
(
  gen_random_uuid(),
  'Workforce Mobility & Skill Passport Standards',
  'A comprehensive guide to digital trade credentialing and cross-border project deployment across Singapore, Malaysia, and regional hubs.',
  'https://images.unsplash.com/photo-1560942485-b2a1a20628fd?q=80&w=1935&auto=format&fit=crop',
  'LENIX Standards Board',
  '2025-08-05T09:00:00Z'
)
on conflict do nothing;
