import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
    setLoading(false);
  };

  const handleClick = async () => {
    navigate("/signup");
  };

  return (
    <div className="flex justify-center mt-24  px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}
         <Label htmlFor="password">Email</Label>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-3"
        />
        <div className="flex justify-between mb-1 items-center ">
           <Label htmlFor="password">Password</Label>
        <p
          onClick={() => navigate("/forgot-password")}
          className="ml-auto inline-block text-sm underline-offset-4 hover:underline cursor-pointer"
        >
           Forgot your password?
        </p>
          
        </div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-3"
        />
        <Button type="submit" disabled={loading} className="w-full mb-3">
          {loading ? "Logging in..." : "Login"}
        </Button>
        <div className="flex gap-2">
          <p className="">Don't have an Account </p>
          <p
            onClick={handleClick}
            className="text-neutral-500 underline underline-offset-4 cursor-pointer"
          >
            Signup
          </p>
        </div>
      </form>
    </div>
  );
}
