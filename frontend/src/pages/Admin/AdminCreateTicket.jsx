import TicketForm from '../../components/TicketForm';
import AdminLayout from '../../layouts/AdminLayout';

export default function AdminCreateTicket() {
  return (
    <TicketForm
      Layout={AdminLayout}
      backPath="/admin/tickets"
      redirectPath="/admin/tickets"
    />
  );
}
