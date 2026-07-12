(function () {
  const stateNames = {
    finished: "finished",
    working: "working now",
    waiting: "waiting for input",
    interrupted: "interrupted",
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function overlapFocus(run, focus) {
    const runEnd = run.start + run.width;
    const focusEnd = focus.start + focus.width;
    return Math.max(0, Math.min(runEnd, focusEnd) - Math.max(run.start, focus.start));
  }

  function flattenedRuns(data) {
    return data.score
      .flatMap((lane) =>
        lane.runs.map((run) => ({
          ...run,
          laneLabel: lane.label,
          repo: lane.repo,
          focused: lane.focus.reduce((total, focus) => total + overlapFocus(run, focus), 0),
        })),
      )
      .sort((a, b) => a.start - b.start);
  }

  function detailFor(run, data) {
    const agent = data.agents.find((item) => item.id === run.id);
    const recent = data.recent.find((item) => item.id === run.id);
    return {
      branch: agent?.branch || recent?.branch || "recorded",
      harness: run.harness,
      state: stateNames[run.state] || run.state,
      tokens: agent?.tokens || recent?.tokens || null,
      files: agent?.filesChanged ?? recent?.filesChanged ?? null,
    };
  }

  function timelineMarkup(data) {
    return data.score
      .map(
        (lane) => `
          <section class="score-lane" aria-labelledby="lane-${escapeHtml(lane.id)}">
            <div class="lane-label">
              <strong id="lane-${escapeHtml(lane.id)}">${escapeHtml(lane.label)}</strong>
              <span>${escapeHtml(lane.repo)}</span>
            </div>
            <div class="lane-field">
              <div class="run-track">
                ${lane.runs
                  .map(
                    (run) => `
                      <button
                        class="run-block ${escapeHtml(run.state)}"
                        style="--start:${run.start}%;--width:${run.width}%"
                        type="button"
                        data-run-id="${escapeHtml(run.id)}"
                        aria-pressed="false"
                        aria-label="${escapeHtml(`${lane.label}, ${run.label}, ${run.time}, ${stateNames[run.state] || run.state}`)}"
                        title="${escapeHtml(`${run.label} / ${run.time}`)}"
                      ><span aria-hidden="true">${run.width >= 8 ? escapeHtml(run.label) : ""}</span></button>
                    `,
                  )
                  .join("")}
              </div>
              <div class="focus-track" aria-label="User focus intervals">
                ${lane.focus
                  .map(
                    (focus) => `<span class="focus-span" style="--start:${focus.start}%;--width:${focus.width}%" aria-hidden="true"></span>`,
                  )
                  .join("")}
              </div>
              <span class="score-now-line" aria-hidden="true"></span>
            </div>
          </section>
        `,
      )
      .join("");
  }

  function mobileMarkup(runs, data) {
    return runs
      .map((run) => {
        const detail = detailFor(run, data);
        const focusMinutes = Math.round(run.focused * 5.64);
        const focusLabel = focusMinutes > 0 ? `${focusMinutes}m focus` : "";
        return `
          <li>
            <button
              class="mobile-run-button"
              type="button"
              data-mobile-run="${escapeHtml(run.id)}"
              aria-expanded="false"
              aria-controls="mobile-detail-${escapeHtml(run.id)}"
            >
              <span class="mobile-run-time">${escapeHtml(run.time.split("-")[0])}</span>
              <span class="mobile-state-mark ${escapeHtml(run.state)}" aria-hidden="true"></span>
              <span class="mobile-run-copy">
                <strong>${escapeHtml(run.label)}</strong>
                <span>${escapeHtml(run.laneLabel)} / ${escapeHtml(detail.state)}</span>
              </span>
              <span class="mobile-focus-mark">${escapeHtml(focusLabel)}</span>
            </button>
            <div class="mobile-run-detail" id="mobile-detail-${escapeHtml(run.id)}">
              <span>window<strong>${escapeHtml(run.time)}</strong></span>
              <span>runner<strong>${escapeHtml(detail.harness)}</strong></span>
              <span>tokens<strong>${detail.tokens ? escapeHtml(detail.tokens.toLocaleString()) : "not reported"}</strong></span>
            </div>
          </li>
        `;
      })
      .join("");
  }

  function readoutMarkup(run, data) {
    const detail = detailFor(run, data);
    const tokenLabel = detail.tokens ? detail.tokens.toLocaleString() : "not reported";
    const fileLabel = detail.files === null ? "not reported" : String(detail.files);
    return `
      <div class="readout-title">
        <strong>${escapeHtml(run.label)}</strong>
        <span>${escapeHtml(run.laneLabel)} / ${escapeHtml(run.repo)}</span>
      </div>
      <dl class="readout-stat"><dt>window</dt><dd>${escapeHtml(run.time)}</dd></dl>
      <dl class="readout-stat"><dt>state</dt><dd class="state-${escapeHtml(run.state)}">${escapeHtml(detail.state)}</dd></dl>
      <dl class="readout-stat"><dt>runner</dt><dd>${escapeHtml(detail.harness)}</dd></dl>
      <dl class="readout-stat"><dt>output</dt><dd>${escapeHtml(`${tokenLabel} tok / ${fileLabel} files`)}</dd></dl>
    `;
  }

  function render(root, data) {
    const runs = flattenedRuns(data);
    root.innerHTML = `
      <div class="day-score">
        <header class="score-heading">
          <h2><span>24H</span> DAY SCORE</h2>
          <p class="score-totals">
            <span><strong>${data.summary.runs24h}</strong> runs</span>
            <span><strong>${data.summary.focusMinutes}</strong>m focus</span>
            <span class="is-active"><strong>${data.summary.active}</strong> live</span>
          </p>
        </header>
        <div class="score-legend" aria-label="Timeline legend">
          <span class="score-key">finished</span>
          <span class="score-key working">working</span>
          <span class="score-key waiting">waiting</span>
          <span class="score-key interrupted">interrupted</span>
          <span class="score-key focus">user focus</span>
        </div>
        <div class="score-desktop">
          <div class="score-axis" aria-hidden="true">
            <span class="score-axis-label">workspace / shared clock</span>
            <div class="clock-axis">
              <span style="--at:0%">06</span>
              <span style="--at:20%">08</span>
              <span style="--at:40%">10</span>
              <span style="--at:60%">12</span>
              <span style="--at:80%">14</span>
              <span style="--at:100%">15:24</span>
            </div>
          </div>
          ${timelineMarkup(data)}
        </div>
        <section class="score-readout" aria-label="Selected run" aria-live="polite"></section>
        <section class="score-mobile" aria-label="Runs in chronological order">
          <h3 class="mobile-day-heading"><span>today / chronological</span><span>focus observed</span></h3>
          <ol class="mobile-run-list">${mobileMarkup(runs, data)}</ol>
        </section>
      </div>
    `;

    const readout = root.querySelector(".score-readout");
    const desktopButtons = Array.from(root.querySelectorAll(".run-block"));

    function selectRun(id, moveFocus) {
      const run = runs.find((item) => item.id === id);
      if (!run) return;
      desktopButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.runId === id));
      });
      readout.innerHTML = readoutMarkup(run, data);
      if (moveFocus) {
        root.querySelector(`[data-run-id="${CSS.escape(id)}"]`)?.focus();
      }
    }

    desktopButtons.forEach((button, index) => {
      button.addEventListener("click", () => selectRun(button.dataset.runId, false));
      button.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % desktopButtons.length;
        if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + desktopButtons.length) % desktopButtons.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = desktopButtons.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        selectRun(desktopButtons[nextIndex].dataset.runId, true);
      });
    });

    root.querySelectorAll("[data-mobile-run]").forEach((button) => {
      button.addEventListener("click", () => {
        const isOpen = button.getAttribute("aria-expanded") === "true";
        root.querySelectorAll("[data-mobile-run]").forEach((item) => item.setAttribute("aria-expanded", "false"));
        root.querySelectorAll(".mobile-run-detail").forEach((item) => item.classList.remove("is-open"));
        if (!isOpen) {
          button.setAttribute("aria-expanded", "true");
          document.getElementById(button.getAttribute("aria-controls"))?.classList.add("is-open");
        }
      });
    });

    const preferred = runs.find((run) => run.state === "working") || runs.at(-1);
    selectRun(preferred.id, false);
  }

  window.mountNowMock(
    {
      id: "day-score",
      short: "score",
      label: "Day score",
      title: "24-hour day score",
      subtitle: "agent runs and your focus on one shared clock",
    },
    render,
  );
})();
