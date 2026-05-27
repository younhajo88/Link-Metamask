import { parseEther, parseUnits } from 'viem';

export const erc20Abi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function prepareNativeTransfer(to: `0x${string}`, amountEth: string) {
  return {
    to,
    value: parseEther(amountEth),
  };
}

export function prepareTokenTransferArgs(to: `0x${string}`, amount: string, decimals: number) {
  return [to, parseUnits(amount, decimals)] as const;
}

export function preparePersonalSignMessage(address: `0x${string}`) {
  return `MetaMask Link Test signature request for ${address} at ${new Date().toISOString()}`;
}

export function prepareTypedData(chainId: number, address: `0x${string}`) {
  return {
    domain: {
      name: 'MetaMask Link Test',
      version: '1',
      chainId,
    },
    types: {
      TestMessage: [
        { name: 'wallet', type: 'address' },
        { name: 'purpose', type: 'string' },
      ],
    },
    primaryType: 'TestMessage',
    message: {
      wallet: address,
      purpose: 'Verify EIP-712 signing from the test page',
    },
  } as const;
}
