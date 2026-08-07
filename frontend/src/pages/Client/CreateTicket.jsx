// pages/client/CreateTicket.jsx
import TicketForm from '../../components/TicketForm';
import ClientLayout from '../../layouts/ClientLayout';

export default function CreateTicket() {
  return (
    <TicketForm
      Layout={ClientLayout}
      backPath="/tickets"
      redirectPath="/tickets"
      successMessage="Ticket créé avec succès ! 🎉"
    />
  );
}
