const NON_ALNUM_RE = /[^a-z0-9\s]/g;
const WHITESPACE_RE = /\s+/g;
const MAX_FETCH_BYTES = 8 * 1024 * 1024;
const MAX_CANDIDATE_URLS = 4;
const IMAGE_METADATA_AI_TERMS = [
  'openai',
  'chatgpt',
  'dall-e',
  'dall e',
  'midjourney',
  'stable diffusion',
  'stability ai',
  'comfyui',
  'automatic1111',
  'invokeai',
  'fooocus',
  'dalle',
  'flux',
  'generative ai',
  'generated with ai',
  'ai generated',
  'made with ai',
  'content credentials',
  'c2pa',
] as const;

type GalleryMediaLike = {
  url: string;
};

type PostLike = {
  url: string;
  gallery?: GalleryMediaLike[];
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(NON_ALNUM_RE, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

function decodeHtmlEntities(url: string): string {
  return url.replace(/&amp;/g, '&');
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isLikelyImageUrl(value: string): boolean {
  if (!isHttpUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();
    return (
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.gif') ||
      url.hostname.endsWith('redd.it') ||
      url.hostname.endsWith('redditmedia.com')
    );
  } catch {
    return false;
  }
}

function dedupeUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const url of urls) {
    if (seen.has(url)) {
      continue;
    }
    seen.add(url);
    deduped.push(url);
  }
  return deduped;
}

function collectGalleryUrls(gallery: GalleryMediaLike[] | undefined): string[] {
  if (!gallery?.length) {
    return [];
  }

  return gallery
    .map((media) => decodeHtmlEntities(media.url))
    .filter((url) => isLikelyImageUrl(url));
}

export function collectImageCandidateUrls(post: PostLike): string[] {
  const urls = [
    ...collectGalleryUrls(post.gallery),
    decodeHtmlEntities(post.url ?? ''),
  ].filter((url) => isLikelyImageUrl(url));

  return dedupeUrls(urls).slice(0, MAX_CANDIDATE_URLS);
}

export function isLikelyImagePost(post: PostLike): boolean {
  return collectImageCandidateUrls(post).length > 0;
}

async function fetchImageBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'bcollie-modbot image-metadata-review',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsed) && parsed > MAX_FETCH_BYTES) {
      throw new Error(`image exceeds max size limit of ${MAX_FETCH_BYTES} bytes`);
    }
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_FETCH_BYTES) {
    throw new Error(`image exceeds max size limit of ${MAX_FETCH_BYTES} bytes`);
  }

  return bytes;
}

function extractAsciiText(bytes: Uint8Array): string {
  let result = '';
  for (const value of bytes) {
    if (value >= 32 && value <= 126) {
      result += String.fromCharCode(value);
    } else {
      result += ' ';
    }
  }
  return normalizeText(result);
}

function hasPngParametersChunk(bytes: Uint8Array): boolean {
  const first = bytes[0];
  const second = bytes[1];
  const third = bytes[2];
  const fourth = bytes[3];
  if (
    bytes.byteLength < 8 ||
    first == null ||
    second == null ||
    third == null ||
    fourth == null ||
    first !== 0x89 ||
    second !== 0x50 ||
    third !== 0x4e ||
    fourth !== 0x47
  ) {
    return false;
  }

  for (let offset = 8; offset + 12 <= bytes.byteLength; ) {
    const b0 = bytes[offset];
    const b1 = bytes[offset + 1];
    const b2 = bytes[offset + 2];
    const b3 = bytes[offset + 3];
    const c0 = bytes[offset + 4];
    const c1 = bytes[offset + 5];
    const c2 = bytes[offset + 6];
    const c3 = bytes[offset + 7];

    if (
      b0 == null ||
      b1 == null ||
      b2 == null ||
      b3 == null ||
      c0 == null ||
      c1 == null ||
      c2 == null ||
      c3 == null
    ) {
      break;
    }

    const length =
      (b0 << 24) |
      (b1 << 16) |
      (b2 << 8) |
      b3;
    const chunkType = String.fromCharCode(c0, c1, c2, c3);

    if (length < 0 || offset + 12 + length > bytes.byteLength) {
      break;
    }

    if (chunkType === 'tEXt' || chunkType === 'iTXt' || chunkType === 'zTXt') {
      const chunkData = bytes.subarray(offset + 8, offset + 8 + length);
      const chunkText = extractAsciiText(chunkData);
      if (` ${chunkText} `.includes(' parameters ')) {
        return true;
      }
    }

    offset += length + 12;
  }

  return false;
}

export function analyzeImageMetadataBytes(imageBytes: Uint8Array): string[] {
  const findings: string[] = [];
  const combinedMetadata = extractAsciiText(imageBytes);
  const paddedMetadata = ` ${combinedMetadata} `;

  if (hasPngParametersChunk(imageBytes)) {
    findings.push('png_parameters_chunk');
  }

  for (const term of IMAGE_METADATA_AI_TERMS) {
    if (paddedMetadata.includes(` ${term} `)) {
      findings.push(`metadata_term:${term}`);
    }
  }

  if (
    paddedMetadata.includes(' c2pa ') ||
    paddedMetadata.includes(' content credentials ')
  ) {
    findings.push('c2pa_marker');
  }

  if (
    findings.includes('c2pa_marker') &&
    findings.some((item) => item.startsWith('metadata_term:'))
  ) {
    findings.push('c2pa_plus_ai_term');
  }

  return [...new Set(findings)];
}

function toSubstantiveFindings(findings: string[]): string[] {
  return findings.filter(
    (finding) =>
      finding === 'png_parameters_chunk' ||
      finding === 'c2pa_plus_ai_term' ||
      finding.startsWith('metadata_term:')
  );
}

export async function detectImageMetadataReviewReasons(
  post: PostLike
): Promise<string[]> {
  const urls = collectImageCandidateUrls(post);
  const reasons: string[] = [];

  for (const url of urls) {
    try {
      const imageBytes = await fetchImageBytes(url);
      const findings = analyzeImageMetadataBytes(imageBytes);
      const substantiveFindings = toSubstantiveFindings(findings);
      if (substantiveFindings.length > 0) {
        reasons.push(...substantiveFindings.slice(0, 4));
        break;
      }
    } catch (error) {
      console.log(`[image-metadata-review] skipped url=${url}`, error);
    }
  }

  return [...new Set(reasons)];
}
