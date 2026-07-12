(function () {
  const number = new Intl.NumberFormat("en-US");

  function formatTokens(value) {
    if (value == null) return "not reported";
    return value >= 1000 ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k` : number.format(value);
  }

  function activityTitle(item) {
    return item.publicTitle || "Private activity";
  }

  function repoLabel(item) {
    return item.repoUrl ? item.repo : "private workspace";
  }

  function repoNode(item) {
    if (!item.repoUrl) {
      const text = document.createElement("span");
      text.textContent = "private workspace";
      return text;
    }

    const link = document.createElement("a");
    link.href = item.repoUrl;
    link.textContent = item.repo;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  }

  function stateMark(state) {
    const mark = document.createElement("span");
    mark.className = "ledger-state-mark";
    mark.dataset.state = state;
    mark.setAttribute("aria-hidden", "true");
    return mark;
  }

  function createFocus(agent, host) {
    const focus = document.createElement("section");
    focus.className = "ledger-focus";
    focus.setAttribute("aria-labelledby", "ledger-focus-title");

    const copy = document.createElement("div");
    copy.className = "ledger-focus-meta";

    const eyeline = document.createElement("p");
    eyeline.className = "ledger-eyeline";
    eyeline.append(stateMark(agent.state));
    eyeline.append(document.createTextNode(agent.stateLabel));

    const title = document.createElement("h2");
    title.id = "ledger-focus-title";
    title.textContent = activityTitle(agent);

    const line = document.createElement("p");
    line.className = "ledger-focus-line";
    line.append(repoNode(agent));
    if (agent.branch) {
      const branch = document.createElement("span");
      branch.textContent = `branch ${agent.branch}`;
      line.append(branch);
    }
    const runner = document.createElement("span");
    runner.textContent = `${agent.harness} / ${agent.model}`;
    line.append(runner);
    copy.append(eyeline, title, line);

    const stats = document.createElement("dl");
    stats.className = "ledger-focus-stats";
    const values = [
      ["elapsed", agent.elapsed],
      ["tokens", formatTokens(agent.tokens)],
      ["source", host ? `${host.label} / ${host.freshness}` : agent.host],
    ];
    values.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);
      stats.append(wrapper);
    });

    focus.append(copy, stats);
    return focus;
  }

  function createRoster(agents, selectedId, onSelect) {
    const section = document.createElement("section");
    section.className = "ledger-section";
    section.setAttribute("aria-labelledby", "ledger-roster-title");

    const head = document.createElement("header");
    head.className = "ledger-section-head";
    const title = document.createElement("h3");
    title.id = "ledger-roster-title";
    title.textContent = "Live roster";
    const total = document.createElement("p");
    const working = agents.filter((agent) => agent.state === "working").length;
    const waiting = agents.filter((agent) => agent.state === "waiting").length;
    total.textContent = `${working} working / ${waiting} waiting / ${agents.length} total`;
    head.append(title, total);

    const list = document.createElement("ol");
    list.className = "ledger-roster";
    agents.forEach((agent) => {
      const item = document.createElement("li");
      item.className = "ledger-roster-item";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ledger-roster-button";
      button.dataset.agentId = agent.id;
      button.setAttribute("aria-pressed", String(agent.id === selectedId));
      button.setAttribute("aria-label", `Show ${activityTitle(agent)}, ${agent.stateLabel}`);
      button.append(stateMark(agent.state));

      const copy = document.createElement("span");
      copy.className = "ledger-roster-copy";
      const runTitle = document.createElement("span");
      runTitle.className = "ledger-roster-title";
      runTitle.textContent = activityTitle(agent);
      const subline = document.createElement("span");
      subline.className = "ledger-roster-subline";
      subline.textContent = `${agent.stateLabel} / ${agent.harness}`;
      copy.append(runTitle, subline);

      const location = document.createElement("span");
      location.className = "ledger-roster-location";
      location.textContent = repoLabel(agent);
      const elapsed = document.createElement("span");
      elapsed.className = "ledger-roster-elapsed";
      elapsed.textContent = agent.elapsed;
      button.append(copy, location, elapsed);
      button.addEventListener("click", () => onSelect(agent.id));
      item.append(button);
      list.append(item);
    });

    section.append(head, list);
    return section;
  }

  function detailValue(label, value, href) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    if (href) {
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = value;
      description.append(link);
    } else {
      description.textContent = value;
    }
    wrapper.append(term, description);
    return wrapper;
  }

  function createRecent(recent) {
    const section = document.createElement("section");
    section.className = "ledger-section";
    section.setAttribute("aria-labelledby", "ledger-recent-title");

    const head = document.createElement("header");
    head.className = "ledger-section-head";
    const title = document.createElement("h3");
    title.id = "ledger-recent-title";
    title.textContent = "Recent runs";
    const total = document.createElement("p");
    total.textContent = `${recent.length} recorded today`;
    head.append(title, total);

    const wrap = document.createElement("div");
    wrap.className = "ledger-table-wrap";
    const table = document.createElement("table");
    table.className = "ledger-table";
    const caption = document.createElement("caption");
    caption.className = "sr-only";
    caption.textContent = "Recently completed and interrupted agent runs";
    const tableHead = document.createElement("thead");
    tableHead.innerHTML = "<tr><th scope=\"col\"><span class=\"sr-only\">Details</span></th><th scope=\"col\">Started</th><th scope=\"col\">Run</th><th scope=\"col\">Runtime</th><th scope=\"col\">Result</th></tr>";
    const body = document.createElement("tbody");

    recent.forEach((run) => {
      const row = document.createElement("tr");
      row.className = "ledger-run-row";
      const detailId = `ledger-details-${run.id}`;

      const toggleCell = document.createElement("td");
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ledger-expand";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", detailId);
      toggle.setAttribute("aria-label", `Show details for ${activityTitle(run)}`);
      toggle.title = "Show run details";
      const glyph = document.createElement("span");
      glyph.className = "ledger-expand-glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = "+";
      toggle.append(glyph);
      toggleCell.append(toggle);

      const time = document.createElement("td");
      time.className = "ledger-time";
      time.textContent = run.at;
      const runCell = document.createElement("td");
      const runTitle = document.createElement("span");
      runTitle.className = "ledger-run-title";
      runTitle.textContent = activityTitle(run);
      const subline = document.createElement("span");
      subline.className = "ledger-run-subline";
      subline.textContent = `${repoLabel(run)} / ${run.harness}`;
      runCell.append(runTitle, subline);
      const duration = document.createElement("td");
      duration.className = "ledger-duration";
      duration.textContent = run.duration;
      const outcome = document.createElement("td");
      outcome.className = "ledger-outcome";
      outcome.dataset.state = run.state;
      outcome.textContent = run.outcome;
      row.append(toggleCell, time, runCell, duration, outcome);

      const detailRow = document.createElement("tr");
      detailRow.className = "ledger-detail-row";
      detailRow.id = detailId;
      detailRow.hidden = true;
      const detailCell = document.createElement("td");
      detailCell.colSpan = 5;
      const details = document.createElement("dl");
      details.className = "ledger-detail-grid";
      details.append(
        detailValue("repository", repoLabel(run), run.repoUrl),
        detailValue("branch", run.branch || "not published"),
        detailValue("agent", `${run.harness} / ${run.model}`),
        detailValue("output", run.filesChanged == null ? "not published" : `${run.filesChanged} files / ${run.commits} commits / ${formatTokens(run.tokens)} tokens`),
      );
      detailCell.append(details);
      detailRow.append(detailCell);

      toggle.addEventListener("click", () => {
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.setAttribute("aria-label", `${expanded ? "Show" : "Hide"} details for ${activityTitle(run)}`);
        toggle.title = expanded ? "Show run details" : "Hide run details";
        detailRow.hidden = expanded;
      });

      body.append(row, detailRow);
    });

    table.append(caption, tableHead, body);
    wrap.append(table);
    section.append(head, wrap);
    return section;
  }

  window.mountNowMock(
    {
      id: "live-ledger",
      short: "ledger",
      label: "Live ledger",
      title: "Live ledger",
      subtitle: "A roster first, with each run on the record",
    },
    function render(root, data) {
      const ledger = document.createElement("div");
      ledger.className = "ledger";
      let selectedId = (data.agents.find((agent) => agent.focused) || data.agents[0]).id;

      function paint() {
        const selected = data.agents.find((agent) => agent.id === selectedId) || data.agents[0];
        const host = data.hosts.find((item) => item.id === selected.host);
        ledger.replaceChildren(
          createFocus(selected, host),
          createRoster(data.agents, selectedId, (id) => {
            selectedId = id;
            paint();
            const selectedButton = ledger.querySelector(`[data-agent-id="${id}"]`);
            if (selectedButton) selectedButton.focus();
          }),
          createRecent(data.recent),
        );
      }

      paint();
      root.append(ledger);
    },
  );
})();
