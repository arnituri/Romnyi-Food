import { useCallback, useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAccessibleDialog } from '../useAccessibleDialog';

function DialogHarness({ onConfirm = vi.fn() }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeDialog = useCallback(() => setIsOpen(false), []);
  const { captureOpener, dialogRef } = useAccessibleDialog(isOpen, closeDialog);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          captureOpener(event);
          setIsOpen(true);
        }}
      >
        Párbeszédablak megnyitása
      </button>

      {isOpen && (
        <section ref={dialogRef} role="dialog" aria-modal="true" aria-label="Teszt párbeszédablak" tabIndex="-1">
          <button type="button" data-dialog-initial-focus onClick={closeDialog}>Mégse</button>
          <button type="button" onClick={onConfirm}>Megerősítés</button>
        </section>
      )}
    </>
  );
}

async function openDialog() {
  const opener = screen.getByRole('button', { name: 'Párbeszédablak megnyitása' });
  fireEvent.click(opener);
  const cancelButton = await screen.findByRole('button', { name: 'Mégse' });
  await waitFor(() => expect(cancelButton).toHaveFocus());
  return { opener, cancelButton, confirmButton: screen.getByRole('button', { name: 'Megerősítés' }) };
}

describe('useAccessibleDialog', () => {
  it('moves focus to the safe initial action and restores it to the opener after closing', async () => {
    render(<DialogHarness />);
    const { opener, cancelButton } = await openDialog();

    fireEvent.click(cancelButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('keeps Tab and Shift+Tab focus inside the dialog', async () => {
    render(<DialogHarness />);
    const { cancelButton, confirmButton } = await openDialog();

    confirmButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(cancelButton).toHaveFocus();

    cancelButton.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(confirmButton).toHaveFocus();
  });

  it('treats Escape as cancel and never confirms the action', async () => {
    const onConfirm = vi.fn();
    render(<DialogHarness onConfirm={onConfirm} />);
    const { opener } = await openDialog();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(opener).toHaveFocus();
  });
});
