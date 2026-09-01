
import { db, storage } from '../firebaseConfig';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    query,
    where,
    addDoc,
    deleteDoc,
    orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { WorkerProfile, EmployerProfile, Job, Application } from '../types';

// Helper to upload files
export const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    // Add metadata so browsers handle the file correctly (e.g. display images instead of downloading)
    const metadata = {
        contentType: file.type
    };
    await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(storageRef);
};

// --- Profiles ---

export const getWorkerProfile = async (userId: string): Promise<WorkerProfile | null> => {
    try {
        const docRef = doc(db, 'workerProfiles', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as WorkerProfile;
        }
        return null;
    } catch (error) {
        console.error("Error getting worker profile:", error);
        return null;
    }
};

export const saveWorkerProfile = async (profile: WorkerProfile) => {
    await setDoc(doc(db, 'workerProfiles', profile.user_id), profile);
};

export const getEmployerProfile = async (userId: string): Promise<EmployerProfile | null> => {
    console.log(`Fetching employer profile for ${userId}`);
    try {
        const docRef = doc(db, 'employerProfiles', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            console.log("Employer profile found:", docSnap.data());
            return { id: docSnap.id, ...docSnap.data() } as EmployerProfile;
        }
        console.log("No employer profile found.");
        return null;
    } catch (error) {
        console.error("Error getting employer profile:", error);
        return null;
    }
};

export const saveEmployerProfile = async (profile: EmployerProfile) => {
    await setDoc(doc(db, 'employerProfiles', profile.user_id), profile);
};

// --- Subcollections for Worker Profile ---

export const getSubcollectionData = async (userId: string, subcollectionName: string) => {
    try {
        const snapshot = await getDocs(collection(db, 'workerProfiles', userId, subcollectionName));
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error(`Error getting ${subcollectionName}:`, error);
        return [];
    }
};

export const addSubcollectionItem = async (userId: string, subcollectionName: string, data: any): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, 'workerProfiles', userId, subcollectionName), data);
        return docRef.id; // Return the generated ID
    } catch (error) {
        console.error(`Error adding to ${subcollectionName}:`, error);
        throw error;
    }
};

export const deleteSubcollectionItem = async (userId: string, subcollectionName: string, itemId: string) => {
    try {
        await deleteDoc(doc(db, 'workerProfiles', userId, subcollectionName, itemId));
        console.log(`Successfully deleted document ${itemId} from ${subcollectionName}`);
    } catch (error) {
        console.error(`Error deleting from ${subcollectionName}:`, error);
        throw error;
    }
};

export const updateSubcollectionItem = async (userId: string, subcollectionName: string, itemId: string, data: any) => {
    try {
        await updateDoc(doc(db, 'workerProfiles', userId, subcollectionName, itemId), data);
        console.log(`Successfully updated document ${itemId} in ${subcollectionName}`);
    } catch (error) {
        console.error(`Error updating ${subcollectionName}:`, error);
        throw error;
    }
};


// --- Jobs ---

export const getJobs = async (employerId?: string): Promise<Job[]> => {
    console.log(`getJobs called. EmployerFilter: ${employerId}`);
    try {
        let q;
        if (employerId) {
            // Employer Dashboard: Fetch jobs created by this employer
            q = query(collection(db, 'jobs'), where('employer_id', '==', employerId));
        } else {
            // Public Search: Fetch only Active jobs
            q = query(collection(db, 'jobs'), where('status', '==', 'Active'));
        }

        const snapshot = await getDocs(q);
        console.log(`getJobs query returned ${snapshot.size} documents.`);

        return snapshot.docs.map(d => {
            const data = d.data();
            return { id: d.id, ...(data as Record<string, any>) } as Job;
        });
    } catch (error) {
        console.error("Error getting jobs from Firestore:", error);
        throw error;
    }
};

export const createJob = async (job: Omit<Job, 'id'>) => {
    console.log("Attempting to create job in DB:", job);
    try {
        if (!job.employer_id) {
            throw new Error("Cannot create job: employer_id is missing.");
        }

        const docRef = await addDoc(collection(db, 'jobs'), {
            ...job,
            createdAt: new Date().toISOString()
        });
        console.log("Job created successfully with ID:", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Firestore addDoc error:", e);
        throw e;
    }
};

export const updateJob = async (id: string, data: Partial<Job>) => {
    console.log(`Updating job ${id}`, data);
    await updateDoc(doc(db, 'jobs', id), data);
};

export const deleteJob = async (id: string) => {
    console.log(`Deleting job ${id}`);
    await deleteDoc(doc(db, 'jobs', id));
};

// --- Applications (Job Applications) ---

export const createApplication = async (job: Job, workerId: string) => {
    try {
        // 1. Check if already applied
        const q = query(
            collection(db, 'applications'),
            where('job_id', '==', job.id),
            where('worker_id', '==', workerId)
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docSnapshot = snapshot.docs[0];
            const appData = docSnapshot.data();

            // If the application was withdrawn, reactivate it
            if (appData.status === 'Withdrawn') {
                await updateDoc(doc(db, 'applications', docSnapshot.id), {
                    status: 'Submitted',
                    appliedAt: new Date().toISOString()
                });
                return true;
            }

            throw new Error("You have already applied for this job.");
        }

        // 2. Create Application
        const applicationData: Omit<Application, 'id'> = {
            job_id: job.id,
            worker_id: workerId,
            employer_id: job.employer_id,
            status: 'Submitted',
            job_title: job.title,
            employer_name: job.employer_name,
            location: job.location,
            appliedAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'applications'), applicationData);
        return true;
    } catch (error) {
        console.error("Error applying for job:", error);
        throw error;
    }
};

export const getWorkerApplications = async (workerId: string): Promise<Application[]> => {
    try {
        const q = query(collection(db, 'applications'), where('worker_id', '==', workerId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Application));
    } catch (error) {
        console.error("Error fetching applications:", error);
        return [];
    }
};

// Soft withdraw: updates status to 'Withdrawn'
export const withdrawApplication = async (applicationId: string) => {
    console.log(`Attempting to withdraw application: ${applicationId}`);
    try {
        await updateDoc(doc(db, 'applications', applicationId), {
            status: 'Withdrawn'
        });
        console.log(`Successfully withdrawn application: ${applicationId}`);
    } catch (error) {
        console.error("Error withdrawing application:", error);
        throw error;
    }
};

// Re-apply from dashboard: updates status to 'Submitted'
export const reapplyApplication = async (applicationId: string) => {
    console.log(`Attempting to re-apply application: ${applicationId}`);
    try {
        await updateDoc(doc(db, 'applications', applicationId), {
            status: 'Submitted',
            appliedAt: new Date().toISOString()
        });
        console.log(`Successfully re-applied application: ${applicationId}`);
    } catch (error) {
        console.error("Error re-applying for application:", error);
        throw error;
    }
};

export const getJobApplicants = async (jobId: string): Promise<WorkerProfile[]> => {
    try {
        // 1. Get applications for the job
        const q = query(collection(db, 'applications'), where('job_id', '==', jobId));
        const snapshot = await getDocs(q);

        // Filter out withdrawn applications so employers don't see them
        const activeApplications = snapshot.docs.filter(doc => doc.data().status !== 'Withdrawn');
        const workerIds = activeApplications.map(doc => doc.data().worker_id);

        if (workerIds.length === 0) {
            return [];
        }

        // 2. Fetch worker profiles
        // Note: in a high-traffic app, we would paginate or use 'in' queries in chunks of 10
        const workerPromises = workerIds.map(id => getWorkerProfile(id));
        const workers = await Promise.all(workerPromises);

        // Filter out nulls if a worker profile was deleted but application remains
        return workers.filter((w): w is WorkerProfile => w !== null);
    } catch (error) {
        console.error("Error fetching job applicants:", error);
        return [];
    }
};

// --- Search Workers (Real DB) ---

export const searchWorkersInDb = async (filters: { skill: string; experience: number; country: string }): Promise<WorkerProfile[]> => {
    console.log("Searching workers with filters:", filters);
    try {
        // Fetch ALL profiles first, then filter in memory. 
        // This allows us to handle data that might be missing the 'status' field (legacy data) or have different field names.
        const snapshot = await getDocs(collection(db, 'workerProfiles'));

        console.log(`Found ${snapshot.size} total worker profiles in DB.`);

        let workers = snapshot.docs.map(d => {
            const data = d.data();

            // Fix string formatting for trade_or_skill
            let tradeDisplay = data.trade_or_skill;

            // If trade_or_skill is missing, check if 'skills' array exists and use the primary skill name
            if (!tradeDisplay && data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
                const primary = data.skills.find((s: any) => s.isPrimary) || data.skills[0];
                tradeDisplay = primary.trade;
            }
            // Fallback if it's still not a string
            else if (typeof tradeDisplay !== 'string') {
                tradeDisplay = 'General';
            }

            return {
                id: d.id,
                user_id: data.user_id || d.id,
                full_name: data.full_name || data.name || 'Unknown Worker',
                trade_or_skill: tradeDisplay,
                experience_years: typeof data.experience_years === 'number' ? data.experience_years : (parseInt(data.experience) || 0),
                summary: data.summary || data.experience || '',
                bio: data.bio || '',
                country_of_origin: data.country_of_origin || 'Unknown',
                experience_in_country: data.experience_in_country || 0,
                photo_url: data.photo_url,
                cv_url: data.cv_url,
                // IMPORTANT: Map the skills array so frontend can display multi-skills
                skills: data.skills || [],
                status: data.status || 'Active'
            } as WorkerProfile;
        });

        // Filter for Active status (after defaulting missing ones to Active)
        workers = workers.filter(w => w.status === 'Active');

        // Filter by Country (Exact Match) - only if filter is provided
        if (filters.country && filters.country !== 'Any') {
            workers = workers.filter(w => w.country_of_origin && w.country_of_origin.toLowerCase() === filters.country.toLowerCase());
        }

        // Filter by Experience (Greater than or equal)
        if (filters.experience > 0) {
            workers = workers.filter(w => w.experience_years >= filters.experience);
        }

        // Filter by Skill (Case-insensitive partial match)
        if (filters.skill) {
            const term = filters.skill.toLowerCase();
            workers = workers.filter(w =>
                (w.trade_or_skill && w.trade_or_skill.toLowerCase().includes(term)) ||
                // Search within the skills array as well
                (w.skills && w.skills.some((s: any) => s.trade.toLowerCase().includes(term))) ||
                (w.summary && w.summary.toLowerCase().includes(term)) ||
                (w.bio && w.bio.toLowerCase().includes(term))
            );
        }

        console.log(`Returning ${workers.length} workers after filtering.`);
        return workers;
    } catch (error) {
        console.error("Error searching workers in DB:", error);
        return [];
    }
};

// --- Site Content (Admin) ---

export const saveSiteContent = async (docId: string, data: any) => {
    try {
        console.log(`[saveSiteContent] Saving to siteContent/${docId}:`, data);
        await setDoc(doc(db, 'siteContent', docId), data);
        console.log(`[saveSiteContent] Successfully saved to siteContent/${docId}`);
    } catch (error) {
        console.error(`[saveSiteContent] Error saving to siteContent/${docId}:`, error);
        throw error;
    }
}

export const getSiteContent = async (docId: string) => {
    try {
        console.log(`[getSiteContent] Loading from siteContent/${docId}`);
        const docRef = await getDoc(doc(db, 'siteContent', docId));
        const exists = docRef.exists();
        const data = exists ? docRef.data() : undefined;
        console.log(`[getSiteContent] Loaded from siteContent/${docId}:`, exists ? 'Found' : 'Not found', data);
        return data;
    } catch (error) {
        console.error(`[getSiteContent] Error loading from siteContent/${docId}:`, error);
        throw error;
    }
}

// --- Users (Admin) ---

export const getAllWorkers = async (): Promise<WorkerProfile[]> => {
    const snapshot = await getDocs(collection(db, 'workerProfiles'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorkerProfile));
}

export const getAllEmployers = async (): Promise<EmployerProfile[]> => {
    const snapshot = await getDocs(collection(db, 'employerProfiles'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployerProfile));
}

// --- Applications ---

export const updateApplicationStatus = async (applicationId: string, status: 'Submitted' | 'Viewed' | 'Shortlisted' | 'Rejected' | 'Withdrawn') => {
    try {
        await updateDoc(doc(db, 'applications', applicationId), { status });
        console.log(`Application ${applicationId} status updated to ${status}`);
    } catch (error) {
        console.error('Error updating application status:', error);
        throw error;
    }
};
