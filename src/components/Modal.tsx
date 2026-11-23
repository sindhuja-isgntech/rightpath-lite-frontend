import React, { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id of the heading inside the dialog that names it for screen readers */
  labelledBy: string;
  /** Tailwind max-width class, written out in full at the call site, e.g. "max-w-[680px]" */
  maxWidth?: string;
  children: ReactNode;
}

/**
 * Native <dialog> modal: traps keyboard focus, closes with Esc, and closes when the dimmed
 * backdrop is clicked. Children are mounted only while open, so their state resets each time.
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  labelledBy,
  maxWidth = 'max-w-[680px]',
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself
        if (event.target === dialogRef.current) onClose();
      }}
      className={`m-auto max-h-[90vh] w-[calc(100%-2rem)] ${maxWidth} overflow-y-auto rounded-[24px] bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-black/40`}
    >
      {open && children}
    </dialog>
  );
};
