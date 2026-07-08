import CertificationsWorkspace from "./workspaces/CertificationsWorkspace";
import CourseworkWorkspace from "./workspaces/CourseworkWorkspace";
import DeckController from "./DeckController";
import HomeWorkspace from "./workspaces/HomeWorkspace";
import ProjectsWorkspace from "./workspaces/ProjectsWorkspace";
import WorkWorkspace from "./workspaces/WorkWorkspace";

// The snap deck: all five workspaces stack vertically inside the scrolling
// <main>; wheel/touch scrolling snaps between them while explicit navigation
// (digits, sidebar cells, window list, dot rail) jumps INSTANTLY — the tmux
// hard cut survives. Every route renders this same deck scrolled to its own
// section, so deep links, per-route metadata, and OG cards are unchanged.
export default function Deck({ initial }: { initial: string }) {
  return (
    <>
      <section className="ws-slide" id="ws-home" data-acc="home" aria-label="home workspace">
        <HomeWorkspace />
      </section>
      <section className="ws-slide" id="ws-work" data-acc="work" aria-label="work workspace">
        <WorkWorkspace />
      </section>
      <section className="ws-slide" id="ws-projects" data-acc="proj" aria-label="projects workspace">
        <ProjectsWorkspace />
      </section>
      <section className="ws-slide" id="ws-certifications" data-acc="cert" aria-label="certifications workspace">
        <CertificationsWorkspace />
      </section>
      <section className="ws-slide" id="ws-coursework" data-acc="course" aria-label="coursework workspace">
        <CourseworkWorkspace />
      </section>
      {initial !== "home" && (
        // parse-time alignment for deep links: runs before first paint so
        // /work never flashes the home section
        <script
          dangerouslySetInnerHTML={{
            __html: `document.getElementById("ws-${initial}").scrollIntoView({behavior:"instant",block:"start"})`,
          }}
        />
      )}
      <DeckController initial={initial} />
    </>
  );
}
