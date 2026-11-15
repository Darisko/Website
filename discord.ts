// @ts-nocheck
// Discord user IDs are public identifiers. Never put a Discord bot token here.
const DISCORD_USER_ID = "847078359732453396";
const LANYARD_USER_URL = `https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`;
const LANYARD_SOCKET_URL = "wss://api.lanyard.rest/socket";

const widget = document.querySelector("#discordPresence");
const statusLabel = document.querySelector("#discordStatus");
const connectionLabel = document.querySelector("#discordLive");
const hint = document.querySelector("#discordHint");
const joinLink = document.querySelector("#lanyardJoin");
const activityRow = document.querySelector("#activityRow");
const activityLabel = document.querySelector("#activityLabel");
const activityName = document.querySelector("#activityName");
const activityDetails = document.querySelector("#activityDetails");
const spotifyRow = document.querySelector("#spotifyRow");
const spotifyArt = document.querySelector("#spotifyArt");
const spotifySong = document.querySelector("#spotifySong");
const spotifyArtist = document.querySelector("#spotifyArtist");
const spotifyOpen = document.querySelector("#spotifyOpen");
const profileAvatar = document.querySelector("#profileAvatar");
const discordAvatar = document.querySelector("#discordAvatar");
const avatarFallback = document.querySelector("#avatarFallback");

let currentSocket = null;
let heartbeatTimer = null;
let connectionTimer = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let stopped = false;

function hideDetails() {
  activityRow.hidden = true;
  spotifyRow.hidden = true;
  spotifyOpen.hidden = true;
  spotifyArt.hidden = true;
}

function showUnavailable(message, { needsOptIn = false, connection = "UNAVAILABLE" } = {}) {
  widget.dataset.state = "unavailable";
  widget.setAttribute("aria-busy", "false");
  statusLabel.textContent = "Discord status unavailable";
  connectionLabel.textContent = connection;
  connectionLabel.classList.remove("is-live");
  hint.textContent = message;
  hint.hidden = false;
  joinLink.hidden = !needsOptIn;
  hideDetails();
}

function displayActivity(presence) {
  const activities = Array.isArray(presence.activities) ? presence.activities : [];
  const activity = activities.find((item) => item && item.type !== 4 && String(item.name).toLowerCase() !== "spotify")
    || activities.find((item) => item && item.type === 4 && (item.state || item.emoji?.name));

  if (!activity) {
    activityRow.hidden = true;
    return;
  }

  const labels = { 0: "PLAYING", 1: "STREAMING", 2: "LISTENING TO", 3: "WATCHING", 5: "COMPETING IN" };
  const isCustomStatus = activity.type === 4;
  activityLabel.textContent = isCustomStatus ? "CUSTOM STATUS" : labels[activity.type] || "ACTIVITY";
  activityName.textContent = isCustomStatus ? (activity.state || activity.name || "Custom status") : (activity.name || "Discord activity");
  const detail = isCustomStatus && activity.emoji?.name
    ? activity.emoji.name
    : activity.details || activity.state || "";
  activityDetails.textContent = detail;
  activityDetails.hidden = !detail;
  activityRow.hidden = false;
}

function displaySpotify(presence) {
  const track = presence.listening_to_spotify && presence.spotify ? presence.spotify : null;
  if (!track || !track.song) {
    spotifyRow.hidden = true;
    spotifyOpen.hidden = true;
    spotifyArt.hidden = true;
    return;
  }

  spotifySong.textContent = track.song;
  spotifyArtist.textContent = track.artist || "";
  spotifyArtist.hidden = !track.artist;
  spotifyRow.hidden = false;

  const artUrl = track.album_art_url;
  let safeArtUrl = "";
  try {
    const parsed = new URL(artUrl);
    if (parsed.protocol === "https:" && parsed.hostname === "i.scdn.co") safeArtUrl = parsed.href;
  } catch {
    safeArtUrl = "";
  }

  if (safeArtUrl) {
    spotifyArt.alt = `Album art for ${track.song}`;
    spotifyArt.hidden = false;
    spotifyArt.onerror = () => { spotifyArt.hidden = true; };
    spotifyArt.src = safeArtUrl;
  } else {
    spotifyArt.hidden = true;
    spotifyArt.removeAttribute("src");
  }

  const trackId = String(track.track_id || "");
  if (/^[a-zA-Z0-9]{10,30}$/.test(trackId)) {
    spotifyOpen.href = `https://open.spotify.com/track/${encodeURIComponent(trackId)}`;
    spotifyOpen.hidden = false;
  } else {
    spotifyOpen.hidden = true;
  }
}

function useAvatarFallback() {
  discordAvatar.onload = null;
  discordAvatar.onerror = null;
  discordAvatar.hidden = true;
  discordAvatar.removeAttribute("src");
  avatarFallback.hidden = false;
  profileAvatar.setAttribute("aria-label", "Darisko profile picture");
}

function displayAvatar(presence) {
  const user = presence.discord_user;
  const userId = String(user?.id || "");
  const avatarHash = String(user?.avatar || "");
  if (userId !== DISCORD_USER_ID || !/^(?:a_)?[a-f0-9]{6,64}$/i.test(avatarHash)) {
    useAvatarFallback();
    return;
  }

  const format = avatarHash.startsWith("a_") ? "gif" : "png";
  const imageUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=256`;
  discordAvatar.hidden = true;
  avatarFallback.hidden = false;
  discordAvatar.onload = () => {
    if (discordAvatar.src !== imageUrl) return;
    discordAvatar.hidden = false;
    avatarFallback.hidden = true;
    profileAvatar.setAttribute("aria-label", "Darisko Discord profile picture");
  };
  discordAvatar.onerror = useAvatarFallback;
  discordAvatar.src = imageUrl;
}

function displayPresence(presence, isLive) {
  const statuses = {
    online: "Online",
    idle: "Idle",
    dnd: "Do not disturb",
    offline: "Offline",
  };
  const status = String(presence.discord_status || "").toLowerCase();
  displayAvatar(presence);
  if (!statuses[status]) {
    showUnavailable("Lanyard returned an unknown Discord status.");
    return;
  }

  widget.dataset.state = status;
  widget.setAttribute("aria-busy", "false");
  statusLabel.textContent = statuses[status];
  connectionLabel.textContent = isLive ? "LIVE" : "SNAPSHOT";
  connectionLabel.classList.toggle("is-live", isLive);
  joinLink.hidden = true;
  hint.textContent = status === "offline" ? "Not currently active on Discord" : "";
  hint.hidden = status !== "offline";

  if (status === "offline") {
    hideDetails();
    return;
  }

  displayActivity(presence);
  displaySpotify(presence);
}

async function loadSnapshot() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(LANYARD_USER_URL, { cache: "no-store", signal: controller.signal });
    const result = await response.json();
    if (!response.ok || !result.success || !result.data) {
      showUnavailable("Join Lanyard to share your presence.", { needsOptIn: true, connection: "NOT LINKED" });
      return;
    }
    displayPresence(result.data, false);
  } catch {
    showUnavailable("Live presence is temporarily unavailable.", { connection: "RECONNECTING" });
  } finally {
    window.clearTimeout(timeout);
  }
}

function clearSocketTimers() {
  if (heartbeatTimer) window.clearInterval(heartbeatTimer);
  if (connectionTimer) window.clearTimeout(connectionTimer);
  if (reconnectTimer) window.clearTimeout(reconnectTimer);
  heartbeatTimer = null;
  connectionTimer = null;
  reconnectTimer = null;
}

function scheduleReconnect() {
  if (stopped || reconnectTimer) return;
  const delay = Math.min(30000, 1000 * (2 ** reconnectAttempt));
  reconnectAttempt = Math.min(reconnectAttempt + 1, 5);
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connectSocket();
  }, delay);
}

function connectSocket() {
  if (stopped) return;
  let socket;
  try {
    socket = new WebSocket(LANYARD_SOCKET_URL);
  } catch {
    showUnavailable("Live presence is temporarily unavailable.", { connection: "RECONNECTING" });
    scheduleReconnect();
    return;
  }

  currentSocket = socket;
  connectionTimer = window.setTimeout(() => {
    if (socket === currentSocket) {
      showUnavailable("Live connection timed out. Reconnecting…", { connection: "RECONNECTING" });
      socket.close();
    }
  }, 10000);
  socket.addEventListener("message", (event) => {
    if (socket !== currentSocket) return;
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.op === 1) {
      const interval = Number(message.d?.heartbeat_interval) || 30000;
      socket.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [DISCORD_USER_ID] } }));
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      heartbeatTimer = window.setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ op: 3 }));
      }, interval);
      return;
    }

    if (message.op !== 0) return;
    if (message.t === "INIT_STATE") {
      if (connectionTimer) window.clearTimeout(connectionTimer);
      connectionTimer = null;
      const presence = message.d?.[DISCORD_USER_ID];
      if (presence) {
        reconnectAttempt = 0;
        displayPresence(presence, true);
      } else {
        showUnavailable("Join Lanyard to share your presence.", { needsOptIn: true, connection: "NOT LINKED" });
      }
      return;
    }

    if (message.t === "PRESENCE_UPDATE") {
      const presence = message.d;
      if (String(presence?.discord_user?.id || "") === DISCORD_USER_ID) {
        reconnectAttempt = 0;
        displayPresence(presence, true);
      }
    }
  });

  socket.addEventListener("close", () => {
    if (socket !== currentSocket) return;
    currentSocket = null;
    clearSocketTimers();
    if (stopped) return;
    showUnavailable("Live connection lost. Reconnecting…", { connection: "RECONNECTING" });
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    if (socket === currentSocket) showUnavailable("Live presence is temporarily unavailable.", { connection: "RECONNECTING" });
  });
}

window.addEventListener("pagehide", () => {
  stopped = true;
  clearSocketTimers();
  if (currentSocket) currentSocket.close();
});

loadSnapshot().finally(connectSocket);
