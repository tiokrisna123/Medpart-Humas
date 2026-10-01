import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export type TeamMember = {
  id: string;
  full_name: string;
  role: "admin" | "staff";
  is_active: boolean;
};

type MemberContextType = {
  member: TeamMember | null;
  members: TeamMember[];
  loading: boolean;
  error: string;
  login: (member: TeamMember) => void;
  logout: () => void;
};

const MemberContext = createContext<MemberContextType | undefined>(undefined);
const STORAGE_KEY = "mulih_current_member";

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      if (!supabase) {
        if (mounted) {
          setError("Supabase belum dikonfigurasi.");
          setLoading(false);
        }
        return;
      }

      const { data, error: membersError } = await supabase
        .from("team_members")
        .select("id, full_name, role, is_active")
        .eq("is_active", true)
        .order("full_name");

      if (!mounted) return;

      if (membersError) {
        console.error("Gagal mengambil anggota:", membersError);
        setError(membersError.message);
        setLoading(false);
        return;
      }

      const activeMembers = data ?? [];
      setMembers(activeMembers);

      const savedMember = localStorage.getItem(STORAGE_KEY);

      if (savedMember) {
        try {
          const parsedMember = JSON.parse(savedMember) as Pick<TeamMember, "id">;
          const activeMember = activeMembers.find(
            (candidate) => candidate.id === parsedMember.id,
          );

          if (activeMember) {
            setMember(activeMember);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      setLoading(false);
    }

    void loadMembers();

    return () => {
      mounted = false;
    };
  }, []);

  function login(selectedMember: TeamMember) {
    setMember(selectedMember);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedMember));
  }

  function logout() {
    setMember(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <MemberContext.Provider
      value={{
        member,
        members,
        loading,
        error,
        login,
        logout,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);

  if (!context) {
    throw new Error("useMember must be used inside MemberProvider");
  }

  return context;
}
