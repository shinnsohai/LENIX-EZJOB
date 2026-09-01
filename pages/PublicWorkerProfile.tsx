
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkerProfile, getSubcollectionData } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import PassportLayout from '../components/profile/PassportLayout';
import Spinner from '../components/Spinner';
import { ArrowLeft } from 'lucide-react';
import type { WorkerProfile, Project, Certification, Reference, UserSkill } from '../types';

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

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            try {
                const profileData = await getWorkerProfile(id);
                if (profileData) {
                    // Legacy Migration: If 'skills' array is missing/empty but 'trade_or_skill' exists, create the array
                    let loadedSkills: UserSkill[] = profileData.skills || [];
                    if (loadedSkills.length === 0 && profileData.trade_or_skill) {
                        loadedSkills = [{
                            trade: profileData.trade_or_skill,
                            tags: profileData.trade_specifics || {},
                            isPrimary: true
                        }];
                    }

                    setProfile({
                        ...profileData,
                        skills: loadedSkills,
                        physical_attributes: { ...profileData.physical_attributes },
                        media_links: { ...profileData.media_links },
                        trade_specifics: profileData.trade_specifics || {}
                    });

                    // Load subcollections
                    const [p, c, r] = await Promise.all([
                        getSubcollectionData(id, 'projects'),
                        getSubcollectionData(id, 'certifications'),
                        getSubcollectionData(id, 'references')
                    ]);
                    setProjects(p as Project[]);
                    setCerts(c as Certification[]);
                    setReferences(r as Reference[]);
                } else {
                    setError('Worker profile not found.');
                }
            } catch (e) {
                console.error("Error loading public profile:", e);
                setError('Failed to load profile.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

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
