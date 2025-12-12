type MaybeAuthEl<T extends HTMLElement> = T | null;

const tabRegister   = document.getElementById("tabRegister")   as MaybeAuthEl<HTMLDivElement>;
const tabLogin      = document.getElementById("tabLogin")      as MaybeAuthEl<HTMLDivElement>;
const registerForm  = document.getElementById("registerForm")  as MaybeAuthEl<HTMLDivElement>;
const loginForm     = document.getElementById("loginForm")     as MaybeAuthEl<HTMLDivElement>;
const authMessageBox= document.getElementById("message")       as MaybeAuthEl<HTMLDivElement>;
const registerBtn   = document.getElementById("registerBtn")   as MaybeAuthEl<HTMLButtonElement>;
const loginBtn      = document.getElementById("loginBtn")      as MaybeAuthEl<HTMLButtonElement>;

const regEmail       = document.getElementById("regEmail")       as MaybeAuthEl<HTMLInputElement>;
const regUsername    = document.getElementById("regUsername")    as MaybeAuthEl<HTMLInputElement>;
const regDisplayName = document.getElementById("regDisplayName") as MaybeAuthEl<HTMLInputElement>;
const regPassword    = document.getElementById("regPassword")    as MaybeAuthEl<HTMLInputElement>;

const loginIdentifier = document.getElementById("loginIdentifier") as MaybeAuthEl<HTMLInputElement>;
const loginPassword   = document.getElementById("loginPassword")   as MaybeAuthEl<HTMLInputElement>;

function setAuthMessage(text: string, isError = false): void {
  if (!authMessageBox) return;
  authMessageBox.textContent = text;
  authMessageBox.style.color = isError ? "#fca5a5" : "#e5e7eb";
}

function setLoading(isLoading: boolean): void {
  if (registerBtn) registerBtn.disabled = isLoading;
  if (loginBtn) loginBtn.disabled = isLoading;
}

function showRegister(): void {
  tabRegister?.classList.add("active");
  tabLogin?.classList.remove("active");
  registerForm?.classList.remove("hidden");
  loginForm?.classList.add("hidden");
  setAuthMessage("");
}

function showLogin(): void {
  tabLogin?.classList.add("active");
  tabRegister?.classList.remove("active");
  loginForm?.classList.remove("hidden");
  registerForm?.classList.add("hidden");
  setAuthMessage("");
}

async function registerUser(): Promise<void> {
  if (!regEmail || !regUsername || !regDisplayName || !regPassword) return;

  const email       = regEmail.value.trim();
  const username    = regUsername.value.trim();
  const displayName = regDisplayName.value.trim();
  const password    = regPassword.value;

  if (!email || !username || !displayName || !password) {
    setAuthMessage("Please fill in all fields.", true);
    return;
  }

  setLoading(true);
  setAuthMessage("Registering...");

  try {
    const res = await fetch("/api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, username, display_name: displayName, password }),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      setAuthMessage(data.error || "Registration failed.", true);
    } else {
      setAuthMessage("Registered successfully! You can now log in.");
      showLogin();
      if (loginIdentifier) {
        loginIdentifier.value = username;
      }
    }
  } catch (err) {
    console.error(err);
    setAuthMessage("Network error.", true);
  } finally {
    setLoading(false);
  }
}

async function loginUser(): Promise<void> {
  if (!loginIdentifier || !loginPassword) return;

  const identifier = loginIdentifier.value.trim();
  const password   = loginPassword.value;

  if (!identifier || !password) {
    setAuthMessage("Please enter your username/email and password.", true);
    return;
  }

  setLoading(true);
  setAuthMessage("Logging in...");

  try {
    const res = await fetch("/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ identifier, password }),
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      setAuthMessage(data.error || "Login failed.", true);
    } else {
      setAuthMessage("Login OK! Redirecting...");
      console.log("Logged in user:", data.user);
      setTimeout(() => {
        window.location.href = "./me.html";
      }, 500);
    }
  } catch (err) {
    console.error(err);
    setAuthMessage("Network error.", true);
  } finally {
    setLoading(false);
  }
}

tabRegister?.addEventListener("click", showRegister);
tabLogin?.addEventListener("click", showLogin);

registerBtn?.addEventListener("click", () => { void registerUser(); });
loginBtn?.addEventListener("click", () => { void loginUser(); });

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key !== "Enter") return;

  const isRegisterVisible = !registerForm?.classList.contains("hidden");
  if (isRegisterVisible) {
    void registerUser();
  } else {
    void loginUser();
  }
});
