import type { PoolData } from '../types';
import type { StudioVariantId } from '../components/studio/studioRegistry';
import { isPoolMetricVariant, isProtocolVariant, variantById } from '../components/studio/studioRegistry';

export function buildStudioFilename(
  variantId: StudioVariantId,
  pools?: PoolData[],
  protocolSlug?: string,
): string {
  const variant = variantById(variantId);

  if (isProtocolVariant(variantId)) {
    return `onchain-${variant.exportPrefix}-${protocolSlug ?? 'protocol'}.png`;
  }

  if (isPoolMetricVariant(variantId)) {
    return `onchain-${variant.exportPrefix}.png`;
  }

  const slug = pools?.map((p) => p.stablecoin ?? p.id).join('-') || 'post';
  return `onchain-${variant.exportPrefix}-${slug}.png`;
}

/** @deprecated Use buildStudioFilename with variantId */
export function buildStudioFilenameLegacy(pools: PoolData[], templateId: string): string {
  return buildStudioFilename(templateId as StudioVariantId, pools);
}
