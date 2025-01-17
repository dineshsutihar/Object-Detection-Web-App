export default function validateEmailAndPassword(email: string, password: string) {
  let isValid = true;
  let emailError = "";
  let passwordError = "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError = "Please enter a valid email";
    isValid = false;
  }

  if (!password || password.length < 8) {
    passwordError = "Password must be at least 8 characters";
    isValid = false;
  }

  return { isValid, emailError, passwordError };
}
