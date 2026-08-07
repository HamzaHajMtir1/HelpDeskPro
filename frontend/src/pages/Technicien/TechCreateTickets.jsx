// pages/tech/TechCreateTicket.jsx
import TicketForm from '../../components/TicketForm';
import TechnicienLayout from '../../layouts/TechnicienLayout';

export default function TechCreateTicket() {
  return (
    <TicketForm
      Layout={TechnicienLayout}
      backPath="/tech/tickets"
      redirectPath="/tech/tickets"
    />
  );
}
