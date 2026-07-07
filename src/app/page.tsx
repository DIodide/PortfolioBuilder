// Proof-of-concept dump of everything the content parsers surface.
// Deliberately unstyled — parsing shape and real UI come later.
import {
  getCertifications,
  getCoursework,
  getProjects,
  getSocials,
  getUser,
  getWork,
  type ContentDoc,
} from "@/lib/content";

function Doc({ title, doc }: { title: string; doc: ContentDoc | null }) {
  if (!doc) return <p>({title}: missing)</p>;
  return (
    <section>
      <h2>
        {title} <small>({doc.path})</small>
      </h2>
      <pre>{JSON.stringify(doc.frontmatter, null, 2)}</pre>
      <pre>{doc.body}</pre>
      <hr />
    </section>
  );
}

export default function Home() {
  const projects = getProjects();
  return (
    <main>
      <h1>PortfolioBuilder — content pipeline proof of concept</h1>
      <Doc title="User" doc={getUser()} />
      <Doc title="Socials" doc={getSocials()} />
      <Doc title="Work" doc={getWork()} />
      <Doc title="Coursework" doc={getCoursework()} />
      <Doc title="Certifications" doc={getCertifications()} />
      <h2>Projects ({projects.length})</h2>
      {projects.map((p) => (
        <section key={p.dir}>
          <h3>{p.dir}</h3>
          <pre>{JSON.stringify(p.frontmatter, null, 2)}</pre>
          <pre>{p.body}</pre>
          {p.images.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt={src} width={320} />
          ))}
          <hr />
        </section>
      ))}
    </main>
  );
}
