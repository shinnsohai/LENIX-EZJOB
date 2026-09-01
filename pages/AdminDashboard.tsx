import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkerProfile, EmployerProfile, BlogPost } from '../types';
import { useSiteContent } from '../contexts/SiteContentContext';
import { getAllWorkers, getAllEmployers, saveWorkerProfile, saveEmployerProfile, uploadFile } from '../services/db';
import type { HomepageContent, SiteAssets, Testimonial, FAQ, AboutPageContent, ContactPageContent, CareersPageContent } from '../contexts/SiteContentContext';


type AdminView = 'DASHBOARD' | 'FRONTPAGE_CONTENT' | 'QUICK_LINKS' | 'LEGAL_PAGES' | 'SITE_ASSETS' | 'WORKER_MANAGEMENT' | 'EMPLOYER_MANAGEMENT' | 'BLOG_MANAGEMENT';
type ModalMode = 'CREATE' | 'EDIT' | 'VIEW';

const SiteAssetsManager: React.FC = () => {
    const { siteAssets, updateSiteAssets } = useSiteContent();
    const [tempAssets, setTempAssets] = useState<SiteAssets>(siteAssets);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<{ logoFile?: File; heroFile?: File }>({});

    // Sync when context loads
    useEffect(() => {
        setTempAssets(siteAssets);
    }, [siteAssets]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            // Create temporary preview URL
            const previewUrl = URL.createObjectURL(file);
            setTempAssets(prev => ({ ...prev, [name]: previewUrl }));

            // Store the actual file for upload
            if (name === 'logoUrl') {
                setPendingFiles(prev => ({ ...prev, logoFile: file }));
            } else if (name === 'heroBackgroundUrl') {
                setPendingFiles(prev => ({ ...prev, heroFile: file }));
            }
            console.log('File selected:', name, file.name);
        }
    };

    const handleSave = async () => {
        console.log('Starting save process...');
        console.log('Pending files:', pendingFiles);
        console.log('Current tempAssets:', tempAssets);

        setIsUploading(true);
        try {
            const updatedAssets = { ...tempAssets };

            // Upload logo if there's a pending file
            if (pendingFiles.logoFile) {
                console.log('Uploading logo file:', pendingFiles.logoFile.name);
                const logoUrl = await uploadFile(pendingFiles.logoFile, `site-assets/logo-${Date.now()}`);
                console.log('Logo uploaded successfully. URL:', logoUrl);
                updatedAssets.logoUrl = logoUrl;
            }

            // Upload hero background if there's a pending file
            if (pendingFiles.heroFile) {
                console.log('Uploading hero background file:', pendingFiles.heroFile.name);
                const heroUrl = await uploadFile(pendingFiles.heroFile, `site-assets/hero-${Date.now()}`);
                console.log('Hero background uploaded successfully. URL:', heroUrl);
                updatedAssets.heroBackgroundUrl = heroUrl;
            }

            console.log('Final updatedAssets to save:', updatedAssets);

            // Save to Firestore with permanent URLs
            await updateSiteAssets(updatedAssets);
            console.log('Assets saved to Firestore successfully');

            setTempAssets(updatedAssets);
            setPendingFiles({});
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error uploading assets:', error);
            alert(`Failed to upload assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (assetType: 'logoUrl' | 'heroBackgroundUrl') => {
        if (window.confirm(`Are you sure you want to delete this ${assetType === 'logoUrl' ? 'logo' : 'hero background'}?`)) {
            setTempAssets(prev => ({ ...prev, [assetType]: '' }));
            // Clear pending file if any
            if (assetType === 'logoUrl') {
                setPendingFiles(prev => ({ ...prev, logoFile: undefined }));
            } else {
                setPendingFiles(prev => ({ ...prev, heroFile: undefined }));
            }
            // Immediately save the deletion
            const updatedAssets = { ...tempAssets, [assetType]: '' };
            updateSiteAssets(updatedAssets);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Manage Site Assets</h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Company Logo</label>
                    {tempAssets.logoUrl ? (
                        <div className="flex items-center gap-4">
                            <img src={tempAssets.logoUrl} alt="Logo Preview" className="h-16 w-auto border p-2 rounded-md bg-white" />
                            <button
                                onClick={() => handleDelete('logoUrl')}
                                className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Logo
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-2">No logo uploaded</p>
                    )}
                    <div className="mt-2">
                        <input type="file" name="logoUrl" onChange={handleFileChange} accept="image/*" className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                </div>

                <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">Homepage Hero Background</label>
                    {tempAssets.heroBackgroundUrl ? (
                        <div className="flex items-center gap-4">
                            <img src={tempAssets.heroBackgroundUrl} alt="Background Preview" className="h-24 w-auto object-cover border p-2 rounded-md bg-white" />
                            <button
                                onClick={() => handleDelete('heroBackgroundUrl')}
                                className="bg-red-500 text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-600 transition-colors flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete Background
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 mb-2">No background uploaded</p>
                    )}
                    <div className="mt-2">
                        <input type="file" name="heroBackgroundUrl" onChange={handleFileChange} accept="image/*" className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end items-center gap-4">
                {showSuccess && <span className="text-green-600 text-sm">Assets saved successfully!</span>}
                {isUploading && <span className="text-blue-600 text-sm">Uploading files...</span>}
                <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {isUploading ? 'Uploading...' : 'Save Assets'}
                </button>
            </div>
        </div>
    );
};

const FrontpageContentManager: React.FC = () => {
    const { homepageContent, updateHomepageContent } = useSiteContent();
    const [tempContent, setTempContent] = useState<HomepageContent>(homepageContent);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { setTempContent(homepageContent); }, [homepageContent]);

    const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTempContent(prev => ({ ...prev, hero: { ...prev.hero, [e.target.name]: e.target.value } }));
    };

    const handleListChange = (list: 'testimonials' | 'faqs', index: number, field: string, value: string) => {
        const newList = [...tempContent[list]];
        newList[index] = { ...newList[index], [field]: value };
        setTempContent(prev => ({ ...prev, [list]: newList }));
    };

    const addListItem = (list: 'testimonials' | 'faqs') => {
        const newItem = list === 'testimonials'
            ? { id: crypto.randomUUID(), quote: '', author: '' }
            : { id: crypto.randomUUID(), q: '', a: '' };
        setTempContent(prev => ({ ...prev, [list]: [...prev[list], newItem] }));
    };

    const removeListItem = (list: 'testimonials' | 'faqs', id: string) => {
        setTempContent(prev => ({ ...prev, [list]: prev[list].filter(item => item.id !== id) }));
    };

    const handleSave = async () => {
        try {
            await updateHomepageContent(tempContent);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving homepage content:', error);
            alert('Failed to save content. Please try again.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Manage Frontpage Content</h2>

            {/* Hero Section */}
            <div className="p-4 border rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-4">Hero Section</h3>
                <div className="space-y-4">
                    <input type="text" name="headline" value={tempContent.hero.headline} onChange={handleHeroChange} className="w-full p-2 border rounded" placeholder="Headline" />
                    <input type="text" name="subheadline" value={tempContent.hero.subheadline} onChange={handleHeroChange} className="w-full p-2 border rounded" placeholder="Subheadline" />
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="p-4 border rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Testimonials</h3>
                    <button onClick={() => addListItem('testimonials')} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm">+ Add</button>
                </div>
                <div className="space-y-4">
                    {tempContent.testimonials.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 border rounded bg-slate-50">
                            <div className="flex-grow space-y-2">
                                <textarea value={item.quote} onChange={e => handleListChange('testimonials', index, 'quote', e.target.value)} className="w-full p-2 border rounded" rows={2} placeholder="Quote"></textarea>
                                <input type="text" value={item.author} onChange={e => handleListChange('testimonials', index, 'author', e.target.value)} className="w-full p-2 border rounded" placeholder="Author" />
                            </div>
                            <button onClick={() => removeListItem('testimonials', item.id)} className="text-red-500 font-bold p-2">&times;</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQs Section */}
            <div className="p-4 border rounded-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">FAQs</h3>
                    <button onClick={() => addListItem('faqs')} className="bg-blue-500 text-white font-bold py-1 px-3 rounded-md text-sm">+ Add</button>
                </div>
                <div className="space-y-4">
                    {tempContent.faqs.map((item, index) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 border rounded bg-slate-50">
                            <div className="flex-grow space-y-2">
                                <input type="text" value={item.q} onChange={e => handleListChange('faqs', index, 'q', e.target.value)} className="w-full p-2 border rounded" placeholder="Question" />
                                <textarea value={item.a} onChange={e => handleListChange('faqs', index, 'a', e.target.value)} className="w-full p-2 border rounded" rows={2} placeholder="Answer"></textarea>
                            </div>
                            <button onClick={() => removeListItem('faqs', item.id)} className="text-red-500 font-bold p-2">&times;</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 flex justify-end items-center gap-4">
                {showSuccess && <span className="text-green-600 text-sm">Content saved successfully!</span>}
                <button onClick={handleSave} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-700">
                    Save All Content
                </button>
            </div>
        </div>
    );
};

const LegalPagesManager: React.FC<{
    initialContent: { privacyPolicy: string; termsOfService: string; };
    onSave: (newContent: { privacyPolicy: string; termsOfService: string; }) => void;
}> = ({ initialContent, onSave }) => {
    const [tempContent, setTempContent] = useState(initialContent);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { setTempContent(initialContent); }, [initialContent]);

    const handleSave = async () => {
        try {
            await onSave(tempContent);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving legal pages:', error);
            alert('Failed to save legal pages. Please try again.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Edit Legal Pages</h2>
            <div className="space-y-6">
                <div>
                    <label htmlFor="privacyPolicy" className="block text-lg font-medium text-gray-700">Privacy Policy</label>
                    <textarea
                        id="privacyPolicy"
                        rows={10}
                        value={tempContent.privacyPolicy}
                        onChange={(e) => setTempContent({ ...tempContent, privacyPolicy: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="termsOfService" className="block text-lg font-medium text-gray-700">Terms of Service</label>
                    <textarea
                        id="termsOfService"
                        rows={10}
                        value={tempContent.termsOfService}
                        onChange={(e) => setTempContent({ ...tempContent, termsOfService: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end items-center gap-4">
                {showSuccess && <span className="text-green-600 text-sm">Changes saved successfully!</span>}
                <button onClick={handleSave} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-700">
                    Save Changes
                </button>
            </div>
        </div>
    );
};

const QuickLinksAndPagesManager: React.FC = () => {
    const {
        quickLinks,
        updateQuickLinks,
        aboutPageContent,
        contactPageContent,
        careersPageContent,
        updateAboutPageContent,
        updateContactPageContent,
        updateCareersPageContent,
    } = useSiteContent();
    const [activeTab, setActiveTab] = useState<'links' | 'content'>('links');

    // State for Link Manager
    const [tempLinks, setTempLinks] = useState(quickLinks);

    // State for Content Manager
    const [selectedPage, setSelectedPage] = useState<'about' | 'contact' | 'careers'>('about');
    const [tempAbout, setTempAbout] = useState(aboutPageContent);
    const [tempContact, setTempContact] = useState(contactPageContent);
    const [tempCareers, setTempCareers] = useState(careersPageContent);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { setTempLinks(quickLinks); }, [quickLinks]);
    useEffect(() => { setTempAbout(aboutPageContent); }, [aboutPageContent]);
    useEffect(() => { setTempContact(contactPageContent); }, [contactPageContent]);
    useEffect(() => { setTempCareers(careersPageContent); }, [careersPageContent]);

    const handleSaveLinks = async () => {
        try {
            const validLinks = tempLinks.filter(link => link.text && link.url);
            await updateQuickLinks(validLinks);
            setTempLinks(validLinks);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving quick links:', error);
            alert('Failed to save links. Please try again.');
        }
    };

    const handleSaveContent = async () => {
        try {
            switch (selectedPage) {
                case 'about':
                    await updateAboutPageContent(tempAbout);
                    break;
                case 'contact':
                    await updateContactPageContent(tempContact);
                    break;
                case 'careers':
                    await updateCareersPageContent(tempCareers);
                    break;
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving page content:', error);
            alert('Failed to save content. Please try again.');
        }
    };

    const renderContentEditor = () => {
        switch (selectedPage) {
            case 'about':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4">Editing: About Us Page</h3>
                        <input type="text" value={tempAbout.title} onChange={e => setTempAbout({ ...tempAbout, title: e.target.value })} className="w-full p-2 border rounded" placeholder="Page Title" />
                        <textarea value={tempAbout.paragraph1} onChange={e => setTempAbout({ ...tempAbout, paragraph1: e.target.value })} className="w-full p-2 border rounded" rows={4} placeholder="Paragraph 1"></textarea>
                        <textarea value={tempAbout.paragraph2} onChange={e => setTempAbout({ ...tempAbout, paragraph2: e.target.value })} className="w-full p-2 border rounded" rows={2} placeholder="Paragraph 2"></textarea>
                        <textarea value={tempAbout.paragraph3} onChange={e => setTempAbout({ ...tempAbout, paragraph3: e.target.value })} className="w-full p-2 border rounded" rows={4} placeholder="Paragraph 3"></textarea>
                        <textarea value={tempAbout.paragraph4} onChange={e => setTempAbout({ ...tempAbout, paragraph4: e.target.value })} className="w-full p-2 border rounded" rows={4} placeholder="Paragraph 4"></textarea>
                    </div>
                );
            case 'contact':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4">Editing: Contact Page</h3>
                        <input type="text" value={tempContact.title} onChange={e => setTempContact({ ...tempContact, title: e.target.value })} className="w-full p-2 border rounded" placeholder="Page Title" />
                        <textarea value={tempContact.intro} onChange={e => setTempContact({ ...tempContact, intro: e.target.value })} className="w-full p-2 border rounded" rows={3} placeholder="Intro Paragraph"></textarea>
                        <input type="email" value={tempContact.email} onChange={e => setTempContact({ ...tempContact, email: e.target.value })} className="w-full p-2 border rounded" placeholder="Contact Email" />
                        <input type="text" value={tempContact.phone} onChange={e => setTempContact({ ...tempContact, phone: e.target.value })} className="w-full p-2 border rounded" placeholder="Contact Phone" />
                        <input type="text" value={tempContact.addressLine1} onChange={e => setTempContact({ ...tempContact, addressLine1: e.target.value })} className="w-full p-2 border rounded" placeholder="Address Line 1" />
                        <input type="text" value={tempContact.addressLine2} onChange={e => setTempContact({ ...tempContact, addressLine2: e.target.value })} className="w-full p-2 border rounded" placeholder="Address Line 2" />
                    </div>
                );
            case 'careers':
                return (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold mb-4">Editing: Careers Page</h3>
                        <input type="text" value={tempCareers.title} onChange={e => setTempCareers({ ...tempCareers, title: e.target.value })} className="w-full p-2 border rounded" placeholder="Page Title" />
                        <textarea value={tempCareers.intro} onChange={e => setTempCareers({ ...tempCareers, intro: e.target.value })} className="w-full p-2 border rounded" rows={3} placeholder="Intro Paragraph"></textarea>
                        <input type="text" value={tempCareers.openRolesTitle} onChange={e => setTempCareers({ ...tempCareers, openRolesTitle: e.target.value })} className="w-full p-2 border rounded" placeholder="Open Roles Title" />
                        <textarea value={tempCareers.openRolesText} onChange={e => setTempCareers({ ...tempCareers, openRolesText: e.target.value })} className="w-full p-2 border rounded" rows={2} placeholder="Open Roles Text"></textarea>
                        <input type="email" value={tempCareers.resumeEmail} onChange={e => setTempCareers({ ...tempCareers, resumeEmail: e.target.value })} className="w-full p-2 border rounded" placeholder="Resume Submission Email" />
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Quick Links & Pages Manager</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('links')} className={`${activeTab === 'links' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Manage Links
                    </button>
                    <button onClick={() => setActiveTab('content')} className={`${activeTab === 'content' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Manage Page Content
                    </button>
                </nav>
            </div>

            <div className="pt-6">
                {activeTab === 'links' && (
                    <div>
                        <div className="space-y-4">
                            {tempLinks.map(link => (
                                <div key={link.id} className="flex items-center gap-4 p-2 border rounded-md">
                                    <input type="text" placeholder="Link Text" value={link.text} onChange={e => setTempLinks(tempLinks.map(l => l.id === link.id ? { ...l, text: e.target.value } : l))} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                                    <input type="text" placeholder="URL (e.g., /about)" value={link.url} onChange={e => setTempLinks(tempLinks.map(l => l.id === link.id ? { ...l, url: e.target.value } : l))} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                                    <button onClick={() => setTempLinks(tempLinks.filter(l => l.id !== link.id))} className="text-red-500 hover:text-red-700 font-bold p-2">&times;</button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setTempLinks([...tempLinks, { id: crypto.randomUUID(), text: '', url: '' }])} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600">+ Add New Link</button>
                            <div className="flex items-center gap-4">
                                {showSuccess && activeTab === 'links' && <span className="text-green-600 text-sm">Links saved successfully!</span>}
                                <button onClick={handleSaveLinks} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-700">Save Links</button>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'content' && (
                    <div>
                        <div className="mb-4">
                            <label htmlFor="page-select" className="block text-sm font-medium text-gray-700">Select a page to edit:</label>
                            <select id="page-select" value={selectedPage} onChange={e => setSelectedPage(e.target.value as any)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md">
                                <option value="about">About Us</option>
                                <option value="contact">Contact</option>
                                <option value="careers">Careers</option>
                            </select>
                        </div>
                        <div className="p-4 border rounded-md bg-slate-50">
                            {renderContentEditor()}
                        </div>
                        <div className="mt-6 flex justify-end items-center gap-4">
                            {showSuccess && activeTab === 'content' && <span className="text-green-600 text-sm">Page content saved!</span>}
                            <button onClick={handleSaveContent} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-700">Save Page Content</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<AdminView>('DASHBOARD');
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [employers, setEmployers] = useState<EmployerProfile[]>([]);

    // Use global state for quick links, legal pages and blog posts
    const {
        legalPagesContent,
        blogPosts,
        updateLegalPagesContent,
        updateBlogPosts
    } = useSiteContent();

    // Load initial data
    useEffect(() => {
        const loadUsers = async () => {
            const w = await getAllWorkers();
            setWorkers(w);
            const e = await getAllEmployers();
            setEmployers(e);
        };
        if (view === 'WORKER_MANAGEMENT' || view === 'EMPLOYER_MANAGEMENT') {
            loadUsers();
        }
    }, [view]);

    // User management state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('VIEW');
    const [currentUser, setCurrentUser] = useState<WorkerProfile | EmployerProfile | BlogPost | null>(null);
    const [userType, setUserType] = useState<'worker' | 'employer' | 'blog' | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleLogout = () => {
        sessionStorage.removeItem('isAdmin');
        navigate('/admin/login');
    };

    const openModal = (mode: ModalMode, user: WorkerProfile | EmployerProfile | BlogPost | null, type: 'worker' | 'employer' | 'blog') => {
        setModalMode(mode);
        setCurrentUser(user);
        setUserType(type);
        setIsModalOpen(true);
    };

    const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>, type: 'worker' | 'employer' | 'blog') => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        // Note: For better scaling, perform search on backend. Here we filter locally for simplicity.
    };

    const filteredWorkers = workers.filter(w => w.full_name.toLowerCase().includes(searchTerm) || w.trade_or_skill.toLowerCase().includes(searchTerm));
    const filteredEmployers = employers.filter(e => e.company_name.toLowerCase().includes(searchTerm) || (e.industry && e.industry.toLowerCase().includes(searchTerm)));

    const handleSave = async (data: Partial<WorkerProfile & EmployerProfile & BlogPost>) => {
        try {
            if (userType === 'worker') {
                const user = data as Partial<WorkerProfile>;
                const id = user.id || crypto.randomUUID();
                const newWorker: WorkerProfile = {
                    id: id,
                    user_id: user.user_id || id, // In admin create, user_id matches id usually
                    full_name: user.full_name || '',
                    trade_or_skill: user.trade_or_skill || '',
                    experience_years: Number(user.experience_years) || 0,
                    summary: user.summary,
                    country_of_origin: user.country_of_origin || '',
                    experience_in_country: Number(user.experience_in_country) || 0,
                    photo_url: user.photo_url,
                    cv_url: user.cv_url,
                    status: user.status as 'Active' | 'Suspended' || 'Active',
                };
                await saveWorkerProfile(newWorker);
                setWorkers(prev => {
                    const exists = prev.find(p => p.id === newWorker.id);
                    return exists ? prev.map(p => p.id === newWorker.id ? newWorker : p) : [...prev, newWorker];
                });
            } else if (userType === 'employer') {
                const user = data as Partial<EmployerProfile>;
                const id = user.id || crypto.randomUUID();
                const newEmployer: EmployerProfile = {
                    id: id,
                    user_id: user.user_id || id,
                    company_name: user.company_name || '',
                    description: user.description,
                    website_url: user.website_url,
                    phone: user.phone,
                    industry: user.industry,
                    company_size: user.company_size,
                    year_founded: user.year_founded ? Number(user.year_founded) : undefined,
                    company_logo_url: user.company_logo_url,
                    status: user.status as 'Active' | 'Suspended' || 'Active',
                };
                await saveEmployerProfile(newEmployer);
                setEmployers(prev => {
                    const exists = prev.find(p => p.id === newEmployer.id);
                    return exists ? prev.map(p => p.id === newEmployer.id ? newEmployer : p) : [...prev, newEmployer];
                });
            } else if (userType === 'blog') {
                const post = data as Partial<BlogPost>;
                const newPosts =
                    modalMode === 'CREATE'
                        ? [...blogPosts, { ...post, id: crypto.randomUUID(), publishDate: new Date().toISOString() } as BlogPost]
                        : blogPosts.map((p) => (p.id === post.id ? ({ ...p, ...post } as BlogPost) : p));
                await updateBlogPosts(newPosts);
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error("Admin Save Error", e);
            alert("Failed to save");
        }
    };

    const handleDelete = async (id: string, type: 'worker' | 'employer' | 'blog') => {
        if (window.confirm(`Are you sure you want to delete this ${type}? This cannot be undone.`)) {
            // In a real app, call delete API. Here we just update local state for viewing
            if (type === 'worker') {
                setWorkers(prev => prev.filter(w => w.id !== id));
                // await deleteWorker(id); 
            } else if (type === 'employer') {
                setEmployers(prev => prev.filter(e => e.id !== id));
            } else if (type === 'blog') {
                await updateBlogPosts(blogPosts.filter(p => p.id !== id));
            }
        }
    };

    const handleUserSuspend = async (id: string, type: 'worker' | 'employer') => {
        const action = (user: WorkerProfile | EmployerProfile) => user.status === 'Active' ? 'suspend' : 'reactivate';
        if (type === 'worker') {
            const worker = workers.find(w => w.id === id);
            if (worker && window.confirm(`Are you sure you want to ${action(worker)} ${worker.full_name}?`)) {
                const newStatus = worker.status === 'Active' ? 'Suspended' : 'Active';
                await saveWorkerProfile({ ...worker, status: newStatus });
                setWorkers(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
            }
        } else {
            const employer = employers.find(e => e.id === id);
            if (employer && window.confirm(`Are you sure you want to ${action(employer)} ${employer.company_name}?`)) {
                const newStatus = employer.status === 'Active' ? 'Suspended' : 'Active';
                await saveEmployerProfile({ ...employer, status: newStatus });
                setEmployers(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
            }
        }
    };


    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="Frontpage Content" description="Manage Hero, Bento grids, Testimonials, and CTAs." icon="home" onClick={() => setView('FRONTPAGE_CONTENT')} />
            <DashboardCard title="Site Assets & Branding" description="Change LENIX logos, hero background, and brand media." icon="photo_library" onClick={() => setView('SITE_ASSETS')} />
            <DashboardCard title="Blog Management" description="Publish, edit, and moderate industry trade articles." icon="edit_note" onClick={() => setView('BLOG_MANAGEMENT')} />
            <DashboardCard title="Worker Management" description="Audit Skill Passports, verify credentials, and manage status." icon="engineering" onClick={() => setView('WORKER_MANAGEMENT')} />
            <DashboardCard title="Employer Management" description="Manage enterprise employers, requisitions, and company profiles." icon="apartment" onClick={() => setView('EMPLOYER_MANAGEMENT')} />
            <DashboardCard title="Quick Links & Nav" description="Configure footer compliance links and navigation structure." icon="link" onClick={() => setView('QUICK_LINKS')} />
            <DashboardCard title="Legal & Compliance" description="Update Privacy Policy, Terms of Service, and trade compliance rules." icon="gavel" onClick={() => setView('LEGAL_PAGES')} />
        </div>
    );

    const renderUserManager = (type: 'worker' | 'employer') => {
        const data = type === 'worker' ? filteredWorkers : filteredEmployers;
        const title = type === 'worker' ? "Worker Skill Passport Verification" : "Employer Account Moderation";
        const placeholder = type === 'worker' ? 'Search by candidate name or trade...' : 'Search by company or industry...';

        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
                        <p className="text-xs font-mono text-slate-500 mt-1">EZJOB by LENIX Operations Database</p>
                    </div>
                    <button onClick={() => openModal('CREATE', null, type)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-4 py-2.5 rounded-full font-bold shadow-md transition-all">
                        + Create Record
                    </button>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => handleUserSearch(e, type)}
                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 font-mono text-xs">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                {type === 'worker' ?
                                    (<>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-cyan-400">Worker Name</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Trade Skill</th>
                                    </>) :
                                    (<>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-cyan-400">Company Name</th>
                                        <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Industry</th>
                                    </>)
                                }
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Status</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {data.map(user => {
                                const isSuspended = user.status === 'Suspended';
                                return (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{'full_name' in user ? user.full_name : user.company_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">{'trade_or_skill' in user ? user.trade_or_skill : user.industry}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-[11px] font-bold rounded-full ${isSuspended ? 'bg-red-100 text-red-800' : 'bg-cyan-100 text-cyan-900'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold space-x-3">
                                            <button onClick={() => openModal('VIEW', user, type)} className="text-slate-600 hover:text-slate-900">View</button>
                                            <button onClick={() => openModal('EDIT', user, type)} className="text-cyan-700 hover:text-cyan-600">Edit</button>
                                            <button onClick={() => handleUserSuspend(user.id, type)} className={`${isSuspended ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'}`}>{isSuspended ? 'Reactivate' : 'Suspend'}</button>
                                            <button onClick={() => handleDelete(user.id, type)} className="text-red-600 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderBlogManager = () => {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">Blog Management</h2>
                        <p className="text-xs font-mono text-slate-500 mt-1">EZJOB by LENIX Publication Feed</p>
                    </div>
                    <button onClick={() => openModal('CREATE', null, 'blog')} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs uppercase px-4 py-2.5 rounded-full font-bold shadow-md transition-all">
                        + Create Article
                    </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 font-mono text-xs">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-cyan-400">Title</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Author</th>
                                <th className="px-6 py-3.5 text-left font-bold uppercase tracking-wider text-slate-300">Date</th>
                                <th className="px-6 py-3.5 text-right font-bold uppercase tracking-wider text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {blogPosts.map(post => (
                                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{post.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">{post.author}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(post.publishDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold space-x-3">
                                        <button onClick={() => openModal('EDIT', post, 'blog')} className="text-cyan-700 hover:text-cyan-600">Edit</button>
                                        <button onClick={() => handleDelete(post.id, 'blog')} className="text-red-600 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const Modal = () => {
        const [formData, setFormData] = useState<Partial<WorkerProfile & EmployerProfile & BlogPost>>(
            currentUser || {}
        );

        if (!isModalOpen) return null;

        const titleText = `${modalMode === 'CREATE' ? 'Create' : modalMode === 'EDIT' ? 'Edit' : 'View'} ${userType === 'worker' ? 'Worker' : userType === 'employer' ? 'Employer' : 'Blog Post'}`;
        const isViewMode = modalMode === 'VIEW';

        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
            if (e.target.type === 'file') {
                const files = (e.target as HTMLInputElement).files;
                if (files && files[0]) {
                    const file = files[0];
                    const fileUrl = URL.createObjectURL(file);
                    const name = userType === 'blog' ? 'imageUrl' : e.target.name;
                    setFormData({ ...formData, [name]: fileUrl });
                }
            } else {
                setFormData({ ...formData, [e.target.name]: e.target.value });
            }
        };

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            handleSave(formData);
        }

        const FormInput: React.FC<{ label: string, name: string, value: string | number | undefined, type?: string, readOnly?: boolean }> = ({ label, name, value, type = "text", readOnly = false }) => (
            <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
                {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm break-words">{value || '-'}</p> :
                    <input
                        type={type}
                        name={name}
                        defaultValue={value || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />}
            </div>
        );

        const FormTextarea: React.FC<{ label: string, name: string, value: string | undefined, readOnly?: boolean, rows?: number }> = ({ label, name, value, readOnly = false, rows = 4 }) => (
            <div className="md:col-span-2">
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
                {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm whitespace-pre-wrap">{value || '-'}</p> :
                    <textarea
                        name={name}
                        defaultValue={value || ''}
                        onChange={handleChange}
                        rows={rows}
                        className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
                    />}
            </div>
        );

        const FormSelect: React.FC<{ label: string, name: string, value: string | undefined, options: string[], readOnly?: boolean }> = ({ label, name, value, options, readOnly = false }) => (
            <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
                {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm">{value || '-'}</p> :
                    <select name={name} defaultValue={value || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500">
                        <option value="" disabled>Select...</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>}
            </div>
        );

        const FormFileInput: React.FC<{ label: string, name: string, value: string | undefined, readOnly?: boolean, accept?: string }> = ({ label, name, value, readOnly, accept }) => {
            const isImage = name.includes('photo') || name.includes('logo') || name.includes('image');

            if (readOnly) {
                return (
                    <div>
                        <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
                        <div className="mt-1">
                            {value ? (
                                isImage ? (
                                    <img src={value} alt={label} className="h-20 w-auto object-cover rounded-xl border border-slate-200" />
                                ) : (
                                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-600 font-mono text-xs hover:underline">View File</a>
                                )
                            ) : (
                                <p className="text-slate-400 text-xs italic">No file attached</p>
                            )}
                        </div>
                    </div>
                );
            }

            return (
                <div>
                    <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
                    <input
                        type="file"
                        name={name}
                        accept={accept}
                        onChange={handleChange}
                        className="mt-1 block w-full text-xs font-mono text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
                    />
                </div>
            );
        };

        const renderWorkerFields = () => {
            const data = formData as Partial<WorkerProfile>;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Full Name" name="full_name" value={data.full_name} readOnly={isViewMode} />
                    <FormInput label="Trade / Skill" name="trade_or_skill" value={data.trade_or_skill} readOnly={isViewMode} />
                    <FormInput label="Experience (Years)" name="experience_years" value={data.experience_years} type="number" readOnly={isViewMode} />
                    <FormInput label="Country of Origin" name="country_of_origin" value={data.country_of_origin} readOnly={isViewMode} />
                    <FormInput label="Experience in Country (Years)" name="experience_in_country" value={data.experience_in_country} type="number" readOnly={isViewMode} />
                    <FormSelect label="Status" name="status" value={data.status} options={['Active', 'Suspended']} readOnly={isViewMode} />
                    <FormFileInput label="Photo URL" name="photo_url" value={data.photo_url} readOnly={isViewMode} accept="image/*" />
                    <FormFileInput label="CV Document" name="cv_url" value={data.cv_url} readOnly={isViewMode} />
                    <FormTextarea label="Professional Summary" name="summary" value={data.summary} readOnly={isViewMode} />
                </div>
            );
        };

        const renderEmployerFields = () => {
            const data = formData as Partial<EmployerProfile>;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput label="Company Name" name="company_name" value={data.company_name} readOnly={isViewMode} />
                    <FormInput label="Industry" name="industry" value={data.industry} readOnly={isViewMode} />
                    <FormInput label="Website URL" name="website_url" value={data.website_url} readOnly={isViewMode} />
                    <FormInput label="Phone" name="phone" value={data.phone} readOnly={isViewMode} />
                    <FormInput label="Company Size" name="company_size" value={data.company_size} readOnly={isViewMode} />
                    <FormInput label="Year Founded" name="year_founded" value={data.year_founded} type="number" readOnly={isViewMode} />
                    <FormSelect label="Status" name="status" value={data.status} options={['Active', 'Suspended']} readOnly={isViewMode} />
                    <FormFileInput label="Company Logo" name="company_logo_url" value={data.company_logo_url} readOnly={isViewMode} accept="image/*" />
                    <FormTextarea label="Company Description" name="description" value={data.description} readOnly={isViewMode} />
                </div>
            );
        };

        const renderBlogFields = () => {
            const data = formData as Partial<BlogPost>;
            return (
                <div className="grid grid-cols-1 gap-4">
                    <FormInput label="Post Title" name="title" value={data.title} readOnly={isViewMode} />
                    <FormInput label="Author" name="author" value={data.author} readOnly={isViewMode} />
                    <FormFileInput label="Illustration Photo" name="imageUrl" value={data.imageUrl} readOnly={isViewMode} accept="image/*" />
                    <FormTextarea label="Content" name="content" value={data.content} readOnly={isViewMode} rows={10} />
                </div>
            );
        };

        return (
            <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <h2 className="text-xl font-extrabold text-slate-900">{titleText}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            {userType === 'worker' && renderWorkerFields()}
                            {userType === 'employer' && renderEmployerFields()}
                            {userType === 'blog' && renderBlogFields()}
                        </div>
                        <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100 font-mono text-xs">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">Close</button>
                            {!isViewMode && <button type="submit" className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-md">Save Changes</button>}
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case 'FRONTPAGE_CONTENT': return <FrontpageContentManager />;
            case 'SITE_ASSETS': return <SiteAssetsManager />;
            case 'WORKER_MANAGEMENT': return renderUserManager('worker');
            case 'EMPLOYER_MANAGEMENT': return renderUserManager('employer');
            case 'BLOG_MANAGEMENT': return renderBlogManager();
            case 'LEGAL_PAGES': return <LegalPagesManager initialContent={legalPagesContent} onSave={updateLegalPagesContent} />;
            case 'QUICK_LINKS': return <QuickLinksAndPagesManager />;
            case 'DASHBOARD':
            default:
                return renderDashboard();
        }
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-cyan-400 text-[22px]">admin_panel_settings</span>
                        <div>
                            <h1 className="text-base font-extrabold text-white leading-tight">EZJOB by LENIX</h1>
                            <span className="text-[10px] font-mono text-cyan-400">Admin Operations Console</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {view !== 'DASHBOARD' && (
                    <button onClick={() => { setView('DASHBOARD'); setSearchTerm(''); }} className="mb-6 inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider text-cyan-700 hover:text-cyan-600 cursor-pointer">
                        &larr; Back to Dashboard
                    </button>
                )}
                {renderContent()}
                <Modal />
            </main>
        </div>
    );
};

const DashboardCard: React.FC<{ title: string; description: string; icon: string; onClick: () => void; }> = ({ title, description, icon, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between cursor-pointer group hover:border-cyan-500/50"
    >
        <div>
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors">{title}</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-cyan-700 group-hover:text-cyan-600">
            <span>Manage Module</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </div>
    </div>
);


export default AdminDashboard;