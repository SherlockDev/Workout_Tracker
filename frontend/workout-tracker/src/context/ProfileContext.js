import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfileState] = useState(null);

  useEffect(() => {
    api.get("/api/profiles", { skipProfile: true }).then(async (data) => {
      let list = data;
      if (list.length === 0) {
        const created = await api.post("/api/profiles", { name: "Me" }, { skipProfile: true });
        list = [created];
      }
      setProfiles(list);
      const savedId = parseInt(localStorage.getItem("activeProfileId"));
      const found = list.find((p) => p.id === savedId);
      const active = found || list[0];
      setActiveProfileState(active);
      localStorage.setItem("activeProfileId", String(active.id));
    });
  }, []);

  const switchProfile = (profile) => {
    localStorage.setItem("activeProfileId", String(profile.id));
    setActiveProfileState(profile);
  };

  const createProfile = async (name) => {
    const p = await api.post("/api/profiles", { name }, { skipProfile: true });
    setProfiles((prev) => [...prev, p]);
    return p;
  };

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, switchProfile, createProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
