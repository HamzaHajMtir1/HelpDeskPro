import TechnicienLayout from '../../layouts/TechnicienLayout';
import ProfilePage from '../../components/ProfilePage';
 
export default function TechProfile() {
  return (
    <ProfilePage
      Layout={TechnicienLayout}
      backPath="/dashboardTech"
      roleLabel="Technicien"
      roleColor={{ bg: 'rgba(255,255,255,0.2)', text: '#fff' }}
      gradientColor="#E31E24"
    />
  );
}
