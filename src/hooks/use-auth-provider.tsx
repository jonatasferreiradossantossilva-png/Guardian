'use client';

import { useCallback, useState } from 'react';
import { auth, firestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { isFirestoreMode, useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { unmask } from '@/lib/masks';

export function useAuthProvider() {
  const [isLoading, setIsLoading] = useState(false);
  const { db, addDoc } = useData();
  const { toast } = useToast();

  const login = useCallback(
    async (identifier: string, pinOrPass: string, profile: string) => {
      setIsLoading(true);
      const input = identifier.trim();
      const isEmail = input.includes('@');
      const cleanId = isEmail ? input.toLowerCase() : unmask(input);

      if (isFirestoreMode()) {
        try {
          if (!auth || !firestore) {
            throw new Error('Serviço de autenticação/banco indisponível.');
          }

          let email = '';
          let fetchedProfile = '';
          
          if (isEmail) {
            email = cleanId;
            // Sign in directly using Firebase Auth first to bypass unauthenticated access limits
            const userCredential = await signInWithEmailAndPassword(auth, email, pinOrPass);
            const firebaseUser = userCredential.user;

            // Fetch user profile from Firestore using getDoc (allowed for signed-in users)
            const userDocRef = doc(firestore, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
              throw new Error('Cadastro do usuário não encontrado no banco de dados.');
            }

            const userData = userDocSnap.data();
            fetchedProfile = userData.profile;
            sessionStorage.setItem('mockUserId', firebaseUser.uid);
            localStorage.setItem('mockUserId', firebaseUser.uid);
            
          } else {
            // Sign in anonymously first to get query permissions for CPF lookup
            if (!auth.currentUser) {
              await signInAnonymously(auth);
            }

            const usersRef = collection(firestore, 'users');
            // Check both masked and unmasked CPF
            const qUnmasked = query(usersRef, where('cpf', '==', cleanId));
            let querySnapshot = await getDocs(qUnmasked);

            if (querySnapshot.empty) {
              // Try with formatted CPF (e.g., 000.000.000-00)
              const formattedCpf = identifier.trim();
              const qMasked = query(usersRef, where('cpf', '==', formattedCpf));
              querySnapshot = await getDocs(qMasked);
            }

            if (querySnapshot.empty) {
              throw new Error('Usuário com este CPF não cadastrado.');
            }

            const userDoc = querySnapshot.docs[0].data();
            email = userDoc.email;
            fetchedProfile = userDoc.profile;
            const systemUserId = querySnapshot.docs[0].id;

            // Sign in with actual credentials (overwriting anonymous session)
            const userCredential = await signInWithEmailAndPassword(auth, email, pinOrPass);
            const firebaseUser = userCredential.user;

            sessionStorage.setItem('mockUserId', systemUserId);
            localStorage.setItem('mockUserId', systemUserId);
          }

          setIsLoading(false);
          return { success: true, email, profile: fetchedProfile };
        } catch (error: any) {
          setIsLoading(false);
          let friendlyMessage = 'Erro ao realizar login. Verifique suas credenciais.';
          if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            friendlyMessage = 'Senha ou PIN incorreto.';
          } else if (error.code === 'auth/user-not-found') {
            friendlyMessage = 'E-mail ou CPF não cadastrado.';
          } else if (error.message) {
            friendlyMessage = error.message;
          }
          toast({
            title: 'Erro de acesso',
            description: friendlyMessage,
            variant: 'destructive',
          });
          return { success: false, error };
        }
      } else {
        // Mock Mode Login Logic
        const user = db.users.find((u) => {
          const matchId = isEmail
            ? u.email?.toLowerCase() === cleanId
            : unmask(u.cpf || '') === cleanId;
          const matchPass = u.pin === pinOrPass || u.password === pinOrPass;
          const matchProfile = u.profile === profile;
          return matchId && matchPass && matchProfile;
        });

        if (!user) {
          setIsLoading(false);
          toast({
            title: 'Erro de acesso',
            description: 'Credenciais inválidas ou perfil incorreto.',
            variant: 'destructive',
          });
          return { success: false };
        }

        sessionStorage.setItem('mockUserId', user.id);
        localStorage.setItem('mockUserId', user.id);
        setIsLoading(false);
        return { success: true, user };
      }
    },
    [db, toast]
  );

  const signUp = useCallback(
    async (values: {
      name: string;
      email: string;
      phone: string;
      cpf: string;
      pin: string;
      profile: 'gestor' | 'motorista' | 'pai' | 'monitor';
    }) => {
      setIsLoading(true);
      if (isFirestoreMode()) {
        try {
          if (!auth || !firestore) {
            throw new Error('Serviço de autenticação/banco indisponível.');
          }

          // 1. Create User in Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.pin);
          const firebaseUser = userCredential.user;

          // 2. Create User document in Firestore matching the UID as document ID
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          const userData = {
            name: values.name,
            email: values.email,
            phone: values.phone,
            cpf: values.cpf,
            pin: values.pin, // stored for backward compatibility
            profile: values.profile,
            active: true,
          };
          await setDoc(userRef, userData);

          // 3. Set also corresponding role flag collection
          // Map 'gestor' → 'roles_admin' to match Firestore Security Rules
          const PROFILE_TO_ROLE: Record<string, string> = {
            gestor: 'roles_admin',
            motorista: 'roles_driver',
            monitor: 'roles_monitor',
            pai: 'roles_parent',
          };
          const roleColl = PROFILE_TO_ROLE[values.profile] || `roles_${values.profile}`;
          const roleRef = doc(firestore, roleColl, firebaseUser.uid);
          await setDoc(roleRef, { active: true });

          sessionStorage.setItem('mockUserId', firebaseUser.uid);
          localStorage.setItem('mockUserId', firebaseUser.uid);
          setIsLoading(false);
          return { success: true, userId: firebaseUser.uid };
        } catch (error: any) {
          setIsLoading(false);
          let friendlyMessage = 'Erro ao cadastrar. Tente novamente.';
          if (error.code === 'auth/email-already-in-use') {
            friendlyMessage = 'Este e-mail já está sendo utilizado.';
          } else if (error.code === 'auth/weak-password') {
            friendlyMessage = 'O PIN ou senha precisa ter pelo menos 6 caracteres no Firebase Auth.';
          }
          toast({
            title: 'Erro ao criar conta',
            description: friendlyMessage,
            variant: 'destructive',
          });
          return { success: false, error };
        }
      } else {
        // Mock mode sign up
        const userId = `user-${values.profile}-${Date.now()}`;
        addDoc('users', {
          id: userId,
          name: values.name,
          email: values.email,
          phone: values.phone,
          cpf: values.cpf,
          pin: values.pin,
          profile: values.profile,
          active: true,
        });

        sessionStorage.setItem('mockUserId', userId);
        localStorage.setItem('mockUserId', userId);
        setIsLoading(false);
        return { success: true, userId };
      }
    },
    [addDoc, toast]
  );

  const logout = useCallback(async () => {
    sessionStorage.removeItem('mockUserId');
    localStorage.removeItem('mockUserId');
    if (isFirestoreMode() && auth) {
      await firebaseSignOut(auth);
    }
    window.location.href = '/login';
  }, []);

  return {
    login,
    signUp,
    logout,
    isLoading,
  };
}
