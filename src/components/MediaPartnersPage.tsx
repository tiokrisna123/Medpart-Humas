import { useEffect, useRef, useState } from "react";
import {
  Plus,
  RefreshCw,
  Search,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { DataState } from "./DataState";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { toDateTimeLocalValue } from "../data/followUps";
import { useMember, type TeamMember } from "../lib/MemberContext";
import {
  MEDIA_ACTIVITIES,
  MEDIA_ACTIVITY_LABELS,
  MEDIA_STATUSES,
  MEDIA_STATUS_LABELS,
  type MediaStatus,
} from "../data/media";

const ACTIVITIES = MEDIA_ACTIVITIES;
const ACTIVITY_LABELS = MEDIA_ACTIVITY_LABELS;
const STATUSES = MEDIA_STATUSES;
const STATUS_LABELS = MEDIA_STATUS_LABELS;
const PIC_ORDER = [
  "I Gusti Ngurah Mahendra Putra",
  "I Kadek Tegar Suanda",
  "Ni Putu Nathania Widayu Putri",
  "Desak Made Listiyanti Praptiwi",
  "Ni Putu Gitali Hrdayani Rajan",
  "Davin Pradipa Ramadan",
  "Tio Krisna",
] as const;
const KNOWN_PIC_NAMES: ReadonlySet<string> = new Set(PIC_ORDER);

type Activity = (typeof ACTIVITIES)[number];
type Status = MediaStatus;

function isActivity(value: string): value is Activity {
  return ACTIVITIES.some((activity) => activity === value);
}

function isStatus(value: string): value is Status {
  return STATUSES.some((status) => status === value);
}

function getStatusBadgeClass(status: Status | undefined) {
  switch (status) {
    case "not_contacted":
      return "status-badge--neutral";
    case "waiting_response":
      return "status-badge--warning";
    case "response_received":
    case "contacted":
      return "status-badge--success";
    case "rejected":
      return "status-badge--danger";
    default:
      return "status-badge--neutral";
  }
}

type MediaPartner = {
  id: string;
  name: string;
  instagram: string | null;
  description: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type MediaTarget = {
  id: string;
  media_partner_id: string;
  activity: Activity;
  status: Status;
  assigned_to: string | null;
  follow_up_at: string | null;
  notes: string | null;
};

type MediaRow = MediaPartner & {
  targets: MediaTarget[];
};

type FormData = {
  name: string;
  instagram: string;
  description: string;
  website_url: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  activity: Activity;
  status: Status;
  assigned_to: string;
  follow_up_at: string;
  notes: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  instagram: "",
  description: "",
  website_url: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  activity: "open_call",
  status: "not_contacted",
  assigned_to: "",
  follow_up_at: "",
  notes: "",
};

export function MediaPartnersPage() {
  const { member, members } = useMember();
  const [searchParams] = useSearchParams();
  const routeQuery = searchParams.get("q") ?? "";

  const [media, setMedia] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchText, setSearchText] = useState(routeQuery);
  const [selectedPic, setSelectedPic] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaRow | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const modalRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalTriggerRef = useRef<HTMLElement | null>(null);

  async function loadMedia() {
    if (!supabase) {
      setErrorMessage("Supabase belum terhubung.");
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
        contact_name,
        contact_phone,
        contact_email,
        created_by,
        created_at,
        updated_at,
        media_targets (
          id,
          media_partner_id,
          activity,
          status,
          assigned_to,
          follow_up_at,
          notes
        )
      `)
      .order("name");

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      setMedia([]);
    } else {
      setMedia(
        (data ?? []).map((item) => ({
          ...item,
          targets: item.media_targets ?? [],
        })),
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMedia();
  }, []);

  useEffect(() => {
    setSearchText(routeQuery);
  }, [routeQuery]);

  useEffect(() => {
    if (!modalOpen) return;

    const focusTimer = window.setTimeout(
      () => nameInputRef.current?.focus(),
      0,
    );
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements =
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
        );
      if (!focusableElements?.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const focusOutsideDialog =
        !modalRef.current?.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === first || focusOutsideDialog)) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || focusOutsideDialog)
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen, saving]);

  function openAddModal() {
    modalTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setEditingMedia(null);

    setForm({
      ...EMPTY_FORM,
      assigned_to: member?.id ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  function openEditModal(item: MediaRow) {
    const target = item.targets[0];

    modalTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setEditingMedia(item);

    setForm({
      name: item.name,
      instagram: item.instagram ?? "",
      description: item.description ?? "",
      website_url: item.website_url ?? "",
      contact_name: item.contact_name ?? "",
      contact_phone: item.contact_phone ?? "",
      contact_email: item.contact_email ?? "",
      activity: target?.activity ?? "open_call",
      status: target?.status ?? "not_contacted",
      assigned_to: target?.assigned_to ?? member?.id ?? "",
      follow_up_at: target?.follow_up_at
        ? toDateTimeLocalValue(target.follow_up_at)
        : "",
      notes: target?.notes ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingMedia(null);
    setForm(EMPTY_FORM);
    window.setTimeout(() => modalTriggerRef.current?.focus(), 0);
  }

  function updateForm<K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErrorMessage("Supabase belum terhubung.");
      return;
    }

    if (!member) {
      setErrorMessage("Member belum dipilih.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Nama media wajib diisi.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingMedia) {
        const { error: mediaError } = await supabase
          .from("media_partners")
          .update({
            name: form.name.trim(),
            instagram: form.instagram.trim() || null,
            description: form.description.trim() || null,
            website_url: form.website_url.trim() || null,
            contact_name: form.contact_name.trim() || null,
            contact_phone: form.contact_phone.trim() || null,
            contact_email: form.contact_email.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMedia.id);

        if (mediaError) throw mediaError;

        const existingTarget = editingMedia.targets[0];

        if (existingTarget) {
          const { error: targetError } = await supabase
            .from("media_targets")
            .update({
              activity: form.activity,
              status: form.status,
              assigned_to: form.assigned_to || null,
              follow_up_at: form.follow_up_at
                ? new Date(form.follow_up_at).toISOString()
                : null,
              notes: form.notes.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingTarget.id);

          if (targetError) throw targetError;
        } else {
          const { error: targetError } = await supabase
            .from("media_targets")
            .insert({
              media_partner_id: editingMedia.id,
              activity: form.activity,
              status: form.status,
              assigned_to: form.assigned_to || null,
              follow_up_at: form.follow_up_at
                ? new Date(form.follow_up_at).toISOString()
                : null,
              notes: form.notes.trim() || null,
              created_by: member.id,
            });

          if (targetError) throw targetError;
        }

        setSuccessMessage("Media berhasil diperbarui.");
      } else {
        const { data: newMedia, error: mediaError } = await supabase
          .from("media_partners")
          .insert({
            name: form.name.trim(),
            instagram: form.instagram.trim() || null,
            description: form.description.trim() || null,
            website_url: form.website_url.trim() || null,
            contact_name: form.contact_name.trim() || null,
            contact_phone: form.contact_phone.trim() || null,
            contact_email: form.contact_email.trim() || null,
            created_by: member.id,
          })
          .select("id")
          .single();

        if (mediaError) throw mediaError;

        const { error: targetError } = await supabase
          .from("media_targets")
          .insert({
            media_partner_id: newMedia.id,
            activity: form.activity,
            status: form.status,
            assigned_to: form.assigned_to || null,
            follow_up_at: form.follow_up_at
              ? new Date(form.follow_up_at).toISOString()
              : null,
            notes: form.notes.trim() || null,
            created_by: member.id,
          });

        if (targetError) {
          await supabase
            .from("media_partners")
            .delete()
            .eq("id", newMedia.id);

          throw targetError;
        }

        setSuccessMessage("Media berhasil ditambahkan.");
      }

      await loadMedia();

      setModalOpen(false);
      setEditingMedia(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Terjadi kesalahan saat menyimpan data.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: MediaRow) {
    if (!supabase) return;

    const confirmed = window.confirm(
      `Hapus media "${item.name}"?\n\nData target media ini juga akan dihapus.`,
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase
      .from("media_partners")
      .delete()
      .eq("id", item.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Media berhasil dihapus.");
    await loadMedia();
  }

  function getTarget(item: MediaRow) {
    return item.targets[0] ?? null;
  }

  function getMemberName(id: string | null) {
    if (!id) return "—";

    return members.find((member) => member.id === id)?.full_name ?? "—";
  }

  const filteredMedia = media.filter((item) => {
    const query = searchText.trim().toLowerCase();
    const target = getTarget(item);
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      item.instagram?.toLowerCase().includes(query) ||
      item.contact_name?.toLowerCase().includes(query);
    const matchesPic =
      selectedPic === "all" ||
      getMemberName(target?.assigned_to ?? null) === selectedPic;
    const matchesStatus =
      selectedStatus === "all" ||
      target?.status === selectedStatus;

    return matchesSearch && matchesPic && matchesStatus;
  });

  const mediaGroups = new Map<string, MediaRow[]>();
  filteredMedia.forEach((item) => {
    const assignedName = getMemberName(
      getTarget(item)?.assigned_to ?? null,
    );
    const groupName =
      assignedName === "—" ? "Belum ditentukan" : assignedName;
    const group = mediaGroups.get(groupName) ?? [];
    group.push(item);
    mediaGroups.set(groupName, group);
  });

  const groupOrder = [
    ...PIC_ORDER,
    ...Array.from(mediaGroups.keys())
      .filter(
        (name) =>
          name !== "Belum ditentukan" &&
          !KNOWN_PIC_NAMES.has(name),
      )
      .sort((left, right) => left.localeCompare(right, "id")),
    "Belum ditentukan",
  ];
  const visibleGroups = groupOrder.flatMap((name) => {
    const items = mediaGroups.get(name);
    return items?.length ? [{ name, items }] : [];
  });

  return (
    <section className="page-section">
      <div className="page-section__header">
        <div>
          <span className="section-eyebrow">JARINGAN PUBLIKASI</span>

          <h2>Media Partner</h2>

          <p>
            Kelola dan pantau partner media untuk kegiatan Mulih.
          </p>
        </div>

        <div className="page-section__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={loadMedia}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>

          <button
            type="button"
            className="button button--primary"
            onClick={openAddModal}
          >
            <Plus size={16} />
            Tambah Media
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="data-state data-state--success" role="status">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="data-state data-state--error" role="alert">
          <strong>Terjadi kesalahan</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="data-toolbar media-page-toolbar">
        <div className="search-field">
          <Search size={17} aria-hidden="true" />

          <input
            type="search"
            aria-label="Cari media, Instagram, atau kontak"
            placeholder="Cari media, Instagram, atau kontak..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="media-filter-controls">
          <label className="media-filter">
            <span>PIC</span>
            <select
              value={selectedPic}
              onChange={(event) => setSelectedPic(event.target.value)}
            >
              <option value="all">Semua PIC</option>
              {PIC_ORDER.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label className="media-filter">
            <span>Status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="all">Semua Status</option>
              {(
                [
                  "not_contacted",
                  "waiting_response",
                  "response_received",
                  "rejected",
                ] as const
              ).map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <span className="data-toolbar__count">
          {filteredMedia.length} Media
        </span>
      </div>

      {loading ? (
        <DataState
          kind="loading"
          title="Memuat data media"
          detail="Mengambil daftar media partner beserta target kegiatannya."
        />
      ) : media.length === 0 ? (
        <DataState
          kind={isSupabaseConfigured ? "empty" : "setup"}
          title={
            isSupabaseConfigured
              ? "Belum ada media partner"
              : "Supabase belum dikonfigurasi"
          }
          detail={
            isSupabaseConfigured
              ? "Tambahkan media pertama dengan tombol Tambah Media di atas."
              : "Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env.local, lalu muat ulang halaman."
          }
        />
      ) : filteredMedia.length === 0 ? (
        <div className="data-state" role="status">
          <div>
            <h3>Tidak ada media yang cocok</h3>
            <p>
              Tidak ditemukan media untuk kata pencarian dan filter saat ini.
              Coba kata lain atau hapus filter PIC dan status.
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setSearchText("");
                setSelectedPic("all");
                setSelectedStatus("all");
              }}
            >
              Hapus pencarian & filter
            </button>
          </div>
        </div>
      ) : (
        <div className="media-groups">
          {visibleGroups.map((group) => (
            <section
              className="media-group"
              key={group.name}
              aria-label={`${group.name}, ${group.items.length} media`}
            >
              <div className="media-group__heading">
                <h3>{group.name}</h3>
                <span>{group.items.length} Media</span>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Media</th>
                      <th>Instagram</th>
                      <th>Kegiatan</th>
                      <th>Status</th>
                      <th>PIC</th>
                      <th>Tindak Lanjut</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {group.items.map((item) => {
                      const target = getTarget(item);

                      return (
                        <tr key={item.id}>
                          <td>
                            <Link
                              className="media-detail-link"
                              to={`/media/${item.id}`}
                            >
                              {item.name}
                            </Link>

                            {item.description && (
                              <small>{item.description}</small>
                            )}
                          </td>

                          <td>{item.instagram || "—"}</td>

                          <td>
                            {target?.activity
                              ? ACTIVITY_LABELS[target.activity]
                              : "—"}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${getStatusBadgeClass(target?.status)}`}
                            >
                              {target?.status
                                ? STATUS_LABELS[target.status]
                                : "—"}
                            </span>
                          </td>

                          <td>{getMemberName(target?.assigned_to ?? null)}</td>

                          <td>
                            {target?.follow_up_at
                              ? new Date(
                                  target.follow_up_at,
                                ).toLocaleDateString("id-ID")
                              : "—"}
                          </td>

                          <td>
                            <div className="table-actions">
                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Edit media ${item.name}`}
                                onClick={() => openEditModal(item)}
                              >
                                <Pencil size={16} aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                className="icon-button"
                                aria-label={`Hapus media ${item.name}`}
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            ref={modalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-modal-title"
          >
            <div className="modal__header">
              <div>
                <span className="section-eyebrow">
                  {editingMedia ? "EDIT MEDIA" : "MEDIA BARU"}
                </span>

                <h2 id="media-modal-title">
                  {editingMedia
                    ? "Edit Media"
                    : "Tambah Media"}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field form-field--full">
                  <span>Nama Media *</span>

                  <input
                    ref={nameInputRef}
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateForm("name", event.target.value)
                    }
                    placeholder="Contoh: Nama media"
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Instagram</span>

                  <input
                    type="text"
                    value={form.instagram}
                    onChange={(event) =>
                      updateForm("instagram", event.target.value)
                    }
                    placeholder="@username"
                  />
                </label>

                <label className="form-field">
                  <span>Website</span>

                  <input
                    type="url"
                    value={form.website_url}
                    onChange={(event) =>
                      updateForm("website_url", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>

                <label className="form-field form-field--full">
                  <span>Deskripsi</span>

                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateForm("description", event.target.value)
                    }
                    placeholder="Deskripsi singkat media..."
                    rows={3}
                  />
                </label>

                <label className="form-field">
                  <span>Nama Kontak</span>

                  <input
                    type="text"
                    value={form.contact_name}
                    onChange={(event) =>
                      updateForm("contact_name", event.target.value)
                    }
                    placeholder="Nama admin/kontak"
                  />
                </label>

                <label className="form-field">
                  <span>No. WhatsApp</span>

                  <input
                    type="tel"
                    value={form.contact_phone}
                    onChange={(event) =>
                      updateForm("contact_phone", event.target.value)
                    }
                    placeholder="08xxxxxxxxxx"
                  />
                </label>

                <label className="form-field">
                  <span>Email</span>

                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(event) =>
                      updateForm("contact_email", event.target.value)
                    }
                    placeholder="email@example.com"
                  />
                </label>

                <label className="form-field">
                  <span>Kegiatan *</span>

                  <select
                    value={form.activity}
                    onChange={(event) => {
                      if (isActivity(event.target.value)) {
                        updateForm("activity", event.target.value);
                      }
                    }}
                  >
                    {ACTIVITIES.map((activity) => (
                      <option key={activity} value={activity}>
                        {ACTIVITY_LABELS[activity]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Status *</span>

                  <select
                    value={form.status}
                    onChange={(event) => {
                      if (isStatus(event.target.value)) {
                        updateForm("status", event.target.value);
                      }
                    }}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>PIC</span>

                  <select
                    value={form.assigned_to}
                    onChange={(event) =>
                      updateForm("assigned_to", event.target.value)
                    }
                  >
                    <option value="">Pilih PIC</option>

                    {members
                      .filter((item: TeamMember) => item.is_active)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.full_name}
                        </option>
                      ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Follow-up</span>

                  <input
                    type="datetime-local"
                    value={form.follow_up_at}
                    onChange={(event) =>
                      updateForm("follow_up_at", event.target.value)
                    }
                  />
                </label>

                <label className="form-field form-field--full">
                  <span>Catatan</span>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm("notes", event.target.value)
                    }
                    placeholder="Catatan komunikasi atau tindak lanjut..."
                    rows={4}
                  />
                </label>
              </div>

              <div className="modal__footer">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="button button--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Menyimpan..."
                    : editingMedia
                      ? "Simpan Perubahan"
                      : "Simpan Media"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}