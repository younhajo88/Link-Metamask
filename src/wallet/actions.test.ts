import { describe, expect, it } from 'vitest';
import {
  erc20Abi,
  prepareNativeTransfer,
  prepareTokenTransferArgs,
  prepareTypedData,
} from './actions';

describe('wallet action helpers', () => {
  it('prepares a native transfer request', () => {
    const request = prepareNativeTransfer('0x0000000000000000000000000000000000000001', '0.01');

    expect(request.to).toBe('0x0000000000000000000000000000000000000001');
    expect(request.value).toBe(10_000_000_000_000_000n);
  });

  it('exposes an ERC-20 transfer ABI fragment', () => {
    expect(erc20Abi[0].name).toBe('transfer');
  });

  it('prepares ERC-20 transfer args using token decimals', () => {
    const args = prepareTokenTransferArgs(
      '0x0000000000000000000000000000000000000001',
      '2.5',
      6,
    );

    expect(args[1]).toBe(2_500_000n);
  });

  it('prepares typed data with the active chain id', () => {
    const typedData = prepareTypedData(11155111, '0x0000000000000000000000000000000000000001');

    expect(typedData.domain.chainId).toBe(11155111);
    expect(typedData.message.wallet).toBe('0x0000000000000000000000000000000000000001');
  });
});
