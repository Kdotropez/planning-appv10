import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';

const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "klick-planning-v7.firebaseapp.com",
    databaseURL: "https://klick-planning-v7-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "klick-planning-v7",
    storageBucket: "klick-planning-v7.appspot.com",
    messagingSenderId: "702907373031",
    appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export async function loadFromFirebase() {
    try {
        const dbRef = ref(database, 'planning-data');
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Données chargées depuis Realtime Database:', JSON.stringify(data, null, 2));
            return data;
        } else {
            console.log('Aucune donnée disponible dans Realtime Database sous planning-data.');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données depuis Realtime Database:', error);
        return null;
    }
}

export async function saveToFirebase(data) {
    try {
        const dbRef = ref(database, 'planning-data');
        await set(dbRef, data);
        console.log('Données sauvegardées dans Realtime Database:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde dans Realtime Database:', error);
        throw error;
    }
}