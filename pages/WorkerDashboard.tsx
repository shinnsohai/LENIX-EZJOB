
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getWorkerProfile,
    saveWorkerProfile,
    uploadFile,
    getWorkerProjects,
    addWorkerProject,
    updateWorkerProject,
    deleteWorkerProject,
    getWorkerCertifications,
    addWorkerCertification,
    deleteWorkerCertification,
    getWorkerReferences,
} from '../services/db';
import { migrateLegacySkills } from '../utils/workerSkills';
import VideoLinkInput from '../components/forms/VideoLinkInput';
import DynamicTradeForm from '../components/forms/DynamicTradeForm';
import PassportLayout from '../components/profile/PassportLayout';
import Spinner from '../components/Spinner';
import { Upload, Edit3, Plus, Trash2, FileCheck, AlertTriangle } from 'lucide-react';
import type { WorkerProfile, Project, Certification, Reference, UserSkill } from '../types';
import { countries } from '../data/countries';

export default function WorkerDashboard() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const cvInputRef = useRef<HTMLInputElement>(null);

    // Main Profile State
    const [profile, setProfile] = useState<WorkerProfile>({
        id: '',
        user_id: '',
        full_name: '',
        trade: '', // Deprecated
        trade_or_skill: '',
        bio: '',
        physical_attributes: { height_cm: 0, weight_kg: 0, handedness: 'Right', color_blindness: false },
        media_links: { intro_video_url: '', skill_video_url: '' },
        trade_specifics: {},
        history: { ex_singapore: false, last_drawn_salary: 0, total_experience: 0 },
        is_verified: false,
        experience_years: 0,
        country_of_origin: '',
        experience_in_country: 0,
        skills: [] // New multi-skill array
    });

    // Subcollections State
    const [projects, setProjects] = useState<Project[]>([]);
    const [certs, setCerts] = useState<Certification[]>([]);
    const [references, setReferences] = useState<Reference[]>([]);

    // Temporary State for new items
    const [newProject, setNewProject] = useState<Partial<Project>>({});
    const [newCert, setNewCert] = useState<Partial<Certification>>({});
    const [certFile, setCertFile] = useState<File | null>(null);

    // Unified inline delete-confirmation UX (replaces the old mix of
    // window.confirm for projects and a bespoke inline timeout for certs).
    const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);
    const [deleteConfirmCertId, setDeleteConfirmCertId] = useState<string | null>(null);

    // Load existing data
    const loadData = useCallback(async () => {
        const uid = user?.id;
        setError(null);

        if (!uid) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const profileData = await getWorkerProfile(uid);

            if (profileData) {
                const loadedSkills: UserSkill[] = migrateLegacySkills(profileData);

                setProfile(prev => ({
                    ...prev,
                    ...profileData,
                    skills: loadedSkills,
                    physical_attributes: { ...prev.physical_attributes, ...(profileData.physical_attributes || {}) },
                    media_links: { ...prev.media_links, ...(profileData.media_links || {}) },
                    trade_specifics: profileData.trade_specifics || {}
                }));

                // Load subcollections safely — worker sub-resources key off the
                // worker_profiles row's own id, not the auth user id.
                try {
                    const [p, c, r] = await Promise.all([
                        getWorkerProjects(profileData.id),
                        getWorkerCertifications(profileData.id),
                        getWorkerReferences(profileData.id)
                    ]);
                    setProjects(p);
                    setCerts(c);
                    setReferences(r);
                } catch (subError) {
                    console.warn("Could not load projects/certifications/references:", subError);
                }
            } else {
                setProfile(prev => ({ ...prev, id: '', user_id: uid }));
                setIsEditing(true);
            }
        } catch (e) {
            console.error("Error loading profile:", e);
            setError("We couldn't load your profile. Please check your connection and try again.");
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle changes from DynamicTradeForm
    const handleSkillsChange = (newSkills: UserSkill[]) => {
        // Find primary skill to update legacy flat fields
        const primarySkill = newSkills.find(s => s.isPrimary) || newSkills[0];

        setProfile(prev => ({
            ...prev,
            skills: newSkills,
            // Sync legacy fields for backward compatibility with Search/Passport
            trade_or_skill: primarySkill ? primarySkill.trade : '',
            trade_specifics: primarySkill ? primarySkill.tags : {}
        }));
    };

    const handleSaveMainProfile = async () => {
        setLoading(true);
        const uid = user?.id;
        if (!uid) { setLoading(false); return; }

        try {
            const profileToSave = { ...profile, user_id: uid };

            // Ensure skills is defined to prevent data loss
            if (!profileToSave.skills) {
                profileToSave.skills = [];
            }

            await saveWorkerProfile(profileToSave);

            // On first save, the DB assigns the worker_profiles row its own id
            // (distinct from the auth user id) — re-fetch it so later steps
            // (projects/certifications, which are keyed off that id) work.
            if (!profile.id) {
                const saved = await getWorkerProfile(uid);
                if (saved) {
                    setProfile(prev => ({ ...prev, id: saved.id }));
                }
            }

            if (step < 5) setStep(step + 1);
            else {
                setIsEditing(false);
                setStep(1);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to save profile");
        }
        setLoading(false);
    };

    const handleAddProject = async () => {
        if (!profile.id || !newProject.project_name) {
            if (!profile.id) alert("Please save your profile first (Step 1) before adding work history.");
            else alert("Project name is required.");
            return;
        }

        try {
            if (newProject.id) {
                // Update existing project
                await updateWorkerProject(newProject.id, newProject);
                setProjects(prev => prev.map(p => p.id === newProject.id ? { ...p, ...newProject } as Project : p));
                alert("Project updated successfully!");
            } else {
                // Add new project
                const newId = await addWorkerProject(profile.id, newProject as Omit<Project, 'id'>);
                const projectWithId = { ...newProject, id: newId } as Project;
                setProjects(prev => [...prev, projectWithId]);
                alert("Project added successfully!");
            }
            setNewProject({});
        } catch (e) {
            alert("Error saving project.");
        }
    }

    const handleEditProject = (project: Project) => {
        setNewProject(project);
        // Scroll to top of form
        const formElement = document.getElementById('project-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteProject = async (projectId: string | undefined) => {
        if (!projectId) return;

        // Inline confirmation, same pattern as certification delete.
        if (deleteConfirmProjectId !== projectId) {
            setDeleteConfirmProjectId(projectId);
            setTimeout(() => setDeleteConfirmProjectId(null), 3000);
            return;
        }
        setDeleteConfirmProjectId(null);

        try {
            await deleteWorkerProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (e) {
            console.error("Error deleting project:", e);
            alert("Failed to delete project.");
        }
    };

    const handleAddCert = async () => {
        if (!profile.id || !newCert.cert_name) {
            if (!profile.id) alert("Please save your profile first (Step 1) before adding certifications.");
            return;
        }
        const uid = user?.id;
        if (!uid) return;

        // Validate File Size (2MB = 2 * 1024 * 1024 bytes)
        if (certFile && certFile.size > 2 * 1024 * 1024) {
            alert("File size exceeds 2MB. Please upload a smaller file.");
            return;
        }

        let downloadUrl = '';
        if (certFile) {
            try {
                downloadUrl = await uploadFile('worker-cert-docs', uid, certFile);
            } catch (e) {
                alert("Failed to upload certificate file");
                return;
            }
        }

        try {
            // 1. Add item and GET THE ID back
            const newId = await addWorkerCertification(profile.id, {
                cert_name: newCert.cert_name!,
                expiry_date: newCert.expiry_date || '',
                document_url: downloadUrl,
            });

            // 2. Manually update local state with the new item AND its ID.
            const newCertItem: Certification = {
                id: newId,
                cert_name: newCert.cert_name!,
                expiry_date: newCert.expiry_date || '',
                document_url: downloadUrl
            };

            setCerts(prev => [...prev, newCertItem]);

            // 3. Reset form
            setNewCert({});
            setCertFile(null);
            const fileInput = document.getElementById('cert-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (e) {
            alert("Error adding certification.");
            console.error(e);
        }
    }

    const handleDeleteCert = async (certId: string | undefined) => {
        if (!certId) {
            console.error("Cannot delete: Certificate ID is missing");
            return;
        }

        // Inline Confirmation Logic
        if (deleteConfirmCertId !== certId) {
            setDeleteConfirmCertId(certId);
            // Auto-reset after 3 seconds
            setTimeout(() => setDeleteConfirmCertId(null), 3000);
            return;
        }

        try {
            // Optimistically update UI first for better responsiveness
            setCerts(prev => prev.filter(c => c.id !== certId));
            setDeleteConfirmCertId(null);

            // Then delete from DB
            await deleteWorkerCertification(certId);
        } catch (e) {
            console.error("Error deleting certification:", e);
            alert("Failed to delete certification from database. Refreshing list.");
            // Revert / Refresh if failed
            if (profile.id) {
                const updated = await getWorkerCertifications(profile.id);
                setCerts(updated);
            }
        }
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                alert("File size must be less than 5MB");
                return;
            }
            const uid = user?.id;
            if (!uid) return;
            setLoading(true);
            try {
                const downloadUrl = await uploadFile('worker-cvs', uid, file);

                const updatedProfile = { ...profile, cv_url: downloadUrl, user_id: uid };
                await saveWorkerProfile(updatedProfile);
                setProfile(updatedProfile);
                alert("CV Uploaded Successfully!");
            } catch (error) {
                console.error("Error uploading CV:", error);
                alert("Failed to upload CV.");
            } finally {
                setLoading(false);
                if (cvInputRef.current) cvInputRef.current.value = '';
            }
        }
    };



    if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen px-4 text-center">
                <AlertTriangle size={40} className="text-red-500 mb-3" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Couldn't load your profile</h2>
                <p className="text-slate-500 mb-6 max-w-md">{error}</p>
                <button
                    onClick={() => loadData()}
                    className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    // --- VIEW MODE: Show Passport Layout ---
    if (!isEditing) {
        return (
            <div className="relative">


                <PassportLayout
                    profile={profile}
                    projects={projects}
                    certs={certs}
                    references={references}
                    onEdit={() => setIsEditing(true)}
                />
            </div>
        );
    }

    // --- EDIT MODE: Wizard ---
    return (
        <div className="max-w-3xl mx-auto py-10 px-4">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Edit Your Profile</h1>
                <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-800">Cancel</button>
            </div>

            {/* Wizard Progress */}
            <div className="flex justify-between mb-8 text-sm font-medium text-slate-400 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
                {[1, 2, 3, 4, 5].map(i => (
                    <button
                        key={i}
                        onClick={() => setStep(i)}
                        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white transition-colors ${step >= i ? 'border-emerald-600 text-emerald-600' : 'border-slate-300 text-slate-300'
                            }`}
                    >
                        {i}
                    </button>
                ))}
            </div>

            <div className="mb-6 text-center">
                <h2 className="text-xl font-bold text-slate-800">
                    {step === 1 && 'The Basics'}
                    {step === 2 && 'Trade Expertise'}
                    {step === 3 && 'Skill Demo (Videos)'}
                    {step === 4 && 'Documents & Certs'}
                    {step === 5 && 'Work History'}
                </h2>
            </div>

            {/* --- Step 1: Basics --- */}
            {step === 1 && (
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="e.g. John Doe"
                            value={profile.full_name}
                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Country of Origin</label>
                            <select
                                className="w-full p-3 border rounded-lg bg-white"
                                value={profile.country_of_origin}
                                onChange={e => setProfile({ ...profile, country_of_origin: e.target.value })}
                            >
                                <option value="">Select Country...</option>
                                {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Exp. in Host Country (Years)</label>
                            <input
                                type="number"
                                className="w-full p-3 border rounded-lg"
                                value={profile.experience_in_country}
                                onChange={e => setProfile({ ...profile, experience_in_country: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Short Bio / About Me</label>
                        <textarea
                            className="w-full p-3 border rounded-lg h-32"
                            placeholder="Tell employers about yourself..."
                            value={profile.bio}
                            onChange={e => setProfile({ ...profile, bio: e.target.value })}
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium text-slate-800 mb-3">Physical Attributes</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={profile.physical_attributes?.height_cm || ''}
                                    onChange={e => setProfile({ ...profile, physical_attributes: { ...profile.physical_attributes, height_cm: parseInt(e.target.value) } })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={profile.physical_attributes?.weight_kg || ''}
                                    onChange={e => setProfile({ ...profile, physical_attributes: { ...profile.physical_attributes, weight_kg: parseInt(e.target.value) } })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Color Blind?</label>
                                <select
                                    className="w-full p-2 border rounded bg-white"
                                    value={profile.physical_attributes?.color_blindness ? 'yes' : 'no'}
                                    onChange={e => setProfile({ ...profile, physical_attributes: { ...profile.physical_attributes, color_blindness: e.target.value === 'yes' } })}
                                >
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Step 2: Trade (Using New Dynamic Form) --- */}
            {step === 2 && (
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Years Experience</label>
                        <input
                            type="number"
                            className="w-full p-3 border rounded-lg"
                            value={profile.experience_years}
                            onChange={e => setProfile({ ...profile, experience_years: parseInt(e.target.value) || 0 })}
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Skills & Expertise</h3>
                        <p className="text-sm text-slate-500 mb-6">Add your primary trade first, then any secondary skills.</p>
                        <DynamicTradeForm
                            skills={profile.skills || []}
                            onSkillsChange={handleSkillsChange}
                        />
                    </div>
                </div>
            )}

            {/* --- Step 3: Videos --- */}
            {step === 3 && (
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100">
                        <strong>Pro Tip:</strong> Upload your videos to YouTube, TikTok, or Facebook first, then paste the link here.
                    </div>

                    <VideoLinkInput
                        label="Intro Video Link (YouTube/TikTok)"
                        placeholder="https://youtube.com/watch?v=..."
                        value={profile.media_links?.intro_video_url || ''}
                        onChange={(val) => setProfile({ ...profile, media_links: { ...profile.media_links, intro_video_url: val } })}
                    />

                    <VideoLinkInput
                        label="Skill Demo Video Link"
                        placeholder="https://youtube.com/shorts/..."
                        value={profile.media_links?.skill_video_url || ''}
                        onChange={(val) => setProfile({ ...profile, media_links: { ...profile.media_links, skill_video_url: val } })}
                    />
                </div>
            )}

            {/* --- Step 4: Docs --- */}
            {step === 4 && (
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">

                    {/* NEW CV SECTION */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <h3 className="font-bold text-lg mb-2">Curriculum Vitae (CV)</h3>
                        <p className="text-sm text-slate-500 mb-4">Upload your resume/CV to let employers know more about you.</p>

                        <div className="flex items-center gap-4">
                            <div className="flex-grow">
                                <input
                                    ref={cvInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleCVUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-emerald-700 hover:file:bg-emerald-50 border border-slate-300 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>

                        {profile.cv_url && (
                            <div className="mt-4 flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <FileCheck size={20} />
                                    <span className="font-medium text-sm">CV Uploaded</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={profile.cv_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-emerald-600 hover:underline font-medium"
                                    >
                                        View
                                    </a>
                                    <button
                                        onClick={() => setProfile({ ...profile, cv_url: '' })}
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                        title="Remove CV"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <h3 className="font-bold text-lg">Add Certifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                        <input
                            className="p-2 border rounded"
                            placeholder="Certificate Name (e.g. CSOC)"
                            value={newCert.cert_name || ''}
                            onChange={e => setNewCert({ ...newCert, cert_name: e.target.value })}
                        />
                        <input
                            type="date"
                            className="p-2 border rounded"
                            value={newCert.expiry_date || ''}
                            onChange={e => setNewCert({ ...newCert, expiry_date: e.target.value })}
                        />
                        <div className="md:col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Upload Document (Image/PDF) - Max 2MB</label>
                            <input
                                type="file"
                                id="cert-file-input"
                                onChange={e => e.target.files && setCertFile(e.target.files[0])}
                                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            />
                        </div>
                        <button onClick={handleAddCert} className="md:col-span-2 bg-slate-800 text-white py-2 rounded hover:bg-slate-900">
                            Add Certification
                        </button>
                    </div>

                    <div className="space-y-2">
                        {certs.map((c, idx) => (
                            <div key={c.id || idx} className="flex justify-between items-center p-3 bg-white border rounded">
                                <div>
                                    <span className="font-bold block">{c.cert_name}</span>
                                    <span className="text-xs text-slate-500">Expires: {c.expiry_date}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {c.document_url && <a href={c.document_url} target="_blank" rel="noreferrer" className="text-emerald-600 text-sm underline">View</a>}
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteCert(c.id)}
                                        className={`transition-all duration-200 p-1 rounded ${deleteConfirmCertId === c.id ? 'bg-red-600 text-white px-3' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                                        title="Delete Certification"
                                    >
                                        {deleteConfirmCertId === c.id ? <span className="text-xs font-bold">Confirm?</span> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- Step 5: History --- */}
            {step === 5 && (
                <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg">Work History</h3>
                    <div id="project-form" className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-slate-700">{newProject.id ? 'Edit Project' : 'Add New Project'}</h4>
                            {newProject.id && (
                                <button
                                    onClick={() => setNewProject({})}
                                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>

                        <input
                            className="w-full p-2 border rounded"
                            placeholder="Project Name / Company"
                            value={newProject.project_name || ''}
                            onChange={e => setNewProject({ ...newProject, project_name: e.target.value })}
                        />
                        <input
                            className="w-full p-2 border rounded"
                            placeholder="Role (e.g. Lead Welder)"
                            value={newProject.role || ''}
                            onChange={e => setNewProject({ ...newProject, role: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number" placeholder="Start Year" className="p-2 border rounded"
                                value={newProject.year_start || ''}
                                onChange={e => setNewProject({ ...newProject, year_start: parseInt(e.target.value) })}
                            />
                            <input
                                type="number" placeholder="End Year" className="p-2 border rounded"
                                value={newProject.year_end || ''}
                                onChange={e => setNewProject({ ...newProject, year_end: parseInt(e.target.value) })}
                            />
                        </div>

                        {/* New Description Field */}
                        <textarea
                            className="w-full p-2 border rounded h-24"
                            placeholder="Short write-up about your experience (e.g. Responsibilities, key achievements...)"
                            value={newProject.description || ''}
                            onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                        />

                        <button
                            id="add-project-btn"
                            type="button"
                            onClick={handleAddProject}
                            className={`w-full text-white py-2 rounded flex items-center justify-center gap-2 ${newProject.id ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900'}`}
                        >
                            {newProject.id ? <Edit3 size={16} /> : <Plus size={16} />}
                            {newProject.id ? 'Update Project' : 'Add Project'}
                        </button>
                    </div>

                    <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-4">
                        {projects.map((p, idx) => (
                            <div key={p.id || idx} className="relative group">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-400"></div>

                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{p.project_name}</h4>
                                        <p className="text-sm text-emerald-600 font-medium">{p.role}</p>
                                        <span className="text-xs text-slate-400">{p.year_start} - {p.year_end}</span>
                                    </div>

                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditProject(p)}
                                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                            title="Edit"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProject(p.id)}
                                            className={`p-1 rounded transition-all duration-200 ${deleteConfirmProjectId === p.id ? 'bg-red-600 text-white px-3' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                                            title="Delete"
                                        >
                                            {deleteConfirmProjectId === p.id ? <span className="text-xs font-bold">Confirm?</span> : <Trash2 size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {p.description && (
                                    <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                        {p.description}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-between sticky bottom-0 bg-slate-50 p-4 border-t border-slate-200">
                <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-700 disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleSaveMainProfile}
                    disabled={loading}
                    className="px-8 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg disabled:opacity-70 transition-all"
                >
                    {loading ? 'Saving...' : (step === 5 ? 'Finish & View Profile' : 'Save & Next')}
                </button>
            </div>
        </div>
    );
}
