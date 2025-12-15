document.addEventListener("DOMContentLoaded", () => {
  const userId = new URLSearchParams(window.location.search).get('userId');

  if (!userId) {
    const subtitle = document.getElementById("subtitle") as HTMLElement;
    subtitle.textContent = "User not found!";
    return;
  }

  interface User {
    email: string;
    username: string;
    display_name: string;
    wins: number;
    losses: number;
    avatar_path?: string;
  }

const loadUserProfile = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`/api/user/profile?id=${id}`);
    const data = await response.json();
    
    console.log('API Response:', data);  // Log the entire response to see the structure

    if (response.ok && data.user) {
      const user = data.user;

      const viewEmail = document.getElementById("viewEmail") as HTMLElement;
      const viewUsername = document.getElementById("viewUsername") as HTMLElement;
      const viewDisplayName = document.getElementById("viewDisplayName") as HTMLElement;
      const fieldWins = document.getElementById("fieldWins") as HTMLElement;
      const fieldLosses = document.getElementById("fieldLosses") as HTMLElement;
      const avatarBox = document.getElementById("avatarBox") as HTMLElement;
      const avatarInitials = document.getElementById("avatarInitials") as HTMLElement;
      const title = document.getElementById("title") as HTMLElement;

      viewEmail.textContent = user.email;
      viewUsername.textContent = user.username;
      viewDisplayName.textContent = user.display_name;

      fieldWins.textContent = (user.wins !== undefined && user.wins !== null) ? user.wins.toString() : "0";
      fieldLosses.textContent = (user.losses !== undefined && user.losses !== null) ? user.losses.toString() : "0";

      if (user.avatar_path) {
        const img = document.createElement("img");
        img.src = user.avatar_path;
        img.alt = `${user.username}'s Avatar`;
        avatarBox.appendChild(img);
        avatarInitials.style.display = "none";
      } else {
        avatarInitials.textContent = getInitials(user.display_name);
      }

      title.textContent = `${user.display_name}'s Profile`;

      const subtitle = document.getElementById("subtitle") as HTMLElement;
      const profile = document.getElementById("profile") as HTMLElement;
      subtitle.style.display = "none";
      profile.style.display = "block";
    } else {
      const subtitle = document.getElementById("subtitle") as HTMLElement;
      subtitle.textContent = "Error loading user profile.";
    }
  } catch (e) {
    console.error(e);
    const subtitle = document.getElementById("subtitle") as HTMLElement;
    subtitle.textContent = "Network error.";
  }
};

  loadUserProfile(userId);

  const backBtn = document.getElementById("backBtn") as HTMLElement;
  backBtn.addEventListener("click", () => {
    window.history.back();
  });

  function getInitials(name: string): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
});
