import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useUser } from '../../contexts/UserContext';

const AuthComplete: React.FC = () => {
  const navigate = useNavigate();
  const { setUserFromSession } = useUser();

  useEffect(() => {
  (async () => {
    try {
      const res = await authAPI.me();
      if (res.status === 200 && res.data) {
        setUserFromSession(res.data);
      }
    } catch {}
    navigate('/');
  })();
}, [navigate, setUserFromSession]);

  return <div style={{display:'grid',placeItems:'center',minHeight:'60vh'}}>🔐 Finalisation…</div>;
};

export default AuthComplete;
