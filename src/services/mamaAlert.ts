export interface MamaAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface MamaAlertOptions {
  eyebrow?: string;
  mood?: 'mama' | 'overfed' | 'auntie';
}

export interface MamaAlertRequest {
  title: string;
  message: string;
  buttons: MamaAlertButton[];
  eyebrow?: string;
  mood?: 'mama' | 'overfed' | 'auntie';
}

type AlertHandler = (req: MamaAlertRequest | null) => void;

// LIFO stack of active hosts so an inline host inside an open Modal
// automatically handles alerts fired while that Modal is visible!
const hostStack: AlertHandler[] = [];

export const mamaAlert = {
  /** Register an active MamaAlertHost (returns unsubscribe) */
  registerHost(handler: AlertHandler): () => void {
    hostStack.push(handler);
    return () => {
      const idx = hostStack.lastIndexOf(handler);
      if (idx !== -1) hostStack.splice(idx, 1);
    };
  },

  /** Drop-in warm Mama replacement for React Native's cold default Alert.alert */
  alert(
    title: string,
    message: string = '',
    buttons?: MamaAlertButton[],
    options?: MamaAlertOptions
  ): void {
    const activeHost = hostStack[hostStack.length - 1];
    if (!activeHost) return;

    const resolvedButtons: MamaAlertButton[] =
      buttons && buttons.length > 0
        ? buttons
        : [{ text: 'Got it', style: 'default' }];

    activeHost({
      title,
      message,
      buttons: resolvedButtons,
      eyebrow: options?.eyebrow,
      mood: options?.mood,
    });
  },

  dismiss(): void {
    const activeHost = hostStack[hostStack.length - 1];
    if (activeHost) activeHost(null);
  },
};

