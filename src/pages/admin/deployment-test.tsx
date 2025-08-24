import { DeploymentDiagnostics } from '@/components/admin/DeploymentDiagnostics';
import { DeploymentTestPanel } from '@/components/admin/DeploymentTestPanel';

export default function DeploymentTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Deployment Testing</h1>
        <p className="text-muted-foreground mb-8">
          Use this page to test Supabase Edge Functions deployment and verify the system is working correctly.
        </p>
        <DeploymentTestPanel />
        <DeploymentDiagnostics />
      </div>
    </div>
  );
}