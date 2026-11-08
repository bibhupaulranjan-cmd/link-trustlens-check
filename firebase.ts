   import { initializeApp } from "firebase/app";
   import { getAuth } from "firebase/auth";
   import { getFirestore } from "firebase/firestore";
   import { getAnalytics, isSupported } from "firebase/analytics";

   const firebaseConfig = {
     apiKey: "AIzaSyDEIXpvPiwjBqqN4totpoCzHSBKcWSucaA",
     authDomain: "trustlens-fde3e.firebaseapp.com",
     projectId: "trustlens-fde3e",
     storageBucket: "trustlens-fde3e.firebasestorage.app",
     messagingSenderId: "503904316038",
     appId: "1:503904316038:web:56a1fd3902b27f1d0dbf07",
     measurementId: "G-SD9XV5FYX9"
   };

   export const app = initializeApp(firebaseConfig);
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   export const analyticsPromise = isSupported().then((ok) =>
     ok ? getAnalytics(app) : null
   );
