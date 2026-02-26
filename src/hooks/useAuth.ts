import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export interface RegisterFormData {
  email: string
  password: string
  name: string
  phone: string
  company: string
}

// Turkish error messages for Firebase auth errors
const errorMessages: Record<string, string> = {
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor',
  'auth/invalid-email': 'Geçersiz e-posta adresi',
  'auth/operation-not-allowed': 'Bu işlem şu anda kullanılamıyor',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış',
  'auth/user-not-found': 'Kullanıcı bulunamadı',
  'auth/wrong-password': 'Hatalı şifre',
  'auth/invalid-credential': 'Geçersiz e-posta veya şifre',
  'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin',
  'auth/network-request-failed': 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin',
  'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı',
  'auth/cancelled-popup-request': 'Giriş işlemi iptal edildi',
}

function getErrorMessage(error: any): string {
  if (error?.code && errorMessages[error.code]) {
    return errorMessages[error.code]
  }
  return error?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

export function useAuthActions() {
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account',
      })
      const result = await signInWithPopup(auth, provider)

      // Create user profile if it doesn't exist
      const userDoc = doc(db, 'users', result.user.uid)
      await setDoc(
        userDoc,
        {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName || '',
          phone: '',
          company: '',
          emailVerified: result.user.emailVerified,
          createdAt: serverTimestamp(),
          // Note: kvkkConsent is intentionally NOT included here
          // With merge: true, existing kvkkConsent values will be preserved
          // New users will have no kvkkConsent and will be prompted
        },
        { merge: true }
      )

      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const signUpWithEmail = async (data: RegisterFormData) => {
    try {
      // Create auth user
      const result = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      )

      // Update display name
      await updateProfile(result.user, {
        displayName: data.name,
      })

      // Send verification email
      await sendEmailVerification(result.user)

      // Create user profile in Firestore
      const userDoc = doc(db, 'users', result.user.uid)
      await setDoc(userDoc, {
        uid: result.user.uid,
        email: data.email,
        name: data.name,
        phone: data.phone,
        company: data.company,
        emailVerified: false,
        createdAt: serverTimestamp(),
        kvkkConsent: null,
      })

      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Kullanıcı oturumu bulunamadı' }
      }
      await sendEmailVerification(auth.currentUser)
      return { success: true }
    } catch (error) {
      return { success: false, error: getErrorMessage(error) }
    }
  }

  return {
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    sendPasswordReset,
    signOut,
    resendVerificationEmail,
  }
}
