// import admin from 'firebase-admin';


// let app;

// try {
//   if (process.env.FIREBASE_SERVICE_ACCOUNT) {
//     const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
//     app = admin.initializeApp({
//       credential: admin.credential.cert(serviceAccount)
//     });
//     console.log('Firebase Admin initialized successfully.');
//   } else {
//     console.warn('FIREBASE_SERVICE_ACCOUNT not found in environment variables. Google Login will not work.');
//   }
// } catch (error) {
//   console.error('Failed to initialize Firebase Admin:', error);
// }

// export const adminAuth = app ? admin.auth() : null;



import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app = null;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    app = getApps().length
      ? getApps()[0]
      : initializeApp({
        credential: cert(serviceAccount),
      });

    console.log('Firebase Admin initialized successfully.');
  } else {
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT not found in environment variables. Google Login will not work.'
    );
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
}

export const adminAuth = app ? getAuth(app) : null;