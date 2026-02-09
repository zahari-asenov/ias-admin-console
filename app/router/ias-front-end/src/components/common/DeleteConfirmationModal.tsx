import { Modal, Group as MantineGroup, Text, Button, Divider } from '@mantine/core';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  type: 'users' | 'groups';
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal = ({
  isOpen,
  type,
  count,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps) => {
  const title = `Delete ${type}`;
  const message = `Selected ${count} ${type} will be deleted. Please confirm that you want to proceed.`;

  return (
    <Modal
      opened={isOpen}
      onClose={onCancel}
      title={
        <MantineGroup gap="sm">
          <Text 
            size="lg" 
            style={{ 
              color: 'var(--mantine-color-orange-6)',
              fontSize: '20px',
              lineHeight: 1
            }}
          >
            ⚠
          </Text>
          <Text fw={600}>{title}</Text>
        </MantineGroup>
      }
      size="md"
      centered
    >
      <Divider color="orange" mb="md" />
      
      <Text size="sm" mb="xl">
        {message}
      </Text>

      <MantineGroup justify="flex-end" gap="sm" mt="xl">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          color="blue" 
          onClick={onConfirm}
        >
          Delete
        </Button>
      </MantineGroup>
    </Modal>
  );
};
