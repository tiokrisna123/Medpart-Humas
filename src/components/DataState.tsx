import { AlertCircle, Database, LoaderCircle } from "lucide-react";

type DataStateProps = {
  kind: "empty" | "loading" | "error" | "setup";
  title?: string;
  detail?: string;
};

const stateContent = {
  empty: {
    icon: Database,
    title: "Belum ada data",
    detail: "Data akan muncul di sini setelah mitra ditambahkan.",
  },
  loading: {
    icon: LoaderCircle,
    title: "Memuat data",
    detail: "Sedang mengambil informasi terbaru.",
  },
  error: {
    icon: AlertCircle,
    title: "Data belum dapat dimuat",
    detail: "Periksa koneksi lalu coba lagi.",
  },
  setup: {
    icon: Database,
    title: "Supabase belum dikonfigurasi",
    detail: "Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env.local untuk menghubungkan data.",
  },
} satisfies Record<DataStateProps["kind"], { icon: typeof Database; title: string; detail: string }>;

export function DataState({ kind, title, detail }: DataStateProps) {
  const state = stateContent[kind];
  const Icon = state.icon;

  return (
    <div className={`data-state data-state--${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span className="data-state__icon" aria-hidden="true">
        <Icon size={19} strokeWidth={1.7} />
      </span>
      <div>
        <h3>{title ?? state.title}</h3>
        <p>{detail ?? state.detail}</p>
      </div>
    </div>
  );
}
