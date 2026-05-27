import { QueryClient } from '@tanstack/react-query';
import { createConfig, http, injected, type Config } from 'wagmi';
import type { Chain } from 'wagmi/chains';
import { connectionNetworks, defaultNetwork } from './chains';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID as string | undefined;

export const isProjectIdConfigured =
  Boolean(projectId) && projectId !== 'replace-with-reown-project-id';

if (!isProjectIdConfigured) {
  console.warn('VITE_REOWN_PROJECT_ID is not configured. WalletConnect will not work.');
}

export const queryClient = new QueryClient();

const customRpcUrls = {
  ...(import.meta.env.VITE_SEPOLIA_RPC_URL
    ? { 'eip155:11155111': [{ url: import.meta.env.VITE_SEPOLIA_RPC_URL }] }
    : {}),
  ...(import.meta.env.VITE_POLYGON_AMOY_RPC_URL
    ? { 'eip155:80002': [{ url: import.meta.env.VITE_POLYGON_AMOY_RPC_URL }] }
    : {}),
};

const fallbackChains = connectionNetworks as unknown as [Chain, ...Chain[]];

async function createWagmiConfig(): Promise<Config> {
  if (!isProjectIdConfigured) {
    return createConfig({
      chains: fallbackChains,
      connectors: [injected({ target: 'metaMask' })],
      transports: {
        1: http(),
        11155111: http(import.meta.env.VITE_SEPOLIA_RPC_URL || undefined),
        80002: http(import.meta.env.VITE_POLYGON_AMOY_RPC_URL || undefined),
      },
    });
  }

  const [{ createAppKit }, { WagmiAdapter }] = await Promise.all([
    import('@reown/appkit/react'),
    import('@reown/appkit-adapter-wagmi'),
  ]);

  const wagmiAdapter = new WagmiAdapter({
    networks: connectionNetworks,
    projectId: projectId ?? '',
    customRpcUrls,
  });

  createAppKit({
    adapters: [wagmiAdapter],
    networks: connectionNetworks,
    defaultNetwork,
    projectId: projectId ?? '',
    metadata: {
      name: 'MetaMask Link Test',
      description: 'Desktop extension and mobile WalletConnect test page',
      url: window.location.origin,
      icons: [`${window.location.origin}/favicon.svg`],
    },
    features: {
      analytics: false,
      email: false,
      socials: [],
    },
  });

  return wagmiAdapter.wagmiConfig;
}

export const wagmiConfig = await createWagmiConfig();
