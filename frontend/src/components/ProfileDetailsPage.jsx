import { useEffect, useState } from 'react';
import { updateProfile } from '../services/authService.js';

export default function ProfileDetailsPage({ user, onUserChange }) {
  const [form, setForm] = useState({
    mobile: user.mobile || '',
    dob: user.dob || '',
    gender: user.gender || '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      mobile: user.mobile || '',
      dob: user.dob || '',
      gender: user.gender || '',
    });
  }, [user]);

  function updateField(field, value) {
    setMessage('');
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    try {
      setMessage('Saving...');
      const updated = await updateProfile(form);
      onUserChange(updated);
      setMessage('Profile saved.');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not save profile.');
    }
  }

  return (
    <div className="profile-page fade-in-up">
      <h2>Profile details</h2>
      <p>Update your mobile number, date of birth, and gender for your Fund Circle account.</p>
      <form className="profile-form" onSubmit={submit}>
        <label>
          Mobile number
          <input
            value={form.mobile}
            placeholder="+91 98765 43210"
            onChange={(event) => updateField('mobile', event.target.value)}
          />
        </label>
        <label>
          Gender
          <select value={form.gender} onChange={(event) => updateField('gender', event.target.value)}>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </label>
        <label>
          Date of birth
          <input
            type="date"
            value={form.dob}
            onChange={(event) => updateField('dob', event.target.value)}
          />
        </label>
        <button className="primary-button" type="submit">
          Save profile
        </button>
        {message ? <p className="helper-message">{message}</p> : null}
      </form>
    </div>
  );
}
