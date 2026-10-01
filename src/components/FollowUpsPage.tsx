import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { DataState } from "./DataState";
import { TargetEditForm, type TargetEditValues } from "./TargetEditForm";
import {
  filterFollowUpTargets,
  getFollowUpBucket,
  loadFollowUpTargets,
  type FollowUpFilter,
  type FollowUpTarget,
} from "../data/followUps";
import {
  MEDIA_ACTIVITY_LABELS,
  MEDIA_STATUS_LABELS,
} from "../data/media";
import { useMember } from "../lib/MemberContext";
import { supabase } from "../lib/supabase";

const FILTERS: { value: FollowUpFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "today", label: "Hari ini" },
  { value: "overdue", label: "Terlambat" },
  { value: "upcoming", label: "7 hari ke depan" },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function FollowUpsPage() {
  const { members } = useMember();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeFilter = searchParams.get("filter");
  const [targets, setTargets] = useState<FollowUpTarget[]>([]);
  const [filter, setFilter] = useState<FollowUpFilter>(() =>
    routeFilter === "today" ||
    routeFilter === "overdue" ||
    routeFilter === "upcoming"
      ? routeFilter
      : "all",
  );
  const [loading, setLoading] = useState(true);
  const [savingTargetId, setSavingTargetId] = useState<string | null>(null);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [targetError, setTargetError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function refreshTargets() {
    setLoading(true);
    setErrorMessage("");

    try {
      setTargets(await loadFollowUpTargets());
    } catch (error) {
      console.error("Gagal mengambil jadwal follow-up:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Jadwal follow-up tidak dapat dimuat.",
      );
      setTargets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshTargets();
  }, []);

  function selectFilter(value: FollowUpFilter) {
    setFilter(value);
    setSearchParams(
      value === "all" ? {} : { filter: value },
      { replace: true },
    );
  }

  async function saveTarget(
    target: FollowUpTarget,
    values: TargetEditValues,
  ) {
    if (!supabase) {
      setTargetError("Supabase belum terhubung.");
      return;
    }

    setSavingTargetId(target.id);
    setTargetError("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("media_targets")
      .update({
        activity: values.activity,
        status: values.status,
        assigned_to: values.assigned_to || null,
        follow_up_at: values.follow_up_at
          ? new Date(values.follow_up_at).toISOString()
          : null,
        notes: values.notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", target.id);

    if (error) {
      console.error("Gagal memperbarui target:", error);
      setTargetError(error.message);
      setSavingTargetId(null);
      return;
    }

    setEditingTargetId(null);
    setSavingTargetId(null);
    setSuccessMessage("Target dan jadwal follow-up berhasil diperbarui.");
    await refreshTargets();
  }

  async function markCompleted(target: FollowUpTarget) {
    if (!supabase) {
      setErrorMessage("Supabase belum terhubung.");
      return;
    }

    setSavingTargetId(target.id);
    setActionError("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("media_targets")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", target.id);

    if (error) {
      console.error("Gagal menandai target selesai:", error);
      setActionError(error.message);
      setSavingTargetId(null);
      return;
    }

    setSavingTargetId(null);
    setSuccessMessage("Target berhasil ditandai selesai.");
    await refreshTargets();
  }

  const now = new Date();
  const filteredTargets = filterFollowUpTargets(targets, filter, now);
  const counts: Record<FollowUpFilter, number> = {
    all: targets.length,
    today: targets.filter(
      (target) => getFollowUpBucket(target, now) === "today",
    ).length,
    overdue: targets.filter(
      (target) => getFollowUpBucket(target, now) === "overdue",
    ).length,
    upcoming: targets.filter(
      (target) => getFollowUpBucket(target, now) === "upcoming",
    ).length,
  };

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">JADWAL KOMUNIKASI</p>
        <h2>Follow-ups</h2>
        <p>
          Jadwal bersumber dari target media. Tanggal mengikuti zona waktu
          perangkat yang digunakan.
        </p>
      </section>

      <section className="follow-ups-panel" aria-label="Daftar follow-up media">
        <div className="follow-ups-toolbar">
          <div className="follow-ups-filters" aria-label="Filter follow-up">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`follow-up-filter${
                  filter === value ? " follow-up-filter--active" : ""
                }`}
                aria-pressed={filter === value}
                onClick={() => selectFilter(value)}
              >
                {label}
                <span>{counts[value]}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="button button--secondary"
            onClick={() => void refreshTargets()}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {successMessage && (
          <p className="inline-notice inline-notice--success" role="status">
            {successMessage}
          </p>
        )}
        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}

        {errorMessage ? (
          <div className="follow-ups-state">
            <DataState
              kind="error"
              title="Jadwal follow-up gagal dimuat"
              detail={errorMessage}
            />
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void refreshTargets()}
            >
              Coba lagi
            </button>
          </div>
        ) : loading ? (
          <div className="follow-ups-state">
            <DataState
              kind="loading"
              title="Memuat jadwal follow-up"
              detail="Mengambil target yang memiliki tanggal follow-up."
            />
          </div>
        ) : filteredTargets.length === 0 ? (
          <div className="follow-ups-state">
            <DataState
              kind="empty"
              title={
                filter === "all"
                  ? "Belum ada jadwal follow-up"
                  : "Tidak ada jadwal pada rentang ini"
              }
              detail={
                filter === "all"
                  ? "Tambahkan tanggal follow-up pada target media untuk melihatnya di sini."
                  : "Coba filter lain atau ubah tanggal follow-up pada target media."
              }
            />
          </div>
        ) : (
          <div className="follow-up-list">
            {filteredTargets.map((target) => {
              const bucket = getFollowUpBucket(target, now);
              const partnerName =
                target.media_partner?.name ?? "Nama media tidak tersedia";

              return (
                <article className="follow-up-row" key={target.id}>
                  <div className="follow-up-row__media">
                    <Link
                      className="follow-up-media-link"
                      to={`/media/${target.media_partner_id}?target=${target.id}`}
                    >
                      {partnerName}
                    </Link>
                    <span>
                      {target.media_partner?.instagram || "Instagram belum dicatat"}
                    </span>
                  </div>

                  <div className="follow-up-row__field">
                    <span>Kegiatan</span>
                    <strong>{MEDIA_ACTIVITY_LABELS[target.activity]}</strong>
                  </div>

                  <div className="follow-up-row__field">
                    <span>Status</span>
                    <strong>{MEDIA_STATUS_LABELS[target.status]}</strong>
                  </div>

                  <div className="follow-up-row__field">
                    <span>PIC</span>
                    <strong>
                      {target.assigned_member?.full_name ?? "Belum ditentukan"}
                    </strong>
                  </div>

                  <div className="follow-up-row__field">
                    <span>Follow-up</span>
                    <time dateTime={target.follow_up_at ?? undefined}>
                      {target.follow_up_at
                        ? dateFormatter.format(new Date(target.follow_up_at))
                        : "Belum dijadwalkan"}
                    </time>
                    {bucket && (
                      <span
                        className={`follow-up-state-label follow-up-state-label--${bucket}`}
                      >
                        {bucket === "overdue"
                          ? "Terlambat"
                          : bucket === "today"
                            ? "Hari ini"
                            : "7 hari ke depan"}
                      </span>
                    )}
                  </div>

                  <div className="follow-up-row__field follow-up-row__notes">
                    <span>Catatan</span>
                    <p>{target.notes || "Belum ada catatan."}</p>
                  </div>

                  <div className="follow-up-row__actions">
                    <button
                      type="button"
                      className="button button--secondary"
                      aria-expanded={editingTargetId === target.id}
                      onClick={() => {
                        setEditingTargetId((current) =>
                          current === target.id ? null : target.id,
                        );
                        setTargetError("");
                      }}
                    >
                      {editingTargetId === target.id
                        ? "Tutup edit"
                        : "Edit target"}
                    </button>
                    <Link
                      className="button button--primary"
                      to={`/media/${target.media_partner_id}?target=${target.id}#communication`}
                    >
                      Tambah komunikasi
                    </Link>
                    {target.status !== "completed" &&
                      target.status !== "confirmed" && (
                        <button
                          type="button"
                          className="button button--text"
                          disabled=                          {savingTargetId === target.id}
                          onClick={() => void markCompleted(target)}
                        >
                          {savingTargetId === target.id
                            ? "Menyimpan..."
                            : "Tandai selesai"}
                        </button>
                      )}
                  </div>

                  {editingTargetId === target.id && (
                    <div className="follow-up-row__editor">
                      <TargetEditForm
                        key={target.id}
                        target={target}
                        members={members}
                        saving={savingTargetId === target.id}
                        error={targetError}
                        onCancel={() => {
                          setEditingTargetId(null);
                          setTargetError("");
                        }}
                        onSave={(values) => void saveTarget(target, values)}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
