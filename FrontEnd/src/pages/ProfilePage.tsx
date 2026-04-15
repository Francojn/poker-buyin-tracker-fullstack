import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { updatePaymentLink } from "../api/users";
import { getErrorMessage } from "../utils/http";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [paymentLink, setPaymentLink] = useState(user?.paymentLink ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const updated = await updatePaymentLink(user!.id, paymentLink.trim() || null);
      updateUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <h2>Profile</h2>

      <article className="section-card" style={{ maxWidth: 480 }}>
        <h3>Account details</h3>
        <div className="stack-list">
          <div className="row-card">
            <span className="muted-text">Username</span>
            <strong>{user?.username}<span className="muted-text" style={{ fontWeight: 400 }}>#{user?.userCode}</span></strong>
          </div>
        </div>
      </article>

      <article className="section-card" style={{ maxWidth: 480 }}>
        <h3>Payment link</h3>
        <p className="helper-text">Share a payment link so others can pay you after sessions.</p>
        <form className="form-grid compact-form" onSubmit={handleSubmit}>
          <label className="form-field form-field-full">
            <span>Payment link</span>
            <input
              type="url"
              value={paymentLink}
              onChange={(event) => setPaymentLink(event.target.value)}
              placeholder="https://paypal.me/your-link"
            />
          </label>
          {error ? <p className="form-error form-field-full">{error}</p> : null}
          {success ? <p className="form-success form-field-full">Payment link updated.</p> : null}
          <div className="form-actions form-field-full">
            <button type="submit" className="button" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
