const STORAGE_KEY = "falconElectionData";
const SESSION_KEY = "falconElectionAdminSignedIn";
const ADMIN_USERNAME = "unaisbaraka";
const ADMIN_PASSWORD = "falconelection26";
const API_BASE = window.location.protocol === "file:" ? "" : `${window.location.origin}`;

const fallbackImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#e7edf3"/>
    <circle cx="200" cy="118" r="54" fill="#176f7a" opacity=".75"/>
    <path d="M94 267c22-65 68-98 106-98s84 33 106 98" fill="#d89a2b" opacity=".86"/>
  </svg>`);

function defaultData() {
  return {
    pollOpen: true,
    candidates: [
      {
        id: crypto.randomUUID(),
        name: "Sample Candidate",
        position: "Head Student",
        className: "10 A",
        image: fallbackImage,
        votes: 0
      }
    ]
  };
}

function loadLocalData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const starter = defaultData();
    saveLocalData(starter);
    return starter;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      pollOpen: Boolean(parsed.pollOpen),
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : []
    };
  } catch {
    const starter = defaultData();
    saveLocalData(starter);
    return starter;
  }
}

function saveLocalData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function requestData(path = "/election", options = {}) {
  if (!API_BASE) return null;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!response.ok) throw new Error("Request failed");
  return response.json();
}

async function loadData() {
  try {
    return (await requestData()) || loadLocalData();
  } catch {
    return loadLocalData();
  }
}

async function saveData(data) {
  if (!API_BASE) {
    saveLocalData(data);
    return data;
  }

  try {
    const saved = await requestData("/election", {
      method: "PUT",
      body: JSON.stringify(data)
    });
    saveLocalData(saved);
    return saved;
  } catch {
    throw new Error("Could not save election data");
  }
}

function groupedByPosition(candidates) {
  return candidates.reduce((groups, candidate) => {
    const position = candidate.position.trim() || "Unassigned";
    groups[position] = groups[position] || [];
    groups[position].push(candidate);
    return groups;
  }, {});
}

function voteTotal(candidates) {
  return candidates.reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0);
}

function percent(candidate, total) {
  if (!total) return "0%";
  return `${Math.round((Number(candidate.votes || 0) / total) * 100)}%`;
}

function percentNumber(votes, total) {
  if (!total) return 0;
  return Math.round((Number(votes || 0) / total) * 100);
}

function candidateImage(candidate) {
  if (candidate.image && candidate.image.startsWith("data:")) {
    return candidate.image;
  }
  return initialsAvatar(candidate.name);
}

function initialsAvatar(name) {
  const initials = String(name || "Candidate")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "C";
  const hue = Array.from(String(name || "Candidate")).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <rect width="160" height="160" rx="18" fill="hsl(${hue}, 42%, 34%)"/>
        <text x="80" y="94" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" font-weight="700" fill="white">${initials}</text>
      </svg>`)
  );
}

function updatePollBadges(isOpen) {
  ["pollStatusBadge", "adminPollBadge"].forEach((id) => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.className = isOpen ? "badge open" : "badge closed";
    badge.textContent = isOpen ? "Poll open" : "Poll closed";
  });
}

/* ==========================================================================
   PUBLIC PAGE APPLICATION LOGIC
   ========================================================================== */
async function initPublicPage() {
  const voteForm = document.getElementById("voteForm");
  if (!voteForm) return;

  const data = await loadData();
  const statusText = document.getElementById("pollStatusText");
  const closedNotice = document.getElementById("closedNotice");
  updatePollBadges(data.pollOpen);
  statusText.textContent = data.pollOpen ? "Voting is open now." : "Voting is closed by admin.";
  closedNotice.classList.toggle("hidden", data.pollOpen);

  voteForm.innerHTML = "";
  if (!data.candidates.length) {
    voteForm.innerHTML = '<section class="notice">No candidates have been added yet.</section>';
    return;
  }

  const steps = Object.entries(groupedByPosition(data.candidates));
  const selections = {};

  voteForm.appendChild(createIntroStep(data.pollOpen, steps.length));

  steps.forEach(([position, candidates], index) => {
    const section = document.getElementById("positionTemplate").content.cloneNode(true);
    const step = section.querySelector(".position-section");
    step.classList.add("vote-step", "hidden");
    step.dataset.step = String(index + 1);
    step.dataset.position = position;
    section.querySelector("h2").textContent = position;
    section.querySelector(".selection-count").textContent = `Step ${index + 1} of ${steps.length}`;
    const grid = section.querySelector(".candidate-grid");

    candidates.forEach((candidate) => {
      const card = document.getElementById("candidateTemplate").content.cloneNode(true);
      const input = card.querySelector("input");
      input.name = `position-${index}`;
      input.value = candidate.id;
      input.disabled = !data.pollOpen;
      card.querySelector("img").src = candidateImage(candidate);
      card.querySelector("img").alt = `${candidate.name} photo`;
      card.querySelector("strong").textContent = candidate.name;
      card.querySelector("small").textContent = `Class ${candidate.className}`;
      grid.appendChild(card);
    });

    const actions = document.createElement("div");
    actions.className = "vote-actions";
    actions.innerHTML = `
      <button type="button" class="ghost-button" data-back>Back</button>
      <p class="form-error" data-step-error></p>
      <button type="button" data-next>${index === steps.length - 1 ? "Review votes" : "Next"}</button>
    `;
    grid.after(actions);
    voteForm.appendChild(section);
  });

  voteForm.appendChild(createReviewStep(steps));
  showVoteStep(0);

  voteForm.addEventListener("change", (event) => {
    if (!event.target.matches('input[type="radio"]') || !data.pollOpen) return;
    const step = event.target.closest(".position-section");
    selections[step.dataset.position] = event.target.value;
    step.querySelectorAll(".check-indicator").forEach((indicator) => {
      indicator.textContent = "Vote";
    });
    event.target.closest(".candidate-card").querySelector(".check-indicator").textContent = "Selected";
    const error = step.querySelector("[data-step-error]");
    if (error) error.textContent = "";
  });

  voteForm.addEventListener("click", async (event) => {
    const startButton = event.target.closest("[data-start]");
    const nextButton = event.target.closest("[data-next]");
    const backButton = event.target.closest("[data-back]");
    const submitButton = event.target.closest("[data-submit-votes]");

    if (startButton) {
      showVoteStep(1);
      return;
    }

    if (backButton) {
      const current = Number(backButton.closest(".vote-step").dataset.step);
      showVoteStep(Math.max(0, current - 1));
      return;
    }

    if (nextButton) {
      const currentStep = nextButton.closest(".position-section");
      if (!currentStep.querySelector('input[type="radio"]:checked')) {
        currentStep.querySelector("[data-step-error]").textContent = "Please select one candidate