import { bookingStatusBadgeClass, BOOKING_STATUS_LABELS, paymentStatusBadgeClass } from '../utils/status';

export function BookingStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${bookingStatusBadgeClass(status)}`}>
      {BOOKING_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${paymentStatusBadgeClass(status)}`}>
      {status}
    </span>
  );
}
