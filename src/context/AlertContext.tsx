import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CustomAlertModal, CustomAlertProps, AlertAction, AlertIconType } from '../components/CustomAlertModal';

export interface ShowAlertOptions {
  title: string;
  message?: string;
  icon?: AlertIconType;
  type?: 'dialog' | 'action_sheet';
  actions: AlertAction[];
}

interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
  showInfo: (title: string, message?: string, onOk?: () => void) => void;
  showWarning: (title: string, message?: string, onOk?: () => void) => void;
  showError: (title: string, message?: string, onOk?: () => void) => void;
  showSuccess: (title: string, message?: string, onOk?: () => void) => void;
}

const AlertContext = createContext<AlertContextType | null>(null);

let globalAlertHandler: ((options: ShowAlertOptions) => void) | null = null;

export const globalShowAlert = (options: ShowAlertOptions) => {
  if (globalAlertHandler) {
    globalAlertHandler(options);
  }
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState<CustomAlertProps>({
    visible: false,
    title: '',
    message: '',
    icon: 'info',
    type: 'dialog',
    actions: [],
    onClose: () => {},
  });

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback(
    ({ title, message, icon, type = 'dialog', actions }: ShowAlertOptions) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        icon,
        type,
        actions: actions.length > 0 ? actions : [{ text: 'OK', style: 'default' }],
        onClose: hideAlert,
      });
    },
    [hideAlert]
  );

  useEffect(() => {
    globalAlertHandler = showAlert;
    return () => {
      globalAlertHandler = null;
    };
  }, [showAlert]);

  const showInfo = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        icon: 'info',
        type: 'dialog',
        actions: [{ text: 'OK', style: 'primary', onPress: onOk }],
      });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        icon: 'warning',
        type: 'dialog',
        actions: [{ text: 'OK', style: 'primary', onPress: onOk }],
      });
    },
    [showAlert]
  );

  const showError = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        icon: 'warning',
        type: 'dialog',
        actions: [{ text: 'OK', style: 'destructive', onPress: onOk }],
      });
    },
    [showAlert]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, onOk?: () => void) => {
      showAlert({
        title,
        message,
        icon: 'success',
        type: 'dialog',
        actions: [{ text: 'Done', style: 'primary', onPress: onOk }],
      });
    },
    [showAlert]
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        hideAlert,
        showInfo,
        showWarning,
        showError,
        showSuccess,
      }}
    >
      {children}
      <CustomAlertModal {...alertConfig} onClose={hideAlert} />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
