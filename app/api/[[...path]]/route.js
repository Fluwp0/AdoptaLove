import { getCloudflareContext } from '@opennextjs/cloudflare';
import { setRuntimeBindings } from '../../../backend/src/config/runtimeBindings';
import { handleSitesApiRequest } from '../../../backend/src/sites/fetchApi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handler(request) {
  if (process.env.DATABASE_DRIVER === 'd1' || process.env.STORAGE_DRIVER === 'r2') {
    setRuntimeBindings(getCloudflareContext().env);
  }
  return handleSitesApiRequest(request);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
