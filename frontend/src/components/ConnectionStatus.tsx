import clsx from 'clsx';

interface Props {
  status: 'connected' | 'disconnected' | 'reconnecting';
}

export function ConnectionStatus({ status }: Props) {
  if (status === 'connected') return null;
  return (
    <div
      className={clsx(
        'w-full text-center text-xs py-1.5 px-4 text-white font-medium transition-all shadow-sm',
        status === 'reconnecting' ? 'bg-amber-600' : 'bg-rose-600'
      )}
    >
      {status === 'reconnecting' ? '⚡ Reconnecting to secure chat stream…' : '⚠️ Offline — attempting automatic reconnection'}
    </div>
  );
}
