import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Signup function
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { email, password, firstName, lastName, username, phone } =
        formData;

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUser) {
        setMessage({ type: "error", text: "Username already taken." });
        setLoading(false);
        return;
      }

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      // Sign up user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Inserting user details into the database
        const { error: dbError } = await supabase.from("users").insert([
          {
            id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            username,
            phone,
          },
        ]);

        if (dbError) throw dbError;

        setMessage({
          type: "success",
          text: "Signup successful!",
        });
        navigate("/");
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Signup failed." });
    }

    setLoading(false);
  };

  return (
    <div className="flex justify-center mt-6 px-4 ">
      <form
        onSubmit={handleSignup}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4">Signup</h2>
        {message && (
          <p
            className={`${
              message.type === "error" ? "text-red-500" : "text-green-500"
            } text-sm mb-2`}
          >
            {message.text}
          </p>
        )}

        <Input
          type="text"
          name="firstName"
          placeholder="First Name"
          value={formData.firstName}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={formData.lastName}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="mb-3"
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing up..." : "Signup"}
        </Button>
      </form>
    </div>
  );
}
