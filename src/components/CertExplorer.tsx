"use client";

import { useMemo, useState } from "react";
import Pane from "@/components/Pane";
import type { Cert, CertProvider } from "@/lib/content";

// Drill-down explorer for the certifications workspace: issuer panes on the
// left (every cert is a selectable row), a sticky openssl-style x509
// inspector + category histogram on the right. All strings come from the
// providers prop — nothing is invented here.

/** compact semester tag, e.g. "Spring 2023" -> "S23".
 *  (mirrors shortSemester in lib/content, which is server-only — it pulls in
 *  node:fs — so it can't be imported into this client component) */
const shortSem = (s: string) =>
  s
    .replace(/Fall\s+20(\d\d)/i, "F$1")
    .replace(/Spring\s+20(\d\d)/i, "S$1")
    .replace(/Summer\s+20(\d\d)/i, "Su$1");

/** plausible .crt filename for a cert, e.g. "IT Specialist - Java" -> "it-specialist-java" */
const fileSlug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** hostname of a verify link, e.g. "credly.com" */
const host = (url: string) =>
  url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");

const certKey = (slug: string, name: string) => `${slug}/${name}`;

const ROW_CSS = `
.cert-row { display: flex; align-items: baseline; gap: 10px; width: 100%; text-align: left; font-size: 12px; padding: 3px 8px; }
.cert-row:hover { background: color-mix(in srgb, var(--acc) 9%, transparent); }
.cert-row[aria-pressed="true"] { color: var(--acc); box-shadow: inset 2px 0 0 0 var(--acc); background: color-mix(in srgb, var(--acc) 7%, transparent); }
.cert-row .nm { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cert-row .sem { flex: none; font-size: 11px; }
`;

function CertList({
  provider,
  selectedKey,
  onSelect,
}: {
  provider: CertProvider;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {provider.certs.map((cert) => {
        const key = certKey(provider.slug, cert.name);
        const selected = key === selectedKey;
        return (
          <button
            key={cert.name}
            type="button"
            className="cert-row"
            aria-pressed={selected}
            onClick={() => onSelect(key)}
          >
            <span className="nm">{cert.name}</span>
            <span className={selected ? "sem" : "sem dim"}>
              {shortSem(cert.semester)}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IssuerPane({
  provider,
  selectedKey,
  onSelect,
  scrollList = false,
}: {
  provider: CertProvider;
  selectedKey: string;
  onSelect: (key: string) => void;
  scrollList?: boolean;
}) {
  const list = (
    <CertList provider={provider} selectedKey={selectedKey} onSelect={onSelect} />
  );
  return (
    <Pane
      cmd={`ls certs/${provider.slug}/`}
      sub={`· ${provider.count}`}
      label={`${provider.provider} certifications`}
    >
      <p
        className="meta"
        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {provider.logoUrl && (
          <img
            src={provider.logoUrl}
            alt={`${provider.provider} logo`}
            style={{
              width: 16,
              height: 16,
              objectFit: "contain",
              verticalAlign: "-4px",
              marginRight: 7,
              border: "1px solid var(--border-strong)",
              background: "var(--bg)",
            }}
          />
        )}
        {provider.provider.toLowerCase()}
      </p>
      {scrollList ? (
        <div style={{ maxHeight: 340, overflowY: "auto" }}>{list}</div>
      ) : (
        list
      )}
    </Pane>
  );
}

function Inspector({ provider, cert }: { provider: CertProvider; cert: Cert }) {
  return (
    <Pane
      cmd={`openssl x509 -in ${provider.slug}/${fileSlug(cert.name)}.crt -text`}
      label="certificate inspector"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <pre className="block" style={{ flex: "1 1 auto", minWidth: 0 }}>
          {`Certificate:
    Data:
        Version: 3 (0x2)
        Signature Algorithm: glths-it-diploma
        Issuer: O=${provider.provider}
        Subject: CN=Ibraheem Amin
        Validity
            Not Before: ${cert.semester}
            Not After : does not expire
        Category: ${cert.category}
    Authority Information Access:
        `}
          {cert.verifyUrl ? (
            <>
              {"Verify — "}
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="accent"
              >
                {host(cert.verifyUrl)} ↗
              </a>
            </>
          ) : (
            <span className="dim">Verification: no public credential link</span>
          )}
        </pre>
        {cert.logoUrl && (
          <img
            src={cert.logoUrl}
            alt={`${cert.name} badge`}
            style={{
              flex: "none",
              width: 72,
              height: 72,
              objectFit: "contain",
              border: "1px solid var(--border-strong)",
              background: "var(--bg)",
            }}
          />
        )}
      </div>
    </Pane>
  );
}

function ScanPane({ cert }: { cert: Cert }) {
  // real scan filename when one exists; plausible slug otherwise so the
  // notch command still reads like a genuine shell invocation
  const file = cert.scanUrl?.split("/").pop() ?? `${fileSlug(cert.name)}.png`;
  return (
    <Pane cmd={`open certificates/${file}`} label="certificate scan">
      {cert.scanUrl ? (
        // capped height so the sticky x509 → certificate → categories stack
        // stays within the viewport; the full scan scrolls inside the frame
        <div
          style={{
            maxHeight: "46vh",
            overflowY: "auto",
            border: "1px solid var(--border-strong)",
          }}
        >
          <img
            src={cert.scanUrl}
            alt={`${cert.name} certificate scan`}
            style={{ width: "100%", display: "block" }}
          />
        </div>
      ) : (
        <p className="dim" style={{ fontSize: 12 }}>
          open: no scan on file for this certificate
        </p>
      )}
    </Pane>
  );
}

export default function CertExplorer({ providers }: { providers: CertProvider[] }) {
  const entries = useMemo(
    () => providers.flatMap((p) => p.certs.map((cert) => ({ provider: p, cert }))),
    [providers],
  );

  const [selectedKey, setSelectedKey] = useState<string>(() => {
    const first = entries.find((e) => e.cert.verifyUrl) ?? entries[0];
    return first ? certKey(first.provider.slug, first.cert.name) : "";
  });
  const selected =
    entries.find((e) => certKey(e.provider.slug, e.cert.name) === selectedKey) ??
    entries[0];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { cert } of entries)
      counts.set(cert.category, (counts.get(cert.category) ?? 0) + 1);
    return [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );
  }, [entries]);
  const maxCount = categories.length ? categories[0][1] : 0;

  if (!providers.length || !selected) return null;

  const [head, ...rest] = providers;
  const rows: CertProvider[][] = [];
  for (let i = 0; i < rest.length; i += 3) rows.push(rest.slice(i, i + 3));

  return (
    <>
      <style>{ROW_CSS}</style>
      <div
        style={{
          // two-column split sharing the machine's 1px border lines;
          // auto-fit wraps it to a single column when narrow
          flex: "1 1 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 1,
          background: "var(--border)",
          alignItems: "stretch",
        }}
      >
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <IssuerPane
            provider={head}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            scrollList
          />
          {rows.map((row) => (
            <div
              key={row[0].slug}
              className="collage-row"
              style={{ flex: "1 0 auto" }}
            >
              {row.map((p) => (
                <IssuerPane
                  key={p.slug}
                  provider={p}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ minWidth: 0, background: "var(--bg)" }}>
          <div
            style={{
              // top: 8 (not 0) so the border-notch command title, which
              // protrudes above the pane, never clips at the scrollport edge
              position: "sticky",
              top: 8,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              background: "var(--border)",
            }}
          >
            <Inspector provider={selected.provider} cert={selected.cert} />
            <ScanPane cert={selected.cert} />
            <Pane cmd="cut -f3 certs.tsv | sort | uniq -c" label="categories">
              <pre className="block">
                {categories.map(([category, count]) => (
                  <span key={category}>
                    <span className="accent">
                      {"▇".repeat(count).padEnd(maxCount, " ")}
                    </span>{" "}
                    {String(count).padStart(2, " ")}{" "}
                    {category.toLowerCase()}
                    {"\n"}
                  </span>
                ))}
              </pre>
            </Pane>
          </div>
        </div>
      </div>
    </>
  );
}
