import CertExplorer from "@/components/CertExplorer";
import { getCertProviders } from "@/lib/content";

export const metadata = {
  title: "certifications — Ibraheem Amin",
};

export default function Certifications() {
  const providers = getCertProviders();

  return (
    <div className="stack grow" data-acc="cert">
      <CertExplorer providers={providers} />
    </div>
  );
}
