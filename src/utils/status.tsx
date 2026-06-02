export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  searching: 'Finding assistant',
  assigned: 'Assigned',
  arriving: 'Arriving',
  started: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function bookingStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-green';
    case 'cancelled':
      return 'badge-red';
    case 'searching':
    case 'pending':
      return 'badge-orange';
    case 'assigned':
    case 'arriving':
    case 'started':
      return 'badge-blue';
    default:
      return 'badge-gray';
  }
}

export function paymentStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-green';
    case 'pending':
      return 'badge-orange';
    case 'failed':
      return 'badge-red';
    default:
      return 'badge-gray';
  }
}

export function isPaymentPending(
  status: string,
  payment?: { status: string } | null,
): boolean {
  if (status !== 'completed') return false;
  if (!payment) return true;
  return payment.status === 'pending';
}
