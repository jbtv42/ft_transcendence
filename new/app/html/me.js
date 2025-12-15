const subtitle = document.getElementById("subtitle");
const profileDiv = document.getElementById("profile");
const messageBox = document.getElementById("message");
const avatarBox = document.getElementById("avatarBox");
const avatarInitials = document.getElementById("avatarInitials");
const viewEmail = document.getElementById("viewEmail");
const viewUsername = document.getElementById("viewUsername");
const viewDisplayName = document.getElementById("viewDisplayName");
const inputEmail = document.getElementById("inputEmail");
const inputUsername = document.getElementById("inputUsername");
const inputDisplayName = document.getElementById("inputDisplayName");
const accountView = document.getElementById("accountView");
const accountEdit = document.getElementById("accountEdit");
const avatarView = document.getElementById("avatarView");
const avatarEdit = document.getElementById("avatarEdit");
const passwordView = document.getElementById("passwordView");
const passwordEdit = document.getElementById("passwordEdit");
const logoutBtn = document.getElementById("logoutBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editAvatarBtn = document.getElementById("editAvatarBtn");
const avatarSaveBtn = document.getElementById("avatarSaveBtn");
const cancelAvatarBtn = document.getElementById("cancelAvatarBtn");
const avatarInput = document.getElementById("avatarInput");
const editPasswordBtn = document.getElementById("editPasswordBtn");
const passwordSaveBtn = document.getElementById("passwordSaveBtn");
const cancelPasswordBtn = document.getElementById("cancelPasswordBtn");
const inputCurrentPw = document.getElementById("inputCurrentPassword");
const inputNewPw = document.getElementById("inputNewPassword");
const fieldWins = document.getElementById("fieldWins");
const fieldLosses = document.getElementById("fieldLosses");
const friendIdentifier = document.getElementById("friendIdentifier");
const addFriendBtn = document.getElementById("addFriendBtn");
const friendsListDiv = document.getElementById("friendsList");
const pendingListDiv = document.getElementById("pendingList");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
let currentUser = null;
let originalProfile = null;
let lastChatId = 0;
function setMessage(text, isError = false) {
    if (!messageBox)
        return;
    messageBox.textContent = text;
    messageBox.style.color = isError ? "#fca5a5" : "#a7f3d0";
}
function getInitials(name) {
    if (!name)
        return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}
function updateAvatarView(user) {
    if (!avatarBox || !avatarInitials)
        return;
    const oldImg = avatarBox.querySelector("img");
    if (oldImg)
        oldImg.remove();
    if (user.avatar_path) {
        const img = document.createElement("img");
        img.src = user.avatar_path;
        img.alt = "Avatar";
        avatarBox.appendChild(img);
        avatarInitials.style.display = "none";
    }
    else {
        avatarInitials.style.display = "block";
        avatarInitials.textContent = getInitials(user.display_name || user.username);
    }
}
function fillViewMode(u) {
    if (viewEmail)
        viewEmail.textContent = u.email;
    if (viewUsername)
        viewUsername.textContent = u.username;
    if (viewDisplayName)
        viewDisplayName.textContent = u.display_name;
}
function fillEditMode(u) {
    if (inputEmail)
        inputEmail.value = u.email;
    if (inputUsername)
        inputUsername.value = u.username;
    if (inputDisplayName)
        inputDisplayName.value = u.display_name;
}
function enterAccountViewMode() {
    if (accountView)
        accountView.style.display = "block";
    if (accountEdit)
        accountEdit.style.display = "none";
}
function enterAccountEditMode() {
    if (accountView)
        accountView.style.display = "none";
    if (accountEdit)
        accountEdit.style.display = "block";
    if (currentUser) {
        originalProfile = {
            email: currentUser.email,
            username: currentUser.username,
            display_name: currentUser.display_name,
            id: currentUser.id,
            avatar_path: currentUser.avatar_path,
            wins: currentUser.wins,
            losses: currentUser.losses,
        };
        fillEditMode(currentUser);
    }
}
function enterAvatarViewMode() {
    if (avatarView)
        avatarView.style.display = "block";
    if (avatarEdit)
        avatarEdit.style.display = "none";
    if (avatarInput)
        avatarInput.value = "";
}
function enterAvatarEditMode() {
    if (avatarView)
        avatarView.style.display = "none";
    if (avatarEdit)
        avatarEdit.style.display = "block";
    if (avatarInput)
        avatarInput.value = "";
}
function enterPasswordViewMode() {
    if (passwordView)
        passwordView.style.display = "block";
    if (passwordEdit)
        passwordEdit.style.display = "none";
    if (inputCurrentPw)
        inputCurrentPw.value = "";
    if (inputNewPw)
        inputNewPw.value = "";
}
function enterPasswordEditMode() {
    if (passwordView)
        passwordView.style.display = "none";
    if (passwordEdit)
        passwordEdit.style.display = "block";
    if (inputCurrentPw)
        inputCurrentPw.value = "";
    if (inputNewPw)
        inputNewPw.value = "";
}
function renderStatusDot(online) {
    const span = document.createElement("span");
    span.className = "status-dot";
    span.style.background = online ? "#22c55e" : "#6b7280";
    return span;
}
async function apiJson(url, init) {
    var _a;
    const res = await fetch(url, Object.assign({ credentials: "include", headers: Object.assign({ Accept: "application/json" }, ((_a = init === null || init === void 0 ? void 0 : init.headers) !== null && _a !== void 0 ? _a : {})) }, init));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (data === null || data === void 0 ? void 0 : data.error) || `HTTP ${res.status}`;
        throw new Error(String(msg));
    }
    return data;
}
async function loadUser() {
    var _a, _b;
    try {
        const data = await apiJson("/api/me", { method: "GET" });
        const u = data.user;
        currentUser = u;
        if (subtitle)
            subtitle.textContent = "Welcome back, " + (u.display_name || u.username) + "!";
        if (fieldWins)
            fieldWins.textContent = ((_a = u.wins) !== null && _a !== void 0 ? _a : 0).toString();
        if (fieldLosses)
            fieldLosses.textContent = ((_b = u.losses) !== null && _b !== void 0 ? _b : 0).toString();
        fillViewMode(u);
        updateAvatarView(u);
        if (profileDiv)
            profileDiv.style.display = "block";
        enterAccountViewMode();
        enterAvatarViewMode();
        enterPasswordViewMode();
        await Promise.all([loadFriends(), loadPendingFriends(), loadChat(true)]);
        setInterval(() => {
            void loadFriends();
            void loadPendingFriends();
            void loadChat(false);
        }, 5000);
    }
    catch (e) {
        window.location.href = "/";
    }
}
async function logout() {
    try {
        await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
            headers: { Accept: "application/json" },
        });
    }
    catch (_a) { }
    window.location.href = "/";
}
async function saveProfile() {
    if (!inputEmail || !inputUsername || !inputDisplayName)
        return;
    const email = inputEmail.value.trim();
    const username = inputUsername.value.trim();
    const displayName = inputDisplayName.value.trim();
    if (!email || !username || !displayName) {
        setMessage("All fields are required.", true);
        return;
    }
    setMessage("Saving profile...");
    try {
        const res = await fetch("/api/profile/update_profile", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ email, username, display_name: displayName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(data.error || "Failed to update profile.", true);
            return;
        }
        if (currentUser) {
            currentUser.email = email;
            currentUser.username = username;
            currentUser.display_name = displayName;
            fillViewMode(currentUser);
            updateAvatarView(currentUser);
        }
        setMessage("Profile updated!");
        enterAccountViewMode();
    }
    catch (e) {
        console.error(e);
        setMessage("Network error while updating profile.", true);
    }
}
function cancelAccountEdit() {
    setMessage("");
    if (originalProfile && currentUser) {
        currentUser.email = originalProfile.email;
        currentUser.username = originalProfile.username;
        currentUser.display_name = originalProfile.display_name;
        fillViewMode(currentUser);
        updateAvatarView(currentUser);
    }
    enterAccountViewMode();
}
async function saveAvatar() {
    var _a;
    if (!avatarInput)
        return;
    const file = (_a = avatarInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file) {
        setMessage("Please choose an image file.", true);
        return;
    }
    setMessage("Uploading avatar...");
    const formData = new FormData();
    formData.append("avatar", file);
    try {
        const res = await fetch("/api/profile/upload_avatar", {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(data.error || "Upload failed.", true);
            return;
        }
        if (currentUser) {
            currentUser.avatar_path = data.avatar_path || currentUser.avatar_path;
            updateAvatarView(currentUser);
        }
        setMessage("Avatar updated!");
        enterAvatarViewMode();
    }
    catch (e) {
        console.error(e);
        setMessage("Network error while uploading avatar.", true);
    }
}
function cancelAvatarEdit() {
    setMessage("");
    enterAvatarViewMode();
}
async function savePassword() {
    if (!inputCurrentPw || !inputNewPw)
        return;
    const currentPw = inputCurrentPw.value;
    const newPw = inputNewPw.value;
    if (!currentPw || !newPw) {
        setMessage("Please fill both password fields.", true);
        return;
    }
    setMessage("Changing password...");
    try {
        const res = await fetch("/api/profile/change_password", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(data.error || "Password change failed.", true);
            return;
        }
        setMessage("Password updated!");
        enterPasswordViewMode();
    }
    catch (e) {
        console.error(e);
        setMessage("Network error while changing password.", true);
    }
}
function cancelPasswordEdit() {
    setMessage("");
    enterPasswordViewMode();
}
async function loadFriends() {
    if (!friendsListDiv)
        return;
    try {
        const data = await apiJson("/api/friends/friends_list", { method: "GET" });
        friendsListDiv.innerHTML = "";
        const friends = Array.isArray(data.friends) ? data.friends : [];
        if (friends.length === 0) {
            friendsListDiv.textContent = "No friends yet.";
            return;
        }
        friends.forEach((f) => {
            const row = document.createElement("div");
            const dot = renderStatusDot(!!f.online);
            const nameBtn = document.createElement("button");
            nameBtn.textContent = f.display_name || f.username || `User ${f.id}`;
            nameBtn.className = "friend-name-btn";
            nameBtn.addEventListener("click", () => {
                window.location.href = `viewProfile.html?userId=${f.id}`;
            });
            row.appendChild(dot);
            row.appendChild(nameBtn);
            friendsListDiv.appendChild(row);
        });
    }
    catch (e) {
        console.error(e);
    }
}
async function loadPendingFriends() {
    if (!pendingListDiv)
        return;
    try {
        const data = await apiJson("/api/friends/friends_pending", { method: "GET" });
        pendingListDiv.innerHTML = "";
        const pending = Array.isArray(data.pending) ? data.pending : [];
        if (pending.length === 0) {
            pendingListDiv.textContent = "No pending requests.";
            return;
        }
        pending.forEach((r) => {
            const row = document.createElement("div");
            const nameSpan = document.createElement("span");
            nameSpan.textContent = r.display_name || r.username || `User ${r.id}`;
            const acceptBtn = document.createElement("button");
            acceptBtn.textContent = "Accept";
            acceptBtn.style.marginLeft = "0.5rem";
            acceptBtn.style.padding = "0.2rem 0.5rem";
            acceptBtn.style.fontSize = "0.8rem";
            acceptBtn.addEventListener("click", () => {
                void respondToRequest(r.id, true);
            });
            const rejectBtn = document.createElement("button");
            rejectBtn.textContent = "Reject";
            rejectBtn.style.marginLeft = "0.3rem";
            rejectBtn.style.padding = "0.2rem 0.5rem";
            rejectBtn.style.fontSize = "0.8rem";
            rejectBtn.addEventListener("click", () => {
                void respondToRequest(r.id, false);
            });
            row.appendChild(nameSpan);
            row.appendChild(acceptBtn);
            row.appendChild(rejectBtn);
            pendingListDiv.appendChild(row);
        });
    }
    catch (e) {
        console.error(e);
    }
}
async function respondToRequest(requesterId, accept) {
    try {
        const res = await fetch("/api/friends/friend_respond", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ requester_id: requesterId, accept }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(data.error || "Failed to update friend request.", true);
            return;
        }
        setMessage("Friend request updated!");
        await Promise.all([loadFriends(), loadPendingFriends()]);
    }
    catch (e) {
        console.error(e);
        setMessage("Network error while updating friend request.", true);
    }
}
async function sendFriendRequest() {
    if (!friendIdentifier)
        return;
    const id = friendIdentifier.value.trim();
    if (!id) {
        setMessage("Enter a username or email to add a friend.", true);
        return;
    }
    setMessage("Sending friend request...");
    try {
        const res = await fetch("/api/friends/friend_request", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ identifier: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            setMessage(data.error || "Friend request failed.", true);
            return;
        }
        setMessage("Friend request sent!");
        friendIdentifier.value = "";
        await loadPendingFriends();
    }
    catch (e) {
        console.error(e);
        setMessage("Network error while sending friend request.", true);
    }
}
// ---- Chat ----
function appendChatMessage(msg) {
    if (!chatBox)
        return;
    const line = document.createElement("div");
    const who = msg.display_name || msg.username || `User ${msg.sender_id}`;
    const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : "";
    line.innerHTML =
        `<strong>${who}</strong> ` +
            `<span style="opacity:0.6;font-size:0.7rem;">${time}</span>: ` +
            `${msg.content}`;
    chatBox.appendChild(line);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (msg.id > lastChatId)
        lastChatId = msg.id;
}
async function loadChat(initial = false) {
    if (!chatBox)
        return;
    try {
        const url = initial
            ? "/api/chat/chat_fetch?room=global"
            : "/api/chat/chat_fetch?room=global&since_id=" + encodeURIComponent(lastChatId);
        const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(data.messages))
            return;
        data.messages.forEach(appendChatMessage);
    }
    catch (e) {
        console.error(e);
    }
}
// ---- UI wiring ----
logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener("click", () => { void logout(); });
editProfileBtn === null || editProfileBtn === void 0 ? void 0 : editProfileBtn.addEventListener("click", () => { enterAccountEditMode(); });
saveProfileBtn === null || saveProfileBtn === void 0 ? void 0 : saveProfileBtn.addEventListener("click", () => { void saveProfile(); });
cancelEditBtn === null || cancelEditBtn === void 0 ? void 0 : cancelEditBtn.addEventListener("click", () => { cancelAccountEdit(); });
editAvatarBtn === null || editAvatarBtn === void 0 ? void 0 : editAvatarBtn.addEventListener("click", () => { enterAvatarEditMode(); });
avatarSaveBtn === null || avatarSaveBtn === void 0 ? void 0 : avatarSaveBtn.addEventListener("click", () => { void saveAvatar(); });
cancelAvatarBtn === null || cancelAvatarBtn === void 0 ? void 0 : cancelAvatarBtn.addEventListener("click", () => { cancelAvatarEdit(); });
editPasswordBtn === null || editPasswordBtn === void 0 ? void 0 : editPasswordBtn.addEventListener("click", () => { enterPasswordEditMode(); });
passwordSaveBtn === null || passwordSaveBtn === void 0 ? void 0 : passwordSaveBtn.addEventListener("click", () => { void savePassword(); });
cancelPasswordBtn === null || cancelPasswordBtn === void 0 ? void 0 : cancelPasswordBtn.addEventListener("click", () => { cancelPasswordEdit(); });
addFriendBtn === null || addFriendBtn === void 0 ? void 0 : addFriendBtn.addEventListener("click", () => { void sendFriendRequest(); });
chatSendBtn === null || chatSendBtn === void 0 ? void 0 : chatSendBtn.addEventListener("click", async () => {
    if (!chatInput)
        return;
    const content = chatInput.value.trim();
    if (!content)
        return;
    try {
        await fetch("/api/chat/chat_send", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ room: "global", content }),
        });
        chatInput.value = "";
        await loadChat(false);
    }
    catch (e) {
        console.error(e);
    }
});
void loadUser();
