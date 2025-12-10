// Basic DOM references
const subtitle       = document.getElementById("subtitle");
const profileDiv     = document.getElementById("profile");
const messageBox     = document.getElementById("message");
const avatarBox      = document.getElementById("avatarBox");
const avatarInitials = document.getElementById("avatarInitials");

// Account view fields
const viewEmail       = document.getElementById("viewEmail");
const viewUsername    = document.getElementById("viewUsername");
const viewDisplayName = document.getElementById("viewDisplayName");

// Account edit fields
const inputEmail       = document.getElementById("inputEmail");
const inputUsername    = document.getElementById("inputUsername");
const inputDisplayName = document.getElementById("inputDisplayName");

// Password fields
const inputCurrentPw = document.getElementById("inputCurrentPassword");
const inputNewPw     = document.getElementById("inputNewPassword");

// Stats
const fieldWins   = document.getElementById("fieldWins");
const fieldLosses = document.getElementById("fieldLosses");

// Sections
const accountView   = document.getElementById("accountView");
const accountEdit   = document.getElementById("accountEdit");
const avatarView    = document.getElementById("avatarView");
const avatarEdit    = document.getElementById("avatarEdit");
const passwordView  = document.getElementById("passwordView");
const passwordEdit  = document.getElementById("passwordEdit");

// Buttons
const logoutBtn          = document.getElementById("logoutBtn");
const editProfileBtn     = document.getElementById("editProfileBtn");
const saveProfileBtn     = document.getElementById("saveProfileBtn");
const cancelEditBtn      = document.getElementById("cancelEditBtn");

const editAvatarBtn      = document.getElementById("editAvatarBtn");
const avatarSaveBtn      = document.getElementById("avatarSaveBtn");
const cancelAvatarBtn    = document.getElementById("cancelAvatarBtn");
const avatarInput        = document.getElementById("avatarInput");

const editPasswordBtn    = document.getElementById("editPasswordBtn");
const passwordSaveBtn    = document.getElementById("passwordSaveBtn");
const cancelPasswordBtn  = document.getElementById("cancelPasswordBtn");

// Friends & chat elements
const friendIdentifier = document.getElementById("friendIdentifier");
const addFriendBtn     = document.getElementById("addFriendBtn");
const friendsListDiv   = document.getElementById("friendsList");
const pendingListDiv   = document.getElementById("pendingList");

const openPongBtn = document.getElementById("openPongBtn");

let currentUser = null;
let originalProfile = null;
let lastChatId = 0;

function setMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.style.color = isError ? "#fca5a5" : "#a7f3d0";
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function updateAvatarView(user) {
  const oldImg = avatarBox.querySelector("img");
  if (oldImg) oldImg.remove();

  if (user.avatar_path) {
    const img = document.createElement("img");
    img.src = user.avatar_path;
    img.alt = "Avatar";
    avatarBox.appendChild(img);
    avatarInitials.style.display = "none";
  } else {
    avatarInitials.style.display = "block";
    avatarInitials.textContent = getInitials(user.display_name || user.username);
  }
}

function fillViewMode(u) {
  viewEmail.textContent       = u.email;
  viewUsername.textContent    = u.username;
  viewDisplayName.textContent = u.display_name;
}

function fillEditMode(u) {
  inputEmail.value       = u.email;
  inputUsername.value    = u.username;
  inputDisplayName.value = u.display_name;
}

function enterAccountViewMode() {
  accountView.style.display = "block";
  accountEdit.style.display = "none";
}

function enterAccountEditMode() {
  accountView.style.display = "none";
  accountEdit.style.display = "block";
  if (currentUser) {
    originalProfile = {
      email: currentUser.email,
      username: currentUser.username,
      display_name: currentUser.display_name,
    };
    fillEditMode(currentUser);
  }
}

function enterAvatarViewMode() {
  avatarView.style.display = "block";
  avatarEdit.style.display = "none";
  avatarInput.value = "";
}

function enterAvatarEditMode() {
  avatarView.style.display = "none";
  avatarEdit.style.display = "block";
  avatarInput.value = "";
}

function enterPasswordViewMode() {
  passwordView.style.display = "block";
  passwordEdit.style.display = "none";
  inputCurrentPw.value = "";
  inputNewPw.value = "";
}

function enterPasswordEditMode() {
  passwordView.style.display = "none";
  passwordEdit.style.display = "block";
  inputCurrentPw.value = "";
  inputNewPw.value = "";
}

function renderStatusDot(status) {
  const span = document.createElement("span");
  span.className = "status-dot";
  if (status === "online") {
    span.style.background = "#22c55e";
  } else if (status === "away") {
    span.style.background = "#eab308";
  } else {
    span.style.background = "#6b7280";
  }
  return span;
}

async function loadFriends() {
  try {
    const res = await fetch("/api/friends/friends_list.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return;
    }

    friendsListDiv.innerHTML = "";
    if (!data.friends || data.friends.length === 0) {
      friendsListDiv.textContent = "No friends yet.";
      return;
    }

    data.friends.forEach(f => {
      const row = document.createElement("div");
      const dot = renderStatusDot(f.status);
      const name = document.createElement("span");
      name.textContent = (f.display_name || f.username) + " (" + f.status + ")";
      row.appendChild(dot);
      row.appendChild(name);
      friendsListDiv.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadPendingFriends() {
  try {
    const res = await fetch("/api/friends/friends_pending.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return;
    }

    pendingListDiv.innerHTML = "";
    if (!data.requests || data.requests.length === 0) {
      pendingListDiv.textContent = "No pending requests.";
      return;
    }

    data.requests.forEach(r => {
      const row = document.createElement("div");
      const nameSpan = document.createElement("span");
      nameSpan.textContent = r.display_name || r.username || ("User " + r.from_id);

      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "Accept";
      acceptBtn.style.marginLeft = "0.5rem";
      acceptBtn.style.padding = "0.2rem 0.5rem";
      acceptBtn.style.fontSize = "0.8rem";
      acceptBtn.addEventListener("click", () => {
        respondToRequest(r.from_id, "accept");
      });

      const rejectBtn = document.createElement("button");
      rejectBtn.textContent = "Reject";
      rejectBtn.style.marginLeft = "0.3rem";
      rejectBtn.style.padding = "0.2rem 0.5rem";
      rejectBtn.style.fontSize = "0.8rem";
      rejectBtn.addEventListener("click", () => {
        respondToRequest(r.from_id, "reject");
      });

      row.appendChild(nameSpan);
      row.appendChild(acceptBtn);
      row.appendChild(rejectBtn);
      pendingListDiv.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

async function respondToRequest(fromId, action) {
  try {
    const res = await fetch("/api/friends/friend_respond.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: fromId, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to update friend request.", true);
      return;
    }
    setMessage("Friend request " + action + "ed.");
    loadPendingFriends();
    loadFriends();
  } catch (e) {
    console.error(e);
    setMessage("Network error while updating friend request.", true);
  }
}

async function sendFriendRequest() {
  const id = friendIdentifier.value.trim();
  if (!id) {
    setMessage("Enter a username or email to add a friend.", true);
    return;
  }
  setMessage("Sending friend request...");
  try {
    const res = await fetch("/api/friends/friend_request.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Friend request failed.", true);
      return;
    }
    setMessage("Friend request sent!");
    friendIdentifier.value = "";
  } catch (e) {
    console.error(e);
    setMessage("Network error while sending friend request.", true);
  }
}

function appendChatMessage(msg) {
  const line = document.createElement("div");
  const who = msg.display_name || msg.username || ("User " + msg.sender_id);
  const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : "";
  line.innerHTML = `<strong>${who}</strong> <span style="opacity:0.6;font-size:0.7rem;">${time}</span>: ${msg.content}`;
  chatBox.appendChild(line);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (msg.id > lastChatId) {
    lastChatId = msg.id;
  }
}

async function loadChat(initial = false) {
  try {
    const url = initial
      ? "/api/chat/chat_fetch.php?room=global"
      : "/api/chat/chat_fetch.php?room=global&since_id=" + encodeURIComponent(lastChatId);

    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.messages) {
      return;
    }
    data.messages.forEach(appendChatMessage);
  } catch (e) {
    console.error(e);
  }
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  try {
    const res = await fetch("/api/chat/chat_send.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "global", content: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to send message.", true);
      return;
    }
    if (data.message) {
      appendChatMessage(data.message);
    }
  } catch (e) {
    console.error(e);
    setMessage("Network error while sending message.", true);
  }
}

async function loadUser() {
  try {
    const res = await fetch("/api/me.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      window.location.href = "/";
      return;
    }

    const u = data.user;
    currentUser = u;

    subtitle.textContent = "Welcome back, " + (u.display_name || u.username) + "!";
    fieldWins.textContent   = u.wins;
    fieldLosses.textContent = u.losses;

    fillViewMode(u);
    updateAvatarView(u);

    profileDiv.style.display = "block";
    enterAccountViewMode();
    enterAvatarViewMode();
    enterPasswordViewMode();

    // Initial friends + pending + chat
    loadFriends();
    loadPendingFriends();
    loadChat(true);

    // Poll every 5s for status + new messages + pending
    setInterval(() => {
      loadFriends();
      loadPendingFriends();
      loadChat(false);
    }, 5000);
  } catch (e) {
    console.error(e);
    setMessage("Error loading profile.", true);
  }
}

async function logout() {
  try {
    await fetch("/api/logout.php", {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
  } catch (e) {}
  window.location.href = "/";
}

async function saveProfile() {
  const email       = inputEmail.value.trim();
  const username    = inputUsername.value.trim();
  const displayName = inputDisplayName.value.trim();

  if (!email || !username || !displayName) {
    setMessage("Email, username and display name are required.", true);
    return;
  }

  setMessage("Saving profile...");

  try {
    const res = await fetch("/api/profile/update_profile.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        username,
        display_name: displayName,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Profile update failed.", true);
      return;
    }

    setMessage("Profile updated!");
    if (currentUser) {
      currentUser.email        = email;
      currentUser.username     = username;
      currentUser.display_name = displayName;
      fillViewMode(currentUser);
      updateAvatarView(currentUser);
    }
    enterAccountViewMode();
  } catch (e) {
    console.error(e);
    setMessage("Network error while updating profile.", true);
  }
}

function cancelAccountEdit() {
  setMessage("");
  if (originalProfile && currentUser) {
    currentUser.email        = originalProfile.email;
    currentUser.username     = originalProfile.username;
    currentUser.display_name = originalProfile.display_name;
    fillViewMode(currentUser);
    updateAvatarView(currentUser);
  }
  enterAccountViewMode();
}

async function saveAvatar() {
  const file = avatarInput.files[0];
  if (!file) {
    setMessage("Please choose an image file.", true);
    return;
  }

  setMessage("Uploading avatar...");
  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const res = await fetch("/api/profile/upload_avatar.php", {
      method: "POST",
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Upload failed.", true);
      return;
    }

    setMessage("Avatar updated!");
    if (currentUser) {
      currentUser.avatar_path = data.avatar_url;
      updateAvatarView(currentUser);
    }
    enterAvatarViewMode();
  } catch (e) {
    console.error(e);
    setMessage("Network error during upload.", true);
  }
}

function cancelAvatarEdit() {
  setMessage("");
  enterAvatarViewMode();
}

async function savePassword() {
  const currentPw = inputCurrentPw.value.trim();
  const newPw     = inputNewPw.value.trim();

  if (!currentPw || !newPw) {
    setMessage("Current and new password are required.", true);
    return;
  }

  setMessage("Changing password...");

  try {
    const res = await fetch("/api/profile/change_password.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_password: currentPw,
        new_password: newPw,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Password change failed.", true);
      return;
    }

    setMessage("Password updated!");
    enterPasswordViewMode();
  } catch (e) {
    console.error(e);
    setMessage("Network error while changing password.", true);
  }
}

function cancelPasswordEdit() {
  setMessage("");
  enterPasswordViewMode();
}

// Event listeners
logoutBtn.addEventListener("click", logout);

editProfileBtn.addEventListener("click", enterAccountEditMode);
saveProfileBtn.addEventListener("click", saveProfile);
cancelEditBtn.addEventListener("click", cancelAccountEdit);

editAvatarBtn.addEventListener("click", enterAvatarEditMode);
avatarSaveBtn.addEventListener("click", saveAvatar);
cancelAvatarBtn.addEventListener("click", cancelAvatarEdit);

editPasswordBtn.addEventListener("click", enterPasswordEditMode);
passwordSaveBtn.addEventListener("click", savePassword);
cancelPasswordBtn.addEventListener("click", cancelPasswordEdit);

addFriendBtn.addEventListener("click", sendFriendRequest);

chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendChatMessage();
  }
});
if (openPongBtn) {
  openPongBtn.addEventListener("click", () => {
    window.location.href = "/page/pong.html";
  });
}

loadUser();

