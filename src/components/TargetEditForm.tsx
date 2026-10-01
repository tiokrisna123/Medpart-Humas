import { useState } from "react";

import {
  MEDIA_ACTIVITIES,
  MEDIA_ACTIVITY_LABELS,
  MEDIA_STATUSES,
  MEDIA_STATUS_LABELS,
  type MediaActivity,
  type MediaStatus,
} from "../data/media";
import {
  toDateTimeLocalValue,
  type FollowUpTarget,
} from "../data/followUps";
import type { TeamMember } from "../lib/MemberContext";

export type TargetEditValues = {
  activity: MediaActivity;
  status: MediaStatus;
  assigned_to: string;
  follow_up_at: string;
  notes: string;
};

type TargetEditFormProps = {
  target: FollowUpTarget;
  members: TeamMember[];
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (values: TargetEditValues) => void;
};

function isMediaActivity(value: string): value is MediaActivity {
  return MEDIA_ACTIVITIES.some((item) => item === value);
}

function isMediaStatus(value: string): value is MediaStatus {
  return MEDIA_STATUSES.some((item) => item === value);
}

export function TargetEditForm({
  target,
  members,
  saving,
  error,
  onCancel,
  onSave,
}: TargetEditFormProps) {
  const [activity, setActivity] = useState<MediaActivity>(target.activity);
  const [status, setStatus] = useState<MediaStatus>(target.status);
  const [assignedTo, setAssignedTo] = useState(target.assigned_to ?? "");
  const [followUpAt, setFollowUpAt] = useState(
    target.follow_up_at
      ? toDateTimeLocalValue(target.follow_up_at)
      : "",
  );
  const [notes, setNotes] = useState(target.notes ?? "");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      activity,
      status,
      assigned_to: assignedTo,
      follow_up_at: followUpAt,
      notes,
    });
  }

  return (
    <form className="target-edit-form" onSubmit={handleSubmit}>
      <label className="form-field">
        <span>Kegiatan</span>
        <select
          value={activity}
          onChange={(event) => {
            const value = event.target.value;
            if (isMediaActivity(value)) {
              setActivity(value);
            }
          }}
        >
          {MEDIA_ACTIVITIES.map((item) => (
            <option key={item} value={item}>
              {MEDIA_ACTIVITY_LABELS[item]}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Status</span>
        <select
          value={status}
          onChange={(event) => {
            const value = event.target.value;
            if (isMediaStatus(value)) {
              setStatus(value);
            }
          }}
        >
          {MEDIA_STATUSES.map((item) => (
            <option key={item} value={item}>
              {MEDIA_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>PIC</span>
        <select
          value={assignedTo}
          onChange={(event) => setAssignedTo(event.target.value)}
        >
          <option value="">Belum ditentukan</option>
          {members
            .filter((member) => member.is_active)
            .map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
        </select>
      </label>

      <label className="form-field">
        <span>Follow-up</span>
        <input
          type="datetime-local"
          value={followUpAt}
          onChange={(event) => setFollowUpAt(event.target.value)}
        />
      </label>

      <label className="form-field form-field--full">
        <span>Catatan</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </label>

      {error && (
        <p className="form-error form-field--full" role="alert">
          {error}
        </p>
      )}

      <div className="target-edit-form__actions form-field--full">
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Batal
        </button>
        <button
          type="submit"
          className="button button--primary"
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "Simpan target"}
        </button>
      </div>
    </form>
  );
}
