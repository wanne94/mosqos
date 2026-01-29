import { ConfirmDeleteModal } from '@/shared/components'

export interface DeleteMemberModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Called when modal is closed */
  onClose: () => void
  /** Called when delete is confirmed */
  onConfirm: () => void
  /** Name of member being deleted */
  memberName: string
  /** Whether delete is in progress */
  isLoading?: boolean
}

/**
 * Modal for confirming member deletion
 * Wraps the shared ConfirmDeleteModal with member-specific configuration
 *
 * @example
 * <DeleteMemberModal
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   memberName={member.full_name}
 * />
 */
export function DeleteMemberModal({
  isOpen,
  onClose,
  onConfirm,
  memberName,
  isLoading = false,
}: DeleteMemberModalProps) {
  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Member"
      message="Are you sure you want to delete this member?"
      itemName={memberName}
      confirmText="Delete Member"
      isLoading={isLoading}
    />
  )
}

export default DeleteMemberModal
