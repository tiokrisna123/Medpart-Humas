import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";

import { DataState } from "./DataState";
import {
  createMessageTemplate,
  deleteMessageTemplate,
  getMessageTemplateErrorMessage,
  loadMessageTemplates,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_CHANNELS,
  updateMessageTemplate,
  type MessageTemplate,
  type MessageTemplateDraft,
} from "../data/templates";
import { isCommunicationType } from "../data/communications";
import { useMember } from "../lib/MemberContext";

type TemplateForm = {
  name: string;
  channel: MessageTemplateDraft["channel"];
  subject: string;
  content: string;
  description: string;
};

type ChannelFilter = "all" | MessageTemplateDraft["channel"];

const updatedAtFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function emptyForm(): TemplateForm {
  return {
    name: "",
    channel: "whatsapp",
    subject: "",
    content: "",
    description: "",
  };
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Waktu pembaruan tidak tersedia"
    : updatedAtFormatter.format(date);
}

export function MessageTemplatesPage() {
  const { member, members } = useMember();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const initialLoadStartedRef = useRef(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  async function refreshTemplates() {
    setLoading(true);
    setLoadError("");

    try {
      setTemplates(await loadMessageTemplates());
      return true;
    } catch (error) {
      console.error("Gagal mengambil message templates:", error);
      setTemplates([]);
      setLoadError(getMessageTemplateErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    void refreshTemplates();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;

    const focusTimer = window.setTimeout(
      () => nameInputRef.current?.focus(),
      0,
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        closeModal();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements =
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
        );
      if (!focusableElements?.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [modalOpen, saving]);

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");

    return templates.filter((template) => {
      const matchesChannel =
        channelFilter === "all" || template.channel === channelFilter;
      const searchableText = [
        template.name,
        template.subject,
        template.content,
        template.description,
        TEMPLATE_CHANNEL_LABELS[template.channel],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("id-ID");

      return matchesChannel && (!query || searchableText.includes(query));
    });
  }, [channelFilter, search, templates]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(template: MessageTemplate) {
    setEditingId(template.id);
    setForm({
      name: template.name,
      channel: template.channel,
      subject: template.subject ?? "",
      content: template.content,
      description: template.description ?? "",
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFormError("");
    window.setTimeout(() => addButtonRef.current?.focus(), 0);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const name = form.name.trim();
    const content = form.content.trim();
    if (!name || !content) {
      setFormError("Isi nama template dan pesan sebelum menyimpan.");
      return;
    }
    if (!member) {
      setFormError("Anggota aktif tidak ditemukan. Masuk kembali lalu coba lagi.");
      return;
    }

    const draft: MessageTemplateDraft = {
      name,
      channel: form.channel,
      subject: form.subject.trim() || null,
      content,
      description: form.description.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await updateMessageTemplate(editingId, draft);
        setSuccessMessage("Template berhasil diperbarui.");
      } else {
        await createMessageTemplate(draft, member.id);
        setSuccessMessage("Template berhasil ditambahkan.");
      }
      setModalOpen(false);
      await refreshTemplates();
    } catch (error) {
      console.error("Gagal menyimpan message template:", error);
      setFormError(getMessageTemplateErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate(template: MessageTemplate) {
    if (!member) {
      setOperationError(
        "Anggota aktif tidak ditemukan. Masuk kembali lalu coba lagi.",
      );
      return;
    }

    setSuccessMessage("");
    setOperationError("");
    try {
      await createMessageTemplate(
        {
          name: `${template.name} (salinan)`,
          channel: template.channel,
          subject: template.subject,
          content: template.content,
          description: template.description,
        },
        member.id,
      );
      setSuccessMessage("Salinan template berhasil dibuat.");
      await refreshTemplates();
    } catch (error) {
      console.error("Gagal menduplikasi message template:", error);
      setOperationError(getMessageTemplateErrorMessage(error));
    }
  }

  async function handleDelete(template: MessageTemplate) {
    if (!window.confirm(`Hapus template "${template.name}"?`)) return;

    setSuccessMessage("");
    setOperationError("");
    try {
      await deleteMessageTemplate(template.id);
      setSuccessMessage("Template berhasil dihapus.");
      await refreshTemplates();
    } catch (error) {
      console.error("Gagal menghapus message template:", error);
      setOperationError(getMessageTemplateErrorMessage(error));
    }
  }

  return (
    <div className="page-stack template-page">
      <section className="page-section">
        <header className="page-section__header template-page__header">
          <div>
            <p className="eyebrow">PESAN HUMAS</p>
            <h2>Message Templates</h2>
            <p>
              Kumpulan template komunikasi untuk kebutuhan Humas MULIH.
            </p>
          </div>
          <button
            ref={addButtonRef}
            type="button"
            className="button button--primary"
            onClick={openCreate}
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Template
          </button>
        </header>
      </section>

      {successMessage && (
        <p className="inline-notice inline-notice--success" role="status">
          {successMessage}
        </p>
      )}
      {operationError && (
        <p className="form-error" role="alert">
          {operationError}
        </p>
      )}

      <section className="template-workspace" aria-label="Daftar template">
        <div className="template-toolbar">
          <label className="search-field template-toolbar__search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Cari template</span>
            <input
              type="search"
              placeholder="Cari template..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="template-toolbar__filter">
            <span>Channel</span>
            <select
              value={channelFilter}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "all" || isCommunicationType(value)) {
                  setChannelFilter(value);
                }
              }}
            >
              <option value="all">Semua</option>
              {TEMPLATE_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {TEMPLATE_CHANNEL_LABELS[channel]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button--secondary template-toolbar__refresh"
            onClick={() => void refreshTemplates()}
            disabled={loading}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {loading ? "Memuat..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <DataState
            kind="loading"
            title="Memuat template pesan"
            detail="Mengambil template komunikasi dari Supabase."
          />
        ) : loadError ? (
          <DataState
            kind="error"
            title="Template pesan belum dapat dimuat"
            detail={`${loadError} Pastikan tabel public.message_templates tersedia dan aksesnya sudah dikonfigurasi.`}
          />
        ) : templates.length === 0 ? (
          <DataState
            kind="empty"
            title="Belum ada template pesan"
            detail="Tambahkan template agar tim dapat menggunakannya kembali saat mencatat komunikasi."
          />
        ) : filteredTemplates.length === 0 ? (
          <div className="template-filter-empty">
            <DataState
              kind="empty"
              title="Tidak ada template yang cocok"
              detail="Ubah kata pencarian atau pilih channel lain."
            />
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setSearch("");
                setChannelFilter("all");
              }}
            >
              Hapus filter
            </button>
          </div>
        ) : (
          <div className="template-grid">
            {filteredTemplates.map((template) => {
              const creator = members.find(
                (candidate) => candidate.id === template.created_by,
              );

              return (
                <article className="template-card" key={template.id}>
                  <div className="template-card__heading">
                    <div className="template-card__identity">
                      <h3>{template.name}</h3>
                      <span className="status-badge">
                        {TEMPLATE_CHANNEL_LABELS[template.channel]}
                      </span>
                    </div>
                    <div className="template-card__actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Edit ${template.name}`}
                        onClick={() => openEdit(template)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Duplikat ${template.name}`}
                        onClick={() => void handleDuplicate(template)}
                      >
                        <Copy size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Hapus ${template.name}`}
                        onClick={() => void handleDelete(template)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {template.subject && (
                    <p className="template-card__subject">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="template-card__preview">{template.content}</p>
                  {template.description && (
                    <p className="template-card__description">
                      {template.description}
                    </p>
                  )}
                  <div className="template-card__meta">
                    <span>
                      Dibuat oleh {creator?.full_name ?? "Anggota tidak tersedia"}
                    </span>
                    <time dateTime={template.updated_at}>
                      Diperbarui {formatUpdatedAt(template.updated_at)}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            ref={dialogRef}
            className="modal template-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-modal-title"
          >
            <div className="modal__header">
              <div>
                <p className="eyebrow">
                  {editingId ? "PERBARUI PESAN" : "PESAN BARU"}
                </p>
                <h2 id="template-modal-title">
                  {editingId ? "Edit Template" : "Tambah Template"}
                </h2>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Tutup formulir"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={17} aria-hidden="true" />
              </button>
            </div>

            <form className="modal__body" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field form-field--full">
                  <span>Nama Template *</span>
                  <input
                    ref={nameInputRef}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Channel *</span>
                  <select
                    value={form.channel}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (isCommunicationType(value)) {
                        setForm((current) => ({
                          ...current,
                          channel: value,
                        }));
                      }
                    }}
                    required
                  >
                    {TEMPLATE_CHANNELS.map((channel) => (
                      <option key={channel} value={channel}>
                        {TEMPLATE_CHANNEL_LABELS[channel]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Subject</span>
                  <input
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        subject: event.target.value,
                      }))
                    }
                    maxLength={200}
                  />
                </label>

                <label className="form-field form-field--full">
                  <span>Isi Pesan *</span>
                  <textarea
                    rows={7}
                    value={form.content}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <p className="template-placeholder-help form-field--full">
                  Placeholder yang dapat ditulis sebagai teks biasa:{" "}
                  <code>{"{{nama_media}}"}</code>{" "}
                  <code>{"{{nama_kontak}}"}</code>{" "}
                  <code>{"{{kegiatan}}"}</code>{" "}
                  <code>{"{{pic}}"}</code>
                </p>

                <label className="form-field form-field--full">
                  <span>Deskripsi</span>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    maxLength={500}
                  />
                </label>
              </div>

              {formError && (
                <p className="form-error template-form-error" role="alert">
                  {formError}
                </p>
              )}

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
                  {saving ? "Menyimpan..." : "Simpan Template"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
