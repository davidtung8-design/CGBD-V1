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
  const hostname = window.location.hostname;
  
  try {
    const isIframe = window.self !== window.top;
    
    // Attempt Popup first (except in iframe where it's always blocked)
    if (!isIframe) {
      try {
        console.log("Attempting signInWithPopup");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
      } catch (popupError: any) {
        console.log("Popup failed/blocked, falling back to redirect:", popupError.code);
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
          // Fall through to redirect
        } else if (popupError.code === 'auth/unauthorized-domain') {
          throw new Error(`域名未授权 (Unauthorized Domain): ${hostname}`);
        } else {
          throw popupError;
        }
      }
    }

    console.log("Executing signInWithRedirect");
    await signInWithRedirect(auth, googleProvider);
  } catch (error: any) {
    if (error.code === 'auth/unauthorized-domain') {
       throw new Error(`域名未授权 (Unauthorized Domain): ${hostname}`);
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
    return { success: true };
  } catch (error: any) {
    console.error("Firestore connection attempt failed:", error);
    let reason = "Unknown error";
    if (error.message && error.message.includes('the client is offline')) {
      reason = "网络离线或无法连接 Firebase 服务器 (Client is offline or Firebase unreachable)";
    } else if (error.code === 'permission-denied') {
      reason = "权限被拒绝 (Permission Denied). 请检查 Firestore 规则";
    } else if (error.message && error.message.includes('failed-precondition')) {
      reason = "项目未初始化 (Project not initialized). 请在控制台点击 'Create Database'";
    } else {
      reason = error.message;
    }
    return { success: false, reason, code: error.code };
  }
}
