"use client";

import validateEmailAndPassword from "@/utils/email_pass";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    setErrors({ username: "", email: "", password: "" });

    if (!username || username.trim() === "") {
      setErrors((prev) => ({ ...prev, username: "Username is required" }));
      return;
    }

    const { isValid, emailError, passwordError } = validateEmailAndPassword(
      email,
      password
    );

    if (!isValid) {
      setErrors((prev) => ({
        ...prev,
        email: emailError || "",
        password: passwordError || "",
      }));
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        toast.success("Registration successful!");
        toast.info("Redirecting to login page...");
        router.push("/auth/login");
      } else {
        const data = await response.json();
        toast.error("Registration failed: " + data.message);
      }
    } catch (error) {
      toast.error("Registration failed. " + error);
      console.error("Registration error:", error);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Register</h1>
      <form
        className="flex flex-col space-y-4 w-1/4"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="w-full space-y-4">
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              className="border p-2 rounded w-full"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username}</p>
            )}
          </div>
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="border p-2 rounded w-full"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>
        </div>
        <div className="w-full">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="border p-2 rounded w-full"
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Register
        </button>
        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <a href="/auth/login" className="text-blue-500 hover:underline">
            Login here
          </a>
        </p>
      </form>
    </section>
  );
}
