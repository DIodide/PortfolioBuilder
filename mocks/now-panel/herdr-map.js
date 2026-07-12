(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function groupAgents(data) {
    return data.hosts.map((host) => {
      const hostAgents = data.agents.filter((agent) => agent.host === host.id);
      const workspaceMap = new Map();

      hostAgents.forEach((agent) => {
        if (!workspaceMap.has(agent.workspace)) workspaceMap.set(agent.workspace, new Map());
        const tabMap = workspaceMap.get(agent.workspace);
        if (!tabMap.has(agent.tab)) tabMap.set(agent.tab, []);
        tabMap.get(agent.tab).push(agent);
      });

      return {
        ...host,
        agents: hostAgents,
        workspaces: Array.from(workspaceMap, ([name, tabs]) => ({
          name,
          tabs: Array.from(tabs, ([name, agents]) => ({ name, agents })),
        })),
      };
    });
  }

  function agentLabel(agent) {
    return agent.publicTitle || "Private activity";
  }

  function hostMarkup(host) {
    const workspaces = host.workspaces
      .map(
        (workspace) => `
          <li class="tree-node">
            <div class="workspace-row">
              <span class="node-type">ws</span>
              <strong>${escapeHtml(workspace.name)}</strong>
              <small>${workspace.tabs.length} tab${workspace.tabs.length === 1 ? "" : "s"}</small>
            </div>
            <ul class="tree-branch">
              ${workspace.tabs
                .map(
                  (tab) => `
                    <li class="tree-node">
                      <div class="tab-row">
                        <span class="node-type">tab</span>
                        <span>${escapeHtml(tab.name)}</span>
                        <small>named</small>
                      </div>
                      <ul class="tree-branch">
                        ${tab.agents
                          .map(
                            (agent) => `
                              <li class="tree-node agent-node">
                                <button
                                  class="agent-select"
                                  type="button"
                                  data-agent-id="${escapeHtml(agent.id)}"
                                  aria-pressed="false"
                                  aria-label="${escapeHtml(`${agentLabel(agent)}, ${agent.stateLabel}, ${agent.elapsed}`)}"
                                >
                                  <span class="agent-state ${escapeHtml(agent.state)}" aria-hidden="true"></span>
                                  <span class="agent-copy">
                                    <strong>${escapeHtml(agentLabel(agent))}</strong>
                                    <span>${escapeHtml(`${agent.harness} / ${agent.model}`)}</span>
                                  </span>
                                  <span class="agent-elapsed">${escapeHtml(agent.elapsed)}</span>
                                </button>
                              </li>
                            `,
                          )
                          .join("")}
                      </ul>
                    </li>
                  `,
                )
                .join("")}
            </ul>
          </li>
        `,
      )
      .join("");

    return `
      <li class="host-item ${escapeHtml(host.state)}">
        <div class="host-row">
          <span class="host-indicator" aria-hidden="true"></span>
          <strong>${escapeHtml(host.label)}</strong>
          <span class="host-health"><b>${escapeHtml(host.state)}</b> / seen ${escapeHtml(host.freshness)} ago</span>
        </div>
        ${
          workspaces
            ? `<ul class="tree-branch">${workspaces}</ul>`
            : `<p class="empty-host">no current agents / collector heartbeat only</p>`
        }
      </li>
    `;
  }

  function repoMarkup(agent) {
    if (!agent.repoUrl) return escapeHtml(agent.repo);
    return `<a href="${escapeHtml(agent.repoUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(agent.repo)}</a>`;
  }

  function eventTrail(agent) {
    const events = [
      {
        time: "now",
        title: agent.stateLabel,
        detail: `heartbeat from ${agent.host} / ${agent.elapsed} elapsed`,
      },
    ];

    if (agent.focused) {
      events.push({ time: "recent", title: "user focus observed", detail: "focus interval 14:58-15:16" });
    }
    if (agent.filesChanged !== null) {
      events.push({
        time: "latest",
        title: `${agent.filesChanged} file${agent.filesChanged === 1 ? "" : "s"} changed`,
        detail: `${agent.additions} additions / ${agent.deletions} deletions`,
      });
    }
    events.push({
      time: agent.started,
      title: "run registered",
      detail: `${agent.harness} / ${agent.model} / ${agent.id}`,
    });

    return events
      .map(
        (event) => `
          <li>
            <time>${escapeHtml(event.time)}</time>
            <p>${escapeHtml(event.title)}<span>${escapeHtml(event.detail)}</span></p>
          </li>
        `,
      )
      .join("");
  }

  function inspectorMarkup(agent) {
    const titleSource = agent.titleSource ? "explicit public metadata" : "private by default";
    const branch = agent.branch || "not exposed";
    const fileCount = agent.filesChanged === null ? "not reported" : agent.filesChanged.toLocaleString();
    return `
      <div class="inspector-head">
        <h3>selected agent</h3>
        <span class="inspector-status ${escapeHtml(agent.state)}">${escapeHtml(agent.stateLabel)}</span>
      </div>
      <h4 class="inspect-title">${escapeHtml(agentLabel(agent))}</h4>
      <p class="inspect-path">
        ${escapeHtml(agent.host)} <span>/</span> ${escapeHtml(agent.workspace)} <span>/</span> ${escapeHtml(agent.tab)}
      </p>
      <dl class="inspect-metrics">
        <div><dt>elapsed</dt><dd>${escapeHtml(agent.elapsed)}</dd></div>
        <div><dt>tokens</dt><dd>${escapeHtml(agent.tokens.toLocaleString())}</dd></div>
        <div><dt>files</dt><dd>${escapeHtml(fileCount)}</dd></div>
      </dl>
      <dl class="inspect-meta">
        <dt>runner</dt><dd>${escapeHtml(`${agent.harness} / ${agent.model}`)}</dd>
        <dt>repository</dt><dd>${repoMarkup(agent)}</dd>
        <dt>branch</dt><dd>${escapeHtml(branch)}${agent.worktree ? " / worktree" : ""}</dd>
        <dt>label</dt><dd>${escapeHtml(titleSource)}</dd>
        <dt>run id</dt><dd>${escapeHtml(agent.id)}</dd>
      </dl>
      <section class="event-section" aria-labelledby="event-heading-${escapeHtml(agent.id)}">
        <h4 id="event-heading-${escapeHtml(agent.id)}">event trail</h4>
        <ol class="event-trail">${eventTrail(agent)}</ol>
      </section>
    `;
  }

  function render(root, data) {
    const hosts = groupAgents(data);
    root.innerHTML = `
      <div class="herdr-map">
        <header class="map-heading">
          <h2><span>HERDR</span> MAP</h2>
          <p><span><strong>${data.agents.length}</strong> current agents</span><span>${data.hosts.length} hosts</span></p>
        </header>
        <div class="map-layout">
          <nav class="topology" aria-label="Current agent topology">
            <div class="topology-head">
              <h3>host / workspace / named tab / agent</h3>
            </div>
            <ul class="host-list">
              ${hosts.map(hostMarkup).join("")}
            </ul>
          </nav>
          <aside class="map-inspector" aria-live="polite" aria-label="Selected agent inspector"></aside>
        </div>
      </div>
    `;

    const inspector = root.querySelector(".map-inspector");
    const buttons = Array.from(root.querySelectorAll(".agent-select"));

    function selectAgent(id, moveFocus) {
      const agent = data.agents.find((item) => item.id === id);
      if (!agent) return;
      buttons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.agentId === id));
      });
      inspector.innerHTML = inspectorMarkup(agent);
      if (moveFocus) {
        root.querySelector(`[data-agent-id="${CSS.escape(id)}"]`)?.focus();
      }
    }

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => selectAgent(button.dataset.agentId, false));
      button.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = (index + 1) % buttons.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = buttons.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        selectAgent(buttons[nextIndex].dataset.agentId, true);
      });
    });

    const preferred = data.agents.find((agent) => agent.focused) || data.agents[0];
    selectAgent(preferred.id, false);
  }

  window.mountNowMock(
    {
      id: "herdr-map",
      short: "map",
      label: "Herdr map",
      title: "Current agent topology",
      subtitle: "host health, named tabs, and stable run identity",
    },
    render,
  );
})();
