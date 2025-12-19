'use client';

import { useT } from '@/lib/translation';

type Props = {
  open: boolean;
  onClose: () => void;
  message: string;
};

export default function RequestSentModal({
  open,
  onClose,
  message,
}: Props) {
  const { t } = useT();
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-sm text-center">
        <h2 className="text-lg font-semibold mb-3">{message}</h2>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
        {t('close')}
        </button>
      </div>
    </div>
  );
}
