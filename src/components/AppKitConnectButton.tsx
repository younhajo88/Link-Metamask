import { useAppKit } from '@reown/appkit/react';
import { Wallet } from 'lucide-react';

export default function AppKitConnectButton() {
  const { open } = useAppKit();

  return (
    <button type="button" className="primary-button" onClick={() => open()}>
      <Wallet size={17} />
      Connect Wallet
    </button>
  );
}
