import type { ScanResult, ShareResponse, ShareSource, ShareTheme } from '../types/index.js';
import { buildSharePayload } from '../output/json.js';

const SHARE_API_URL = 'https://crabb.ai/api/share';

interface ShareOptions {
  source?: ShareSource;
  campaign?: string;
  theme?: ShareTheme;
}

export async function shareResult(result: ScanResult, options: ShareOptions = {}): Promise<ShareResponse> {
  const payload = buildSharePayload(result, options);

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

export async function shareResultMock(result: ScanResult, options: ShareOptions = {}): Promise<ShareResponse> {
  void buildSharePayload(result, options);

  const mockId = `mock-${Date.now().toString(36)}`;

  return {
    id: mockId,
    url: `https://crabb.ai/score/${mockId}`,
    deleteToken: `delete-${mockId}`,
  };
}
