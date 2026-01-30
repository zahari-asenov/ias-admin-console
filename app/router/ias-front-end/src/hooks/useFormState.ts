import { useState } from 'react';

/**
 * Generic form state management hook
 * Handles formData, errors, touched state, and field updates
 */
export const useFormState = <T extends Record<string, any>>(
  initialData: T,
  validator?: (data: T) => Record<string, string>
) => {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleFieldChange = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleFieldBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field as string]: true }));
    if (validator) {
      const newErrors = validator(formData);
      if (newErrors[field as string]) {
        setErrors(prev => ({ ...prev, [field as string]: newErrors[field as string] }));
      }
    }
  };

  const validateForm = (customValidator?: (data: T) => Record<string, string>): boolean => {
    const validatorFn = customValidator || validator;
    if (!validatorFn) return true;
    const newErrors = validatorFn(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = (newInitialData?: T) => {
    setFormData(newInitialData || initialData);
    setErrors({});
    setTouched({});
  };

  const markAllTouched = (fields: (keyof T)[]) => {
    const touchedObj: Record<string, boolean> = {};
    fields.forEach(field => {
      touchedObj[field as string] = true;
    });
    setTouched(touchedObj);
  };

  return {
    formData,
    errors,
    touched,
    handleFieldChange,
    handleFieldBlur,
    validateForm,
    resetForm,
    markAllTouched,
    setFormData,
    setErrors,
    setTouched
  };
};
