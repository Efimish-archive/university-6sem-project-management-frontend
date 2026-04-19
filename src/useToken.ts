import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function useToken() {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) return void navigate("/login");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(savedToken);
  }, [navigate]);

  return token;
}
