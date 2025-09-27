import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/authcontext';
import { supabase } from '@/lib/supabase';
import { Navigate } from 'react-router-dom';

const AdminMiddleware = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading, true/false = result
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.id) {
        const { data, error } = await supabase
        .from('users')
        .select('Is_Admin')
        .eq('id', user.id)
        .single();

        if (error || !data) {
          setIsAdmin(false);
          throw new Error(`Failed to fetch admin status ${error}`);
        } else {
          setIsAdmin(data.Is_Admin === true);
        }
      }
    };

    checkAdminStatus();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isAdmin === null) {
    return <div className="text-center p-8">Checking permissions...</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminMiddleware;
