import { useState } from 'react';
import { Button, Group as MantineGroup } from '@mantine/core';
import type { Group, GroupFormData, FormErrors } from '../../types';
import { Modal } from '../common/Modal';
import { GroupForm } from './GroupForm';
import { validateGroupForm } from '../../utils/validators';
import { generateScimId, generateGroupId } from '../../utils/generators';

interface CreateGroupModalProps {
  isOpen: boolean;
  allGroups: Group[];
  onClose: () => void;
  onCreateGroup: (group: Group) => void;
}

export const CreateGroupModal = ({
  isOpen,
  allGroups,
  onClose,
  onCreateGroup
}: CreateGroupModalProps) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    displayName: '',
    description: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: ''
    });
    setErrors({});
    setTouched({});
  };

  const handleFieldChange = (field: keyof GroupFormData, value: string) => {
    setFormData({...formData, [field]: value});
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const handleFieldBlur = (field: keyof GroupFormData) => {
    setTouched({...touched, [field]: true});
    const newErrors = validateGroupForm(formData, allGroups);
    if (newErrors[field]) {
      setErrors({...errors, [field]: newErrors[field]});
    }
  };

  const handleCreate = () => {
    const newErrors = validateGroupForm(formData, allGroups);
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description,
        scimId: generateScimId(),
        groupId: generateGroupId(allGroups.length),
        type: 'Security',
        source: 'Manual',
        memberCount: 0
      };
      
      onCreateGroup(newGroup);
      resetForm();
      onClose();
    } else {
      setTouched({
        name: true,
        displayName: true,
        description: true
      });
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create New Group"
      onClose={handleClose}
      footer={
        <MantineGroup justify="flex-end" gap="sm">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </MantineGroup>
      }
    >
      <GroupForm
        formData={formData}
        errors={errors}
        touched={touched}
        allGroups={allGroups}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
      />
    </Modal>
  );
};
