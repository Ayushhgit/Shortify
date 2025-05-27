import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPQfvFEcNC2CE3hBLzDXJFQDjlrFldgvA",
  authDomain: "shortify-876e7.firebaseapp.com",
  projectId: "shortify-876e7",
  storageBucket: "shortify-876e7.firebasestorage.app",
  messagingSenderId: "1073217346097",
  appId: "1:1073217346097:web:99131161930a940cc71310",
  measurementId: "G-V0KYESHCV4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export const db = getFirestore(app);

export const getToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

export default app;
