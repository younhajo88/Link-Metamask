import { polygonAmoy, sepolia, type AppKitNetwork } from '@reown/appkit/networks';

export const supportedChains = [sepolia, polygonAmoy] as [AppKitNetwork, ...AppKitNetwork[]];

export type SupportedChainId = (typeof supportedChains)[number]['id'];

export const tokenExamples: Record<
  SupportedChainId,
  Array<{ symbol: string; address: `0x${string}`; decimals: number }>
> = {
  [sepolia.id]: [],
  [polygonAmoy.id]: [],
};

export function getChainName(chainId?: number) {
  return supportedChains.find((chain) => chain.id === chainId)?.name ?? 'Unknown';
}
