(() => {
  "use strict";

  // These are browser-safe Supabase connection values. Never place a secret or
  // service-role key in this file.
  const SUPABASE_URL = "https://lsqiezrucftruvvtrypb.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bF90WlEX-wp3lCOVh2tS9A_kF3WA-eY";
  const CARD_SET_VERSION = "2026-09-04-v1";

  const allCards = window.CARD_DATA || [];
  const categoryInfo = {
    "Emotional Support & Mental Health": { label: "Emotional & Mental Health Support", description: "Listening, counseling, crisis response, and emotional well-being", color: "#9B6CF2", soft: "#EEE5FF" },
    "Youth, Families, & Education": { label: "Youth, Families & Learning", description: "Helping children, families, students, and learners thrive", color: "#39A8F2", soft: "#DDF2FF" },
    "Social Justice, Equity & Advocacy": { label: "Equity, Justice & Advocacy", description: "Protecting rights, amplifying voices, and improving fairness", color: "#F27676", soft: "#FFE2E2" },
    "Growth, Coaching & Personal Development": { label: "Growth, Coaching & Guidance", description: "Helping people clarify goals, build skills, and move forward", color: "#42C47A", soft: "#DFF8E9" },
    "Health, Rehabilitation & Disability Support": { label: "Health, Access & Independence", description: "Supporting health, rehabilitation, disability access, and daily living", color: "#39C5BD", soft: "#DCF8F6" },
    "Everyday Navigation & Resource Access": { label: "Resources & Life Navigation", description: "Connecting people with services, information, and essential resources", color: "#F5AD4D", soft: "#FFF0D8" },
    "Behind-the-Scenes Helpers": { label: "Programs, Research & Systems", description: "Improving the programs and organizations that help people", color: "#8095F2", soft: "#E5EAFF" }
  };

  const categoryExperience = {
    "Emotional Support & Mental Health": "Attend a mental-health, wellness, or peer-support event and notice which helping roles are involved.",
    "Youth, Families, & Education": "Volunteer with a youth or family program and ask staff how their roles work together.",
    "Social Justice, Equity & Advocacy": "Attend a community forum or advocacy event and observe how people turn concerns into action.",
    "Growth, Coaching & Personal Development": "Interview a coach, advisor, or learning professional about how they help people make progress.",
    "Health, Rehabilitation & Disability Support": "Explore a hospital, rehabilitation, aging-services, or disability-support volunteer role.",
    "Everyday Navigation & Resource Access": "Volunteer with a community resource agency and learn how it connects people with services.",
    "Behind-the-Scenes Helpers": "Offer to help a mission-driven organization with a small research, planning, communication, or evaluation project."
  };
  const approachExperience = {
    "Direct Support": "Try a client-facing volunteer role that lets you practice listening, encouragement, and resource sharing.",
    "Education & Youth": "Tutor, mentor, or support an educational program to test how much you enjoy guiding learning and development.",
    "Health & Mental Wellness": "Complete a short introductory training such as Mental Health First Aid, QPR, or another relevant workshop.",
    "Data & Innovation": "Assist with a research project, needs assessment, survey, or program evaluation connected to this issue.",
    "Advocacy & Systems": "Ask to shadow a professional who works across policies, programs, or community systems."
  };

  const storageKey = "uiowa-helping-card-sort-v2";
  const courseFromUrl = new URLSearchParams(window.location.search).get("course")?.trim().slice(0, 120) || "";
  let state = loadState();
  if (courseFromUrl) state.context.courseGroup = courseFromUrl;
  let cards = orderedCards(state.order);
  let currentFilter = "all";
  let toastTimer;

  const el = id => document.getElementById(id);
  const views = { sort: el("sort-view"), patterns: el("patterns-view"), results: el("results-view") };

  function shuffledIds() {
    const ids = allCards.map(card => card.id);
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    return ids;
  }
  function newSessionId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  function defaultState() {
    return {
      index: 0,
      answers: {},
      shortlist: [],
      order: shuffledIds(),
      sessionId: newSessionId(),
      context: { major: "", usageContext: "", courseGroup: "" },
      submittedFingerprint: ""
    };
  }
  function orderedCards(order) {
    const byId = new Map(allCards.map(card => [card.id, card]));
    return (order || []).map(id => byId.get(id)).filter(Boolean);
  }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      const fallback = defaultState();
      const validOrder = Array.isArray(saved?.order) && saved.order.length === allCards.length;
      return saved && saved.answers ? { ...fallback, ...saved, order: validOrder ? saved.order : fallback.order } : fallback;
    } catch { return defaultState(); }
  }
  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function invalidateSubmission() {
    state.submittedFingerprint = "";
    document.body.classList.remove("print-unlocked");
    if (el("save-status")) el("save-status").textContent = "";
    if (el("save-results")) el("save-results").textContent = "Submit & view my results";
    updateResultsAccess(false);
  }
  function category(card) { return categoryInfo[card.categoryA] || categoryInfo["Behind-the-Scenes Helpers"]; }
  function experienceIdeas(card) {
    return [
      card.opportunities,
      categoryExperience[card.categoryA] || "Talk with someone who does this work and ask what a typical week looks like.",
      approachExperience[card.approach] || "Try a short volunteer, job-shadow, research, or campus involvement connected to this work."
    ];
  }
  function experienceListHtml(card) {
    return `<ul class="experience-list">${experienceIdeas(card).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }
  function onetLink(card) {
    const term = card.careers.split(",")[0].trim();
    return `https://www.onetonline.org/find/quick?s=${encodeURIComponent(term)}`;
  }
  function setCategoryStyle(node, cardOrName) {
    const info = typeof cardOrName === "string" ? (categoryInfo[cardOrName] || categoryInfo["Behind-the-Scenes Helpers"]) : category(cardOrName);
    node.style.setProperty("--cat", info.color);
    node.style.setProperty("--cat-soft", info.soft);
  }
  function showView(name) {
    Object.entries(views).forEach(([key, node]) => node.hidden = key !== name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function showToast(message) {
    clearTimeout(toastTimer);
    el("toast").textContent = message;
    el("toast").classList.add("show");
    toastTimer = setTimeout(() => el("toast").classList.remove("show"), 2400);
  }

  function renderSort() {
    if (!cards.length) return;
    if (state.index >= cards.length) { renderPatterns(); showView("patterns"); return; }
    const card = cards[state.index];
    el("progress-text").textContent = `Card ${state.index + 1} of ${cards.length}`;
    el("progress-bar").style.width = `${(state.index / cards.length) * 100}%`;
    el("challenge-prompt").textContent = card.prompt;
    el("short-description").textContent = card.description;
    el("back-card").disabled = state.index === 0;
    document.querySelectorAll(".decision").forEach(button => {
      const isCurrent = state.answers[card.id] === button.dataset.choice;
      button.classList.toggle("current-choice", isCurrent);
      button.setAttribute("aria-pressed", String(isCurrent));
    });
    el("sort-card").focus({ preventScroll: true });
  }

  function answer(choice) {
    const id = cards[state.index].id;
    state.answers[id] = choice;
    invalidateSubmission();
    if (choice === "not") state.shortlist = state.shortlist.filter(item => item !== id);
    state.index += 1;
    saveState();
    renderSort();
  }

  function candidateCards() {
    return cards.filter(card => ["interested", "maybe"].includes(state.answers[card.id]));
  }

  function patternScores() {
    const scores = {};
    Object.keys(categoryInfo).forEach(key => scores[key] = {
      points: 0,
      interested: 0,
      maybe: 0,
      possible: cards.filter(card => card.categoryA === key).length * 2,
      rate: 0
    });
    candidateCards().forEach(card => {
      const choice = state.answers[card.id];
      scores[card.categoryA].points += choice === "interested" ? 2 : 1;
      scores[card.categoryA][choice] += 1;
    });
    Object.values(scores).forEach(score => score.rate = score.possible ? score.points / score.possible : 0);
    return Object.entries(scores).sort((a, b) => b[1].rate - a[1].rate || b[1].points - a[1].points);
  }

  function renderPatterns() {
    const candidates = candidateCards();
    const interested = candidates.filter(c => state.answers[c.id] === "interested").length;
    const maybe = candidates.length - interested;
    el("patterns-summary").textContent = candidates.length
      ? `You marked ${interested} interested and ${maybe} maybe. Stronger patterns appear first.`
      : "You did not mark any cards interested or maybe. Review your sort to reconsider a few possibilities.";

    const scores = patternScores();
    el("pattern-panel").innerHTML = scores.filter(([, s]) => s.points > 0).map(([name, score]) => {
      const info = categoryInfo[name];
      return `<div class="pattern-row" style="--cat:${info.color};--cat-soft:${info.soft}">
        <div class="pattern-name"><span>${escapeHtml(info.label)}</span><span>${score.interested + score.maybe} card${score.interested + score.maybe === 1 ? "" : "s"}</span></div>
        <p>${escapeHtml(info.description)}</p>
        <div class="pattern-meter" aria-label="Interest strength within this pattern"><span style="width:${Math.round(score.rate * 100)}%"></span></div>
      </div>`;
    }).join("") || `<div class="empty-state"><h3>No patterns yet</h3><p>Review your choices and mark any challenges that you might want to explore.</p></div>`;

    renderFilters(scores);
    renderCandidates();
    updateShortlistControls();
  }

  function renderFilters(scores) {
    const activeCategories = scores.filter(([, s]) => s.points > 0).map(([name]) => name);
    if (currentFilter !== "all" && !activeCategories.includes(currentFilter)) currentFilter = "all";
    el("filter-row").innerHTML = [
      `<button class="filter-button" data-filter="all" aria-pressed="${currentFilter === "all"}">All patterns</button>`,
      ...activeCategories.map(name => `<button class="filter-button" data-filter="${escapeAttr(name)}" aria-pressed="${currentFilter === name}">${escapeHtml(categoryInfo[name].label)}</button>`)
    ].join("");
  }

  function renderCandidates() {
    const candidates = candidateCards()
      .filter(card => currentFilter === "all" || card.categoryA === currentFilter)
      .sort((a, b) => (state.answers[b.id] === "interested") - (state.answers[a.id] === "interested"));
    el("candidate-grid").innerHTML = candidates.map(card => {
      const info = category(card);
      const selected = state.shortlist.includes(card.id);
      const choiceLabel = state.answers[card.id] === "interested" ? "Interested" : "Maybe";
      return `<article class="candidate-card ${selected ? "selected" : ""}" style="--cat:${info.color};--cat-soft:${info.soft}">
        <span class="category-chip" style="--cat:${info.color};--cat-soft:${info.soft}">${escapeHtml(info.label)}</span>
        <h4>${escapeHtml(card.prompt)}</h4>
        <p><strong>${choiceLabel}</strong> · ${escapeHtml(card.careers)}</p>
        <div class="candidate-actions">
          <button class="details-button" data-detail="${card.id}" type="button">View details</button>
          <button class="select-button" data-select="${card.id}" type="button" aria-pressed="${selected}">${selected ? "✓ Selected" : "+ Select"}</button>
        </div>
      </article>`;
    }).join("");
    el("empty-candidates").hidden = candidates.length > 0;
  }

  function toggleShortlist(id) {
    if (state.shortlist.includes(id)) state.shortlist = state.shortlist.filter(item => item !== id);
    else if (state.shortlist.length < 5) state.shortlist.push(id);
    else { showToast("Choose up to 5 cards. Remove one before adding another."); return; }
    invalidateSubmission();
    saveState();
    renderCandidates();
    updateShortlistControls();
  }

  function updateShortlistControls() {
    const count = state.shortlist.length;
    el("shortlist-count").textContent = `${count} of 5 selected`;
    el("build-results").disabled = count === 0;
    el("next-help").textContent = count ? `${count} selected. You can choose ${5 - count} more.` : "Select at least one card to build your results.";
  }

  function openDetails(id) {
    const card = cards.find(item => item.id === id);
    if (!card) return;
    const info = category(card);
    setCategoryStyle(el("detail-dialog"), card);
    setCategoryStyle(el("dialog-chip"), card);
    el("dialog-chip").textContent = info.label;
    el("dialog-title").textContent = card.prompt;
    el("dialog-description").textContent = card.description;
    el("dialog-strengths").textContent = card.strengths;
    el("dialog-careers").textContent = card.careers;
    el("dialog-settings").textContent = card.settings;
    el("dialog-preparation").textContent = card.preparation;
    el("dialog-reality").textContent = card.realityCheck;
    el("dialog-opportunities").innerHTML = experienceListHtml(card);
    el("dialog-onet").href = onetLink(card);
    el("detail-dialog").showModal();
  }

  function renderResults() {
    const selected = state.shortlist.map(id => cards.find(card => card.id === id)).filter(Boolean);
    const selectedCats = {};
    selected.forEach(card => selectedCats[card.categoryA] = (selectedCats[card.categoryA] || 0) + 1);
    const top = Object.entries(selectedCats).sort((a,b) => b[1]-a[1]);
    const topLabels = top.slice(0, 2).map(([name]) => categoryInfo[name].label);
    el("result-patterns").innerHTML = `<h3>Patterns in your final choices</h3><p>${topLabels.length ? `Your choices most strongly connect with <strong>${topLabels.map(escapeHtml).join("</strong> and <strong>")}</strong>.` : "Your choices cross several different ways of helping."} Look for repeated populations, work settings, strengths, and types of impact below.</p>`;
    el("result-cards").innerHTML = selected.map((card, index) => {
      const info = category(card);
      return `<article class="result-card" style="--cat:${info.color};--cat-soft:${info.soft}">
        <span class="category-chip" style="--cat:${info.color};--cat-soft:${info.soft}">Choice ${index + 1} · ${escapeHtml(info.label)}</span>
        <h3>${escapeHtml(card.prompt)}</h3>
        <dl>
          <div><dt>Careers to investigate</dt><dd>${escapeHtml(card.careers)}</dd></div>
          <div><dt>Strengths you might use</dt><dd>${escapeHtml(card.strengths)}</dd></div>
          <div><dt>Common settings</dt><dd>${escapeHtml(card.settings)}</dd></div>
          <div><dt>Ways to try it out</dt><dd>${experienceListHtml(card)}</dd></div>
          <div><dt>Research starting point</dt><dd><a href="${onetLink(card)}" target="_blank" rel="noopener">Look up a related occupation in O*NET ↗</a></dd></div>
        </dl>
      </article>`;
    }).join("");
    restoreResponseForm();
    updateSubmissionGate();
  }

  function responsePayload() {
    return {
      p_session_id: state.sessionId,
      p_major: state.context.major,
      p_usage_context: state.context.usageContext,
      p_course_group: state.context.courseGroup,
      p_website: el("website")?.value || "",
      p_answers: state.answers,
      p_shortlist: state.shortlist,
      p_category_scores: Object.fromEntries(patternScores().map(([name, score]) => [name, score])),
      p_card_set_version: CARD_SET_VERSION
    };
  }

  function currentFingerprint() {
    return JSON.stringify({ answers: state.answers, shortlist: state.shortlist, context: state.context });
  }

  async function submitResponse() {
    const saveButton = el("save-results");
    saveButton.disabled = true;
    saveButton.textContent = "Submitting…";
    el("save-status").textContent = "Submitting your results…";
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_card_sort_response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(responsePayload())
      });
      if (!response.ok) throw new Error("save failed");
      state.submittedFingerprint = currentFingerprint();
      saveState();
      el("save-status").textContent = "Results submitted. Your exploration list is ready.";
      updateSubmissionGate();
      el("results-content").scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    } catch {
      el("save-status").textContent = "We couldn't submit your results. Check your connection and try again; your choices are still on this device.";
      return false;
    } finally {
      saveButton.disabled = false;
      if (state.submittedFingerprint !== currentFingerprint()) saveButton.textContent = "Submit & view my results";
    }
  }

  function restoreResponseForm() {
    el("student-major").value = state.context?.major || "";
    el("usage-context").value = state.context?.usageContext || "";
    el("course-group").value = state.context?.courseGroup || "";
    el("course-group").readOnly = Boolean(courseFromUrl);
    el("course-group").setAttribute("aria-readonly", String(Boolean(courseFromUrl)));
    el("course-lock-note").hidden = !courseFromUrl;
  }

  function updateResultsAccess(unlocked) {
    if (!el("results-content")) return;
    el("results-content").hidden = !unlocked;
    el("submission-panel").hidden = unlocked;
    el("results-heading").textContent = unlocked ? "Your helping professions exploration list" : "One last step";
    el("results-intro").textContent = unlocked
      ? "Use this as a starting point—not a final decision. Notice what repeats, then investigate the careers and experiences that stand out."
      : "Add any optional context below. Your patterns and exploration list will appear after you submit.";
  }

  function updateSubmissionGate() {
    const unlocked = Boolean(state.submittedFingerprint) && state.submittedFingerprint === currentFingerprint();
    document.body.classList.toggle("print-unlocked", unlocked);
    updateResultsAccess(unlocked);
  }

  function updateContext() {
    state.context = {
      major: el("student-major").value.trim(),
      usageContext: el("usage-context").value,
      courseGroup: el("course-group").value.trim()
    };
    invalidateSubmission();
    saveState();
  }

  function buildCopyText() {
    const selected = state.shortlist.map(id => cards.find(card => card.id === id)).filter(Boolean);
    const topNames = [...new Set(selected.map(card => category(card).label))];
    const lines = [
      "HELPING PROFESSIONS CARD SORT RESULTS",
      "",
      `Patterns I noticed: ${topNames.join("; ")}`,
      "",
      "CAREERS AND CHALLENGES I WANT TO EXPLORE"
    ];
    selected.forEach((card, i) => lines.push(
      "",
      `${i + 1}. ${card.prompt}`,
      `Pattern: ${category(card).label}`,
      `Careers to investigate: ${card.careers}`,
      `Strengths: ${card.strengths}`,
      `Common settings: ${card.settings}`,
      `Ways to try it out: ${experienceIdeas(card).join("; ")}`
    ));
    lines.push(
      "",
      "KEEP EXPLORING",
      "Helping & Counseling resources: https://careers.uiowa.edu/career-communities/helping-counseling",
      "Explore majors and careers: https://careers.uiowa.edu/explore",
      "Gain experience: https://careers.uiowa.edu/career-prep/gain-experience"
    );
    return lines.join("\n");
  }

  async function copyResults() {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      el("copy-status").textContent = "Copied! Paste your results wherever you need them.";
    } catch {
      const area = document.createElement("textarea");
      area.value = buildCopyText();
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      el("copy-status").textContent = "Copied! Paste your results wherever you need them.";
    }
  }

  function resetAll() {
    if (!confirm("Start over and clear all of your choices?")) return;
    state = defaultState();
    cards = orderedCards(state.order);
    currentFilter = "all";
    localStorage.removeItem(storageKey);
    showView("sort");
    renderSort();
  }

  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value || ""; return div.innerHTML; }
  function escapeAttr(value) { return escapeHtml(value).replaceAll('"', "&quot;"); }

  document.querySelectorAll(".decision").forEach(button => button.addEventListener("click", () => answer(button.dataset.choice)));
  el("back-card").addEventListener("click", () => { if (state.index > 0) { state.index -= 1; saveState(); renderSort(); } });
  el("review-sort").addEventListener("click", () => { state.index = 0; saveState(); showView("sort"); renderSort(); });
  el("filter-row").addEventListener("click", event => { const button = event.target.closest("[data-filter]"); if (!button) return; currentFilter = button.dataset.filter; renderPatterns(); });
  el("candidate-grid").addEventListener("click", event => {
    const detail = event.target.closest("[data-detail]");
    const select = event.target.closest("[data-select]");
    if (detail) openDetails(detail.dataset.detail);
    if (select) toggleShortlist(select.dataset.select);
  });
  el("close-dialog").addEventListener("click", () => el("detail-dialog").close());
  el("detail-dialog").addEventListener("click", event => { if (event.target === el("detail-dialog")) el("detail-dialog").close(); });
  el("build-results").addEventListener("click", () => {
    renderResults();
    showView("results");
  });
  el("edit-shortlist").addEventListener("click", () => { renderPatterns(); showView("patterns"); });
  el("copy-results").addEventListener("click", copyResults);
  el("print-results").addEventListener("click", () => window.print());
  el("response-form").addEventListener("submit", async event => {
    event.preventDefault();
    updateContext();
    await submitResponse();
  });
  ["student-major", "usage-context", "course-group"].forEach(id => {
    el(id).addEventListener("input", updateContext);
    el(id).addEventListener("change", updateContext);
  });
  ["reset-top", "reset-submit", "reset-bottom"].forEach(id => el(id).addEventListener("click", resetAll));
  document.addEventListener("keydown", event => {
    if (views.sort.hidden || event.altKey || event.ctrlKey || event.metaKey || ["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement.tagName)) return;
    if (event.key === "1") answer("not");
    if (event.key === "2") answer("maybe");
    if (event.key === "3") answer("interested");
  });

  if (state.index >= cards.length) { renderPatterns(); showView("patterns"); }
  else { showView("sort"); renderSort(); }
})();
