import { useState, useEffect } from 'react';
import { supabase, Profile, isDemoMode, demoUser } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isDemoMode) {
          // Demo mode - simulate authentication
          if (mounted) {
            setUser(demoUser);
            setProfile(demoUser);
            setLoading(false);
          }
          return;
        }

        // Real Supabase mode
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    if (!isDemoMode) {
      // Listen for auth changes only in real mode
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;

          console.log('Auth state changed:', event, session?.user?.id);

          if (session?.user) {
            setUser(session.user);
            if (event === 'SIGNED_UP' || event === 'SIGNED_IN') {
              await fetchProfile(session.user.id);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          
          setLoading(false);
        }
      );

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Profile fetch error:', error);
        return;
      }

      console.log('Profile data:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        setUser(null);
        setProfile(null);
        toast.success('Signed out successfully');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    loading,
    signOut,
    refetchProfile: () => user && !isDemoMode && fetchProfile(user.id),
    isDemoMode
  };
}