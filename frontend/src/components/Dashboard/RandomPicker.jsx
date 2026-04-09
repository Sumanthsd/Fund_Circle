import { useEffect, useMemo, useState } from 'react';

export default function RandomPicker({ monthId, members, onFinalize, canFinalize, onAdminDenied }) {
  const [selectedMemberIds, setSelectedMemberIds] = useState(members.map((member) => member.member_id));
  const [candidateId, setCandidateId] = useState('');
  const [winner, setWinner] = useState(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedMemberIds(members.map((member) => member.member_id));
    setCandidateId('');
    setWinner(null);
  }, [members]);

  const selectedMembers = useMemo(
    () => members.filter((member) => selectedMemberIds.includes(member.member_id)),
    [members, selectedMemberIds]
  );

  const availableMembers = useMemo(
    () => members.filter((member) => !selectedMemberIds.includes(member.member_id)),
    [members, selectedMemberIds]
  );

  function removeMember(memberId) {
    setWinner(null);
    setSelectedMemberIds((current) => current.filter((id) => id !== memberId));
  }

  function addCandidate() {
    if (!candidateId) return;

    const parsed = Number(candidateId);
    if (!selectedMemberIds.includes(parsed)) {
      setSelectedMemberIds((current) => [...current, parsed]);
    }
    setCandidateId('');
    setWinner(null);
  }

  function pickWinner() {
    if (selectedMembers.length === 0) return;
    const randomValues = new Uint32Array(1);
    window.crypto.getRandomValues(randomValues);
    setWinner(selectedMembers[randomValues[0] % selectedMembers.length]);
    setMessage('');
  }

  async function finalize() {
    if (!winner) return;
    if (!canFinalize) {
      onAdminDenied?.();
      return;
    }
    try {
      setIsSaving(true);
      setMessage('Saving draw result...');
      await onFinalize(monthId, winner.member_id);
      setMessage('Draw saved.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not save draw result.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="picker-grid">
      <div className="picker-panel surface-card">
        <div className="auth-eyebrow">Selected members</div>
        <h3>{selectedMembers.length} in the draw pool</h3>
        <p>Choose the eligible members you want included before running the random pick.</p>

        <div className="picker-select-row">
          <select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}>
            <option value="">Add member to draw pool</option>
            {availableMembers.map((member) => (
              <option key={member.member_id} value={member.member_id}>
                {member.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={addCandidate} disabled={!candidateId}>
            Add
          </button>
        </div>

        <div className="selected-chip-list">
          {selectedMembers.map((member) => (
            <div key={member.member_id} className="selected-chip">
              <span>{member.name}</span>
              <button type="button" onClick={() => removeMember(member.member_id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="picker-panel surface-card">
        <div className="auth-eyebrow">Random selection</div>
        <h3>Run winner draw</h3>
        <p>Members who already received payout in this cycle remain excluded from this list.</p>
        <button
          className="primary-button"
          type="button"
          onClick={pickWinner}
          disabled={selectedMembers.length === 0}
        >
          Pick Random Winner
        </button>
        {winner ? (
          <div className="winner-card fade-in-up">
            <span>Selected member</span>
            <strong>{winner.name}</strong>
            <button className="secondary-button" type="button" onClick={finalize} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Finalize and save'}
              {!canFinalize ? <span className="lock-tag">Admin</span> : null}
            </button>
          </div>
        ) : null}
        {!canFinalize ? <p className="helper-message">Only the master admin can finalize the draw.</p> : null}
        {message ? <p className="helper-message fade-in-up">{message}</p> : null}
      </div>
    </div>
  );
}
