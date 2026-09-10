import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WorkerProfile, EmployerProfile, BlogPost } from '../types';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getAllWorkers, getAllEmployers, saveWorkerProfile, saveEmployerProfile, deleteUserAccount, uploadFile } from '../services/db';
import type { HomepageContent, SiteAssets, Testimonial, FAQ, AboutPageContent, ContactPageContent, CareersPageContent } from '../contexts/SiteContentContext';
import Spinner from '../components/Spinner';


type AdminView = 'DASHBOARD' | 'FRONTPAGE_CONTENT' | 'QUICK_LINKS' | 'LEGAL_PAGES' | 'SITE_ASSETS' | 'WORKER_MANAGEMENT' | 'EMPLOYER_MANAGEMENT' | 'BLOG_MANAGEMENT';
type ModalMode = 'CREATE' | 'EDIT' | 'VIEW';

const SiteAssetsManager: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
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

        if (!user?.id) {
            showToast('Cannot upload: no authenticated admin session.', 'error');
            setIsUploading(false);
            return;
        }

        setIsUploading(true);
        try {
            const updatedAssets = { ...tempAssets };

            // Upload logo if there's a pending file
            if (pendingFiles.logoFile) {
                console.log('Uploading logo file:', pendingFiles.logoFile.name);
                const logoUrl = await uploadFile('site-assets', user.id, pendingFiles.logoFile);
                console.log('Logo uploaded successfully. URL:', logoUrl);
                updatedAssets.logoUrl = logoUrl;
            }

            // Upload hero background if there's a pending file
            if (pendingFiles.heroFile) {
                console.log('Uploading hero background file:', pendingFiles.heroFile.name);
                const heroUrl = await uploadFile('site-assets', user.id, pendingFiles.heroFile);
                console.log('Hero background uploaded successfully. URL:', heroUrl);
                updatedAssets.heroBackgroundUrl = heroUrl;
            }

            console.log('Final updatedAssets to save:', updatedAssets);

            // Save to the DB with permanent URLs
            await updateSiteAssets(updatedAssets);
            console.log('Assets saved successfully');

            setTempAssets(updatedAssets);
            setPendingFiles({});
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error uploading assets:', error);
            showToast(`Failed to upload assets: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (assetType: 'logoUrl' | 'heroBackgroundUrl') => {
        if (!window.confirm(`Are you sure you want to delete this ${assetType === 'logoUrl' ? 'logo' : 'hero background'}?`)) {
            return;
        }
        setTempAssets(prev => ({ ...prev, [assetType]: '' }));
        // Clear pending file if any
        if (assetType === 'logoUrl') {
            setPendingFiles(prev => ({ ...prev, logoFile: undefined }));
        } else {
            setPendingFiles(prev => ({ ...prev, heroFile: undefined }));
        }
        // Immediately save the deletion
        const updatedAssets = { ...tempAssets, [assetType]: '' };
        try {
            await updateSiteAssets(updatedAssets);
        } catch (error) {
            console.error('Error deleting asset:', error);
            showToast(`Failed to delete asset: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            // Revert local preview since the deletion did not persist.
            setTempAssets(prev => ({ ...prev, [assetType]: tempAssets[assetType] }));
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
    const { showToast } = useToast();
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
            showToast('Failed to save content. Please try again.', 'error');
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
    const { showToast } = useToast();
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
            showToast('Failed to save legal pages. Please try again.', 'error');
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
    const { showToast } = useToast();
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
            showToast('Failed to save links. Please try again.', 'error');
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
            showToast('Failed to save content. Please try again.', 'error');
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


// ---------------------------------------------------------------------------
// Shared, fully-controlled form fields for AdminRecordModal. Hoisted to
// module scope (like every other manager here) so they keep a stable
// component identity across re-renders.
// ---------------------------------------------------------------------------

const FormInput: React.FC<{
    label: string;
    name: string;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    readOnly?: boolean;
}> = ({ label, name, value, onChange, type = "text", readOnly = false }) => (
    <div>
        <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
        {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm break-words">{value || '-'}</p> :
            <input
                type={type}
                name={name}
                value={value ?? ''}
                onChange={onChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
            />}
    </div>
);

const FormTextarea: React.FC<{
    label: string;
    name: string;
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    readOnly?: boolean;
    rows?: number;
}> = ({ label, name, value, onChange, readOnly = false, rows = 4 }) => (
    <div className="md:col-span-2">
        <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
        {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm whitespace-pre-wrap">{value || '-'}</p> :
            <textarea
                name={name}
                value={value ?? ''}
                onChange={onChange}
                rows={rows}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
            />}
    </div>
);

const FormSelect: React.FC<{
    label: string;
    name: string;
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: string[];
    readOnly?: boolean;
}> = ({ label, name, value, onChange, options, readOnly = false }) => (
    <div>
        <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">{label}</label>
        {readOnly ? <p className="mt-1 text-slate-900 font-mono text-sm">{value || '-'}</p> :
            <select name={name} value={value ?? ''} onChange={onChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 bg-white rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500">
                <option value="" disabled>Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>}
    </div>
);

const FormFileInput: React.FC<{
    label: string;
    name: string;
    value: string | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    readOnly?: boolean;
    accept?: string;
    disabled?: boolean;
}> = ({ label, name, value, onChange, readOnly, accept, disabled }) => {
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
            {value && (
                isImage ? (
                    <img src={value} alt={label} className="h-16 w-auto object-cover rounded-lg border border-slate-200 mb-2" />
                ) : (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="block text-cyan-600 font-mono text-xs hover:underline mb-2">Current file</a>
                )
            )}
            <input
                type="file"
                name={name}
                accept={accept}
                disabled={disabled}
                onChange={onChange}
                className="mt-1 block w-full text-xs font-mono text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer disabled:opacity-50"
            />
        </div>
    );
};

// ---------------------------------------------------------------------------
// The Worker/Employer/Blog create-edit-view modal. Hoisted to module scope
// (finding #22) so it has a stable component identity across AdminDashboard
// re-renders and no longer loses in-progress form state; its own form state
// resets only when the record being edited (or open/closed state) actually
// changes, via the effect below.
// ---------------------------------------------------------------------------

interface AdminRecordModalProps {
    isOpen: boolean;
    mode: ModalMode;
    userType: 'worker' | 'employer' | 'blog' | null;
    currentUser: WorkerProfile | EmployerProfile | BlogPost | null;
    /** The logged-in admin's own profile id — used as the storage-path owner id for blog image uploads (blog posts have no end-user owner of their own). */
    adminId: string | undefined;
    onClose: () => void;
    onSave: (data: Partial<WorkerProfile & EmployerProfile & BlogPost>) => void | Promise<void>;
}

const AdminRecordModal: React.FC<AdminRecordModalProps> = ({ isOpen, mode, userType, currentUser, adminId, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<WorkerProfile & EmployerProfile & BlogPost>>(currentUser || {});
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        setFormData(currentUser || {});
        setUploadError(null);
    }, [currentUser, isOpen]);

    if (!isOpen) return null;

    const titleText = `${mode === 'CREATE' ? 'Create' : mode === 'EDIT' ? 'Edit' : 'View'} ${userType === 'worker' ? 'Worker' : userType === 'employer' ? 'Employer' : 'Blog Post'}`;
    const isViewMode = mode === 'VIEW';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Uploads straight to Supabase Storage and stores the returned public URL
    // (never a blob: URL) — finding #20.
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !files[0]) return;
        const file = files[0];
        const fieldName = userType === 'blog' ? 'imageUrl' : e.target.name;

        const bucket = userType === 'blog'
            ? 'blog-images'
            : userType === 'worker'
                ? (fieldName === 'cv_url' ? 'worker-cvs' : 'worker-photos')
                : 'employer-logos';

        // Worker/employer uploads are owned by that record's own user_id;
        // blog images have no end-user owner, so they're filed under the
        // uploading admin's own id.
        const uid = userType === 'blog' ? adminId : (formData as Partial<WorkerProfile & EmployerProfile>).user_id;
        if (!uid) {
            setUploadError('Cannot upload: missing owner id for this record.');
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        setUploadError(null);
        try {
            const url = await uploadFile(bucket, uid, file);
            setFormData(prev => ({ ...prev, [fieldName]: url }));
        } catch (err) {
            console.error('Upload failed:', err);
            setUploadError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const renderWorkerFields = () => {
        const data = formData as Partial<WorkerProfile>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Full Name" name="full_name" value={data.full_name} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Trade / Skill" name="trade_or_skill" value={data.trade_or_skill} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Experience (Years)" name="experience_years" value={data.experience_years} onChange={handleChange} type="number" readOnly={isViewMode} />
                <FormInput label="Country of Origin" name="country_of_origin" value={data.country_of_origin} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Experience in Country (Years)" name="experience_in_country" value={data.experience_in_country} onChange={handleChange} type="number" readOnly={isViewMode} />
                <FormSelect label="Status" name="status" value={data.status} onChange={handleChange} options={['Active', 'Suspended']} readOnly={isViewMode} />
                <FormFileInput label="Photo" name="photo_url" value={data.photo_url} onChange={handleFileChange} readOnly={isViewMode} accept="image/*" disabled={isUploading} />
                <FormFileInput label="CV Document" name="cv_url" value={data.cv_url} onChange={handleFileChange} readOnly={isViewMode} disabled={isUploading} />
                <FormTextarea label="Professional Summary" name="summary" value={data.summary} onChange={handleChange} readOnly={isViewMode} />
            </div>
        );
    };

    const renderEmployerFields = () => {
        const data = formData as Partial<EmployerProfile>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Company Name" name="company_name" value={data.company_name} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Industry" name="industry" value={data.industry} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Website URL" name="website_url" value={data.website_url} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Phone" name="phone" value={data.phone} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Company Size" name="company_size" value={data.company_size} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Year Founded" name="year_founded" value={data.year_founded} onChange={handleChange} type="number" readOnly={isViewMode} />
                <FormSelect label="Status" name="status" value={data.status} onChange={handleChange} options={['Active', 'Suspended']} readOnly={isViewMode} />
                <FormFileInput label="Company Logo" name="company_logo_url" value={data.company_logo_url} onChange={handleFileChange} readOnly={isViewMode} accept="image/*" disabled={isUploading} />
                <FormTextarea label="Company Description" name="description" value={data.description} onChange={handleChange} readOnly={isViewMode} />
            </div>
        );
    };

    const renderBlogFields = () => {
        const data = formData as Partial<BlogPost>;
        return (
            <div className="grid grid-cols-1 gap-4">
                <FormInput label="Post Title" name="title" value={data.title} onChange={handleChange} readOnly={isViewMode} />
                <FormInput label="Author" name="author" value={data.author} onChange={handleChange} readOnly={isViewMode} />
                <FormFileInput label="Illustration Photo" name="imageUrl" value={data.imageUrl} onChange={handleFileChange} readOnly={isViewMode} accept="image/*" disabled={isUploading} />
                <FormTextarea label="Content" name="content" value={data.content} onChange={handleChange} readOnly={isViewMode} rows={10} />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                    <h2 className="text-xl font-extrabold text-slate-900">{titleText}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {userType === 'worker' && renderWorkerFields()}
                        {userType === 'employer' && renderEmployerFields()}
                        {userType === 'blog' && renderBlogFields()}
                    </div>
                    {uploadError && <p className="mt-4 text-xs font-mono text-red-600">{uploadError}</p>}
                    {isUploading && <p className="mt-4 text-xs font-mono text-cyan-600">Uploading file...</p>}
                    <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-slate-100 font-mono text-xs">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors">Close</button>
                        {!isViewMode && <button type="submit" disabled={isUploading} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold transition-all shadow-md disabled:opacity-50">Save Changes</button>}
                    </div>
                </form>
            </div>
        </div>
    );
};

const USER_PAGE_SIZE = 25;

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user: adminUser } = useAuth();
    const { showToast } = useToast();
    const [view, setView] = useState<AdminView>('DASHBOARD');
    const [workers, setWorkers] = useState<WorkerProfile[]>([]);
    const [employers, setEmployers] = useState<EmployerProfile[]>([]);
    const [totalWorkers, setTotalWorkers] = useState(0);
    const [totalEmployers, setTotalEmployers] = useState(0);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Use global state for quick links, legal pages and blog posts
    const {
        legalPagesContent,
        blogPosts,
        updateLegalPagesContent,
        saveBlogPost,
        deleteBlogPost,
    } = useSiteContent();

    // User management state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>('VIEW');
    const [currentUser, setCurrentUser] = useState<WorkerProfile | EmployerProfile | BlogPost | null>(null);
    const [userType, setUserType] = useState<'worker' | 'employer' | 'blog' | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce the search box so we don't hit the backend on every keystroke.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    // Reset to page 1 whenever the search term or the active table changes.
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, view]);

    const loadUsers = useCallback(async () => {
        if (view !== 'WORKER_MANAGEMENT' && view !== 'EMPLOYER_MANAGEMENT') return;
        setUsersLoading(true);
        setUsersError(null);
        try {
            if (view === 'WORKER_MANAGEMENT') {
                const { workers: w, total } = await getAllWorkers({ page, pageSize: USER_PAGE_SIZE, search: debouncedSearch || undefined });
                setWorkers(w);
                setTotalWorkers(total);
            } else {
                const { employers: e, total } = await getAllEmployers({ page, pageSize: USER_PAGE_SIZE, search: debouncedSearch || undefined });
                setEmployers(e);
                setTotalEmployers(total);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            setUsersError(err instanceof Error ? err.message : 'Failed to load data.');
        } finally {
            setUsersLoading(false);
        }
    }, [view, page, debouncedSearch]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

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

    const handleSave = async (data: Partial<WorkerProfile & EmployerProfile & BlogPost>) => {
        try {
            if (userType === 'worker') {
                const existing = currentUser as WorkerProfile | null;
                const user = data as Partial<WorkerProfile>;
                if (!existing?.id || !existing?.user_id) {
                    throw new Error('Missing worker record — cannot save.');
                }
                const updatedWorker: WorkerProfile = {
                    ...existing,
                    ...user,
                    id: existing.id,
                    user_id: existing.user_id,
                    full_name: user.full_name ?? existing.full_name ?? '',
                    trade_or_skill: user.trade_or_skill ?? existing.trade_or_skill ?? '',
                    experience_years: Number(user.experience_years ?? existing.experience_years) || 0,
                    country_of_origin: user.country_of_origin ?? existing.country_of_origin ?? '',
                    experience_in_country: Number(user.experience_in_country ?? existing.experience_in_country) || 0,
                    status: (user.status as 'Active' | 'Suspended') || existing.status || 'Active',
                };
                await saveWorkerProfile(updatedWorker);
                await loadUsers();
            } else if (userType === 'employer') {
                const existing = currentUser as EmployerProfile | null;
                const user = data as Partial<EmployerProfile>;
                if (!existing?.id || !existing?.user_id) {
                    throw new Error('Missing employer record — cannot save.');
                }
                const updatedEmployer: EmployerProfile = {
                    ...existing,
                    ...user,
                    id: existing.id,
                    user_id: existing.user_id,
                    company_name: user.company_name ?? existing.company_name ?? '',
                    year_founded: user.year_founded ? Number(user.year_founded) : existing.year_founded,
                    status: (user.status as 'Active' | 'Suspended') || existing.status || 'Active',
                };
                await saveEmployerProfile(updatedEmployer);
                await loadUsers();
            } else if (userType === 'blog') {
                const post = data as Partial<BlogPost> & { id?: string };
                await saveBlogPost(modalMode === 'CREATE' ? { ...post, id: undefined } : post);
            }
            setIsModalOpen(false);
        } catch (e) {
            console.error("Admin Save Error", e);
            showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
        }
    };

    const handleDelete = async (item: WorkerProfile | EmployerProfile | BlogPost, type: 'worker' | 'employer' | 'blog') => {
        if (type === 'blog') {
            const post = item as BlogPost;
            if (!window.confirm(`Delete the blog post "${post.title}"? This cannot be undone.`)) return;
            try {
                await deleteBlogPost(post.id);
            } catch (e) {
                console.error('Admin Delete Error', e);
                showToast(e instanceof Error ? e.message : 'Failed to delete.', 'error');
            }
            return;
        }

        const label = type === 'worker' ? (item as WorkerProfile).full_name : (item as EmployerProfile).company_name;
        if (!window.confirm(`Permanently delete this ${type}'s account (${label})? This removes their login and all associated data and cannot be undone.`)) {
            return;
        }
        const userId = type === 'worker' ? (item as WorkerProfile).user_id : (item as EmployerProfile).user_id;
        if (!userId) {
            showToast('Cannot delete: missing linked user id.', 'error');
            return;
        }
        try {
            await deleteUserAccount(userId);
            await loadUsers();
        } catch (e) {
            console.error('Admin Delete Error', e);
            showToast(e instanceof Error ? e.message : 'Failed to delete.', 'error');
        }
    };

    const handleUserSuspend = async (item: WorkerProfile | EmployerProfile, type: 'worker' | 'employer') => {
        const action = item.status === 'Active' ? 'suspend' : 'reactivate';
        const label = type === 'worker' ? (item as WorkerProfile).full_name : (item as EmployerProfile).company_name;
        if (!window.confirm(`Are you sure you want to ${action} ${label}?`)) return;
        const newStatus = item.status === 'Active' ? 'Suspended' : 'Active';
        try {
            if (type === 'worker') {
                await saveWorkerProfile({ ...(item as WorkerProfile), status: newStatus });
            } else {
                await saveEmployerProfile({ ...(item as EmployerProfile), status: newStatus });
            }
            await loadUsers();
        } catch (e) {
            console.error('Admin Suspend/Reactivate Error', e);
            showToast(e instanceof Error ? e.message : 'Failed to update status.', 'error');
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
        const data = type === 'worker' ? workers : employers;
        const total = type === 'worker' ? totalWorkers : totalEmployers;
        const title = type === 'worker' ? "Worker Skill Passport Verification" : "Employer Account Moderation";
        const placeholder = type === 'worker' ? 'Search by candidate name or trade...' : 'Search by company or industry...';
        const totalPages = Math.max(1, Math.ceil(total / USER_PAGE_SIZE));

        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
                        <p className="text-xs font-mono text-slate-500 mt-1">EZJOB by LENIX Operations Database</p>
                    </div>
                </div>
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full mb-4 px-4 py-2.5 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-cyan-500"
                />
                {usersError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-mono flex items-center justify-between gap-4">
                        <span>{usersError}</span>
                        <button onClick={() => loadUsers()} className="font-bold underline shrink-0">Retry</button>
                    </div>
                )}
                {usersLoading ? (
                    <div className="py-16"><Spinner /></div>
                ) : (
                    <>
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
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No records found.</td>
                                        </tr>
                                    )}
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
                                                    <button onClick={() => handleUserSuspend(user, type)} className={`${isSuspended ? 'text-emerald-600 hover:text-emerald-700' : 'text-amber-600 hover:text-amber-700'}`}>{isSuspended ? 'Reactivate' : 'Suspend'}</button>
                                                    <button onClick={() => handleDelete(user, type)} className="text-red-600 hover:text-red-700">Delete</button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between mt-4 font-mono text-xs text-slate-600">
                            <span>Page {page} of {totalPages} &middot; {total} total</span>
                            <div className="space-x-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page <= 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    &larr; Prev
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        </div>
                    </>
                )}
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
                                        <button onClick={() => handleDelete(post, 'blog')} className="text-red-600 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                    <button onClick={() => { setView('DASHBOARD'); setSearchInput(''); }} className="mb-6 inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider text-cyan-700 hover:text-cyan-600 cursor-pointer">
                        &larr; Back to Dashboard
                    </button>
                )}
                {renderContent()}
                <AdminRecordModal
                    isOpen={isModalOpen}
                    mode={modalMode}
                    userType={userType}
                    currentUser={currentUser}
                    adminId={adminUser?.id}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                />
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