import AdminLayout from '../../layouts/AdminLayout';
import ProfilePage from '../../components/ProfilePage';
 
export default function AdminProfile() {
  return (
    <ProfilePage
      Layout={AdminLayout}
      backPath="/admin"
      roleLabel="Administrateur"
      roleColor={{ bg: 'rgba(227,30,36,0.2)', text: '#fff' }}
      gradientColor="#E31E24"
    />
  );
}
