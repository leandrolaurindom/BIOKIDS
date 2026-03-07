
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-yellow-50 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 transform transition-all animate-jump-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b-4 border-yellow-300 dark:border-yellow-600 pb-4 mb-4">
          <h2 className="text-3xl font-bold text-green-700 dark:text-green-300">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 text-4xl font-bold transform transition-transform hover:scale-125"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
