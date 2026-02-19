import { User as FirebaseUser } from 'firebase/auth'

export interface KvkkConsent {
  acceptedAt: string
  version: string
}

export interface UserProfile {
  uid: string
  email: string
  name: string
  phone: string
  company: string
  emailVerified: boolean
  createdAt: string
  kvkkConsent: KvkkConsent | null
}

export type AuthUser = FirebaseUser
