import { UserButton } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import CycleExplorer from '../components/Dashboard/CycleExplorer.jsx';
import CycleManagementPage from '../components/Dashboard/CycleManagementPage.jsx';
import CycleProgressChart from '../components/Dashboard/CycleProgressChart.jsx';
import MembersPage from '../components/Dashboard/MembersPage.jsx';
import OverallPerformanceTile from '../components/Dashboard/OverallPerformanceTile.jsx';
import RandomPicker from '../components/Dashboard/RandomPicker.jsx';
import { ABOUT_ITEMS, BRAND_COPY, BRAND_NAME, CONTACT_INFO } from '../config/branding.js';
import { createCycle, deleteCycle, finalizeRandomDraw, getCycles, startCycle, updateContribution } from '../services/cycleService.js';
import { createMember, deleteMember, getMembers, updateMember } from '../services/memberService.js';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Members' },
  { id: 'cycles', label: 'Cycles' },
];

export default function DashboardPage({ user, theme, onToggleTheme }) {
  const [cycles, setCycles] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [creatingCycle, setCreatingCycle] = useState(false);
  const [deletingCycleId, setDeletingCycleId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [view, setView] = useState('dashboard');
  const [selectedCycleId, setSelectedCycleId] = useState(null);

  async function loadCycles() {
    const data = await getCycles();
    setCycles(data);
    return data;
  }

  async function loadMembers() {
    setMembersLoading(true);
    try {
      setMembers(await getMembers());
    } finally {
      setMembersLoading(false);
    }
  }

  async function refreshDashboardData() {
    try {
      setError('');
      setLoading(true);
      await Promise.all([loadCycles(), loadMembers()]);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDashboardData();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!cycles.length) {
      setSelectedCycleId(null);
      return;
    }

    setSelectedCycleId((current) => {
      if (current && cycles.some((cycle) => cycle.id === current)) {
        return current;
      }

      const draftOrActive = cycles.find((cycle) => cycle.status === 'ONGOING' || cycle.status === 'DRAFT');

      return draftOrActive?.id || cycles[0].id;
    });
  }, [cycles]);

  const secondCycle = cycles.find((cycle) => cycle.name === 'Second Cycle');
  const selectedCycle = cycles.find((cycle) => cycle.id === selectedCycleId) || cycles[0] || null;
  const activeMonth = useMemo(() => {
    if (!selectedCycle?.months?.length) return null;

    return (
      selectedCycle.months.find(
        (month) =>
          !month.payout_recipient_name &&
          (month.status === 'OPEN' || month.status === 'DRAFT')
      ) || null
    );
  }, [selectedCycle]);

  const eligibleMembers = useMemo(() => {
    if (!selectedCycle) return [];
    return selectedCycle.members.filter((member) => !member.payout_received);
  }, [selectedCycle]);
  const latestPayoutCycle =
    [...cycles]
      .reverse()
      .find((cycle) => cycle.months.some((month) => month.payout_recipient_name)) || secondCycle;

  const summaryCards = [
    {
      label: 'Latest Cycle',
      value: cycles.some((cycle) => cycle.status === 'ONGOING')
        ? 'Cycle is ongoing'
        : cycles.some((cycle) => cycle.status === 'DRAFT')
          ? 'Draft cycle ready to start'
          : 'No active cycle',
    },
    {
      label: "Latest Cycle's Contribution",
      value: secondCycle ? formatCurrency(secondCycle.contribution_amount) : 'Not available',
    },
    {
      label: 'Latest Payout Value',
      value: latestPayoutCycle ? formatCurrency(latestPayoutCycle.payout_amount) : 'Not available',
    },
    { label: 'Eligible Members', value: eligibleMembers.length || 0 },
  ];

  function showAdminNotice() {
    setNotice('Admin User only action. Please sign in with the admin account.');
  }

  async function handleContributionChange(id, status) {
    if (!user.isAdmin) {
      showAdminNotice();
      return;
    }

    try {
      await updateContribution(id, status);
      await loadCycles();
    } catch (err) {
      if (err?.response?.status === 403) {
        showAdminNotice();
        return;
      }
      throw err;
    }
  }

  async function handleFinalizeDraw(monthId, selectedMemberId) {
    if (!user.isAdmin) {
      showAdminNotice();
      return;
    }

    try {
      await finalizeRandomDraw(monthId, selectedMemberId);
      await loadCycles();
      setView('dashboard');
    } catch (err) {
      if (err?.response?.status === 403) {
        showAdminNotice();
        return;
      }
      throw err;
    }
  }

  async function handleAddMember(payload) {
    setAddingMember(true);
    try {
      const result = await createMember(payload);
      await Promise.all([loadMembers(), loadCycles()]);
      return result;
    } finally {
      setAddingMember(false);
    }
  }

  async function handleEditMember(id, payload) {
    setEditingMember(true);
    try {
      const result = await updateMember(id, payload);
      await loadMembers();
      return result;
    } finally {
      setEditingMember(false);
    }
  }

  async function handleDeleteMember(id) {
    setDeletingMemberId(id);
    try {
      const result = await deleteMember(id);
      await Promise.all([loadMembers(), loadCycles()]);
      return result;
    } finally {
      setDeletingMemberId(null);
    }
  }

  async function handleCreateCycle(payload) {
    if (!user.isAdmin) {
      showAdminNotice();
      return null;
    }

    setCreatingCycle(true);

    try {
      const created = await createCycle(payload);
      await loadCycles();
      setSelectedCycleId(created.id);
      return created;
    } catch (err) {
      if (err?.response?.status === 403) {
        showAdminNotice();
      }
      throw err;
    } finally {
      setCreatingCycle(false);
    }
  }

  async function handleDeleteCycle(cycleId) {
    if (!user.isAdmin) {
      showAdminNotice();
      return null;
    }

    setDeletingCycleId(cycleId);
    try {
      const result = await deleteCycle(cycleId);
      await loadCycles();
      return result;
    } catch (err) {
      if (err?.response?.status === 403) {
        showAdminNotice();
      }
      throw err;
    } finally {
      setDeletingCycleId(null);
    }
  }

  async function handleStartCycle(cycleId) {
    if (!user.isAdmin) {
      showAdminNotice();
      return null;
    }

    try {
      await startCycle(cycleId);
      await loadCycles();
      setNotice('Cycle started.');
      return true;
    } catch (err) {
      if (err?.response?.status === 403) {
        showAdminNotice();
        return null;
      }
      throw err;
    }
  }

  function openCycleDetails(cycleId) {
    setSelectedCycleId(cycleId);
    setView('cycle-details');
  }

  function renderMainContent() {
    if (view === 'about') {
      return (
        <section className="about-page surface-card fade-in-up">
          <div className="about-page-header">
            <div>
              <h1>{BRAND_COPY.aboutTitle}</h1>
            </div>
          </div>
          <p>{BRAND_COPY.aboutText}</p>
          <div className="about-grid">
            {ABOUT_ITEMS.map((item) => (
              <article key={item.title} className="about-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (view === 'contact') {
      return (
        <section className="about-page surface-card fade-in-up">
          <div className="about-page-header">
            <div>
              <h1>Contact Fund Circle</h1>
            </div>
          </div>
          <p>
            If you need help with your group workspace, onboarding, or account access, please use
            the contact details below.
          </p>
          <div className="contact-grid">
            <article className="about-card">
              <h3>Contact person</h3>
              <p>{CONTACT_INFO.name}</p>
            </article>
            <article className="about-card">
              <h3>Email</h3>
              <p>{CONTACT_INFO.email}</p>
            </article>
            <article className="about-card">
              <h3>Phone</h3>
              <p>{CONTACT_INFO.phone}</p>
            </article>
          </div>
        </section>
      );
    }

    if (view === 'members') {
      if (membersLoading && !members.length) {
        return <div className="loading-card fade-in-up">Loading members...</div>;
      }

      return (
        <MembersPage
          members={members}
          onAddMember={handleAddMember}
          onEditMember={handleEditMember}
          onDeleteMember={handleDeleteMember}
          addingMember={addingMember}
          editingMember={editingMember}
          deletingMemberId={deletingMemberId}
          canManageMembers={Boolean(user.isAdmin)}
          currentUserEmail={user.email}
          onAdminDenied={showAdminNotice}
        />
      );
    }

    if (view === 'cycles') {
      if (membersLoading && !members.length) {
        return <div className="loading-card fade-in-up">Loading cycle setup...</div>;
      }

      return (
        <CycleManagementPage
          cycles={cycles}
          members={members}
          creatingCycle={creatingCycle}
          deletingCycleId={deletingCycleId}
          onCreateCycle={handleCreateCycle}
          onDeleteCycle={handleDeleteCycle}
          onStartCycle={handleStartCycle}
          onOpenCycle={openCycleDetails}
          canManageCycles={Boolean(user.isAdmin)}
          onAdminDenied={showAdminNotice}
        />
      );
    }

    if (view === 'picker' && activeMonth) {
      return (
        <section className="panel surface-card fade-in-up">
          <div className="panel-heading">
            <div>
              <div className="auth-eyebrow">Draw</div>
              <h2>Winner selection</h2>
              <p>Select the eligible pool from a dropdown-friendly list, then run the random draw.</p>
            </div>
          </div>
          <RandomPicker
            monthId={activeMonth.id}
            members={eligibleMembers}
            onFinalize={handleFinalizeDraw}
            canFinalize={Boolean(user.isAdmin)}
            onAdminDenied={showAdminNotice}
          />
        </section>
      );
    }

    if (view === 'picker' && !activeMonth) {
      return (
        <section className="panel surface-card fade-in-up">
          <div className="panel-heading">
            <div>
              <div className="auth-eyebrow">Draw</div>
              <h2>Winner selection</h2>
              <p>No open month is ready for a draw right now.</p>
            </div>
          </div>
        </section>
      );
    }

    if (view === 'cycle-details' && selectedCycle) {
      return (
        <section className="detail-page fade-in-up">
          <div className="detail-controls">
            <button className="nav-link-button back-button" type="button" onClick={() => setView('dashboard')}>
              Back to dashboard
            </button>
            <label className="detail-cycle-select">
              <span>Cycle</span>
              <select
                value={selectedCycle.id}
                onChange={(event) => setSelectedCycleId(Number(event.target.value))}
              >
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <CycleExplorer
            cycle={selectedCycle}
            onContributionChange={handleContributionChange}
            canManageCycle={Boolean(user.isAdmin)}
            onAdminDenied={showAdminNotice}
          />
        </section>
      );
    }

    return (
      <>
        <section className="summary-grid">
          {summaryCards.map((card, index) => (
            <div
              key={card.label}
              className="summary-card surface-card fade-in-up"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </div>
          ))}
        </section>

        {cycles.length ? (
          <>
            <section className="dashboard-insights">
              <CycleProgressChart
                cycles={cycles}
                selectedCycleId={selectedCycleId}
                onSelectCycle={openCycleDetails}
              />

              <article className="insight-card surface-card fade-in-up" style={{ animationDelay: '80ms' }}>
                <div className="panel-heading">
                  <div>
                    <div className="auth-eyebrow">Cycle quick access</div>
                    <h2>Chit Cycle Details</h2>
                    <p>Choose a cycle and open its dedicated page for month-by-month details.</p>
                  </div>
                </div>

                <div className="cycle-overview-list">
                  {cycles.map((cycle) => {
                    const completedMonths = cycle.months.filter(
                      (month) => month.status === 'CLOSED' || month.status === 'PAYOUT_FINALIZED'
                    ).length;

                    return (
                      <button
                        key={cycle.id}
                        type="button"
                        className={`cycle-overview-card ${selectedCycleId === cycle.id ? 'is-selected' : ''}`}
                        onClick={() => openCycleDetails(cycle.id)}
                      >
                        <div className="cycle-overview-top">
                          <strong>{cycle.name}</strong>
                          <span className={`status-pill status-${String(cycle.status).toLowerCase()}`}>
                            {cycle.status}
                          </span>
                        </div>
                        <span>{cycle.start_month} to {cycle.end_month}</span>
                        <p>
                          {cycle.members.length} members, {formatCurrency(cycle.contribution_amount)} monthly contribution.
                        </p>
                        <div className="cycle-overview-meta">
                          <strong>{completedMonths}</strong>
                          <span>months finished</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </article>
            </section>

            <section className="dashboard-secondary">
              <OverallPerformanceTile cycles={cycles} />
            </section>
          </>
        ) : null}
      </>
    );
  }

  return (
    <div className="app-shell app-shell-dashboard">
      <header className="global-header fade-in-up">
        <div className="global-brand">
          <div className="dashboard-brand">{BRAND_NAME}</div>
        </div>
        <div className="header-actions">
          <span className={`role-pill ${user.isAdmin ? 'role-admin' : 'role-member'}`}>
            {user.isAdmin ? 'Admin User' : 'Member'}
          </span>
          <button className="nav-link-button" type="button" onClick={() => setView('about')}>
            About us
          </button>
          <button className="nav-link-button" type="button" onClick={() => setView('contact')}>
            Contact us
          </button>
          <button className="theme-toggle" type="button" onClick={onToggleTheme}>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="user-avatar-menu">
            <UserButton
              afterSignOutUrl="/"
              userProfileProps={{
                apiKeysProps: {
                  hide: true,
                },
                appearance: {
                  elements: {
                    modalContent: 'clerk-user-modal-content',
                    cardBox: 'clerk-user-modal-card',
                    modalCloseButton: 'clerk-user-modal-close',
                  },
                },
              }}
              appearance={{
                elements: {
                  avatarBox: 'user-avatar-box',
                  userButtonTrigger: 'user-avatar-trigger',
                },
              }}
            />
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <aside className="left-sidebar surface-card fade-in-up">
          <p className="sidebar-copy">Navigate your working areas quickly without wasting screen space.</p>

          <nav className="sidebar-nav">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-link ${view === item.id ? 'is-active' : ''}`}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
            {selectedCycle && (
              <button
                type="button"
                className={`sidebar-link ${view === 'cycle-details' ? 'is-active' : ''}`}
                onClick={() => setView('cycle-details')}
              >
                Cycle Details
              </button>
            )}
            <button
              type="button"
              className={`sidebar-link ${view === 'picker' ? 'is-active' : ''} ${activeMonth ? '' : 'button-locked'}`}
              onClick={() => (activeMonth ? setView('picker') : null)}
              title={activeMonth ? '' : 'No open month available for draw'}
              disabled={!activeMonth}
            >
              Winner draw
            </button>
          </nav>
        </aside>

        <main className="dashboard-main">
          <header className="dashboard-header fade-in-up">
            <div>
              <h1>
                {view === 'cycle-details' && selectedCycle ? selectedCycle.name : 'Fund Circle Dashboard'}
              </h1>
              <p>
                Welcome, {user.name || user.email}. Track contributions, payouts, member updates, and cycle progress in one place.
              </p>
            </div>
          </header>

          {error ? <div className="error-banner">{error}</div> : null}
          {notice ? <div className="action-toast fade-in-up">{notice}</div> : null}
          {loading ? <div className="loading-card fade-in-up">Loading dashboard...</div> : renderMainContent()}
        </main>
      </div>
    </div>
  );
}
