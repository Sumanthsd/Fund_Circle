function percent(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export default function OverallPerformanceTile({ cycles }) {
  const totalMonths = cycles.reduce((sum, cycle) => sum + cycle.months.length, 0);
  const closedMonths = cycles.reduce(
    (sum, cycle) =>
      sum +
      cycle.months.filter((month) => month.status === 'CLOSED' || month.status === 'PAYOUT_FINALIZED').length,
    0
  );
  const totalMembers = new Set(cycles.flatMap((cycle) => cycle.members.map((member) => member.member_id || member.id))).size;
  const draftCycles = cycles.filter((cycle) => cycle.status === 'DRAFT').length;
  const completionRate = percent(closedMonths, totalMonths);

  return (
    <article className="insight-card surface-card fade-in-up" style={{ animationDelay: '140ms' }}>
      <div className="panel-heading">
        <div>
          <div className="auth-eyebrow">Overall chart</div>
          <h2>Portfolio Health Snapshot</h2>
          <p>A quick visual of how the full chit portfolio is progressing across all cycles.</p>
        </div>
      </div>

      <div className="overall-chart">
        <div className="overall-ring" aria-hidden="true">
          <div
            className="overall-ring-fill"
            style={{ '--overall-progress': `${completionRate}%` }}
          >
            <div className="overall-ring-core">
              <strong>{completionRate}%</strong>
              <span>completed</span>
            </div>
          </div>
        </div>

        <div className="overall-metrics">
          <div className="overall-metric">
            <span>Closed months</span>
            <strong>{closedMonths}</strong>
          </div>
          <div className="overall-metric">
            <span>Total months</span>
            <strong>{totalMonths}</strong>
          </div>
          <div className="overall-metric">
            <span>Members in portfolio</span>
            <strong>{totalMembers}</strong>
          </div>
          <div className="overall-metric">
            <span>Upcoming cycles</span>
            <strong>{draftCycles}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
