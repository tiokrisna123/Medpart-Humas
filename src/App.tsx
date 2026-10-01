import React from "react";
import { MediaPartnersPage } from "./components/MediaPartnersPage";
import {
  CalendarClock,
  CalendarDays,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import {
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { DataState } from "./components/DataState";
import { FollowUpsPage } from "./components/FollowUpsPage";
import { MediaDetailPage } from "./components/MediaDetailPage";
import { MessageTemplatesPage } from "./components/MessageTemplatesPage";
import { SettingsPage } from "./components/SettingsPage";
import {
  loadDashboardData,
  type DashboardData,
} from "./data/dashboard";
import {
  getFollowUpBucket,
} from "./data/followUps";
import {
  MEDIA_ACTIVITIES,
  MEDIA_ACTIVITY_LABELS,
  type MediaActivity,
  type MediaStatus,
} from "./data/media";
import { COMMUNICATION_TYPE_LABELS } from "./data/communications";
import { isSupabaseConfigured } from "./lib/supabase";
import { useMember } from "./lib/MemberContext";

const ACTIVITY_PROGRESS_STAGES: {
  label: string;
  statuses: readonly MediaStatus[];
}[] = [
  { label: "Belum dihubungi", statuses: ["target", "not_contacted"] },
  {
    label: "Dalam proses",
    statuses: ["contacted", "waiting_response", "negotiation"],
  },
  { label: "Sudah merespons", statuses: ["response_received"] },
  { label: "Dikonfirmasi atau selesai", statuses: ["confirmed", "completed"] },
  { label: "Ditolak atau tanpa respons", statuses: ["rejected", "no_response"] },
  { label: "Tidak relevan", statuses: ["not_relevant"] },
];
const CONTACT_STARTED_STATUSES: readonly MediaStatus[] = [
  "contacted",
  "waiting_response",
  "response_received",
  "negotiation",
  "confirmed",
  "completed",
  "rejected",
  "no_response",
];

function DashboardPage() {
  const { member } = useMember();
  const [dashboardData, setDashboardData] =
    React.useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] =
    React.useState(true);
  const [dashboardError, setDashboardError] =
    React.useState("");

  const refreshDashboard = React.useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError("");

    try {
      setDashboardData(await loadDashboardData());
    } catch (error) {
      console.error("Gagal mengambil data Dashboard:", error);
      setDashboardError(
        error instanceof Error
          ? error.message
          : "Data Dashboard tidak dapat dimuat.",
      );
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const now = new Date();
  const followUpTargets = dashboardData?.followUpTargets ?? [];
  const followUpCounts = {
    today: followUpTargets.filter(
      (target) => getFollowUpBucket(target, now) === "today",
    ).length,
    overdue: followUpTargets.filter(
      (target) => getFollowUpBucket(target, now) === "overdue",
    ).length,
    upcoming: followUpTargets.filter(
      (target) => getFollowUpBucket(target, now) === "upcoming",
    ).length,
  };
  const todaysFollowUps = followUpTargets.filter(
    (target) => getFollowUpBucket(target, now) === "today",
  );
  const metricItems = [
    { label: "Follow-up hari ini", value: followUpCounts.today, icon: CalendarDays },
    { label: "Terlambat", value: followUpCounts.overdue, icon: CircleAlert },
    { label: "7 hari ke depan", value: followUpCounts.upcoming, icon: CalendarClock },
  ];
  const activityCounts: Record<MediaActivity, number> =
    dashboardData?.activityCounts ?? {
      open_call: 0,
      workshop: 0,
      pameran: 0,
    };
  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 11
      ? "Selamat pagi"
      : greetingHour < 15
        ? "Selamat siang"
        : greetingHour < 19
          ? "Selamat sore"
          : "Selamat malam";

  return (
    <div className="page-stack">
      <section className="welcome-panel">
        <div className="welcome-panel__copy">
          <p className="eyebrow">
            WCM CREATIVE SPACE / MULIH ART EXHIBITION
          </p>

          <h2>
            {greeting}, {member?.full_name ?? "anggota tim"}
          </h2>

          <p>
            Pantau jangkauan publikasi, respons media, dan jadwal tindak lanjut MULIH 2026.
          </p>
        </div>
      </section>

      <div className="setup-notice">
        <span
          className="setup-notice__signal"
          aria-hidden="true"
        />

        <p>
          {isSupabaseConfigured
            ? `Ruang kerja aktif untuk ${member?.full_name ?? "anggota tim"}, ${
                member?.role === "admin" ? "Admin" : "Staff"
              }.`
            : "Pratinjau framework. Hubungkan Supabase melalui .env.local untuk memulai integrasi data."}
        </p>
      </div>

      <section aria-labelledby="summary-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PRIORITAS TIM</p>
            <h2 id="summary-heading">Jadwal tindak lanjut</h2>
          </div>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => void refreshDashboard()}
            disabled={dashboardLoading}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {dashboardLoading ? "Memuat..." : "Muat ulang"}
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <DataState kind="setup" />
        ) : dashboardLoading ? (
          <DataState
            kind="loading"
            title="Memuat data Dashboard"
            detail="Mengambil jadwal, target kegiatan, dan komunikasi terbaru."
          />
        ) : dashboardError ? (
          <DataState
            kind="error"
            title="Data Dashboard gagal dimuat"
            detail={dashboardError}
          />
        ) : (
          <div className="summary-grid summary-grid--follow-ups">
          {metricItems.map(({ label, value, icon: Icon }, index) => (
            <article
              className={`summary-item${
                index === 0 ? " summary-item--lead" : ""
              }`}
              key={label}
            >
              <div className="summary-item__top">
                <span>{label}</span>

                <Icon
                  size={17}
                  strokeWidth={1.65}
                  aria-hidden="true"
                />
              </div>

              <p className="summary-item__value">
                {value}
              </p>

              <p className="summary-item__caption">
                {label === "Follow-up hari ini"
                      ? "Jadwal yang perlu ditangani hari ini"
                  : label === "Terlambat"
                        ? "Jadwal lewat yang masih perlu ditangani"
                        : "Jadwal mendatang dalam 7 hari"}
              </p>
            </article>
          ))}
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section
          className="panel progress-panel"
          aria-labelledby="activity-breakdown-heading"
        >
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">PROGRES HUMAS</p>
              <h2 id="activity-breakdown-heading">
                Progres kontak per kegiatan
              </h2>
              <p className="activity-progress__description">
                Persentase menunjukkan target yang sudah mulai dihubungi dari seluruh target kegiatan.
              </p>
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <DataState kind="setup" />
          ) : dashboardLoading ? (
            <DataState
              kind="loading"
              title="Memuat jumlah target"
              detail="Menghitung target berdasarkan kegiatan."
            />
          ) : dashboardError ? (
            <DataState
              kind="error"
              title="Jumlah target gagal dimuat"
              detail={dashboardError}
            />
          ) : (
            <ul className="activity-progress-list">
              {MEDIA_ACTIVITIES.map((activity) => {
                const total = activityCounts[activity];
                const statusCounts =
                  dashboardData?.activityStatusCounts[activity] ?? {};
                const contacted = CONTACT_STARTED_STATUSES.reduce(
                  (sum, status) => sum + (statusCounts[status] ?? 0),
                  0,
                );
                const percent =
                  total > 0
                    ? Math.min(100, Math.round((contacted / total) * 100))
                    : 0;
                const stages = ACTIVITY_PROGRESS_STAGES.map((stage) => ({
                  label: stage.label,
                  count: stage.statuses.reduce(
                    (sum, status) => sum + (statusCounts[status] ?? 0),
                    0,
                  ),
                })).filter((stage) => stage.count > 0);

                return (
                  <li className="activity-progress" key={activity}>
                    <div className="activity-progress__heading">
                      <h3>{MEDIA_ACTIVITY_LABELS[activity]}</h3>
                      <span>{total} target media</span>
                    </div>

                    {total > 0 ? (
                      <>
                        <div className="activity-progress__summary">
                          <span>
                            {contacted} dari {total} target media sudah dihubungi
                          </span>
                          <strong>{percent}%</strong>
                        </div>
                        <div
                          className="activity-progress__track"
                          role="progressbar"
                          aria-label={`Progres kontak ${MEDIA_ACTIVITY_LABELS[activity]}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={percent}
                        >
                          <span
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <ul className="activity-progress__stages">
                          {stages.map((stage) => (
                            <li key={stage.label}>
                              <span>{stage.label}</span>
                              <strong>{stage.count}</strong>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="activity-progress__empty">
                        Belum ada target media untuk kegiatan ini.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className="panel followup-panel"
          aria-labelledby="followup-heading"
        >
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">TINDAKAN BERIKUTNYA</p>
              <h2 id="followup-heading">
                Follow-up hari ini
              </h2>
            </div>
            <Link className="text-link" to="/follow-ups">
              Semua tindak lanjut
            </Link>
          </div>

          {!isSupabaseConfigured ? (
            <DataState kind="setup" />
          ) : dashboardLoading ? (
            <DataState
              kind="loading"
              title="Memuat follow-up hari ini"
              detail="Mengambil jadwal dari target media."
            />
          ) : dashboardError ? (
            <DataState
              kind="error"
              title="Follow-up hari ini gagal dimuat"
              detail={dashboardError}
            />
          ) : todaysFollowUps.length === 0 ? (
            <p className="follow-up-empty">
              Belum ada follow-up hari ini.
            </p>
          ) : (
            <ul className="dashboard-follow-up-list">
              {todaysFollowUps.map((target) => (
                <li key={target.id}>
                  <Link
                    to={`/media/${target.media_partner_id}?target=${target.id}`}
                  >
                    <strong>
                      {target.media_partner?.name ??
                        "Nama media tidak tersedia"}
                    </strong>
                    <span>
                      {target.assigned_member?.full_name ??
                        "PIC belum ditentukan"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="panel activity-panel"
          aria-labelledby="recent-activity-heading"
        >
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">CATATAN TIM</p>
              <h2 id="recent-activity-heading">
                Komunikasi terbaru
              </h2>
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <DataState kind="setup" />
          ) : dashboardLoading ? (
            <DataState
              kind="loading"
              title="Memuat komunikasi terbaru"
              detail="Mengambil log komunikasi yang baru dicatat."
            />
          ) : dashboardError ? (
            <DataState
              kind="error"
              title="Aktivitas terbaru gagal dimuat"
              detail={dashboardError}
            />
          ) : !dashboardData?.recentCommunications.length ? (
            <DataState
              kind="empty"
              title="Belum ada komunikasi"
              detail="Log komunikasi akan muncul setelah tim mencatat komunikasi dengan media."
            />
          ) : (
            <ul className="recent-activity-list">
              {dashboardData.recentCommunications.map((item) => (
                <li key={item.id}>
                  <div className="recent-activity-list__top">
                    <strong>
                      {COMMUNICATION_TYPE_LABELS[item.type]}
                    </strong>
                    <time dateTime={item.contacted_at}>
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(item.contacted_at))}
                    </time>
                  </div>
                  <p>{item.subject || "Tanpa subject"}</p>
                  {item.media_partner_id ? (
                    <Link
                      to={`/media/${item.media_partner_id}?target=${item.media_target_id}`}
                    >
                      {item.media_name ?? "Media tidak tersedia"}
                      {item.activity
                        ? ` · ${MEDIA_ACTIVITY_LABELS[item.activity]}`
                        : ""}
                    </Link>
                  ) : (
                    <span>Target media tidak tersedia</span>
                  )}
                  <small>
                    Dicatat oleh {item.recorder_name ?? "Anggota tidak tersedia"}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}


/* =========================
   LOGIN
========================= */

function LoginPage() {
  const { member, members, loading, error, login } = useMember();
  const [selectedId, setSelectedId] = React.useState("");

  if (member) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleLogin(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const selectedMember = members.find(
      (item) => item.id === selectedId,
    );

    if (selectedMember) login(selectedMember);
  }

  return (
    <main className="login-setup">
      <div className="wordmark">
        <span className="wordmark__name">
          MULIH
        </span>

        <span className="wordmark__descriptor">
          MEDIA HUB
        </span>
      </div>

      <section className="panel login-setup__panel">
        <p className="eyebrow">
          AKSES RUANG KERJA HUMAS
        </p>

        <h1>Masuk ke MULIH</h1>

        <p className="login-description">
          Pilih nama lengkap untuk masuk ke ruang kerja Humas.
        </p>

        {loading ? (
          <DataState
            kind="loading"
            title="Memuat anggota..."
            detail="Mengambil daftar anggota tim."
          />
        ) : (
          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <label
              className="login-form__label"
              htmlFor="member"
            >
              Nama lengkap
            </label>

            <select
              id="member"
              className="login-form__select"
              value={selectedId}
              onChange={(event) =>
                setSelectedId(event.target.value)
              }
              required
            >
              <option value="">Pilih nama anggota</option>

              {members.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>

            {error && (
              <p className="login-form__error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="login-form__button"
              disabled={!selectedId}
            >
              Masuk
            </button>
          </form>
        )}
      </section>
    </main>
  );
}


/* =========================
   PROTECTED ROUTES
========================= */

function ProtectedLayout() {
  const { member, loading } = useMember();

  if (loading) {
    return (
      <main className="login-setup">
        <section className="panel login-setup__panel">
          <DataState
            kind="setup"
            title="Memuat MULIH..."
            detail="Menyiapkan ruang kerja."
          />
        </section>
      </main>
    );
  }

  if (!member) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <AppShell />;

}


function TeamPage() {
  const { members, loading, error } = useMember();

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">ANGGOTA TIM</p>
        <h2>Team</h2>
        <p>
          Daftar anggota aktif dan peran yang tersimpan di team_members.
        </p>
      </section>

      {loading ? (
        <DataState
          kind="loading"
          title="Memuat anggota tim"
          detail="Mengambil anggota aktif dari Supabase."
        />
      ) : error ? (
        <DataState
          kind="error"
          title="Anggota tim gagal dimuat"
          detail={error}
        />
      ) : members.length === 0 ? (
        <DataState
          kind="empty"
          title="Belum ada anggota aktif"
          detail="Anggota aktif yang terdaftar di team_members akan tampil di sini."
        />
      ) : (
        <section className="team-member-list" aria-label="Anggota tim aktif">
          {members.map((member) => (
            <article className="team-member-row" key={member.id}>
              <div
                className="team-member-row__initial"
                aria-hidden="true"
              >
                {member.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="team-member-row__identity">
                <strong>{member.full_name}</strong>
                <span>Anggota aktif</span>
              </div>
              <span className="team-member-row__role">
                {member.role === "admin" ? "Admin" : "Staff"}
              </span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}


export default function App() {
  return (
    <Routes>
      {/* Login tidak membutuhkan member */}
      <Route
        path="/login"
        element={<LoginPage />}
      />

      {/* Semua halaman berikut membutuhkan member */}
      <Route element={<ProtectedLayout />}>
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/media"
          element={<MediaPartnersPage />}
        />

        <Route
          path="/media/:id"
          element={<MediaDetailPage />}
        />

        <Route
          path="/follow-ups"
          element={<FollowUpsPage />}
        />

        <Route
          path="/templates"
          element={<MessageTemplatesPage />}
        />

        <Route
          path="/team"
          element={<TeamPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Route>
    </Routes>
  );
}