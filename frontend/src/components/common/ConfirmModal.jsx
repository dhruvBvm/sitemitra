import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  confirmVariant = "primary" 
}) {
  const getConfirmButtonClasses = () => {
    if (confirmVariant === 'danger') {
      return "bg-[#EF4444] text-white hover:bg-[#DC2626] border-[#EF4444]";
    }
    return "bg-[#2563EB] text-white hover:bg-[#1D4ED8] border-[#2563EB]";
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="py-4">
        <p className="text-[#4B5563]">{message}</p>
      </div>
      <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#E5E7EB] mt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="bg-[#F3F4F6] text-[#4B5563] border-transparent hover:bg-[#E5E7EB]"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          className={`font-medium shadow-sm transition-colors ${getConfirmButtonClasses()}`}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
