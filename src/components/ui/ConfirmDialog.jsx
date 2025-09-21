import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      actions={[
        <button
          key="cancel"
          onClick={onCancel}
          className="px-3 py-1 rounded bg-secondary text-contrast"
        >
          {cancelText}
        </button>,
        <button
          key="ok"
          onClick={onConfirm}
          className={`px-3 py-1 rounded ${
            danger ? "bg-danger" : "bg-primary"
          } text-contrast`}
        >
          {confirmText}
        </button>,
      ]}
    >
      <p className="text-muted">{message}</p>
    </Modal>
  );
}
