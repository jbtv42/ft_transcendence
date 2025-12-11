type MaybeEl<T extends HTMLElement> = T | null;

interface ApiUser {
  id: number;
  email: string;
  username: string;
  display_name: string;
  avatar_path?: string | null;
  wins?: number;
  losses?: number;
}

interface Friend {
  id: number;
  username: string;
  display_name: string;
  status: string;
}

interface FriendRequest {
  from_id: number;
  username?: string;
  display_name?: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  username?: string;
  display_name?: string;
  content: string;
  created_at?: string;
}

const subtitle       = document.getElementById("subtitle")       as MaybeEl<HTMLDivElement>;
const profileDiv     = document.getElementById("profile")        as MaybeEl<HTMLDivElement>;
const messageBox     = document.getElementById("message")        as MaybeEl<HTMLDivElement>;
const avatarBox      = document.getElementById("avatarBox")      as MaybeEl<HTMLDivElement>;
const avatarInitials = document.getElementById("avatarInitials") as MaybeEl<HTMLSpanElement>;

const viewEmail       = document.getElementById("viewEmail")       as MaybeEl<HTMLSpanElement>;
const viewUsername    = document.getElementById("viewUsername")    as MaybeEl<HTMLSpanElement>;
const viewDisplayName = document.getElementById("viewDisplayName") as MaybeEl<HTMLSpanElement>;

const inputEmail       = document.getElementById("inputEmail")       as MaybeEl<HTMLInputElement>;
const inputUsername    = document.getElementById("inputUsername")    as MaybeEl<HTMLInputElement>;
const inputDisplayName = document.getElementById("inputDisplayName") as MaybeEl<HTMLInputElement>;

const accountView   = document.getElementById("accountView")   as MaybeEl<HTMLDivElement>;
const accountEdit   = document.getElementById("accountEdit")   as MaybeEl<HTMLDivElement>;
const avatarView    = document.getElementById("avatarView")    as MaybeEl<HTMLDivElement>;
const avatarEdit    = document.getElementById("avatarEdit")    as MaybeEl<HTMLDivElement>;
const passwordView  = document.getElementById("passwordView")  as MaybeEl<HTMLDivElement>;
const passwordEdit  = document.getElementById("passwordEdit")  as MaybeEl<HTMLDivElement>;

const logoutBtn         = document.getElementById("logoutBtn")         as MaybeEl<HTMLButtonElement>;
const editProfileBtn    = document.getElementById("editProfileBtn")    as MaybeEl<HTMLButtonElement>;
const saveProfileBtn    = document.getElementById("saveProfileBtn")    as MaybeEl<HTMLButtonElement>;
const cancelEditBtn     = document.getElementById("cancelEditBtn")     as MaybeEl<HTMLButtonElement>;
const editAvatarBtn     = document.getElementById("editAvatarBtn")     as MaybeEl<HTMLButtonElement>;
const avatarSaveBtn     = document.getElementById("avatarSaveBtn")     as MaybeEl<HTMLButtonElement>;
const cancelAvatarBtn   = document.getElementById("cancelAvatarBtn")   as MaybeEl<HTMLButtonElement>;
const avatarInput       = document.getElementById("avatarInput")       as MaybeEl<HTMLInputElement>;
const editPasswordBtn   = document.getElementById("editPasswordBtn")   as MaybeEl<HTMLButtonElement>;
const passwordSaveBtn   = document.getElementById("passwordSaveBtn")   as MaybeEl<HTMLButtonElement>;
const cancelPasswordBtn = document.getElementById("cancelPasswordBtn") as MaybeEl<HTMLButtonElement>;
const inputCurrentPw    = document.getElementById("inputCurrentPassword") as MaybeEl<HTMLInputElement>;
const inputNewPw        = document.getElementById("inputNewPassword")     as MaybeEl<HTMLInputElement>;

const fieldWins   = document.getElementById("fieldWins")   as MaybeEl<HTMLSpanElement>;
const fieldLosses = document.getElementById("fieldLosses") as MaybeEl<HTMLSpanElement>;

const friendIdentifier = document.getElementById("friendIdentifier") as MaybeEl<HTMLInputElement>;
const addFriendBtn     = document.getElementById("addFriendBtn")     as MaybeEl<HTMLButtonElement>;
const friendsListDiv   = document.getElementById("friendsList")      as MaybeEl<HTMLDivElement>;
const pendingListDiv   = document.getElementById("pendingList")      as MaybeEl<HTMLDivElement>;
const chatBox          = document.getElementById("chatBox")          as MaybeEl<HTMLDivElement>;
const chatInput        = document.getElementById("chatInput")        as MaybeEl<HTMLInputElement>;
const chatSendBtn      = document.getElementById("chatSendBtn")      as MaybeEl<HTMLButtonElement>;

let currentUser: ApiUser | null = null;
let originalProfile: ApiUser | null = null;
let lastChatId = 0;

function setMessage(text: string, isError = false): void {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.color = isError ? "#fca5a5" : "#a7f3d0";
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function updateAvatarView(user: ApiUser): void {
  if (!avatarBox || !avatarInitials) return;

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

function fillViewMode(u: ApiUser): void {
  if (viewEmail)       viewEmail.textContent       = u.email;
  if (viewUsername)    viewUsername.textContent    = u.username;
  if (viewDisplayName) viewDisplayName.textContent = u.display_name;
}

function fillEditMode(u: ApiUser): void {
  if (inputEmail)       inputEmail.value       = u.email;
  if (inputUsername)    inputUsername.value    = u.username;
  if (inputDisplayName) inputDisplayName.value = u.display_name;
}


function enterAccountViewMode(): void {
  if (accountView) accountView.style.display = "block";
  if (accountEdit) accountEdit.style.display = "none";
}

function enterAccountEditMode(): void {
  if (accountView) accountView.style.display = "none";
  if (accountEdit) accountEdit.style.display = "block";
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

function enterAvatarViewMode(): void {
  if (avatarView) avatarView.style.display = "block";
  if (avatarEdit) avatarEdit.style.display = "none";
  if (avatarInput) avatarInput.value = "";
}

function enterAvatarEditMode(): void {
  if (avatarView) avatarView.style.display = "none";
  if (avatarEdit) avatarEdit.style.display = "block";
  if (avatarInput) avatarInput.value = "";
}

function enterPasswordViewMode(): void {
  if (passwordView) passwordView.style.display = "block";
  if (passwordEdit) passwordEdit.style.display = "none";
  if (inputCurrentPw) inputCurrentPw.value = "";
  if (inputNewPw) inputNewPw.value = "";
}

function enterPasswordEditMode(): void {
  if (passwordView) passwordView.style.display = "none";
  if (passwordEdit) passwordEdit.style.display = "block";
  if (inputCurrentPw) inputCurrentPw.value = "";
  if (inputNewPw) inputNewPw.value = "";
}

function renderStatusDot(status: string): HTMLSpanElement {
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

async function loadUser(): Promise<void> {
  try {
    const res = await fetch("/api/me.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      window.location.href = "/";
      return;
    }

    const u: ApiUser = data.user;
    currentUser = u;

    if (subtitle) {
      subtitle.textContent = "Welcome back, " + (u.display_name || u.username) + "!";
    }
    if (fieldWins)   fieldWins.textContent   = (u.wins ?? 0).toString();
    if (fieldLosses) fieldLosses.textContent = (u.losses ?? 0).toString();

    fillViewMode(u);
    updateAvatarView(u);

    if (profileDiv) profileDiv.style.display = "block";
    enterAccountViewMode();
    enterAvatarViewMode();
    enterPasswordViewMode();

    await Promise.all([
      loadFriends(),
      loadPendingFriends(),
      loadChat(true),
    ]);

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

async function logout(): Promise<void> {
  try {
    await fetch("/api/logout.php", {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
  } catch (e) {
  }
  window.location.href = "/";
}


async function saveProfile(): Promise<void> {
  if (!inputEmail || !inputUsername || !inputDisplayName) return;

  const email       = inputEmail.value.trim();
  const username    = inputUsername.value.trim();
  const displayName = inputDisplayName.value.trim();

  if (!email || !username || !displayName) {
    setMessage("All fields are required.", true);
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

    const data: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Failed to update profile.", true);
      return;
    }

    if (currentUser) {
      currentUser.email        = email;
      currentUser.username     = username;
      currentUser.display_name = displayName;
      fillViewMode(currentUser);
      updateAvatarView(currentUser);
    }

    setMessage("Profile updated!");
    enterAccountViewMode();
  } catch (e) {
    console.error(e);
    setMessage("Network error while updating profile.", true);
  }
}

function cancelAccountEdit(): void {
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

async function saveAvatar(): Promise<void> {
  if (!avatarInput) return;
  const file = avatarInput.files?.[0];
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

    const data: any = await res.json().catch(() => ({}));

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
  } catch (e) {
    console.error(e);
    setMessage("Network error while uploading avatar.", true);
  }
}

function cancelAvatarEdit(): void {
  setMessage("");
  enterAvatarViewMode();
}

async function savePassword(): Promise<void> {
  if (!inputCurrentPw || !inputNewPw) return;

  const currentPw = inputCurrentPw.value;
  const newPw     = inputNewPw.value;

  if (!currentPw || !newPw) {
    setMessage("Please fill both password fields.", true);
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

    const data: any = await res.json().catch(() => ({}));

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

function cancelPasswordEdit(): void {
  setMessage("");
  enterPasswordViewMode();
}

async function loadFriends(): Promise<void> {
  if (!friendsListDiv) return;
  try {
    const res = await fetch("/api/friends/friends_list.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return;

    friendsListDiv.innerHTML = "";
    if (!data.friends || data.friends.length === 0) {
      friendsListDiv.textContent = "No friends yet.";
      return;
    }

    (data.friends as Friend[]).forEach((f) => {
      const row = document.createElement("div");
      const dot = renderStatusDot(f.status);
      const name = document.createElement("span");
      name.textContent = f.display_name || f.username || `User ${f.id}`;
      row.appendChild(dot);
      row.appendChild(name);
      friendsListDiv.appendChild(row);
    });
  } catch (e) {
    console.error(e);
  }
}

async function loadPendingFriends(): Promise<void> {
  if (!pendingListDiv) return;
  try {
    const res = await fetch("/api/friends/friends_pending.php", {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return;

    pendingListDiv.innerHTML = "";
    if (!data.requests || data.requests.length === 0) {
      pendingListDiv.textContent = "No pending requests.";
      return;
    }

    (data.requests as FriendRequest[]).forEach((r) => {
      const row = document.createElement("div");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = r.display_name || r.username || `User ${r.from_id}`;

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

async function respondToRequest(fromId: number, action: "accept" | "reject"): Promise<void> {
  try {
    const res = await fetch("/api/friends/friend_respond.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_id: fromId, action }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to update friend request.", true);
      return;
    }
    setMessage("Friend request updated!");
    await Promise.all([loadFriends(), loadPendingFriends()]);
  } catch (e) {
    console.error(e);
    setMessage("Network error while updating friend request.", true);
  }
}

async function sendFriendRequest(): Promise<void> {
  if (!friendIdentifier) return;
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
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Friend request failed.", true);
      return;
    }
    setMessage("Friend request sent!");
    friendIdentifier.value = "";
    await loadPendingFriends();
  } catch (e) {
    console.error(e);
    setMessage("Network error while sending friend request.", true);
  }
}

// ---- Chat ----

function appendChatMessage(msg: ChatMessage): void {
  if (!chatBox) return;
  const line = document.createElement("div");
  const who = msg.display_name || msg.username || `User ${msg.sender_id}`;
  const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : "";
  line.innerHTML =
    `<strong>${who}</strong> ` +
    `<span style="opacity:0.6;font-size:0.7rem;">${time}</span>: ` +
    `${msg.content}`;
  chatBox.appendChild(line);
  chatBox.scrollTop = chatBox.scrollHeight;
  if (msg.id > lastChatId) {
    lastChatId = msg.id;
  }
}

async function loadChat(initial = false): Promise<void> {
  if (!chatBox) return;
  try {
    const url = initial
      ? "/api/chat/chat_fetch.php?room=global"
      : "/api/chat/chat_fetch.php?room=global&since_id=" + encodeURIComponent(lastChatId);

    const res = await fetch(url, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.messages) return;

    (data.messages as ChatMessage[]).forEach(appendChatMessage);
  } catch (e) {
    console.error(e);
  }
}

async function sendChatMessage(): Promise<void> {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";

  try {
    const res = await fetch("/api/chat/chat_send.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: "global", content: text }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Failed to send message.", true);
      return;
    }
    if (data.message) {
      appendChatMessage(data.message as ChatMessage);
    }
  } catch (e) {
    console.error(e);
    setMessage("Network error while sending message.", true);
  }
}

// ---- Event wiring ----

logoutBtn?.addEventListener("click", () => void logout());

editProfileBtn?.addEventListener("click", () => {
  enterAccountEditMode();
});

saveProfileBtn?.addEventListener("click", () => void saveProfile());
cancelEditBtn?.addEventListener("click", () => cancelAccountEdit());

editAvatarBtn?.addEventListener("click", () => enterAvatarEditMode());
avatarSaveBtn?.addEventListener("click", () => void saveAvatar());
cancelAvatarBtn?.addEventListener("click", () => cancelAvatarEdit());

editPasswordBtn?.addEventListener("click", () => enterPasswordEditMode());
passwordSaveBtn?.addEventListener("click", () => void savePassword());
cancelPasswordBtn?.addEventListener("click", () => cancelPasswordEdit());

addFriendBtn?.addEventListener("click", () => void sendFriendRequest());

chatSendBtn?.addEventListener("click", () => void sendChatMessage());
chatInput?.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Enter") {
    void sendChatMessage();
  }
});

void loadUser();
