import { useState } from 'react';
import { FileSignature, Repeat2, Send, Shuffle, Signature } from 'lucide-react';
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import {
  erc20Abi,
  prepareNativeTransfer,
  preparePersonalSignMessage,
  prepareTokenTransferArgs,
  prepareTypedData,
} from '../wallet/actions';
import { isTestActionChain, testActionChains } from '../wallet/chains';
import { createActionLog, toErrorDetails, type ActionLogEntry } from '../diagnostics/logger';

interface ActionsPanelProps {
  onLog: (entry: ActionLogEntry) => void;
}

export function ActionsPanel({ onLog }: ActionsPanelProps) {
  const account = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState('18');

  const isConnected = Boolean(account.address);
  const canRunTestAction = isConnected && isTestActionChain(chainId);

  async function runAction(action: string, callback: () => Promise<unknown>) {
    onLog(createActionLog(action, 'pending', { chainId, address: account.address }));
    try {
      const result = await callback();
      onLog(createActionLog(action, 'success', result));
    } catch (error) {
      onLog(createActionLog(action, 'error', toErrorDetails(error)));
    }
  }

  return (
    <section className="panel actions-panel">
      <div className="panel-heading">
        <div>
          <h2>기능 테스트</h2>
          <span>{chainId ? `Active chain ${chainId}` : 'No active chain'}</span>
        </div>
      </div>

      {!canRunTestAction && isConnected && (
        <p className="warning-text">
          연결 안정화를 위해 Ethereum Mainnet을 지원 목록에 포함했지만, 전송/서명 테스트는
          Sepolia 또는 Polygon Amoy에서만 실행됩니다. 먼저 테스트 네트워크로 전환하세요.
        </p>
      )}

      <div className="form-grid">
        <label>
          Recipient
          <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="0x..." />
        </label>
        <label>
          Amount
          <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.01" />
        </label>
        <label>
          Token Address
          <input value={tokenAddress} onChange={(event) => setTokenAddress(event.target.value)} placeholder="0x..." />
        </label>
        <label>
          Token Decimals
          <input value={tokenDecimals} onChange={(event) => setTokenDecimals(event.target.value)} placeholder="18" />
        </label>
      </div>

      <div className="action-groups">
        <div>
          <h3>Network</h3>
          <div className="button-row">
            {testActionChains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                disabled={!isConnected}
                onClick={() => runAction('switch_chain', () => switchChainAsync({ chainId: Number(chain.id) }))}
              >
                <Shuffle size={16} />
                {chain.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3>Transfer</h3>
          <div className="button-row">
            <button
              type="button"
              disabled={!canRunTestAction}
              onClick={() =>
                runAction('native_transfer', () =>
                  sendTransactionAsync(prepareNativeTransfer(recipient as `0x${string}`, amount)),
                )
              }
            >
              <Send size={16} />
              Send Native
            </button>
            <button
              type="button"
              disabled={!canRunTestAction}
              onClick={() =>
                runAction('erc20_transfer', () =>
                  writeContractAsync({
                    address: tokenAddress as `0x${string}`,
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: prepareTokenTransferArgs(
                      recipient as `0x${string}`,
                      amount,
                      Number(tokenDecimals),
                    ),
                  }),
                )
              }
            >
              <Repeat2 size={16} />
              Send ERC-20
            </button>
          </div>
        </div>

        <div>
          <h3>Sign</h3>
          <div className="button-row">
            <button
              type="button"
              disabled={!canRunTestAction}
              onClick={() =>
                runAction('personal_sign', () =>
                  signMessageAsync({
                    message: preparePersonalSignMessage(account.address as `0x${string}`),
                  }),
                )
              }
            >
              <Signature size={16} />
              Personal Sign
            </button>
            <button
              type="button"
              disabled={!canRunTestAction}
              onClick={() =>
                runAction('typed_data_sign', () =>
                  signTypedDataAsync(prepareTypedData(chainId, account.address as `0x${string}`)),
                )
              }
            >
              <FileSignature size={16} />
              Typed Data Sign
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
