import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EXTERNAL_URL = 'https://class-intelligence.vercel.app/';

const ClassAttendance = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Open the external main dashboard in a new tab
    try {
      const newWindow = window.open(EXTERNAL_URL, '_blank', 'noopener,noreferrer');
      if (newWindow) newWindow.focus();
    } catch (e) {
      // ignore errors (e.g., popup blocked)
    }

    // Navigate the original tab back to the app dashboard.
    // Use a short timeout to give the browser a chance to open the new tab before navigation.
    const t = setTimeout(() => {
      try {
        navigate('/', { replace: true });
      } catch (e) {
        // fallback to hard navigation if router navigation fails
        window.location.href = '/';
      }
    }, 200);

    return () => clearTimeout(t);
  }, [navigate]);

  // Do not display class attendance data in this tab — render nothing
  return null;
};

export default ClassAttendance;