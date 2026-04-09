import { useEffect, useMemo, useState } from 'react';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

function formatDate(value) {
  if (!value) return 'Not set';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getPaidCount(month) {
  return month.contributions.filter((contribution) => contribution.status === 'PAID').length;
}

export default function CycleExplorer({ cycle, onContributionChange, canManageCycle, onAdminDenied }) {
  const [selectedMonthId, setSelectedMonthId] = useState(cycle?.months?.[0]?.id ?? null);

  useEffect(() => {
    setSelectedMonthId(cycle?.months?.[0]?.id ?? null);
  }, [cycle]);

  const selectedMonth =
    cycle?.months.find((month) => month.id === selectedMonthId) || cycle?.months?.[0] || null;

  const cycleStats = useMemo(() => {
    if (!cycle) return [];

    const completedMonths = cycle.months.filter(
      (month) => month.status === 'CLOSED' || month.status === 'PAYOUT_FINALIZED'
    ).length;
    const recipients = cycle.months.filter((month) => month.payout_recipient_name).length;
    const outstandingMembers = cycle.members.filter((member) => !member.payout_received).length;

    return [
      { label: 'Months in cycle', value: cycle.months.length },
      { label: 'Completed months', value: completedMonths },
      { label: 'Payouts finalized', value: recipients },
      { label: 'Members waiting', value: outstandingMembers },
    ];
  }, [cycle]);

  if (!cycle) return null;

  return (
    <section className="cycle-explorer surface-card fade-in-up">
      <div className="cycle-explorer-hero">
        <div>
          <div className="auth-eyebrow">Cycle Details</div>
          <h2>{cycle.name}</h2>
          <p>
            {cycle.start_month} to {cycle.end_month}, draw day {cycle.draw_day_of_month}, monthly
            contribution {formatCurrency(cycle.contribution_amount)}.
          </p>
        </div>
        <span className={`status-pill status-${String(cycle.status).toLowerCase()}`}>{cycle.status}</span>
      </div>

      <div className="cycle-stat-grid">
        {cycleStats.map((item) => (
          <div key={item.label} className="cycle-stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="month-switcher">
        {cycle.months.map((month, index) => {
          const paidCount = getPaidCount(month);

          return (
            <button
              key={month.id}
              type="button"
              className={`month-chip ${selectedMonth?.id === month.id ? 'is-selected' : ''}`}
              onClick={() => setSelectedMonthId(month.id)}
            >
              <span>Month {index + 1}</span>
              <strong>{month.month_label}</strong>
              <small>
                {paidCount}/{cycle.members.length} paid
              </small>
            </button>
          );
        })}
      </div>

      {selectedMonth ? (
        <div className="month-detail-grid">
          <article className="month-spotlight">
            <div className="month-spotlight-top">
              <div>
                <div className="auth-eyebrow">Selected month</div>
                <h3>{selectedMonth.month_label}</h3>
              </div>
              <span className={`status-pill status-${String(selectedMonth.status).toLowerCase()}`}>
                {selectedMonth.status}
              </span>
            </div>

            <div className="month-detail-stats">
              <div className="month-detail-stat">
                <span>Due date</span>
                <strong>{formatDate(selectedMonth.due_date)}</strong>
              </div>
              <div className="month-detail-stat">
                <span>Transfer date</span>
                <strong>{formatDate(selectedMonth.transfer_date)}</strong>
              </div>
              <div className="month-detail-stat">
                <span>Payout recipient</span>
                <strong>{selectedMonth.payout_recipient_name || 'Not selected yet'}</strong>
              </div>
              <div className="month-detail-stat">
                <span>Selection method</span>
                <strong>
                  {selectedMonth.selection_method
                    ? selectedMonth.selection_method === 'RANDOM_DRAW'
                      ? 'Picked from draw'
                      : selectedMonth.selection_method
                    : 'Pending'}
                </strong>
              </div>
            </div>

            <div className="month-notes">
              <span>Notes</span>
              <p>{selectedMonth.notes || 'No notes added for this month yet.'}</p>
            </div>
          </article>

          <article className="month-contributions">
            <div className="month-contributions-header">
              <div>
                <div className="auth-eyebrow">Contributions</div>
                <h3>Member payment status</h3>
              </div>
              <strong>
                {getPaidCount(selectedMonth)}/{cycle.members.length} paid
              </strong>
            </div>

            <div className="contribution-list">
              {selectedMonth.contributions.map((contribution) => (
                <div key={contribution.id} className="contribution-row">
                  <div>
                    <strong>{contribution.member_name}</strong>
                    <span>{formatCurrency(contribution.amount)}</span>
                  </div>
                  <div className="contribution-row-actions">
                    <span className={`status-pill status-${String(contribution.status).toLowerCase()}`}>
                      {contribution.status}
                    </span>
                    {cycle.status !== 'CLOSED' ? (
                      <button
                        type="button"
                        className={`soft-button ${contribution.status === 'PAID' ? 'soft-button-revert' : ''} ${!canManageCycle ? 'button-locked' : ''}`}
                        onClick={() =>
                          canManageCycle
                            ? onContributionChange(
                                contribution.id,
                                contribution.status === 'PAID' ? 'PENDING' : 'PAID'
                              )
                            : onAdminDenied?.()
                        }
                      >
                        {contribution.status === 'PAID' ? 'Mark unpaid' : 'Mark paid'}
                        {!canManageCycle ? <span className="lock-tag">Admin</span> : null}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
