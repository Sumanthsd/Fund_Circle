function formatCurrency(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
}

function getCycleProgress(cycle) {
  const totalMonths = cycle.months.length || 1;
  const completedMonths = cycle.months.filter(
    (month) => month.status === 'CLOSED' || month.status === 'PAYOUT_FINALIZED'
  ).length;

  return {
    completedMonths,
    totalMonths,
    percent: Math.round((completedMonths / totalMonths) * 100),
  };
}

export default function CycleProgressChart({ cycles, selectedCycleId, onSelectCycle }) {
  return (
    <article className="insight-card surface-card fade-in-up">
      <div className="panel-heading">
        <div>
          <div className="auth-eyebrow">Cycle Progress</div>
          <h2>Cycle Progress Snapshot</h2>
          <p>See which cycle is completed, which one is active, and how far each monthly run has moved.</p>
        </div>
      </div>

      <div className="cycle-graph-list">
        {cycles.map((cycle) => {
          const progress = getCycleProgress(cycle);

          return (
            <button
              key={cycle.id}
              type="button"
              className={`cycle-graph-row ${selectedCycleId === cycle.id ? 'is-selected' : ''}`}
              onClick={() => onSelectCycle(cycle.id)}
            >
              <div className="cycle-graph-copy">
                <strong>{cycle.name}</strong>
                <span>
                  {cycle.start_month} to {cycle.end_month}
                </span>
              </div>

              <div className="cycle-graph-meter" aria-hidden="true">
                <div className="cycle-graph-meter-fill" style={{ width: `${progress.percent}%` }} />
              </div>

              <div className="cycle-graph-meta">
                <strong>{progress.percent}%</strong>
                <span>
                  {progress.completedMonths}/{progress.totalMonths} months
                </span>
                <span>{formatCurrency(cycle.payout_amount)} payout</span>
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
