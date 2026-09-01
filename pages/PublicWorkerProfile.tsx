
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkerProfile, getWorkerProjects, getWorkerCertifications, getWorkerReferences } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { migrateLegacySkills } from '../utils/workerSkills';
import PassportLayout from '../components/profile/PassportLayout';
import Spinner from '../components/Spinner';
import { ArrowLeft } from 'lucide-react';
import type { WorkerProfile, Project, Certification, Reference } from '../types';

export default function PublicWorkerProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<WorkerProfile | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [certs, setCerts] = useState<Certification[]>([]);
    const [references, setReferences] = useState<Reference[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError('');
        try {
            const profileData = await getWorkerProfile(id);
            if (profileData) {
                const loadedSkills = migrateLegacySkills(profileData);

                setProfile({
                    ...profileData,
                    skills: loadedSkills,
                    physical_attributes: { ...profileData.physical_attributes },
                    media_links: { ...profileData.media_links },
                    trade_specifics: profileData.trade_specifics || {}
                });

                // Each sub-resource is fetched independently so a failure in
                // one (e.g. a transient permissions/network hiccup) doesn't
                // blank out the whole profile — the passport still renders
                // with whatever loaded successfully.
                try {
                    setProjects(await getWorkerProjects(profileData.id));
                } catch (e) {
                    console.warn("Could not load projects:", e);
                }
                try {
                    setCerts(await getWorkerCertifications(profileData.id));
                } catch (e) {
                    console.warn("Could not load certifications:", e);
                }
                try {
                    setReferences(await getWorkerReferences(profileData.id));
                } catch (e) {
                    console.warn("Could not load references:", e);
                }
            } else {
                setError('Worker profile not found.');
            }
        } catch (e) {
            console.error("Error loading public profile:", e);
            setError('Failed to load profile.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>;
    if (error || !profile) return <div className="text-center py-20 text-slate-500">{error || 'Profile not found'}</div>;

    return (
        <div>
            {/* Back Button - Only for Employers */}
            {user && user.role === UserRole.EMPLOYER && (
                <div className="bg-slate-900 border-b border-slate-700">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </div>
            )}

            <PassportLayout
                profile={profile}
                projects={projects}
                certs={certs}
                references={references}
            // No onEdit prop for public view
            />
        </div>
    );
}
