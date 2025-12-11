const tabRegister   = document.getElementById("tabRegister");
const tabLogin      = document.getElementById("tabLogin");
const registerForm  = document.getElementById("registerForm");
const loginForm     = document.getElementById("loginForm");
const messageBox    = document.getElementById("message");
const registerBtn   = document.getElementById("registerBtn");
const loginBtn      = document.getElementById("loginBtn");

// Inputs - register
const regEmail       = document.getElementById("regEmail");
const regUsername    = document.getElementById("regUsername");
const regDisplayName = document.getElementById("regDisplayName");
const regPassword    = document.getElementById("regPassword");

// Inputs - login
const loginIdentifier = document.getElementById("loginIdentifier");
const loginPassword   = document.getElementById("loginPassword");

function setMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.style.color = isError ? "#f87171" : "#a7f3d0";
}

function setLoading(loading) {
    registerBtn.disabled = loading;
    loginBtn.disabled = loading;
}

// Tab switching
function showRegister() {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    setMessage("");
}

function showLogin() {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    setMessage("");
}

tabRegister.addEventListener("click", showRegister);
tabLogin.addEventListener("click", showLogin);

// API calls
async function registerUser() {
    const email       = regEmail.value.trim();
    const username    = regUsername.value.trim();
    const displayName = regDisplayName.value.trim();
    const password    = regPassword.value.trim();

    if (!email || !username || !displayName || !password) {
    setMessage("Please fill all fields.", true);
    return;
    }

    setLoading(true);
    setMessage("Registering...");

    try {
    const res = await fetch("/api/register.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        email,
        username,
        display_name: displayName,
        password,
        }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        setMessage(data.error || "Registration failed.", true);
    } else {
        setMessage("Registered successfully! You can now log in.");
        // Optionally switch automatically to login tab:
        showLogin();
        loginIdentifier.value = username;
    }
    } catch (err) {
    console.error(err);
    setMessage("Network error.", true);
    } finally {
    setLoading(false);
    }
}

async function loginUser() {
    const identifier = loginIdentifier.value.trim();
    const password   = loginPassword.value.trim();

    if (!identifier || !password) {
    setMessage("Please fill both fields.", true);
    return;
    }

    setLoading(true);
    setMessage("Logging in...");

    try {
    const res = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        identifier,
        password,
        }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        setMessage(data.error || "Login failed.", true);
    } else {
        setMessage("Login OK! Redirecting...");
        console.log("Logged in user:", data.user);
        setTimeout(() => {
        window.location.href = "./me.html";
        }, 500);
    }

    } catch (err) {
    console.error(err);
    setMessage("Network error.", true);
    } finally {
    setLoading(false);
    }
}

registerBtn.addEventListener("click", registerUser);
loginBtn.addEventListener("click", loginUser);

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
    if (!registerForm.classList.contains("hidden")) {
        registerUser();
    } else {
        loginUser();
    }
    }
});