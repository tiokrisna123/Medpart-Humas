import { useEffect, useMemo, useState } from "react";
import { Globe, Instagram } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { DataState } from "./DataState";
import { TargetEditForm, type TargetEditValues } from "./TargetEditForm";
import {
  toDateTimeLocalValue,
  type FollowUpTarget,
} from "../data/followUps";
import {
  buildInstagramUrl,
  MEDIA_ACTIVITY_LABELS,
  MEDIA_STATUS_LABELS,
} from "../data/media";
import {
  COMMUNICATION_TYPE_LABELS,
  COMMUNICATION_TYPES,
  isCommunicationType,
  type CommunicationType,
} from "../data/communications";
import {
  getMessageTemplateErrorMessage,
  loadMessageTemplates,
  TEMPLATE_CHANNEL_LABELS,
  type MessageTemplate,
} from "../data/templates";
import { useMember } from "../lib/MemberContext";
import { supabase } from "../lib/supabase";

type MediaPartnerDetail = {
  id: string;
  name: string;
  instagram: string | null;
  description: string | null;
  website_url: string | null;
  media_targets: (FollowUpTarget & {
    created_by: string | null;
  })[];
};

type RawMediaPartnerDetail = Omit<MediaPartnerDetail, "media_targets"> & {
  media_targets: (Omit<
    FollowUpTarget,
    "media_partner" | "assigned_member"
  > & {
    created_by: string | null;
    assigned_member:
      | FollowUpTarget["assigned_member"]
      | NonNullable<FollowUpTarget["assigned_member"]>[]
      | null;
  })[];
};

type CommunicationLog = {
  id: string;
  media_target_id: string;
  type: CommunicationType;
  subject: string | null;
  message: string | null;
  response: string | null;
  contacted_at: string;
  created_by: string | null;
  created_at: string;
};

type CommunicationForm = {
  type: CommunicationType;
  subject: string;
  message: string;
  response: string;
  contacted_at: string;
  next_follow_up_at: string;
};

const communicationDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function emptyCommunicationForm(): CommunicationForm {
  return {
    type: "whatsapp",
    subject: "",
    message: "",
    response: "",
    contacted_at: toDateTimeLocalValue(new Date()),
    next_follow_up_at: "",
  };
}

export function MediaDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { member, members } = useMember();

  const [partner, setPartner] = useState<MediaPartnerDetail | null>(null);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [activeTargetId, setActiveTargetId] = useState(
    searchParams.get("target") ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [savingLog, setSavingLog] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [form, setForm] = useState<CommunicationForm>(
    emptyCommunicationForm,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [logsError, setLogsError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [targetError, setTargetError] = useState("");

  async function loadLogs(targetIds: string[]) {
    if (!supabase || targetIds.length === 0) {
      setLogs([]);
      setLogsError("");
      return;
    }

    setLogsLoading(true);
    setLogsError("");

    const { data, error } = await supabase
      .from("communication_logs")
      .select(
        "id, media_target_id, type, subject, message, response, contacted_at, created_by, created_at",
      )
      .in("media_target_id", targetIds)
      .order("contacted_at", { ascending: false });

    if (error) {
      console.error("Gagal mengambil riwayat komunikasi:", error);
      setLogsError(error.message);
      setLogs([]);
    } else {
      setLogs(data ?? []);
    }

    setLogsLoading(false);
  }

  async function loadPartner() {
    if (!supabase) {
      setErrorMessage("Supabase belum terhubung.");
      setLoading(false);
      return;
    }

    if (!id) {
      setErrorMessage("ID media tidak tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("media_partners")
      .select(`
        id,
        name,
        instagram,
        description,
        website_url,
        media_targets!media_targets_media_partner_id_fkey (
          id,
          media_partner_id,
          activity,
          status,
          assigned_to,
          follow_up_at,
          notes,
          created_by,
          assigned_member:team_members!media_targets_assigned_to_fkey (
            full_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Gagal mengambil detail media:", error);
      setErrorMessage(error.message);
      setPartner(null);
      setLoading(false);
      return;
    }

    const rawDetail: RawMediaPartnerDetail = data;
    const targets: MediaPartnerDetail["media_targets"] =
      (rawDetail.media_targets ?? []).map((target) => ({
        ...target,
        media_partner: {
          name: rawDetail.name,
          instagram: rawDetail.instagram,
        },
        assigned_member: Array.isArray(target.assigned_member)
          ? target.assigned_member[0] ?? null
          : target.assigned_member,
      }));
    const detail: MediaPartnerDetail = {
      ...rawDetail,
      media_targets: targets,
    };
    setPartner(detail);

    const requestedTargetId = searchParams.get("target");
    const selectedTarget = targets.find(
      (target) => target.id === requestedTargetId,
    );
    const nextTargetId = selectedTarget?.id ?? targets[0]?.id ?? "";
    setActiveTargetId(nextTargetId);
    await loadLogs(targets.map((target) => target.id));
    setLoading(false);
  }

  useEffect(() => {
    void loadPartner();
  }, [id, searchParams]);

  useEffect(() => {
    if (!formOpen) return;

    let active = true;
    setTemplatesLoading(true);
    setTemplatesError("");
    setMessageTemplates([]);
    setSelectedTemplateId("");

    void loadMessageTemplates()
      .then((templates) => {
        if (active) setMessageTemplates(templates);
      })
      .catch((error: unknown) => {
        console.error("Gagal mengambil template komunikasi:", error);
        if (active) {
          setMessageTemplates([]);
          setTemplatesError(getMessageTemplateErrorMessage(error));
        }
      })
      .finally(() => {
        if (active) setTemplatesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [formOpen]);

  useEffect(() => {
    if (!loading && searchParams.has("target")) {
      document
        .getElementById("communication")
        ?.scrollIntoView({ block: "start" });
    }
  }, [loading, searchParams]);

  const activeTarget = partner?.media_targets.find(
    (target) => target.id === activeTargetId,
  );
  const targetLogs = useMemo(
    () => logs.filter((log) => log.media_target_id === activeTargetId),
    [logs, activeTargetId],
  );

  function updateForm<K extends keyof CommunicationForm>(
    key: K,
    value: CommunicationForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function applyMessageTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = messageTemplates.find((item) => item.id === templateId);
    if (!template) return;

    setForm((current) => ({
      ...current,
      type: template.channel,
      subject: template.subject ?? "",
      message: template.content,
    }));
  }

  async function saveCommunication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setFormError("Supabase belum terhubung.");
      return;
    }

    if (!member) {
      setFormError("Pilih anggota tim sebelum mencatat komunikasi.");
      return;
    }

    if (!activeTarget) {
      setFormError("Pilih target media untuk mencatat komunikasi.");
      return;
    }

    const contactedAt = new Date(form.contacted_at);
    if (!Number.isFinite(contactedAt.getTime())) {
      setFormError("Tanggal komunikasi tidak valid.");
      return;
    }

    setSavingLog(true);
    setFormError("");
    setErrorMessage("");
    setSuccessMessage("");

    const { error: insertError } = await supabase
      .from("communication_logs")
      .insert({
        media_target_id: activeTarget.id,
        type: form.type,
        subject: form.subject.trim() || null,
        message: form.message.trim() || null,
        response: form.response.trim() || null,
        contacted_at: contactedAt.toISOString(),
        created_by: member.id,
      });

    if (insertError) {
      console.error("Gagal menyimpan komunikasi:", insertError);
      setFormError(insertError.message);
      setSavingLog(false);
      return;
    }

    let followUpUpdateError = "";
    if (form.next_follow_up_at) {
      const nextFollowUpAt = new Date(form.next_follow_up_at);
      if (!Number.isFinite(nextFollowUpAt.getTime())) {
        followUpUpdateError =
          "Komunikasi tersimpan, tetapi tanggal follow-up berikutnya tidak valid.";
      } else {
        const { error } = await supabase
          .from("media_targets")
          .update({
            follow_up_at: nextFollowUpAt.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", activeTarget.id);

        if (error) {
          console.error("Gagal memperbarui follow-up:", error);
          followUpUpdateError =
            `Komunikasi tersimpan, tetapi follow-up berikutnya gagal diperbarui: ${error.message}`;
        }
      }
    }

    setForm(emptyCommunicationForm());
    setSelectedTemplateId("");
    setFormOpen(false);
    if (followUpUpdateError) {
      setFormError(followUpUpdateError);
      await loadPartner();
    } else {
      setSuccessMessage("Komunikasi berhasil dicatat.");
      await loadLogs(partner?.media_targets.map((target) => target.id) ?? []);
      if (form.next_follow_up_at) {
        await loadPartner();
      }
    }

    setSavingLog(false);
  }

  async function saveTarget(values: TargetEditValues) {
    if (!supabase || !activeTarget) {
      setTargetError("Target atau koneksi Supabase tidak tersedia.");
      return;
    }

    setSavingTarget(true);
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
      .eq("id", activeTarget.id);

    if (error) {
      console.error("Gagal memperbarui target media:", error);
      setTargetError(error.message);
      setSavingTarget(false);
      return;
    }

    setEditingTargetId(null);
    setSavingTarget(false);
    setSuccessMessage("Target media berhasil diperbarui.");
    await loadPartner();
  }

  if (loading) {
    return (
      <div className="page-stack">
        <DataState
          kind="loading"
          title="Memuat detail media"
          detail="Mengambil target dan riwayat komunikasi."
        />
      </div>
    );
  }

  if (errorMessage || !partner) {
    return (
      <div className="page-stack">
        <DataState
          kind="error"
          title="Detail media tidak dapat dimuat"
          detail={errorMessage || "Data media tidak ditemukan."}
        />
        <Link className="text-link" to="/media">
          Kembali ke Media Partner
        </Link>
      </div>
    );
  }

  return (
    <div className="page-stack media-detail-page">
      <section className="page-intro">
        <p className="eyebrow">PROFIL PARTNER</p>
        <h2>{partner.name}</h2>

        {partner.instagram || partner.website_url ? (
          <div className="social-links">
            {partner.instagram && (
              <a
                className="social-link"
                href={buildInstagramUrl(partner.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka Instagram ${partner.name}`}
              >
                <Instagram size={15} aria-hidden="true" />
                {partner.instagram}
              </a>
            )}

            {partner.website_url && (
              <a
                className="social-link"
                href={partner.website_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Buka website ${partner.name}`}
              >
                <Globe size={15} aria-hidden="true" />
                Website
              </a>
            )}
          </div>
        ) : (
          <p className="page-intro__description">
            Instagram dan website belum dicatat.
          </p>
        )}

        {partner.description && (
          <p className="page-intro__description">{partner.description}</p>
        )}

        <Link className="text-link" to="/media">
          Kembali ke Media Partner
        </Link>
      </section>

      {successMessage && (
        <p className="inline-notice inline-notice--success" role="status">
          {successMessage}
        </p>
      )}

      <section className="target-detail-list" aria-label="Target media">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEGIATAN DAN TINDAK LANJUT</p>
            <h3>Target media</h3>
          </div>
        </div>

        {partner.media_targets.length === 0 ? (
          <DataState
            kind="empty"
            title="Belum ada target untuk media ini"
            detail="Tambahkan target dari halaman Media Partners sebelum mencatat komunikasi."
          />
        ) : (
          partner.media_targets.map((target) => (
            <article
              className={`target-detail${
                activeTargetId === target.id ? " target-detail--active" : ""
              }`}
              key={target.id}
            >
              <div className="target-detail__summary">
                <div>
                  <h4>{MEDIA_ACTIVITY_LABELS[target.activity]}</h4>
                  <p>
                    {MEDIA_STATUS_LABELS[target.status]} ·{" "}
                    {target.assigned_member?.full_name ?? "PIC belum ditentukan"}
                  </p>
                  <p>
                    Follow-up:{" "}
                    {target.follow_up_at
                      ? communicationDateFormatter.format(
                          new Date(target.follow_up_at),
                        )
                      : "Belum dijadwalkan"}
                  </p>
                  <p>{target.notes || "Belum ada catatan."}</p>
                </div>
                <div className="target-detail__actions">
                  <button
                    type="button"
                    className="button button--secondary"
                    aria-pressed={activeTargetId === target.id}
                    onClick={() => {
                      setActiveTargetId(target.id);
                      setFormOpen(false);
                    }}
                  >
                    {activeTargetId === target.id
                      ? "Target dipilih"
                      : "Pilih target"}
                  </button>
                  <button
                    type="button"
                    className="button button--secondary"
                    aria-expanded={editingTargetId === target.id}
                    onClick={() =>
                      setEditingTargetId((current) =>
                        current === target.id ? null : target.id,
                      )
                    }
                  >
                    {editingTargetId === target.id
                      ? "Tutup edit"
                      : "Edit target"}
                  </button>
                </div>
              </div>

              {editingTargetId === target.id && activeTargetId === target.id && (
                <TargetEditForm
                  key={target.id}
                  target={target}
                  members={members}
                  saving={savingTarget}
                  error={targetError}
                  onCancel={() => {
                    setEditingTargetId(null);
                    setTargetError("");
                  }}
                  onSave={(values) => void saveTarget(values)}
                />
              )}
            </article>
          ))
        )}
      </section>

      {activeTarget && (
        <section
          className="communication-section"
          id="communication"
          aria-labelledby="communication-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">CATATAN HUMAS</p>
              <h3 id="communication-heading">Riwayat Komunikasi</h3>
              <p className="communication-section__target">
                {partner.name} · {MEDIA_ACTIVITY_LABELS[activeTarget.activity]}
              </p>
            </div>
            <button
              type="button"
              className="button button--primary"
              aria-expanded={formOpen}
              onClick={() => {
                setFormOpen((open) => !open);
                setFormError("");
              }}
            >
              {formOpen ? "Tutup formulir" : "Tambah Komunikasi"}
            </button>
          </div>

          {formError && (
            <p className="form-error" role="alert">
              {formError}
            </p>
          )}

          {formOpen && (
            <form
              className="communication-form"
              onSubmit={(event) => void saveCommunication(event)}
            >
              <label className="form-field">
                <span>Jenis komunikasi *</span>
                <select
                  value={form.type}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (isCommunicationType(value)) {
                      updateForm("type", value);
                    }
                  }}
                  required
                >
                  {COMMUNICATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {COMMUNICATION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Gunakan Template</span>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => applyMessageTemplate(event.target.value)}
                  disabled={templatesLoading || messageTemplates.length === 0}
                >
                  <option value="">
                    {templatesLoading
                      ? "Memuat template..."
                      : messageTemplates.length === 0
                        ? "Belum ada template"
                        : "Pilih template"}
                  </option>
                  {messageTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {TEMPLATE_CHANNEL_LABELS[template.channel]}
                    </option>
                  ))}
                </select>
              </label>

              {templatesError ? (
                <p className="form-error form-field--full" role="alert">
                  Template belum dapat dimuat ({templatesError}). Anda tetap
                  dapat mengisi pesan secara manual.
                </p>
              ) : (
                <p className="template-use-hint form-field--full">
                  Template hanya mengisi subject dan pesan. Pesan tidak dikirim
                  otomatis.
                </p>
              )}

              <label className="form-field">
                <span>Subject</span>
                <input
                  value={form.subject}
                  onChange={(event) =>
                    updateForm("subject", event.target.value)
                  }
                />
              </label>

              <label className="form-field form-field--full">
                <span>Pesan</span>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(event) =>
                    updateForm("message", event.target.value)
                  }
                />
              </label>

              <label className="form-field form-field--full">
                <span>Response</span>
                <textarea
                  rows={3}
                  value={form.response}
                  onChange={(event) =>
                    updateForm("response", event.target.value)
                  }
                />
              </label>

              <label className="form-field">
                <span>Tanggal/waktu komunikasi *</span>
                <input
                  type="datetime-local"
                  value={form.contacted_at}
                  onChange={(event) =>
                    updateForm("contacted_at", event.target.value)
                  }
                  required
                />
              </label>

              <label className="form-field">
                <span>Follow-up berikutnya</span>
                <input
                  type="datetime-local"
                  value={form.next_follow_up_at}
                  onChange={(event) =>
                    updateForm("next_follow_up_at", event.target.value)
                  }
                />
              </label>

              <div className="communication-form__actions form-field--full">
                <span>
                  Dicatat sebagai {member?.full_name ?? "anggota aktif"}
                </span>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingLog}
                >
                  {savingLog ? "Menyimpan..." : "Simpan komunikasi"}
                </button>
              </div>
            </form>
          )}

          <div className="communication-history">
            {logsLoading ? (
              <DataState
                kind="loading"
                title="Memuat riwayat komunikasi"
                detail="Mengambil catatan untuk target yang dipilih."
              />
            ) : logsError ? (
              <DataState
                kind="error"
                title="Riwayat komunikasi gagal dimuat"
                detail={logsError}
              />
            ) : targetLogs.length === 0 ? (
              <DataState
                kind="empty"
                title="Belum ada komunikasi"
                detail="Catatan komunikasi untuk target ini akan tampil setelah disimpan."
              />
            ) : (
              targetLogs.map((log) => {
                const recorder = members.find(
                  (item) => item.id === log.created_by,
                );

                return (
                  <article className="communication-entry" key={log.id}>
                    <div className="communication-entry__meta">
                      <strong>{COMMUNICATION_TYPE_LABELS[log.type]}</strong>
                      <time dateTime={log.contacted_at}>
                        {communicationDateFormatter.format(
                          new Date(log.contacted_at),
                        )}
                      </time>
                    </div>
                    <h4>{log.subject || "Tanpa subject"}</h4>
                    <dl className="communication-entry__content">
                      <div>
                        <dt>Pesan</dt>
                        <dd>{log.message || "Tidak ada pesan."}</dd>
                      </div>
                      <div>
                        <dt>Response</dt>
                        <dd>{log.response || "Belum ada response."}</dd>
                      </div>
                    </dl>
                    <p className="communication-entry__recorder">
                      Dicatat oleh: {recorder?.full_name ?? "Anggota tidak tersedia"}
                    </p>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}
    </div>
  );
}
