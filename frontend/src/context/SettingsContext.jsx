import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const SettingsContext = createContext({});

export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = {
  companyName:   'Help Desk IT',
  companySlogan: 'Système de support',
  language:      'fr',
  timezone:      'Africa/Tunis',
  ticketPrefix:  '',
  primaryColor:  '#E31E24',
  logoText:      'Help Desk IT',
  // notifications
  notifNewTicket:      true,
  notifTicketAssigned: true,
  notifNewComment:     true,
  notifTicketResolved: true,
  notifSlaBreached:    true,
  notifSlaBefore30:    true,
  notifUnassigned1h:   true,
  notifDailyReport:    false,
  // securite
  sessionTimeout:     '30',
  maxLoginAttempts:   '5',
  passwordMinLength:  '8',
  requireUppercase:   'true',
  requireNumbers:     'true',
  requireSpecialChar: 'false',
  // email
  smtpHost:     'smtp.gmail.com',
  smtpPort:     '587',
  smtpUser:     '',
  fromName:     'Help Desk IT',
  fromEmail:    '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded,   setLoaded]   = useState(false);

  const refresh = () =>
    api.get('/admin/settings')
      .then(({ data }) => setSettings({ ...DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setLoaded(true));

  useEffect(() => { refresh(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, refresh, loaded }}>
      {children}
    </SettingsContext.Provider>
  );
}
