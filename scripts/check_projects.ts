
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

async function checkProjects() {
    console.log("Checking projects...");
    try {
        // 1. Get all worker profiles to find the user
        const workersSnap = await getDocs(collection(db, 'workerProfiles'));
        console.log(`Found ${workersSnap.size} worker profiles.`);

        for (const workerDoc of workersSnap.docs) {
            console.log(`Checking worker: ${workerDoc.id} (${workerDoc.data().full_name})`);

            // 2. Get projects subcollection
            const projectsSnap = await getDocs(collection(db, 'workerProfiles', workerDoc.id, 'projects'));
            console.log(`  - Projects: ${projectsSnap.size}`);

            projectsSnap.forEach(p => {
                console.log(`    - [${p.id}] ${p.data().project_name}: ${p.data().description}`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

checkProjects();
