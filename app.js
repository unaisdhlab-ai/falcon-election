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
    // Aligned to match the server's expected native individual routing blocks safely
    for (const singleId of selectedIds) {
      const response = await fetch(`${API_BASE}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: singleId })
      });
      if (!response.ok) throw new Error("Submission failed");
    }

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
            <img src="${candidateImage(candidate)}" alt="${escapeHtml(candidate.name)} photo" style="width: 100%; height: 100%; object-fit: cover;">
          </div>

          <h4 style="font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; letter-spacing: -0.01em;">${escapeHtml(candidate.name)}</h4>
          <p style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin: 0 0 1.5rem 0;">Class ${escapeHtml(candidate.className || 'N/A')}</p>

          <div style="margin-top: auto; width: 100%; background: ${isLeading ? '#eff6ff' : '#f8fafc'}; border-radius: 12px; padding: 12px 0; border: 1px solid ${isLeading ? '#dbeafe' : '#f1f5f9'};">
            <span style="font-size: 0.75rem; color: #64748b; display: block; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 2px;">Ballots Cast</span>
            <span style="font-size: 2.25rem; font-weight: 900; color: ${isLeading ? '#2563eb' : '#0f172a'}; line-height: 1;">${voteCount}</span>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 14px; width: 100%; justify-content: center;">
            <button type="button" style="padding: 5px 14px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #ffffff; color: #1e293b;" data-edit="${candidate.id}">Edit</button>
            <button type="button" style="padding: 5px 14px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; cursor: pointer; border: 1px solid #fee2e2; background: #fff5f5; color: #991b1b;" data-delete="${candidate.id}">Delete</button>
          </div>
        </div>
      `;
    });

    htmlContent += `
      </div>

      <div id="${chartSectionId}" style="display: none; width: 100%; box-sizing: border-box;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2.5rem; width: 100%; align-items: center; background: #f8fafc; padding: 2rem; border-radius: 16px; border: 1px dashed #cbd5e1;">
          
          <div style="background: #ffffff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); min-height: 280px; display: flex; flex-direction: column; justify-content: center;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1rem; font-weight: 700; text-align: center;">📊 Vote Volume (Bar Graph)</h4>
            <div style="position: relative; width: 100%; height: 220px;">
              <canvas id="${barCanvasId}"></canvas>
            </div>
          </div>

          <div style="background: #ffffff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); min-height: 280px; display: flex; flex-direction: column; justify-content: center;">
            <h4 style="margin: 0 0 1rem 0; color: #1e293b; font-size: 1rem; font-weight: 700; text-align: center;">🍰 Share Percentage (Pie Chart)</h4>
            <div style="position: relative; width: 100%; height: 220px; display: flex; justify-content: center;">
              <canvas id="${pieCanvasId}"></canvas>
            </div>
          </div>

        </div>
      </div>
    `;

    positionCard.innerHTML = htmlContent;
    container.appendChild(positionCard);

    const labels = candidatesInPosition.map(c => c.name);
    const votesData = candidatesInPosition.map(c => Number(c.votes || 0));
    const percentagesData = candidatesInPosition.map(c => positionTotalVotes ? Math.round((Number(c.votes || 0) / positionTotalVotes) * 100) : 0);

    const primaryColors = ['#3b82f6', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#6366f1', '#14b8a6', '#f43f5e'];
    const hoverColors = ['#2563eb', '#d97706', '#059669', '#db2777', '#7c3aed', '#4f46e5', '#0d9488', '#e11d48'];

    setTimeout(() => {
      const barCtx = document.getElementById(barCanvasId)?.getContext('2d');
      const pieCtx = document.getElementById(pieCanvasId)?.getContext('2d');

      if (barCtx && typeof Chart !== 'undefined') {
        new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Votes Cast',
              data: votesData,
              backgroundColor: primaryColors.slice(0, labels.length),
              borderWidth: 0,
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
          }
        });
      }

      if (pieCtx && typeof Chart !== 'undefined') {
        new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: labels.map((l, idx) => `${l} (${percentagesData[idx]}%)`),
            datasets: [{
              data: votesData,
              backgroundColor: primaryColors.slice(0, labels.length),
              hoverBackgroundColor: hoverColors.slice(0, labels.length),
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { weight: 600 } } } }
          }
        });
      }
    }, 50);

    const btnGrid = document.getElementById(`btnGrid-${posIndex}`);
    const btnChart = document.getElementById(`btnChart-${posIndex}`);
    const gridView = document.getElementById(gridId);
    const chartView = document.getElementById(chartSectionId);

    btnGrid?.addEventListener("click", () => {
      gridView.style.display = "grid";
      chartView.style.display = "none";
      btnGrid.style.background = "#3b82f6";
      btnGrid.style.color = "#ffffff";
      btnChart.style.background = "transparent";
      btnChart.style.color = "#475569";
    });

    btnChart?.addEventListener("click", () => {
      gridView.style.display = "none";
      chartView.style.display = "block";
      btnChart.style.background = "#3b82f6";
      btnChart.style.color = "#ffffff";
      btnGrid.style.background = "transparent";
      btnGrid.style.color = "#475569";
    });
  });

  container.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => editCandidate(button.dataset.edit));
  });
  container.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteCandidate(button.dataset.delete));
  });
}

function renderAdmin() {
  loadData().then(data => {
    updatePollBadges(data.pollOpen);
    const adminPollText = document.getElementById("adminPollText");
    if (adminPollText) {
      adminPollText.textContent = data.pollOpen
        ? "Public users can vote after refreshing the poll page."
        : "Public users will see voting closed after refreshing the poll page.";
    }
    renderAdminPage(data);
    renderResults(data);
  });
}

function renderResults(data) {
  const total = voteTotal(data.candidates);
  const totalVotesElem = document.getElementById("totalVotes");
  if (totalVotesElem) {
    totalVotesElem.textContent = `${total} ${total === 1 ? "vote" : "votes"}`;
  }
  
  const leaders = document.getElementById("leaderList");
  if (leaders) {
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
  }

  drawChart(data.candidates, total);
  renderPositionResults(groupedByPosition(data.candidates));
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
  if (!canvas) return;
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
        const height = Math.max(1, Math.round(image.naturalWidth * scale));
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

/* ==========================================================================
   ADMIN SETTINGS APPLICATION MODULE
   ========================================================================== */
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

  const tabShowResults = document.getElementById("tabShowResults");
  const tabShowManage = document.getElementById("tabShowManage");
  const resultsTabWrapper = document.getElementById("resultsTabWrapper");
  const manageTabWrapper = document.getElementById("manageTabWrapper");

  if (tabShowResults && tabShowManage) {
    tabShowResults.addEventListener("click", () => {
      resultsTabWrapper.style.display = "block";
      manageTabWrapper.style.display = "none";
      
      tabShowResults.style.background = "#3b82f6";
      tabShowResults.style.color = "#ffffff";
      tabShowManage.style.background = "transparent";
      tabShowManage.style.color = "#475569";
      
      triggerAdminLiveUpdate();
    });

    tabShowManage.addEventListener("click", () => {
      resultsTabWrapper.style.display = "none";
      manageTabWrapper.style.display = "block";
      
      tabShowManage.style.background = "#3b82f6";
      tabShowManage.style.color = "#ffffff";
      tabShowResults.style.background = "transparent";
      tabShowResults.style.color = "#475569";
    });
  }

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
      renderAdmin();
    } catch {
      candidateFormStatus.classList.add("error");
      candidateFormStatus.textContent = "Candidate could not be saved. Please refresh and try again.";
    }
  });

  async function triggerAdminLiveUpdate() {
    const adminView = document.getElementById("adminView");
    if (!adminView || adminView.classList.contains("hidden")) return;

    try {
      const response = await fetch(`${API_BASE}/election`);
      if (!response.ok) return;
      const data = await response.json();
      renderAdminPage(data);
    } catch (err) {
      console.error("Live update cycle paused:", err);
    }
  }

  setInterval(triggerAdminLiveUpdate, 3000);
}

async function editCandidate(id) {
  const data = await loadData();
  const candidate = data.candidates.find((item) => item.id === id);
  if (!candidate) return;
  
  document.getElementById("tabShowManage").click();
  
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