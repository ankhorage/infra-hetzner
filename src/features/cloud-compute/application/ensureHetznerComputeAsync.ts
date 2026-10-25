import type {
  InfraComputeSelection,
  InfraComputeSnapshot,
  InfraExecutionContext,
  InfraResult,
} from '@ankhorage/contracts/infra';

import type { HetznerCloudApi, HetznerHostKeyProbe } from '../../../types/hetznerCompute.js';
import { createHetznerComputeSnapshotAsync } from './createHetznerComputeSnapshotAsync.js';
import { projectHetznerCompute } from './projectHetznerCompute.js';
import { resolveHetznerCredentialsAsync } from './resolveHetznerCredentialsAsync.js';

/** Reconcile owned Cloud resources and return one verified portable SSH target. */
export async function ensureHetznerComputeAsync(
  api: HetznerCloudApi,
  hostKeyProbe: HetznerHostKeyProbe,
  context: InfraExecutionContext,
  selection: InfraComputeSelection<'hetzner'>,
): Promise<InfraResult<InfraComputeSnapshot>> {
  const credentials = await resolveHetznerCredentialsAsync(context, selection);
  if (!credentials.ok) return credentials;
  const desired = projectHetznerCompute(context, selection, credentials.value.sshPublicKey);
  const reconciled = await api.reconcileAsync(credentials.value.token, desired, context.signal);
  if (!reconciled.ok) return reconciled;
  const snapshot = await createHetznerComputeSnapshotAsync(
    hostKeyProbe,
    desired,
    credentials.value.sshReference,
    reconciled.value,
    context.signal,
  );
  return snapshot.ok && snapshot.value.targets.length === 0 ? unavailableServer() : snapshot;
}

function unavailableServer(): InfraResult<never> {
  return {
    ok: false,
    diagnostics: [
      {
        severity: 'error',
        code: 'hetzner-server-unavailable',
        message: 'The Hetzner server is not ready with a public IPv4 address.',
      },
    ],
  };
}
