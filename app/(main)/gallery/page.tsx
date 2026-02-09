'use client';

import { useState, useEffect } from 'react';
import { onAuthChange } from '@/lib/userLogin';
import { User } from 'firebase/auth';
import AuthenticatedGallery from './AuthenticatedGallery';
import PublicGallery from './PublicGallery';

export default function GalleryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50">
        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedGallery user={user} />;
  }

  return <PublicGallery />;
}