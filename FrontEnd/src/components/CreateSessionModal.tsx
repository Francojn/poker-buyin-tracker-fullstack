import { useState, type ChangeEvent, type FormEvent } from "react";
import type { CreateSessionPayload } from "../types/api";

const initialState: CreateSessionPayload = {
  name: "",
  startTime: "",
  location: "",
  notes: ""
};

export default function CreateSessionModal({
  open,
  loading,
  error,
  onClose,
  onSubmit
}: {
  open: boolean;
  loading: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: CreateSessionPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateSessionPayload>(initialState);

  if (!open) {
    return null;
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      notes: form.notes?.trim() || undefined
    });
    setForm(initialState);
  };

  const handleClose = () => {
    setForm(initialState);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">New Session</p>
            <h3>Create a poker session</h3>
          </div>
          <button type="button" className="button button-secondary" onClick={handleClose}>
            Close
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Session name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Friday Night Game"
              required
            />
          </label>

          <label className="form-field">
            <span>Start time</span>
            <input
              name="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={handleChange}
              required
            />
          </label>

          <label className="form-field">
            <span>Location</span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Home game"
              required
            />
          </label>

          <label className="form-field form-field-full">
            <span>Notes</span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Optional notes"
              rows={4}
            />
          </label>

          {error ? <p className="form-error form-field-full">{error}</p> : null}

          <div className="form-actions form-field-full">
            <button type="button" className="button button-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
