import React, { useEffect } from 'react';

// A simple modal component that wraps the HTML <dialog> element.
export const Modal: React.FC<{ id: string; children: React.ReactNode; open?: boolean }> = ({ id, children, open }) => {
    useEffect(() => {
        const modal = document.getElementById(id) as HTMLDialogElement;
        if (modal) {
            if (open) {
                modal.showModal();
            } else {
                modal.close();
            }
        }
    }, [open, id]);

    return <dialog id={id} className="modal">{children}</dialog>;
};