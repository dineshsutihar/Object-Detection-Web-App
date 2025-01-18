"use client";

export default function LoginPage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <form
        className="flex flex-col space-y-4 w-1/4"
        action="/api/auth/login"
        method="POST"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const email = formData.get("email") as string;
          const password = formData.get("password") as string;

          let isValid = true;

          // Email validation
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById("email-error")!.textContent =
              "Please enter a valid email";
            isValid = false;
          } else {
            document.getElementById("email-error")!.textContent = "";
          }

          if (!password || password.length < 8) {
            document.getElementById("password-error")!.textContent =
              "Password must be at least 8 characters";
            isValid = false;
          } else {
            document.getElementById("password-error")!.textContent = "";
          }

          if (isValid) {
            e.currentTarget.submit();
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
