import { mainnet, polygonAmoy, sepolia, type AppKitNetwork } from '@reown/appkit/networks';

export const connectionNetworks = [mainnet, sepolia, polygonAmoy] as [
  AppKitNetwork,
  ...AppKitNetwork[],
];

export const defaultNetwork = mainnet;

export const testActionChains = [sepolia, polygonAmoy] as [AppKitNetwork, ...AppKitNetwork[]];

export const supportedChains = connectionNetworks;

export type SupportedChainId = (typeof supportedChains)[number]['id'];
export type TestActionChainId = (typeof testActionChains)[number]['id'];

export const tokenExamples: Record<
  TestActionChainId,
  Array<{ symbol: string; address: `0x${string}`; decimals: number }>
> = {
  [sepolia.id]: [],
  [polygonAmoy.id]: [],
};

export function getChainName(chainId?: number) {
  return supportedChains.find((chain) => chain.id === chainId)?.name ?? 'Unknown';
}

export function isTestActionChain(chainId?: number) {
  return testActionChains.some((chain) => chain.id === chainId);
}
