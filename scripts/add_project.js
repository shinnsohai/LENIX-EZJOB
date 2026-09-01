
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');
const { firebaseConfig } = require('../firebaseConfig');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addProject() {
    console.log("Adding project...");
    try {
        // 1. Get a worker profile
        const workersSnap = await getDocs(collection(db, 'workerProfiles'));
        if (workersSnap.empty) {
            console.log("No workers found.");
            return;
        }
        const workerId = workersSnap.docs[0].id;
        console.log(`Adding to worker: ${workerId}`);

        // 2. Add project
        const newProject = {
            project_name: "Script Project",
            role: "Script Role",
            year_start: 2020,
            year_end: 2021,
            description: "Added via script"
        };

        const docRef = await addDoc(collection(db, 'workerProfiles', workerId, 'projects'), newProject);
        console.log("Project added with ID:", docRef.id);

    } catch (e) {
        console.error("Error:", e);
    }
}

addProject();
