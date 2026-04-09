import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

const emptyForm = {
  name: '',
  mobile: '',
  dob: '',
  gender: '',
};

export default function MembersPage({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  addingMember,
  editingMember,
  deletingMemberId,
  canManageMembers,
  onAdminDenied,
}) {
  const [mode, setMode] = useState('add');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? null);
  const [addForm, setAddForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState({
    mobile: '',
    dob: '',
    gender: '',
  });
  const [toast, setToast] = useState(null);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  useEffect(() => {
    if (!members.length) {
      setSelectedMemberId(null);
      return;
    }

    setSelectedMemberId((current) => (members.some((member) => member.id === current) ? current : members[0].id));
  }, [members]);

  useEffect(() => {
    if (!selectedMember) return;

    setEditForm({
      mobile: selectedMember.mobile || '',
      dob: selectedMember.dob || '',
      gender: selectedMember.gender || '',
    });
  }, [selectedMember]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2300);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function updateAddField(key, value) {
    setAddForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditField(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  async function submitAdd(event) {
    event.preventDefault();
    if (!canManageMembers) {
      onAdminDenied?.();
      return;
    }
    setToast(null);

    try {
      const result = await onAddMember(addForm);
      const cycleNames = result.addedToCycles.map((cycle) => cycle.name).join(', ');
      setToast({
        type: 'success',
        text:
        cycleNames
          ? `Member added. Included in upcoming cycles: ${cycleNames}.`
          : 'Member added. No draft cycle was available to include them yet.',
      });
      setAddForm(emptyForm);
    } catch (err) {
      setToast({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Unable to add member.',
      });
    }
  }

  async function submitEdit(event) {
    event.preventDefault();
    if (!selectedMember) return;
    if (!canManageMembers) {
      onAdminDenied?.();
      return;
    }

    setToast(null);

    try {
      await onEditMember(selectedMember.id, editForm);
      setToast({
        type: 'success',
        text: `Updated ${selectedMember.name}.`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Unable to update member.',
      });
    }
  }

  async function handleDelete() {
    if (!selectedMember) return;
    if (!canManageMembers) {
      onAdminDenied?.();
      return;
    }
    const confirmed = window.confirm(`Delete ${selectedMember.name}? This works only for members added to draft cycles.`);
    if (!confirmed) return;

    setToast(null);

    try {
      await onDeleteMember(selectedMember.id);
      setToast({
        type: 'success',
        text: `${selectedMember.name} deleted.`,
      });
      setMode('add');
    } catch (err) {
      setToast({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Unable to delete member.',
      });
    }
  }

  return (
    <>
      <section className="members-layout fade-in-up">
        <article className="members-card surface-card">
        <div className="panel-heading">
          <div>
            <div className="auth-eyebrow">Members</div>
            <h2>Member directory</h2>
            <p>Pick a member to review or update details, or add someone new for upcoming cycles.</p>
          </div>
        </div>

        <div className="member-list">
          <div className="member-list-head">
            <span>Name</span>
            <span>Mobile</span>
            <span>Gender</span>
            <span>DOB</span>
          </div>
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`member-row ${selectedMemberId === member.id ? 'is-selected' : ''}`}
              onClick={() => {
                setSelectedMemberId(member.id);
                setMode('edit');
              }}
            >
              <span className="member-col member-col-name">{member.name}</span>
              <span className="member-col">{member.mobile || 'Mobile not added'}</span>
              <span className="member-col">{member.gender || 'Gender not added'}</span>
              <span className="member-col">{member.dob || 'DOB not added'}</span>
            </button>
          ))}
        </div>
        </article>

        <article className="members-card surface-card">
        <div className="member-mode-switch">
          <button
            type="button"
            className={`sidebar-link ${mode === 'add' ? 'is-active' : ''}`}
            onClick={() => setMode('add')}
          >
            Add member
          </button>
          <button
            type="button"
            className={`sidebar-link ${mode === 'edit' ? 'is-active' : ''}`}
            onClick={() => setMode('edit')}
            disabled={!selectedMember}
          >
            Edit member
          </button>
        </div>

        {mode === 'add' ? (
          <>
            <div className="panel-heading member-form-heading">
              <div>
                <div className="auth-eyebrow member-form-eyebrow">Add member</div>
                <p className="member-form-copy">Add details to include this member in upcoming cycles.</p>
              </div>
            </div>

            <form className="member-form" onSubmit={submitAdd}>
              <label className="auth-field">
                <span>Name</span>
                <input
                  value={addForm.name}
                  onChange={(event) => updateAddField('name', event.target.value)}
                  placeholder="Enter member name"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Mobile</span>
                <input
                  value={addForm.mobile}
                  onChange={(event) => updateAddField('mobile', event.target.value)}
                  placeholder="Optional mobile number"
                />
              </label>

              <label className="auth-field">
                <span>Date of birth</span>
                <input
                  type="date"
                  value={addForm.dob}
                  onChange={(event) => updateAddField('dob', event.target.value)}
                />
              </label>

              <label className="auth-field">
                <span>Gender</span>
                <select value={addForm.gender} onChange={(event) => updateAddField('gender', event.target.value)}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <button className="primary-button" type="submit" disabled={addingMember}>
                {addingMember ? 'Adding member...' : 'Add member'}
                {!canManageMembers ? <span className="lock-tag">Admin</span> : null}
              </button>
              {!canManageMembers ? <p className="helper-message">Only the master admin can add members.</p> : null}
            </form>
          </>
        ) : (
          <>
            <div className="panel-heading">
              <div>
                <div className="auth-eyebrow">Edit member</div>
                <h2>{selectedMember ? selectedMember.name : 'Select a member'}</h2>
                <p>Update mobile, gender, and date of birth for existing members here.</p>
              </div>
            </div>

            {selectedMember ? (
              <form className="member-form" onSubmit={submitEdit}>
                <label className="auth-field">
                  <span>Mobile</span>
                  <input
                    value={editForm.mobile}
                    onChange={(event) => updateEditField('mobile', event.target.value)}
                    placeholder="Add mobile number"
                  />
                </label>

                <label className="auth-field">
                  <span>Date of birth</span>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(event) => updateEditField('dob', event.target.value)}
                  />
                </label>

                <label className="auth-field">
                  <span>Gender</span>
                  <select value={editForm.gender} onChange={(event) => updateEditField('gender', event.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <div className="member-action-row">
                  <button className="primary-button" type="submit" disabled={editingMember}>
                    {editingMember ? 'Saving...' : 'Save member details'}
                    {!canManageMembers ? <span className="lock-tag">Admin</span> : null}
                  </button>
                  <button
                    className="secondary-button danger-button"
                    type="button"
                    onClick={handleDelete}
                    disabled={deletingMemberId === selectedMember.id}
                  >
                    {deletingMemberId === selectedMember.id ? 'Deleting...' : 'Delete member'}
                    {!canManageMembers ? <span className="lock-tag">Admin</span> : null}
                  </button>
                </div>
                {!canManageMembers ? <p className="helper-message">Only the master admin can edit or delete members.</p> : null}
              </form>
            ) : (
              <div className="loading-card">Select a member from the left to edit details.</div>
            )}
          </>
        )}
        </article>
      </section>
      {toast && typeof document !== 'undefined'
        ? createPortal(
            <div className={`center-toast center-toast-${toast.type}`}>
              {toast.text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
