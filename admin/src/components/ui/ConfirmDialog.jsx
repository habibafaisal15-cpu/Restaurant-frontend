import Modal from './Modal.jsx';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
}) {
  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onCancel}>
        {cancelText}
      </button>
      <button
        type="button"
        className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
        onClick={onConfirm}
      >
        {confirmText}
      </button>
    </>
  );

  return (
    <Modal open={open} onClose={onCancel} title={title} footer={footer} size="sm">
      <p className="confirm-dialog__message">{message}</p>
    </Modal>
  );
}
