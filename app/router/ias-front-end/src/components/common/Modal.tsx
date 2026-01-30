import { Modal as MantineModal } from '@mantine/core';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  zIndex?: number;
}

export const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  footer,
  zIndex = 201
}: ModalProps) => {
  return (
    <MantineModal
      opened={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      centered
      zIndex={zIndex}
    >
      {children}
      {footer && (
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--mantine-color-gray-3)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {footer}
        </div>
      )}
    </MantineModal>
  );
};
