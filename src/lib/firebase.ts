import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => console.error("Persistence error", err));
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  console.log("Current Domain Identification:", {
    origin: window.location.origin,
    hostname: window.location.hostname,
    href: window.location.href
  });

  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0);
    const isIframe = window.self !== window.top;
    
    // On iOS Safari, popups are often blocked, and in itrames they are even worse.
    // If in iframe, we MUST use a separate tab eventually, but we can try to redirect.
    if (isIframe) {
      console.log("Environment: Iframe detected. Redirecting might feel like 'no reaction' if blocked.");
      // We'll proceed but the AuthModal already has a 'standalone' button.
    }

    if (isMobile || isIframe) {
      console.log("Auth Strategy: signInWithRedirect");
      // Add a small delay or non-blocking notification for UX
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectError: any) {
        console.error("Redirect call failed:", redirectError);
        if (redirectError.code === 'auth/unauthorized-domain') {
          throw new Error(`域名未授权 (Unauthorized Domain).\n当前域名: ${window.location.hostname}\n当前 Firebase 项目: ${firebaseConfig.projectId}`);
        }
        throw redirectError;
      }
    } else {
      console.log("Auth Strategy: signInWithPopup");
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error: any) {
    console.error("Sign-in core error:", error);
    if (error.code === 'auth/unauthorized-domain') {
       throw new Error(`域名未授权 (Unauthorized Domain).\n当前域名: ${window.location.hostname}\n当前 Firebase 项目: ${firebaseConfig.projectId}\n\n如果您已在控制台添加此域名，请检查:\n1. 是否添加到了正确的项目: ${firebaseConfig.projectId}\n2. 等待 2-3 分钟生效\n3. 清除 Safari 缓存或在全屏模式下打开。`);
    }
    throw error;
  }
};

export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Email:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string, name: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error) {
    console.error("Error registering with Email:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore Connection: OK");
  } catch (error: any) {
    console.error("Firestore connection attempt failed:", error);
    if (error.message && (error.message.includes('the client is offline') || error.message.includes('permission-denied'))) {
       console.error("Please check your Firebase configuration and Security Rules.");
    }
  }
}
