"use client";

import validateEmailAndPassword from "@/utils/email_pass";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  return (
    <section className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <form
        className="flex flex-col space-y-4 w-1/4"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;
          const { isValid, emailError, passwordError } =
            validateEmailAndPassword(email, password);

          const emailErrorElement = document.getElementById("email-error");
          const passwordErrorElement =
            document.getElementById("password-error");

          if (!isValid) {
            if (emailErrorElement)
              emailErrorElement.textContent = emailError || "";
            if (passwordErrorElement)
              passwordErrorElement.textContent = passwordError || "";
            return;
          }

          if (emailErrorElement) emailErrorElement.textContent = "";
          if (passwordErrorElement) passwordErrorElement.textContent = "";

          try {
            const res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
              const data = await res.json();
              toast.success("Login successful!");
              router.push("/detect");
            } else {
              const data = await res.json();
              toast.info(
                `Login failed. ${data.message}` ||
                  "Login failed. Please try again."
              );
            }
          } catch (error) {
            toast.error("Login failed. " + error);
          }
        }}
      >
        <div className="w-full">
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="border p-2 rounded w-full"
          />
          <p id="email-error" className="text-red-500 text-sm mt-1"></p>
        </div>

        <div className="w-full">
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="border p-2 rounded w-full"
          />
          <p id="password-error" className="text-red-500 text-sm mt-1"></p>
        </div>

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>
      <p className="mt-4">
        Don't have an account?{" "}
        <a href="/auth/register" className="text-blue-500">
          Register here
        </a>
      </p>
    </section>
  );
}
