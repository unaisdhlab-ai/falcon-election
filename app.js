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
      const hasSelection = !!selected;
      
      return `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: left;">
          <div style="flex: 1; padding-right: 12px;">
            <span style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">
              ${escapeHtml(position)}
            </span>
            <strong style="font-size: 1.05rem; color: #0f172a; font-weight: 700; display: block;">
              ${hasSelection ? escapeHtml(selected.name) : "No selection"}
            </strong>
            ${hasSelection && selected.className ? `
              <span style="font-size: 0.8rem; color: #64748b; font-weight: 500; display: block; margin-top: 1px;">
                Class ${escapeHtml(selected.className)}
              </span>
            ` : ''}
          </div>
          <div>
            <span style="font-size: 0.8rem; background: ${hasSelection ? '#ecfdf5' : '#fef2f2'}; color: ${hasSelection ? '#065f46' : '#991b1b'}; padding: 6px 12px; border-radius: 9999px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; display: inline-block; white-space: nowrap;">
              ${hasSelection ? '✓ Selected' : '✕ Missing'}
            </span>
          </div>
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
    const response = await fetch(`${API_BASE}/vote-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateIds: selectedIds })
    });

    if (!response.ok) throw new Error("Submission failed");

    showSuccessModal();
    
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

/* ==========================================================================
   👑 TEACHER VIEW: LUXURY FULL SCREEN REAL-TIME RANKED LEADBOARDS GRID
   ========================================================================== */
function renderAdminPage(data) {
  const container = document.getElementById("candidateTable");
  if (!container) return;

  container.innerHTML = "";

  if (!data.candidates.length) {
    container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 4rem 2rem; background: #f8fafc; border-radius: 16px; border: 2px dashed #cbd5e1; font-weight: 600; font-size: 1.1rem; width: 100%; box-sizing: border-box;">No candidates have been registered yet.</div>';
    return;
  }

  const positions = groupedByPosition(data.candidates);

  Object.keys(positions).forEach((positionName, posIndex) => {
    const candidatesInPosition = positions[positionName];

    candidatesInPosition.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));

    const maxVotes = Number(candidatesInPosition[0].votes || 0);
    const positionTotalVotes = voteTotal(candidatesInPosition);

    const positionCard = document.createElement("div");
    positionCard.style = "background: #ffffff; border-radius: 20px; padding: 2.5rem; margin-bottom: 2.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03), 0 8px 10px -6px rgba(0,0,0,0.02); border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box;";

    const gridId = `grid-${posIndex}`;
    const chartSectionId = `chartSec-${posIndex}`;
    const barCanvasId = `bar-${posIndex}`;
    const pieCanvasId = `pie-${posIndex}`;

    let htmlContent = `
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #f1f5f9; gap: 1rem; width: 100%;">
        <div>
          <h3 style="font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em;">${escapeHtml(positionName)}</h3>
          <p style="color: #64748b; font-size: 0.9rem; margin: 4px 0 0 0; font-weight: 500;">Real-time student rankings and visual data analytics</p>
        </div>
        
        <div style="display: flex; gap: 8px; background: #f1f5f9; padding: 4px; border-radius: 8px;">
          <button id="btnGrid-${posIndex}" type="button" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; background: #3b82f6; color: #ffffff; transition: all 0.2s;">📇 Cards View</button>
          <button id="btnChart-${posIndex}" type="button" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #475569; transition: all 0.2s;">📊 Analytics Charts</button>
        </div>
      </div>

      <div id="${gridId}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; width: 100%;">
    `;

    candidatesInPosition.forEach((candidate, index) => {
      const voteCount = Number(candidate.votes || 0);
      const rank = index + 1;
      const isLeading = voteCount === maxVotes && voteCount > 0;

      let badgeBg = "#94a3b8"; 
      if (rank === 1) badgeBg = "#f59e0b"; 
      if (rank === 2) badgeBg = "#cbd5e1"; 
      if (rank === 3) badgeBg = "#b45309"; 

      htmlContent += `
        <div style="background: ${isLeading ? '#f8fafc' : '#ffffff'}; border: 2px solid ${isLeading ? '#3b82f6' : '#e2e8f0'}; border-radius: 16px; padding: 1.75rem 1.5rem; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: ${isLeading ? '0 4px 20px -2px rgba(59,130,246,0.08)' : 'none'}; transition: all 0.2s ease-in-out;">
          
          <div style="position: absolute; top: 14px; left: 14px; width: 34px; height: 34px; background: ${badgeBg}; color: white; font-weight: 800; font-size: 0.95rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            ${rank}
          </div>

          ${isLeading ? `
            <div style="position: absolute; top: -12px; background: #3b82f6; color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);">
              👑 Winning Leader
            </div>
          ` : ''}

          <div style="width: 115px; height: 115px; border-radius: 50%; overflow: hidden; margin-top: 8px; margin-bottom: 1.25rem; border: 4px solid ${isLeading ? '#3b82f6' : '#f1f5f9'}; box-shadow: 0 4px 10px rgba(0,0,0,0.03); background: #f8fafc; display: flex; align-items: center; justify-content: center;">