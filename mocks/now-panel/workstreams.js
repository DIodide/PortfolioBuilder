(function () {
  function formatMinutes(value) {
    if (value < 60) return `${value}m`;
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return `${hours}h${String(minutes).padStart(2, "0")}m`;
  }

  function isPrivate(stream) {
    return !stream.repoUrl;
  }

  function agentsForStream(stream, agents) {
    return agents.filter((agent) => {
      if (isPrivate(stream)) return !agent.repoUrl;
      return agent.repo === stream.repo;
    });
  }

  function historyForStream(stream, recent) {
    return recent.filter((run) => {
      if (isPrivate(stream)) return !run.repoUrl;
      return run.repo === stream.repo;
    });
  }

  function summaryMetric(label, value) {
    const wrapper = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    wrapper.append(term, description);
    return wrapper;
  }

  function createSummary(data) {
    const streams = data.workstreams;
    const summary = document.createElement("dl");
    summary.className = "streams-summary";
    const totalMinutes = streams.reduce((sum, stream) => sum + stream.agentMinutes, 0);
    const focusMinutes = streams.reduce((sum, stream) => sum + stream.focusMinutes, 0);
    summary.append(
      summaryMetric("workspaces", String(streams.length)),
      summaryMetric("live agents", String(streams.reduce((sum, stream) => sum + stream.activeAgents, 0))),
      summaryMetric("runs today", String(streams.reduce((sum, stream) => sum + stream.runs, 0))),
      summaryMetric("agent time", formatMinutes(totalMinutes)),
      summaryMetric("user focus", formatMinutes(focusMinutes)),
    );
    return summary;
  }

  function createIdentity(stream) {
    const identity = document.createElement("div");
    identity.className = "stream-identity";
    const state = document.createElement("span");
    state.className = "stream-state";
    state.dataset.state = stream.state;
    state.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div");
    copy.className = "stream-copy";

    let repo;
    if (isPrivate(stream)) {
      repo = document.createElement("span");
      repo.textContent = "Private workspace";
    } else {
      repo = document.createElement("a");
      repo.href = stream.repoUrl;
      repo.target = "_blank";
      repo.rel = "noreferrer";
      repo.textContent = stream.repo;
    }
    repo.className = "stream-repo";

    const title = document.createElement("span");
    title.className = `stream-title${isPrivate(stream) ? " stream-private-label" : ""}`;
    title.textContent = isPrivate(stream)
      ? "Activity details not published"
      : `${stream.publicTitle} / ${stream.branch}`;
    copy.append(repo, title);
    identity.append(state, copy);
    return identity;
  }

  function createAgents(stream, agents) {
    const group = document.createElement("div");
    group.className = "stream-agents";
    const live = agentsForStream(stream, agents);
    if (!live.length) {
      const empty = document.createElement("span");
      empty.className = "stream-agent stream-agent-empty";
      empty.textContent = "no live agent";
      group.append(empty);
      return group;
    }

    live.forEach((agent) => {
      const line = document.createElement("span");
      line.className = "stream-agent";
      line.dataset.state = agent.state;
      line.textContent = isPrivate(stream)
        ? `private agent / ${agent.stateLabel}`
        : `${agent.harness} / ${agent.stateLabel} / ${agent.elapsed}`;
      group.append(line);
    });
    return group;
  }

  function createMetrics(stream) {
    const metrics = document.createElement("dl");
    metrics.className = "stream-metrics";
    const items = [
      ["runs", String(stream.runs)],
      ["agent / focus", `${stream.agentMinutes}m / ${stream.focusMinutes}m`],
      ["output", isPrivate(stream) ? "redacted" : stream.output],
    ];
    items.forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      wrapper.append(term, description);
      metrics.append(wrapper);
    });
    return metrics;
  }

  function createTimeline(stream) {
    const timeline = document.createElement("div");
    timeline.className = "stream-timeline";
    const label = document.createElement("span");
    label.className = "stream-timeline-label";
    label.textContent = "08:00 - now";
    const track = document.createElement("div");
    track.className = "stream-track";
    track.setAttribute("aria-label", `${stream.runs} runs across the current day`);
    stream.timeline.forEach((run, index) => {
      const mark = document.createElement("span");
      mark.className = "stream-run-mark";
      mark.dataset.state = run.state;
      mark.style.left = `${run.start}%`;
      mark.style.width = `${run.width}%`;
      mark.title = `Run ${index + 1}: ${run.state}`;
      const accessible = document.createElement("span");
      accessible.className = "sr-only";
      accessible.textContent = `Run ${index + 1}, ${run.state}`;
      mark.append(accessible);
      track.append(mark);
    });
    timeline.append(label, track);
    return timeline;
  }

  function createHistory(stream, recent) {
    const history = document.createElement("div");
    history.className = "stream-history";
    history.id = `stream-history-${stream.id}`;
    history.hidden = true;
    const runs = historyForStream(stream, recent);

    if (!runs.length) {
      const empty = document.createElement("p");
      empty.className = "stream-history-empty";
      empty.textContent = "No recorded runs in this window.";
      history.append(empty);
      return history;
    }

    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.className = "sr-only";
    caption.textContent = `${isPrivate(stream) ? "Private workspace" : stream.repo} run history`;
    const head = document.createElement("thead");
    head.innerHTML = "<tr><th scope=\"col\">Time</th><th scope=\"col\">Run</th><th scope=\"col\">Runtime</th><th scope=\"col\">Result</th></tr>";
    const body = document.createElement("tbody");
    runs.forEach((run) => {
      const row = document.createElement("tr");
      const time = document.createElement("td");
      time.textContent = run.at;
      const title = document.createElement("td");
      title.textContent = isPrivate(stream) ? "Private activity" : run.publicTitle;
      const duration = document.createElement("td");
      duration.textContent = run.duration;
      const outcome = document.createElement("td");
      outcome.dataset.state = run.state;
      outcome.textContent = run.outcome;
      row.append(time, title, duration, outcome);
      body.append(row);
    });
    table.append(caption, head, body);
    history.append(table);
    return history;
  }

  function createStream(stream, data) {
    const item = document.createElement("li");
    const section = document.createElement("section");
    section.className = "stream";
    section.setAttribute("aria-label", isPrivate(stream) ? "Private workspace" : stream.repo);
    const main = document.createElement("div");
    main.className = "stream-main";
    const history = createHistory(stream, data.recent);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "stream-history-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", history.id);
    toggle.title = "Show run history";
    const glyph = document.createElement("span");
    glyph.className = "stream-history-toggle-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = "+";
    const label = document.createElement("span");
    label.textContent = "history";
    toggle.append(glyph, label);
    toggle.addEventListener("click", () => {
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      toggle.title = expanded ? "Show run history" : "Hide run history";
      label.textContent = expanded ? "history" : "close";
      history.hidden = expanded;
    });

    main.append(
      createIdentity(stream),
      createAgents(stream, data.agents),
      createMetrics(stream),
      toggle,
    );
    section.append(main, createTimeline(stream), history);
    item.append(section);
    return item;
  }

  window.mountNowMock(
    {
      id: "workstreams",
      short: "streams",
      label: "Project workstreams",
      title: "Project workstreams",
      subtitle: "Today grouped by repository and private workspace",
    },
    function render(root, data) {
      const streams = document.createElement("div");
      streams.className = "streams";
      streams.append(createSummary(data));
      const list = document.createElement("ol");
      list.className = "stream-list";
      data.workstreams.forEach((stream) => list.append(createStream(stream, data)));
      streams.append(list);
      root.append(streams);
    },
  );
})();
