/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
interface AuthContextType {
  user: User | null;
  session: Session | null;
  setUser: (user: any) => void;
  handleLogout : () =>void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
   const fetchSession = async()=>{
    const {data} = await supabase.auth.getSession();
    setSession(data.session)
    setUser(data.session?.user?? null)
    setLoading(false)
   }
   fetchSession()

   // login/logout state update
   const {data:authListener} = supabase.auth.onAuthStateChange((_event, session) =>{
    setSession(session)
    setUser(session?.user??null)
   });

   //function cleanup
   return ()=>{
    authListener?.subscription?.unsubscribe()
   };
  }, []);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="w-full min-h-screen flex justify-center items-center">Loading...</div>;

  return <AuthContext.Provider value={{ user,session, setUser, handleLogout }}>
    {children}  
    </AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
