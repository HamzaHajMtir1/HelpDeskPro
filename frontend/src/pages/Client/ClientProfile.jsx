import ClientLayout from '../../layouts/ClientLayout';
import ProfilePage from '../../components/ProfilePage';
 
export default function ClientProfile() {
  return (
    <ProfilePage
      Layout={ClientLayout}
      backPath="/dashboard"
      roleLabel="Client"
      roleColor={{ bg: 'rgba(255,255,255,0.2)', text: '#fff' }}
      gradientColor="#E31E24"
    />
  );
}
