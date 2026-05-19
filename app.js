const STORAGE_KEY = "falconElectionData";
const SESSION_KEY = "falconElectionAdminSignedIn";
const ADMIN_USERNAME = "unaisbaraka";
const ADMIN_PASSWORD = "falconelection26";
const API_BASE = window.location.protocol === "file:" ? "" : `${window.location.origin}/api`;

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

async function castVote(candidateId) {
  // FIX: When the server is running (API_BASE is set), always use the API.
  // The old code silently fell back to localStorage on any network error,
  // so votes would be lost (stored locally but never written to the server file).
  if (API_BASE) {
    return await requestData("/vote", {
      method: "POST",
      body: JSON.stringify({ candidateId })
    });
  }

  // File:// mode only — no server, use localStorage directly.
  const latest = loadLocalData();
  const selected = latest.candidates.find((candidate) => candidate.id === candidateId);
  if (selected) selected.votes = Number(selected.votes || 0) + 1;
  saveLocalData(latest);
  return latest;
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
  // FIX: Accept any data: URI stored on the candidate (covers both the server's
  // SVG fallback and real uploaded JPEG/PNG images). Only fall through to the
  // initials avatar when the image field is missing or not a data URI at all.
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
  // FIX: Target poll badges by their specific IDs rather than by text content,
  // which was fragile and could accidentally match unrelated badges.
  ["pollStatusBadge", "adminPollBadge"].forEach((id) => {
    const badge = document.getElementById(id);
    if (!badge) return;
    badge.classList.toggle("open", isOpen);
    badge.classList.toggle("closed", !isOpen);
    badge.textContent = isOpen ? "Poll open" : "Poll closed";
  });
}

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
        currentStep.querySelector("[data-step-error]").textContent = "Please select one candidate before continuing.";
        return;
      }
      const current = Number(currentStep.dataset.step);
      showVoteStep(current + 1);
      renderVoteReview(steps, data.candidates, selections);
      return;
    }

    if (submitButton) {
      await submitGuidedVotes(submitButton, selections, steps);
    }
  });
}

function createIntroStep(isOpen, totalSteps) {
  const intro = document.createElement("section");
  intro.className = "position-section vote-step intro-step";
  intro.dataset.step = "0";
  intro.innerHTML = `
    <p class="eyebrow">Welcome</p>
    <h2>Mark your vote</h2>
    <p class="lede">Read each position carefully, choose one candidate, then press Next. After all positions are complete, press Submit to record the student's vote.</p>
    <div class="instruction-list">
      <span>Choose one candidate for each position.</span>
      <span>Press Next after every choice.</span>
      <span>Submit once at the end.</span>
    </div>
    <div class="vote-actions">
      <span class="selection-count">${totalSteps} ${totalSteps === 1 ? "position" : "positions"}</span>
      <button type="button" data-start ${isOpen ? "" : "disabled"}>Start voting</button>
    </div>
  `;
  return intro;
}

function createReviewStep(steps) {
  const review = document.createElement("section");
  review.className = "position-section vote-step review-step hidden";
  review.dataset.step = String(steps.length + 1);
  review.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Final Step</p>
        <h2>Review and submit</h2>
      </div>
      <span class="selection-count">Ready to submit</span>
    </div>
    <div id="voteReviewList" class="review-list"></div>
    <div class="vote-actions">
      <button type="button" class="ghost-button" data-back>Back</button>
      <p class="form-error" data-submit-error></p>
      <button type="button" data-submit-votes>Submit votes</button>
    </div>
  `;
  return review;
}

function showVoteStep(stepNumber) {
  document.querySelectorAll(".vote-step").forEach((step) => {
    step.classList.toggle("hidden", Number(step.dataset.step) !== stepNumber);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderVoteReview(steps, candidates, selections) {
  const reviewList = document.getElementById("voteReviewList");
  if (!reviewList) return;
  reviewList.innerHTML = steps
    .map(([position]) => {
      const selected = candidates.find((candidate) => candidate.id === selections[position]);
      return `
        <div class="leader-row">
          <div>
            <strong>${escapeHtml(position)}</strong>
            <small>${selected ? escapeHtml(selected.name) : "No candidate selected"}</small>
          </div>
          <span class="selection-count">${selected ? "Selected" : "Missing"}</span>
        </div>
      `;
    })
    .join("");
}

async function submitGuidedVotes(button, selections, steps) {
  const error = document.querySelector("[data-submit-error]");
  const selectedIds = steps.map(([position]) => selections[position]).filter(Boolean);
  if (selectedIds.length !== steps.length) {
    error.textContent = "Please complete every position before submitting.";
    return;
  }

  button.disabled = true;
  button.textContent = "Submitting...";
  error.textContent = "";

  try {
    // Send all selected candidate IDs to the server in ONE single network trip
    const response = await fetch(`${API_BASE}/vote-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds: selectedIds })
    });

    if (!response.ok) throw new Error("Submission failed");

    // Instantly trigger the confirmation modal 
    showSuccessModal();
    
    // Wait 5 seconds for them to see the confirmation, then refresh for the next voter
    setTimeout(() => {
      window.location.reload();
    }, 5000);
  } catch {
    button.disabled = false;
    button.textContent = "Submit votes";
    error.textContent = "Votes could not be submitted. Please try again.";
  }
}

function showSuccessModal() {
  const modal = document.getElementById("successModal");
  modal.classList.remove("hidden");
}

function initAdminPage() {
  const loginView = document.getElementById("loginView");
  if (!loginView) return;

  const adminView = document.getElementById("adminView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const candidateForm = document.getElementById("candidateForm");
  const candidateFormStatus = document.getElementById("candidateFormStatus");
  const imageInput = document.getElementById("candidateImage");
  let pendingImage = "";

  function showAdmin() {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    renderAdmin();
  }

  function showLogin() {
    loginView.classList.remove("hidden");
    adminView.classList.add("hidden");
  }

  if (sessionStorage.getItem(SESSION_KEY) === "true") showAdmin();
  else showLogin();

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      loginError.textContent = "";
      showAdmin();
    } else {
      loginError.textContent = "Incorrect username or password.";
    }
  });

  document.getElementById("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });

  document.getElementById("openPollButton").addEventListener("click", async () => {
    const data = await loadData();
    data.pollOpen = true;
    await saveData(data);
    renderAdmin();
  });

  document.getElementById("closePollButton").addEventListener("click", async () => {
    const data = await loadData();
    data.pollOpen = false;
    await saveData(data);
    renderAdmin();
  });

  document.getElementById("resetVotesButton").addEventListener("click", async () => {
    if (!confirm("Reset all candidate votes to zero?")) return;
    const data = await loadData();
    data.candidates.forEach((candidate) => {
      candidate.votes = 0;
    });
    await saveData(data);
    renderAdmin();
  });

  document.getElementById("clearFormButton").addEventListener("click", () => {
    candidateForm.reset();
    document.getElementById("candidateId").value = "";
    pendingImage = "";
    candidateFormStatus.textContent = "";
    document.getElementById("imagePreviewWrap").classList.add("hidden");
  });

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    if (!file) return;
    candidateFormStatus.classList.remove("error");
    candidateFormStatus.textContent = "Preparing photo...";
    try {
      pendingImage = await resizeImage(file);
      document.getElementById("imagePreview").src = pendingImage;
      document.getElementById("imagePreviewWrap").classList.remove("hidden");
      candidateFormStatus.textContent = "Photo ready.";
    } catch {
      pendingImage = "";
      imageInput.value = "";
      candidateFormStatus.classList.add("error");
      candidateFormStatus.textContent = "Please choose a valid image file.";
    }
  });

  candidateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    candidateFormStatus.classList.remove("error");
    candidateFormStatus.textContent = "Saving candidate...";
    try {
      const data = await loadData();
      const id = document.getElementById("candidateId").value || crypto.randomUUID();
      const existing = data.candidates.find((candidate) => candidate.id === id);
      const nextCandidate = {
        id,
        name: document.getElementById("candidateName").value.trim(),
        position: document.getElementById("candidatePosition").value.trim(),
        className: document.getElementById("candidateClass").value.trim(),
        image: pendingImage || existing?.image || fallbackImage,
        votes: Number(existing?.votes || 0)
      };

      if (existing) {
        Object.assign(existing, nextCandidate);
      } else {
        data.candidates.push(nextCandidate);
      }

      const savedData = await saveData(data);
      candidateForm.reset();
      document.getElementById("candidateId").value = "";
      pendingImage = "";
      document.getElementById("imagePreviewWrap").classList.add("hidden");
      candidateFormStatus.textContent = "Candidate saved.";
      renderCandidateTable(savedData);
      renderResults(savedData);
    } catch {
      candidateFormStatus.classList.add("error");
      candidateFormStatus.textContent = "Candidate could not be saved. Please refresh and try again.";
    }
  });
 // 1. Reusable function for lightning-fast dashboard updates
  async function triggerAdminLiveUpdate() {
    const adminView = document.getElementById("adminView");
    if (!adminView || adminView.classList.contains("hidden")) return;

    try {
      const response = await fetch(`${API_BASE}/api/election`);
      if (!response.ok) return;
      const data = await response.json();
      
      // This will call your brand new visual card rendering engine
      renderAdminPage(data);
    } catch (err) {
      console.error("Live update cycle paused:", err);
    }
  }

  // 2. Keep the automatic background cycle running every 3 seconds
  setInterval(triggerAdminLiveUpdate, 3000);

  // 3. FORCE an instant UI update the split-second the Reset button is clicked
  const resetBtn = document.getElementById("resetVotesButton");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(triggerAdminLiveUpdate, 200);
    });
  }
}

  // 3. FORCE an instant UI update the split-second the Reset button is clicked
  const resetBtn = document.getElementById("resetVotesButton");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      // Gives the server a brief 200ms window to clear, then updates UI instantly
      setTimeout(triggerAdminLiveUpdate, 200);
    });
  }

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Invalid image"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.fillStyle = "#f7f9fc";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function renderAdmin() {
  const data = await loadData();
  updatePollBadges(data.pollOpen);
  document.getElementById("adminPollText").textContent = data.pollOpen
    ? "Public users can vote after refreshing the poll page."
    : "Public users will see voting closed after refreshing the poll page.";

  renderCandidateTable(data);
  renderResults(data);
}

function renderCandidateTable(data) {
  const table = document.getElementById("candidateTable");
  table.innerHTML = "";
  if (!data.candidates.length) {
    table.innerHTML = '<div class="notice">No candidates added yet.</div>';
    return;
  }

  data.candidates.forEach((candidate) => {
    const row = document.createElement("article");
    row.className = "table-row";
    row.innerHTML = `
      <img src="${candidateImage(candidate)}" alt="${escapeHtml(candidate.name)} photo">
      <div>
        <h3>${escapeHtml(candidate.name)}</h3>
        <p>${escapeHtml(candidate.position)} · Class ${escapeHtml(candidate.className)} · ${Number(candidate.votes || 0)} votes</p>
      </div>
      <div class="row-actions">
        <button type="button" class="ghost-button" data-edit="${candidate.id}">Edit</button>
        <button type="button" class="danger-button" data-delete="${candidate.id}">Delete</button>
      </div>
    `;
    table.appendChild(row);
  });

  table.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editCandidate(button.dataset.edit));
  });
  table.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteCandidate(button.dataset.delete));
  });
}

async function editCandidate(id) {
  const data = await loadData();
  const candidate = data.candidates.find((item) => item.id === id);
  if (!candidate) return;
  document.getElementById("candidateId").value = candidate.id;
  document.getElementById("candidateName").value = candidate.name;
  document.getElementById("candidatePosition").value = candidate.position;
  document.getElementById("candidateClass").value = candidate.className;
  document.getElementById("imagePreview").src = candidateImage(candidate);
  document.getElementById("imagePreviewWrap").classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteCandidate(id) {
  if (!confirm("Delete this candidate? Their votes will also be removed.")) return;
  const data = await loadData();
  data.candidates = data.candidates.filter((candidate) => candidate.id !== id);
  await saveData(data);
  renderAdmin();
}

function renderResults(data) {
  const total = voteTotal(data.candidates);
  document.getElementById("totalVotes").textContent = `${total} ${total === 1 ? "vote" : "votes"}`;
  const leaders = document.getElementById("leaderList");
  leaders.innerHTML = "";

  const groups = groupedByPosition(data.candidates);
  Object.entries(groups).forEach(([position, candidates]) => {
    const sorted = [...candidates].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const leader = sorted[0];
    const positionTotal = voteTotal(candidates);
    const row = document.createElement("div");
    row.className = "leader-row";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(position)}</strong>
        <small>Leading: ${leader ? escapeHtml(leader.name) : "No candidate"} (${leader ? Number(leader.votes || 0) : 0} votes)</small>
      </div>
      <strong>${leader ? percent(leader, positionTotal) : "0%"}</strong>
    `;
    leaders.appendChild(row);
  });

  drawChart(data.candidates, total);
  renderPositionResults(groups);
}

function renderPositionResults(groups) {
  const container = document.getElementById("positionResults");
  if (!container) return;
  container.innerHTML = "";

  Object.entries(groups).forEach(([position, candidates]) => {
    const sorted = [...candidates].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const positionTotal = voteTotal(sorted);
    const leader = sorted[0];
    const second = sorted[1];
    const leaderVotes = Number(leader?.votes || 0);
    const secondVotes = Number(second?.votes || 0);
    const difference = leaderVotes - secondVotes;
    const differencePercent = percentNumber(difference, positionTotal);

    const card = document.createElement("article");
    card.className = "position-result-card";
    card.innerHTML = `
      <div class="position-result-head">
        <div>
          <h3>${escapeHtml(position)}</h3>
          <p>${positionTotal} ${positionTotal === 1 ? "vote" : "votes"} total</p>
        </div>
        <div class="result-lead">
          <strong>${leader ? escapeHtml(leader.name) : "No leader"}</strong>
          <span>Lead: ${difference} ${difference === 1 ? "vote" : "votes"} (${differencePercent}%)</span>
        </div>
      </div>
      <div class="position-bars">
        ${sorted.map((candidate, index) => resultBar(candidate, positionTotal, index)).join("")}
      </div>
    `;
    container.appendChild(card);
  });
}

function resultBar(candidate, total, index) {
  const votes = Number(candidate.votes || 0);
  const candidatePercent = percentNumber(votes, total);
  const barWidth = total ? candidatePercent : 0;
  return `
    <div class="result-bar-row">
      <div class="result-name">
        <strong>${escapeHtml(candidate.name)}</strong>
        <small>Class ${escapeHtml(candidate.className)}</small>
      </div>
      <div class="result-bar-track" aria-label="${escapeHtml(candidate.name)} result">
        <span class="${index === 0 ? "leading" : ""}" style="width: ${barWidth}%"></span>
      </div>
      <div class="result-numbers">
        <strong>${votes}</strong>
        <small>${candidatePercent}%</small>
      </div>
    </div>
  `;
}

function drawChart(candidates, total) {
  const canvas = document.getElementById("resultsChart");
  const context = canvas.getContext("2d");
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || 720;
  const height = 300;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const sorted = [...candidates].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0)).slice(0, 8);
  if (!sorted.length) {
    context.fillStyle = "#697386";
    context.font = "16px system-ui";
    context.fillText("No candidates to show.", 16, 40);
    return;
  }

  const maxVotes = Math.max(1, ...sorted.map((candidate) => Number(candidate.votes || 0)));
  const barHeight = 24;
  const gap = 13;
  const left = 150;
  const right = 78;
  const maxBarWidth = Math.max(80, width - left - right);

  context.font = "13px system-ui";
  sorted.forEach((candidate, index) => {
    const y = 28 + index * (barHeight + gap);
    const votes = Number(candidate.votes || 0);
    const barWidth = (votes / maxVotes) * maxBarWidth;
    context.fillStyle = "#172033";
    context.fillText(trimText(context, candidate.name, 132), 12, y + 17);
    context.fillStyle = index === 0 ? "#d89a2b" : "#176f7a";
    context.fillRect(left, y, barWidth, barHeight);
    context.fillStyle = "#172033";
    context.fillText(`${votes} · ${percent(candidate, total)}`, left + barWidth + 8, y + 17);
  });
}

function trimText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1 && context.measureText(`${trimmed}...`).width > maxWidth) {
    trimmed = trimmed.slice(0, -1);
  }
  return `${trimmed}...`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

initPublicPage();
initAdminPage();
