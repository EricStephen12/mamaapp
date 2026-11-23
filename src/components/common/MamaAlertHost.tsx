import React, { useEffect, useState } from 'react';
import { mamaAlert, MamaAlertRequest } from '../../services/mamaAlert';
import { MamaMomentModal, MamaMomentAction } from './MamaMomentModal';

interface MamaAlertHostProps {
  /** Use inline={true} when mounted inside an already-open Modal (avoids iOS nested Modal conflicts) */
  inline?: boolean;
}

export const MamaAlertHost: React.FC<MamaAlertHostProps> = ({ inline = false }) => {
  const [request, setRequest] = useState<MamaAlertRequest | null>(null);

  useEffect(() => {
    const unsub = mamaAlert.registerHost((nextReq) => {
      setRequest(nextReq);
    });
    return unsub;
  }, []);

  if (!request) return null;

  // Order primary / destructive buttons at the top and cancel buttons cleanly at the bottom
  const primaryOrDestructive = request.buttons.filter((b) => b.style !== 'cancel');
  const cancelButtons = request.buttons.filter((b) => b.style === 'cancel');
  const ordered = [...primaryOrDestructive, ...cancelButtons];

  const actions: MamaMomentAction[] = ordered.map((btn, idx) => {
    let variant: MamaMomentAction['variant'] = 'secondary';
    if (btn.style === 'destructive') {
      variant = 'destructive';
    } else if (btn.style === 'cancel') {
      variant = ordered.length === 1 ? 'primary' : 'ghost';
    } else if (idx === 0) {
      variant = 'primary';
    }

    return {
      label: btn.text,
      variant,
      onPress: () => {
        setRequest(null);
        btn.onPress?.();
      },
    };
  });

  const handleDismiss = () => {
    const cancelBtn = cancelButtons[0];
    setRequest(null);
    cancelBtn?.onPress?.();
  };

  return (
    <MamaMomentModal
      visible={true}
      inline={inline}
      eyebrow={request.eyebrow || 'MAMA SAYS'}
      title={request.title}
      message={request.message}
      mood={request.mood || 'mama'}
      actions={actions}
      onClose={handleDismiss}
    />
  );
};

