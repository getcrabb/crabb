import type { ScanResult, ShareResponse } from '../types/index.js';
import { buildSharePayload } from '../output/json.js';

const SHARE_API_URL = 'https://crabb.ai/api/share';

export async function shareResult(result: ScanResult): Promise<ShareResponse> {
  const payload = buildSharePayload(result);

  const response = await fetch(SHARE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to share result: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<ShareResponse>;
}

export async function shareResultMock(result: ScanResult): Promise<ShareResponse> {
  const payload = buildSharePayload(result);

  const mockId = `mock-${Date.now().toString(36)}`;

  return {
    id: mockId,
    url: `https://crabb.ai/score/${mockId}`,
    deleteToken: `delete-${mockId}`,
  };
}
