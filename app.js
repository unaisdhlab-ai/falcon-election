const STORAGE_KEY = "falconElectionData";
const SESSION_KEY = "falconElectionAdminSignedIn";
const ADMIN_USERNAME = "unaisbaraka";
const ADMIN_PASSWORD = "falconelection26";
const API_BASE = window.location.protocol === "file:" ? "" : window.location.origin;

const fallbackImage =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="#e7edf3"/>
    <circle cx="200" cy="118" r="54" fill="#176f7a" opacity=".75"/>
    <path d="M94 267c22-65 68-98 106-98s84 33 106 98" fill="#d89a2b" opacity=".86"/>
  </svg>`);

// MASTER ROSTER RECOVERY REPO (11 Positions, 41 Candidates formatted with default 0 votes)
function defaultData() {
  return {
    pollOpen: true,
    candidates: [
      // 1. Prime Minister
      { id: "pm-1", name: "Mohd Sadik", position: "Prime Minister", className: "9", image: fallbackImage, votes: 0 },
      { id: "pm-2", name: "Candidate 2", position: "Prime Minister", className: "9", image: fallbackImage, votes: 0 },
      { id: "pm-3", name: "Candidate 3", position: "Prime Minister", className: "10", image: fallbackImage, votes: 0 },
      { id: "pm-4", name: "Candidate 4", position: "Prime Minister", className: "10", image: fallbackImage, votes: 0 },

      // 2. Environmental Affairs
      { id: "env-1", name: "Saliha", position: "Environmental Affairs", className: "8", image: fallbackImage, votes: 0 },
      { id: "env-2", name: "Candidate 6", position: "Environmental Affairs", className: "7", image: fallbackImage, votes: 0 },
      { id: "env-3", name: "Candidate 7", position: "Environmental Affairs", className: "8", image: fallbackImage, votes: 0 },
      { id: "env-4", name: "Candidate 8", position: "Environmental Affairs", className: "9", image: fallbackImage, votes: 0 },

      // 3. Fine Arts & Cultural Affairs
      { id: "fa-1", name: "Zaira Khan", position: "Fine Arts & Cultural Affairs", className: "10", image: fallbackImage, votes: 0 },
      { id: "fa-2", name: "Ziya", position: "Fine Arts & Cultural Affairs", className: "9", image: fallbackImage, votes: 0 },
      { id: "fa-3", name: "Candidate 11", position: "Fine Arts & Cultural Affairs", className: "8", image: fallbackImage, votes: 0 },
      { id: "fa-4", name: "Candidate 12", position: "Fine Arts & Cultural Affairs", className: "10", image: fallbackImage, votes: 0 },

      // 4. Head Student
      { id: "hs-1", name: "Candidate 13", position: "Head Student", className: "10 A", image: fallbackImage, votes: 0 },
      { id: "hs-2", name: "Candidate 14", position: "Head Student", className: "10 B", image: fallbackImage, votes: 0 },
      { id: "hs-3", name: "Candidate 15", position: "Head Student", className: "10 C", image: fallbackImage, votes: 0 },
      { id: "hs-4", name: "Candidate 16", position: "Head Student", className: "10 D", image: fallbackImage, votes: 0 },

      // 5. General Captain
      { id: "gc-1", name: "Candidate 17", position: "General Captain", className: "10", image: fallbackImage, votes: 0 },
      { id: "gc-2", name: "Candidate 18", position: "General Captain", className: "9", image: fallbackImage, votes: 0 },
      { id: "gc-3", name: "Candidate 19", position: "General Captain", className: "10", image: fallbackImage, votes: 0 },
      { id: "gc-4", name: "Candidate 20", position: "General Captain", className: "9", image: fallbackImage, votes: 0 },

      // 6. Food & Health
      { id: "fh-1", name: "Candidate 21", position: "Food & Health", className: "9", image: fallbackImage, votes: 0 },
      { id: "fh-2", name: "Candidate 22", position: "Food & Health", className: "8", image: fallbackImage, votes: 0 },
      { id: "fh-3", name: "Candidate 23", position: "Food & Health", className: "9", image: fallbackImage, votes: 0 },
      { id: "fh-4", name: "Candidate 24", position: "Food & Health", className: "7", image: fallbackImage, votes: 0 },

      // 7. Student Editor
      { id: "se-1", name: "Candidate 25", position: "Student Editor", className: "10", image: fallbackImage, votes: 0 },
      { id: "se-2", name: "Candidate 26", position: "Student Editor", className: "9", image: fallbackImage, votes: 0 },
      { id: "se-3", name: "Candidate 27", position: "Student Editor", className: "10", image: fallbackImage, votes: 0 },
      { id: "se-4", name: "Candidate 28", position: "Student Editor", className: "8", image: fallbackImage, votes: 0 },

      // 8. Discipline & Welfare
      { id: "dw-1", name: "Candidate 29", position: "Discipline & Welfare", className: "10", image: fallbackImage, votes: 0 },
      { id: "dw-2", name: "Candidate 30", position: "Discipline & Welfare", className: "9", image: fallbackImage, votes: 0 },
      { id: "dw-3", name: "Candidate 31", position: "Discipline & Welfare", className: "10", image: fallbackImage, votes: 0 },
      { id: "dw-4", name: "Candidate 32", position: "Discipline & Welfare", className: "9", image: fallbackImage, votes: 0 },

      // 9. IT & Media Coordinator
      { id: "it-1", name: "Candidate 33", position: "IT & Media Coordinator", className: "10", image: fallbackImage, votes: 0 },
      { id: "it-2", name: "Candidate 34", position: "IT & Media Coordinator", className: "9", image: fallbackImage, votes: 0 },
      { id: "it-3", name: "Candidate 35", position: "IT & Media Coordinator", className: "10", image: fallbackImage, votes: 0 },

      // 10. Science & Innovation
      { id: "si-1", name: "Candidate 36", position: "Science & Innovation", className: "9", image: fallbackImage, votes: 0 },
      { id: "si-2", name: "Candidate 37", position: "Science & Innovation", className: "8", image: fallbackImage, votes: 0 },
      { id: "si-3", name: "Candidate 38", position: "Science & Innovation", className: "9", image: fallbackImage, votes: 0 },

      // 11. Moral & Social Service
      { id: "ms-1", name: "Candidate 39", position: "Moral & Social Service", className: "10", image: fallbackImage, votes: 0 },
      { id: "ms-2", name: "Candidate 40", position: "Moral & Social Service", className: "9", image: fallbackImage, votes: 0 },
      { id: "ms-3", name: "Mohd Rihan", position: "Moral & Social Service", className: "7", image: fallbackImage, votes: 0 }
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
    let data = await requestData();
    // SELF-HEAL: If server is empty or missing roster arrays, inject the full 41-candidate master blueprint
    if (!data || !data.candidates || data.candidates.length <= 1) {
      data = defaultData();
      await saveData(data);
    }
    return data;
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
    if (!candidate) return groups;
    const position = (candidate.position || "Unassigned").trim();
    groups[position] = groups[position] || [];
    groups[position].push(candidate);
    return groups;
  }, {});
}

function voteTotal(candidates) {
  if (!Array.isArray(candidates)) return 0;
  return candidates.reduce((sum, candidate) => sum + Number(candidate?.votes || 0), 0);
}

function percent(candidate, total) {
  if (!total || !candidate) return "0%";
  return `${Math.round((Number(candidate.votes || 0) / total) * 100)}%`;
}

function percentNumber(votes, total) {
  if (!total) return 0;
  return Math.round((Number(votes || 0) / total) * 100);
}

function candidateImage(candidate) {
  if (candidate && candidate.image && candidate.image.startsWith("data:")) {
    return candidate.image;
  }
  return initialsAvatar(candidate?.name || "Candidate");
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
  if (!data.candidates || !data.candidates.length) {
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
            <span style="font-size: 0.75rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">${escapeHtml(position)}</span>
            <strong style="font-size: 1.05rem; color: #0f172a; font-weight: 700; display: block;">${hasSelection ? escapeHtml(selected.name) : "No selection"}</strong>
            ${hasSelection && selected.className ? `<span style="font-size: 0.8rem; color: #64748b; font-weight: 500; display: block; margin-top: 1px;">Class ${escapeHtml(selected.className)}</span>` : ''}
          </div>
          <div>
            <span style="font-size: 0.8rem; background: ${hasSelection ? '#ecfdf5' : '#fef2f2'}; color: ${hasSelection ? '#065f46' : '#991b1b'}; padding: 6px 12px; border-radius: 9999px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em; display: inline-block; white-space: nowrap;">${hasSelection ? '✓ Selected' : '✕ Missing'}</span>
          </div>
        </div>`;
    }).join("");
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
    const data = await loadData();
    selectedIds.forEach(id => {
      const targetCandidate = data.candidates.find(c => c.id === id);
      if (targetCandidate) {
        targetCandidate.votes = Number(targetCandidate.votes || 0) + 1;
      }
    });
    await saveData(data);
    showSuccessModal();
    setTimeout(() => { window.location.reload(); }, 5000);
  } catch {
    button.disabled = false;
    button.textContent = "Submit votes";
    error.textContent = "Votes could not be submitted. Please try again.";
  }
}

function showSuccessModal() {
  const modal = document.getElementById("successModal");
  if (modal) modal.classList.remove("hidden");
}

/* ==========================================================================
   👑 TEACHER VIEW: LUXURY FULL SCREEN LEADBOARDS GRID WITH LIVE CHARTS
   ========================================================================== */
function renderAdminPage(data) {
  const container = document.getElementById("candidateTable");
  if (!container) return;
  container.innerHTML = "";

  if (!data.candidates || !data.candidates.length) {
    container.innerHTML = '<div style="text-align: center; color: #64748b; padding: 4rem 2rem; background: #f8fafc; border-radius: 16px; border: 2px dashed #cbd5e1; font-weight: 600; font-size: 1.1rem; width: 100%; box-sizing: border-box;">No candidates have been registered yet.</div>';
    return;
  }

  const positions = groupedByPosition(data.candidates);

  Object.keys(positions).forEach((positionName, posIndex) => {
    const candidatesInPosition = positions[positionName];
    candidatesInPosition.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));

    const maxVotes = Number(candidatesInPosition[0]?.votes || 0);
    const positionTotalVotes = voteTotal(candidatesInPosition);

    const positionCard = document.createElement("div");
    positionCard.style = "background: #ffffff; border-radius: 20px; padding: 2.5rem; margin-bottom: 2.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; width: 100%; box-sizing: border-box;";

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
          <button id="btnGrid-${posIndex}" type="button" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; background: #3b82f6; color: #ffffff;">📇 Cards View</button>
          <button id="btnChart-${posIndex}" type="button" style="padding: 6px 14px; font-size: 0.85rem; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; background: transparent; color: #475569;">📊 Analytics Charts</button>
        </div>
      </div>
      <div id="${gridId}" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; width: 100%;">`;

    candidatesInPosition.forEach((candidate, index) => {
      const voteCount = Number(candidate.votes || 0);
      const rank = index + 1;
      const isLeading = voteCount === maxVotes && voteCount > 0;
      let badgeBg = rank === 1 ? "#f59e0b" : rank === 2 ? "#cbd5e1" : rank === 3 ? "#b45309" : "#94a3b8";

      htmlContent += `
        <div style="background: ${isLeading ? '#f8fafc' : '#ffffff'}; border: 2px solid ${isLeading ? '#3b82f6' : '#e2e8f0'}; border-radius: 16px; padding: 1.75rem 1.5rem; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div style="position: absolute; top: 14px; left: 14px; width: 34px; height: 34px; background: ${badgeBg}; color: white; font-weight: 800; font-size: 0.95rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;">${rank}</div>
          ${isLeading ? `<div style="position: absolute; top: -12px; background: #3b82f6; color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 4px 14px; border-radius: 9999px;">👑 Winning Leader</div>` : ''}
          <div style="width: 115px; height: 115px; border-radius: 50%; overflow: hidden; margin-top: 8px; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
            <img src="${candidateImage(candidate)}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
          <h4 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0;">${escapeHtml(candidate.name)}</h4>
          <p style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin: 4px 0 1.5rem 0;">Class ${escapeHtml(candidate.className || 'N/A')}</p>
          <div style="margin-top: auto; width: 100%; background: ${isLeading ? '#eff6ff' : '#f8fafc'}; border-radius: 12px; padding: 12px 0;">
            <span style="font-size: 0.75rem; color: #64748b; display: block; font-weight: 700;">Ballots Cast</span>
            <span style="font-size: 2.25rem; font-weight: 900; color: ${isLeading ? '#2563eb' : '#0f172a'};">${voteCount}</span>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 14px; width: 100%; justify-content: center;">
            <button type="button" style="padding: 5px 14px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff;" data-edit="${candidate.id}">Edit</button>
            <button type="button" style="padding: 5px 14px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #fee2e2; background: #fff5f5; color: #991b1b;" data-delete="${candidate.id}">Delete</button>
          </div>
        </div>`;
    });

    htmlContent += `
      </div>
      <div id="${chartSectionId}" style="display: none; width: 100%;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; background: #f8fafc; padding: 2rem; border-radius: 16px;">
          <div style="background: #ffffff; padding: 1.5rem; border-radius: 12px; height: 240px; position: relative;">
            <canvas id="${barCanvasId}"></canvas>
          </div>
          <div style="background: #ffffff; padding: 1.5rem; border-radius: 12px; height: 240px; position: relative;">
            <canvas id="${pieCanvasId}"></canvas>
          </div>
        </div>
      </div>`;

    positionCard.innerHTML = htmlContent;
    container.appendChild(positionCard);

    const labels = candidatesInPosition.map(c => c.name);
    const votesData = candidatesInPosition.map(c => Number(c.votes || 0));
    const percentagesData = candidatesInPosition.map(c => positionTotalVotes ? Math.round((Number(c.votes || 0) / positionTotalVotes) * 100) : 0);

    const primaryColors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e'];

    setTimeout(() => {
      const barCtx = document.getElementById(barCanvasId)?.getContext('2d');
      const pieCtx = document.getElementById(pieCanvasId)?.getContext('2d');

      if (barCtx && typeof Chart !== 'undefined') {
        new Chart(barCtx, {
          type: 'bar',
          data: { labels: labels, datasets: [{ data: votesData, backgroundColor: primaryColors.slice(0, labels.length), borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
        });
      }
      if (pieCtx && typeof Chart !== 'undefined') {
        new Chart(pieCtx, {
          type: 'pie',
          data: { labels: labels.map((l, idx) => `${l} (${percentagesData[idx]}%)`), datasets: [{ data: votesData, backgroundColor: primaryColors.slice(0, labels.length) }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
      }
    }, 50);

    document.getElementById(`btnGrid-${posIndex}`)?.addEventListener("click", () => {
      document.getElementById(gridId).style.display = "grid";
      document.getElementById(chartSectionId).style.display = "none";
    });
    document.getElementById(`btnChart-${posIndex}`)?.addEventListener("click", () => {
      document.getElementById(gridId).style.display = "none";
      document.getElementById(chartSectionId).style.display = "block";
    });
  });

  container.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => editCandidate(btn.dataset.edit)));
  container.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", () => deleteCandidate(btn.dataset.delete)));
}

function renderAdmin() {
  loadData().then(data => {
    updatePollBadges(data.pollOpen);
    renderAdminPage(data);
    renderResults(data);
  });
}

function renderResults(data) {
  const total = voteTotal(data.candidates);
  const totalVotesElem = document.getElementById("totalVotes");
  if (totalVotesElem) totalVotesElem.textContent = `${total} votes`;
  
  const container = document.getElementById("positionResults");
  if (!container) return;
  container.innerHTML = "";

  const groups = groupedByPosition(data.candidates);
  Object.entries(groups).forEach(([position, candidates]) => {
    const sorted = [...candidates].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const positionTotal = voteTotal(sorted);
    const leader = sorted[0];

    const card = document.createElement("article");
    card.className = "position-result-card";
    card.innerHTML = `
      <div class="position-result-head">
        <div><h3>${escapeHtml(position)}</h3><p>${positionTotal} votes total</p></div>
        <div class="result-lead"><strong>Frontrunner: ${leader ? escapeHtml(leader.name) : "None"}</strong></div>
      </div>
      <div class="position-bars">
        ${sorted.map((c) => {
          const v = Number(c.votes || 0);
          const pct = positionTotal ? Math.round((v / positionTotal) * 100) : 0;
          return `
            <div class="result-bar-row">
              <div class="result-name"><strong>${escapeHtml(c.name)}</strong><small>Class ${escapeHtml(c.className)}</small></div>
              <div class="result-bar-track"><span style="width: ${pct}%"></span></div>
              <div class="result-numbers"><strong>${v}</strong><small>${pct}%</small></div>
            </div>`;
        }).join("")}
      </div>`;
    container.appendChild(card);
  });
}

/* ==========================================================================
   ADMIN AUTHENTICATION LOOP CONTROL
   ========================================================================== */
function initAdminPage() {
  const loginView = document.getElementById("loginView");
  if (!loginView) return;

  const adminView = document.getElementById("adminView");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const candidateForm = document.getElementById("candidateForm");
  const candidateFormStatus = document.getElementById("candidateFormStatus");

  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    loginView.classList.add("hidden");
    adminView.classList.remove("hidden");
    renderAdmin();
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (document.getElementById("username").value.trim() === ADMIN_USERNAME && document.getElementById("password").value === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      loginView.classList.add("hidden");
      adminView.classList.remove("hidden");
      renderAdmin();
    } else {
      loginError.textContent = "Incorrect username or password.";
    }
  });

  document.getElementById("logoutButton")?.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  });

  document.getElementById("openPollButton")?.addEventListener("click", async () => {
    const data = await loadData(); data.pollOpen = true; await saveData(data); renderAdmin();
  });
  document.getElementById("closePollButton")?.addEventListener("click", async () => {
    const data = await loadData(); data.pollOpen = false; await saveData(data); renderAdmin();
  });
  document.getElementById("resetVotesButton")?.addEventListener("click", async () => {
    if (!confirm("Reset all votes to zero?")) return;
    const data = await loadData(); data.candidates.forEach(c => c.votes = 0); await saveData(data); renderAdmin();
  });

  candidateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    candidateFormStatus.textContent = "Saving candidate...";
    try {
      const data = await loadData();
      const id = document.getElementById("candidateId").value || crypto.randomUUID();
      const existing = data.candidates.find(c => c.id === id);
      const nextCand = {
        id,
        name: document.getElementById("candidateName").value.trim(),
        position: document.getElementById("candidatePosition").value.trim(),
        className: document.getElementById("candidateClass").value.trim(),
        image: existing?.image || fallbackImage,
        votes: Number(existing?.votes || 0)
      };

      if (existing) Object.assign(existing, nextCand);
      else data.candidates.push(nextCand);

      await saveData(data);
      candidateForm.reset();
      document.getElementById("candidateId").value = "";
      candidateFormStatus.textContent = "Candidate saved.";
      renderAdmin();
    } catch {
      candidateFormStatus.textContent = "Error saving candidate.";
    }
  });

  setInterval(() => {
    if (adminView && !adminView.classList.contains("hidden")) {
      fetch(`${API_BASE}/election`).then(r => r.json()).then(d => renderAdminPage(d));
    }
  }, 4000);
}

async function editCandidate(id) {
  const data = await loadData();
  const c = data.candidates.find(item => item.id === id);
  if (!c) return;
  document.getElementById("candidateId").value = c.id;
  document.getElementById("candidateName").value = c.name;
  document.getElementById("candidatePosition").value = c.position;
  document.getElementById("candidateClass").value = c.className;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteCandidate(id) {
  if (!confirm("Delete candidate?")) return;
  const data = await loadData();
  data.candidates = data.candidates.filter(c => c.id !== id);
  await saveData(data);
  renderAdmin();
}

function escapeHtml(v) {
  return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

initPublicPage();
initAdminPage();