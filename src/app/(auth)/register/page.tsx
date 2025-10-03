'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirebaseApp } from '@/firebase';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();
  const auth = useAuth();
  const [name, setName] = useState('Admin');
  const [email, setEmail] = useState('admin@stockvision.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile in Firebase Auth
      await updateProfile(user, { displayName: name });

      // Determine user role
      const userRole =
        email === 'admin@stockvision.com' ? 'admin' : 'cliente';

      // Create user document in Firestore
      const db = getFirestore(firebaseApp);
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        name: name,
        email: user.email,
        role: userRole,
        createdAt: serverTimestamp(),
      });

      toast({
        title: '¡Registro exitoso!',
        description: 'Tu cuenta ha sido creada.',
      });

      // Redirect based on role
      if (userRole === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      let description =
        'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
      if (error.code === 'auth/email-already-in-use') {
        description =
          'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
      } else if (error.code === 'auth/weak-password') {
        description = 'La contraseña debe tener al menos 6 caracteres.';
      }
      toast({
        title: 'Error de registro',
        description,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center gap-3 text-foreground">
        <Store className="h-10 w-10 text-primary" />
        <h1 className="font-headline text-4xl font-bold">StockVision POS</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Ingresa tus datos para registrarte.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan Pérez"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button
            className="w-full"
            onClick={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
