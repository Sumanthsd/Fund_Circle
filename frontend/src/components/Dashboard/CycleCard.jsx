function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

export default function CycleCard({ cycle, onContributionChange, animationDelay = 0 }) {
  return (
    <article
      className="cycle-card surface-card fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="cycle-header">
        <div>
          <div className="auth-eyebrow">
            {cycle.start_month} - {cycle.end_month}
          </div>
          <h2>{cycle.name}</h2>
          <p>
            {cycle.members.length} members, {formatCurrency(cycle.contribution_amount)} monthly
            contribution, {formatCurrency(cycle.payout_amount)} payout, draw day {cycle.draw_day_of_month}
          </p>
        </div>
        <span className={`status-pill status-${String(cycle.status).toLowerCase()}`}>
          {cycle.status}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Paid</th>
              <th>Recipient</th>
              <th>Method</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {cycle.months.map((month) => {
              const paidCount = month.contributions.filter(
                (contribution) => contribution.status === 'PAID'
              ).length;

              return (
                <tr key={month.id} className="cycle-row">
                  <td>{month.month_label}</td>
                  <td>
                    <strong>
                      {paidCount}/{cycle.members.length}
                    </strong>
                    {cycle.status !== 'CLOSED' ? (
                      <div className="mini-actions">
                        {month.contributions.map((contribution) => (
                          <button
                            key={contribution.id}
                            type="button"
                            onClick={() => onContributionChange(contribution.id, 'PAID')}
                            className="soft-button"
                          >
                            Mark {contribution.member_name} paid
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td>{month.payout_recipient_name || 'Not selected'}</td>
                  <td>{month.selection_method || 'Pending'}</td>
                  <td>{month.status}</td>
                  <td>{month.notes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
