const tabRegister = document.getElementById("tabRegister");
const tabLogin = document.getElementById("tabLogin");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const authMessageBox = document.getElementById("message");
const registerBtn = document.getElementById("registerBtn");
const loginBtn = document.getElementById("loginBtn");
const regEmail = document.getElementById("regEmail");
const regUsername = document.getElementById("regUsername");
const regDisplayName = document.getElementById("regDisplayName");
const regPassword = document.getElementById("regPassword");
const loginIdentifier = document.getElementById("loginIdentifier");
const loginPassword = document.getElementById("loginPassword");
function setAuthMessage(text, isError = false) {
    if (!authMessageBox)
        return;
    authMessageBox.textContent = text;
    authMessageBox.style.color = isError ? "#fca5a5" : "#e5e7eb";
}
function setLoading(isLoading) {
    if (registerBtn)
        registerBtn.disabled = isLoading;
    if (loginBtn)
        loginBtn.disabled = isLoading;
}
function showRegister() {
    tabRegister === null || tabRegister === void 0 ? void 0 : tabRegister.classList.add("active");
    tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.classList.remove("active");
    registerForm === null || registerForm === void 0 ? void 0 : registerForm.classList.remove("hidden");
    loginForm === null || loginForm === void 0 ? void 0 : loginForm.classList.add("hidden");
    setAuthMessage("");
}
function showLogin() {
    tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.classList.add("active");
    tabRegister === null || tabRegister === void 0 ? void 0 : tabRegister.classList.remove("active");
    loginForm === null || loginForm === void 0 ? void 0 : loginForm.classList.remove("hidden");
    registerForm === null || registerForm === void 0 ? void 0 : registerForm.classList.add("hidden");
    setAuthMessage("");
}
async function registerUser() {
    if (!regEmail || !regUsername || !regDisplayName || !regPassword)
        return;
    const email = regEmail.value.trim();
    const username = regUsername.value.trim();
    const displayName = regDisplayName.value.trim();
    const password = regPassword.value;
    if (!email || !username || !displayName || !password) {
        setAuthMessage("Please fill in all fields.", true);
        return;
    }
    setLoading(true);
    setAuthMessage("Registering...");
    try {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, username, display_name: displayName, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setAuthMessage(data.error || "Registration failed.", true);
        }
        else {
            setAuthMessage("Registered successfully! You can now log in.");
            showLogin();
            if (loginIdentifier) {
                loginIdentifier.value = username;
            }
        }
    }
    catch (err) {
        console.error(err);
        setAuthMessage("Network error.", true);
    }
    finally {
        setLoading(false);
    }
}
async function loginUser() {
    if (!loginIdentifier || !loginPassword)
        return;
    const identifier = loginIdentifier.value.trim();
    const password = loginPassword.value;
    if (!identifier || !password) {
        setAuthMessage("Please enter your username/email and password.", true);
        return;
    }
    setLoading(true);
    setAuthMessage("Logging in...");
    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setAuthMessage(data.error || "Login failed.", true);
        }
        else {
            setAuthMessage("Login OK! Redirecting...");
            console.log("Logged in user:", data.user);
            setTimeout(() => {
                window.location.href = "./me.html";
            }, 500);
        }
    }
    catch (err) {
        console.error(err);
        setAuthMessage("Network error.", true);
    }
    finally {
        setLoading(false);
    }
}
tabRegister === null || tabRegister === void 0 ? void 0 : tabRegister.addEventListener("click", showRegister);
tabLogin === null || tabLogin === void 0 ? void 0 : tabLogin.addEventListener("click", showLogin);
registerBtn === null || registerBtn === void 0 ? void 0 : registerBtn.addEventListener("click", () => { void registerUser(); });
loginBtn === null || loginBtn === void 0 ? void 0 : loginBtn.addEventListener("click", () => { void loginUser(); });
document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter")
        return;
    const isRegisterVisible = !(registerForm === null || registerForm === void 0 ? void 0 : registerForm.classList.contains("hidden"));
    if (isRegisterVisible) {
        void registerUser();
    }
    else {
        void loginUser();
    }
});
