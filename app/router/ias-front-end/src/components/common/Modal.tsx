import { Modal as MantineModal } from '@mantine/core';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  zIndex?: number;
  size?: string | number;
}

export const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  footer,
  zIndex = 201,
  size = "lg"
}: ModalProps) => {
  return (
    <MantineModal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      centered
      zIndex={zIndex}
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
          padding: 0,
          overflow: 'hidden'
        }
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--mantine-spacing-md)' }}>
        {children}
      </div>
      {footer && (
        <div style={{
          flexShrink: 0,
          marginTop: 0,
          padding: '16px var(--mantine-spacing-md)',
          borderTop: '1px solid var(--mantine-color-gray-3)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          backgroundColor: 'var(--mantine-color-body)'
        }}>
          {footer}
        </div>
      )}
    </MantineModal>
  );
};
