import { useEffect, useMemo, useRef, useState } from 'react';

const defaultForm = {
  name: '',
  startMonth: '',
  monthsCount: '6',
  contributionAmount: '',
  drawDayOfMonth: '5',
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export default function CycleManagementPage({
  cycles,
  members,
  creatingCycle,
  deletingCycleId,
  onCreateCycle,
  onDeleteCycle,
  onStartCycle,
  onOpenCycle,
  canManageCycles,
  onAdminDenied,
}) {
  const [form, setForm] = useState(defaultForm);
  const [candidateId, setCandidateId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const initializedSelection = useRef(false);

  useEffect(() => {
    if (initializedSelection.current) return;
    if (!members.length) return;
    setSelectedMemberIds(members.map((member) => member.id));
    initializedSelection.current = true;
  }, [members]);

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedMemberIds.includes(member.id)),
    [members, selectedMemberIds]
  );

  const availableMembers = useMemo(
    () => members.filter((member) => !selectedMemberIds.includes(member.id)),
    [members, selectedMemberIds]
  );

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addCandidate() {
    const parsed = Number(candidateId);
    if (!parsed || selectedMemberIds.includes(parsed)) return;
    setSelectedMemberIds((current) => [...current, parsed]);
    setCandidateId('');
  }

  function removeMember(memberId) {
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId));
  }

  async function submitCycle(event) {
    event.preventDefault();
    if (!canManageCycles) {
      onAdminDenied?.();
      return;
    }

    setMessage('');
    setError('');

    try {
      const created = await onCreateCycle({
        name: form.name,
        startMonth: form.startMonth,
        monthsCount: Number(form.monthsCount),
        contributionAmount: Number(form.contributionAmount),
        drawDayOfMonth: Number(form.drawDayOfMonth),
        memberIds: selectedMemberIds,
      });

      setMessage(`Created ${created.name}.`);
      setForm(defaultForm);
      setSelectedMemberIds(members.map((member) => member.id));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to create cycle.');
    }
  }

  async function handleDeleteCycle(cycle) {
    if (!canManageCycles) {
      onAdminDenied?.();
      return;
    }

    const confirmed = window.confirm(
      `Delete ${cycle.name}? This will permanently remove this draft cycle and all its monthly records.`
    );
    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      await onDeleteCycle(cycle.id);
      setMessage(`Deleted ${cycle.name}.`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to delete cycle.');
    }
  }

  async function handleStartCycle(cycle) {
    if (!canManageCycles) {
      onAdminDenied?.();
      return;
    }

    const confirmed = window.confirm(`Start ${cycle.name}? This will move it from DRAFT to ONGOING.`);
    if (!confirmed) return;

    setMessage('');
    setError('');

    try {
      await onStartCycle?.(cycle.id);
      setMessage(`Started ${cycle.name}.`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to start cycle.');
    }
  }

  return (
    <section className="cycle-management-layout fade-in-up">
      <article className="panel surface-card">
        <div className="panel-heading">
          <div>
            <div className="auth-eyebrow">Cycles</div>
            <h2>Create Cycle</h2>
            <p>Create a new draft cycle with selected members and auto-generated months.</p>
          </div>
        </div>

        {message ? <div className="auth-message">{message}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}

        <form className="cycle-create-form" onSubmit={submitCycle}>
          <label className="auth-field">
            <span>Cycle name</span>
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Fourth Cycle"
              required
            />
          </label>

          <label className="auth-field">
            <span>Start month</span>
            <input
              type="month"
              value={form.startMonth}
              onChange={(event) => updateField('startMonth', event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Total months</span>
            <input
              type="number"
              min="1"
              max="24"
              value={form.monthsCount}
              onChange={(event) => updateField('monthsCount', event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Monthly contribution</span>
            <input
              type="number"
              min="1"
              step="1"
              value={form.contributionAmount}
              onChange={(event) => updateField('contributionAmount', event.target.value)}
              placeholder="15000"
              required
            />
          </label>

          <label className="auth-field">
            <span>Draw day of month</span>
            <input
              type="number"
              min="1"
              max="31"
              value={form.drawDayOfMonth}
              onChange={(event) => updateField('drawDayOfMonth', event.target.value)}
              required
            />
          </label>

          <div className="picker-select-row">
            <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
              <option value="">Add member</option>
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button type="button" className="secondary-button" onClick={addCandidate}>
              Add
            </button>
          </div>

          <div className="selected-chip-list">
            {selectedMembers.map((member) => (
              <div key={member.id} className="selected-chip">
                <span>{member.name}</span>
                <button type="button" onClick={() => removeMember(member.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="member-action-row">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedMemberIds(members.map((member) => member.id))}
            >
              Select all
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setSelectedMemberIds([])}
            >
              Clear
            </button>
          </div>

          <button className="primary-button" type="submit" disabled={creatingCycle}>
            {creatingCycle ? 'Creating cycle...' : 'Create cycle'}
            {!canManageCycles ? <span className="lock-tag">Admin</span> : null}
          </button>
          {!canManageCycles ? <p className="helper-message">Only Admin User can create cycles.</p> : null}
        </form>
      </article>

      <article className="panel surface-card">
        <div className="panel-heading">
          <div>
            <div className="auth-eyebrow">Cycle Directory</div>
            <h2>Existing Cycles</h2>
            <p>Open any cycle in detailed view and update member payment status.</p>
          </div>
        </div>

        <div className="cycle-overview-list">
          {cycles.map((cycle) => (
            <article key={cycle.id} className="cycle-overview-card">
              <div className="cycle-overview-top">
                <strong>{cycle.name}</strong>
                <span className={`status-pill status-${String(cycle.status).toLowerCase()}`}>
                  {cycle.status}
                </span>
              </div>
              <span>
                {cycle.start_month} to {cycle.end_month}
              </span>
              <p>
                {cycle.members.length} members, {formatCurrency(cycle.contribution_amount)} contribution.
              </p>
              <div className="cycle-card-actions">
                <button type="button" className="secondary-button" onClick={() => onOpenCycle(cycle.id)}>
                  Open details
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleStartCycle(cycle)}
                  disabled={cycle.status !== 'DRAFT'}
                  title={cycle.status !== 'DRAFT' ? 'Only DRAFT cycles can be started' : ''}
                >
                  Start cycle
                </button>
                <button
                  type="button"
                  className="secondary-button danger-button"
                  onClick={() => handleDeleteCycle(cycle)}
                  disabled={!['DRAFT', 'ONGOING'].includes(cycle.status) || deletingCycleId === cycle.id}
                  title={
                    !['DRAFT', 'ONGOING'].includes(cycle.status) ? 'Only DRAFT/ONGOING cycles can be deleted' : ''
                  }
                >
                  {deletingCycleId === cycle.id ? 'Deleting...' : 'Delete cycle'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
