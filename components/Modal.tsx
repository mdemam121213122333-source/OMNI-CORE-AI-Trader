import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-[var(--bg-secondary)] w-full max-w-2xl rounded-xl shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)]">{title}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white text-2xl font-bold leading-none"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>
                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;