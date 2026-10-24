import { createInfraAdapter, infraAdapterDescriptor } from '@ankhorage/infra-hetzner';

const adapter = createInfraAdapter();

console.log(infraAdapterDescriptor.id, adapter.descriptor.package);
