import CertExplorer from "@/components/CertExplorer";
import { getCertProviders } from "@/lib/content";


export default function CertificationsWorkspace() {
  const providers = getCertProviders();

  return (
    <div className="stack grow" data-acc="cert">
      <CertExplorer providers={providers} />
    </div>
  );
}
