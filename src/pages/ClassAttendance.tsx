import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EXTERNAL_URL = 'https://class-intelligence.vercel.app/';

const ClassAttendance = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open the external main dashboard and two popover HTML files in new tabs
    try {
      const mainWin = window.open(EXTERNAL_URL, '_blank', 'noopener,noreferrer');
      if (mainWin) mainWin.focus();

      // Local popover HTML files hosted from the `public` directory
      const kwality = '/popovers/sales-overview/kwality.html';
      const supreme = '/popovers/sales-overview/supreme.html';

      const kwWin = window.open(kwality, '_blank', 'noopener,noreferrer');
      const spWin = window.open(supreme, '_blank', 'noopener,noreferrer');
      if (kwWin) kwWin.focus();
      if (spWin) spWin.focus();
    } catch (e) {
      // ignore errors (e.g., popup blocked)
    }

    // Navigate the original tab back to the app dashboard.
    // Use a short timeout to give the browser a chance to open the new tabs before navigation.
    const t = setTimeout(() => {
      try {
        navigate('/', { replace: true });
      } catch (e) {
        // fallback to hard navigation if router navigation fails
        window.location.href = '/';
      }
    }, 250);

    return () => clearTimeout(t);
  }, [navigate]);

  // Do not display class attendance data in this tab — render nothing
  return null;
};

export default ClassAttendance;