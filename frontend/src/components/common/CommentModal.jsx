import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function CommentModal({ isOpen, onClose, onConfirm, title, confirmText, actionLoading }) {
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(comment);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div>
          <label className="block text-sm font-bold text-[#1F2937] mb-2">Add comment (optional)</label>
          <textarea
            className="w-full px-3 py-3 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-[#2563EB] box-border resize-none"
            rows={4}
            placeholder="Write your remarks here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className={`flex-1 text-white ${confirmText === 'Reject' ? 'bg-[#EF4444] hover:bg-red-700' : 'bg-[#10B981] hover:bg-green-700'}`}
            disabled={actionLoading}
            isLoading={actionLoading}
          >
            {confirmText}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
