import { Activity, Copy } from 'lucide-react';
import { formatUnits } from 'viem';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { getChainName } from '../wallet/chains';

function shortAddress(address?: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '-';
}

export function StatusPanel() {
  const account = useAccount();
  const chainId = useChainId();
  const balance = useBalance({
    address: account.address,
    query: {
      enabled: Boolean(account.address),
    },
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>현재 상태</h2>
          <span>Account / Chain / Balance</span>
        </div>
        <Activity size={19} aria-hidden="true" />
      </div>
      <dl className="status-grid">
        <div>
          <dt>Address</dt>
          <dd title={account.address}>{shortAddress(account.address)}</dd>
        </div>
        <div>
          <dt>Connector</dt>
          <dd>{account.connector?.name ?? '-'}</dd>
        </div>
        <div>
          <dt>Chain</dt>
          <dd>{chainId ? `${getChainName(chainId)} (${chainId})` : '-'}</dd>
        </div>
        <div>
          <dt>Balance</dt>
          <dd>
            {balance.data
              ? `${formatUnits(balance.data.value, balance.data.decimals)} ${balance.data.symbol}`
              : '-'}
          </dd>
        </div>
      </dl>
      {account.address && (
        <button
          type="button"
          className="subtle-button"
          onClick={() => navigator.clipboard.writeText(account.address ?? '')}
        >
          <Copy size={16} />
          Copy Address
        </button>
      )}
    </section>
  );
}
