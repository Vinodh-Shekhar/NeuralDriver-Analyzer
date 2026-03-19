import { Shield, AlertTriangle, AlertOctagon, CheckCircle2, Bug } from 'lucide-react';
import type { QAAnalysis } from '../types/telemetry';

interface Props {
  analysisA: QAAnalysis | null;
  analysisB: QAAnalysis | null;
}

export default function QAAnalysisPanel({ analysisA, analysisB }: Props) {
  return (
    <div className="rounded-lg border border-nvidia-border bg-nvidia-panel p-4 animate-fade-in">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-nvidia-green" />
        <span className="font-mono text-sm font-medium text-nvidia-text">
          AI QA Analysis Summary
        </span>
      </div>

      {!analysisA && !analysisB ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-nvidia-border bg-nvidia-bg/20">
          <span className="font-mono text-xs text-nvidia-muted">
            Upload benchmark data to run analysis
          </span>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {analysisA && <DriverAnalysis driverKey="A" analysis={analysisA} />}
          {analysisB && <DriverAnalysis driverKey="B" analysis={analysisB} />}
        </div>
      )}
    </div>
  );
}

function DriverAnalysis({
  driverKey,
  analysis,
}: {
  driverKey: 'A' | 'B';
  analysis: QAAnalysis;
}) {
  const ratingConfig = {
    PASS: {
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-nvidia-green',
      bg: 'bg-nvidia-green/10',
      border: 'border-nvidia-green/30',
    },
    WARNING: {
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-nvidia-warning',
      bg: 'bg-nvidia-warning/10',
      border: 'border-nvidia-warning/30',
    },
    FAIL: {
      icon: <AlertOctagon className="h-5 w-5" />,
      color: 'text-nvidia-danger',
      bg: 'bg-nvidia-danger/10',
      border: 'border-nvidia-danger/30',
    },
  };

  const cfg = ratingConfig[analysis.stabilityRating];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${
            driverKey === 'A'
              ? 'bg-nvidia-green/20 text-nvidia-green'
              : 'bg-nvidia-accent/20 text-nvidia-accent'
          }`}
        >
          {driverKey}
        </div>
        <span className="font-mono text-xs text-nvidia-text">Dataset {driverKey} Analysis</span>
      </div>

      <div className={`rounded-md border ${cfg.border} ${cfg.bg} px-3 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cfg.color}>{cfg.icon}</span>
            <div>
              <div className={`font-mono text-sm font-bold ${cfg.color}`}>
                {analysis.stabilityRating}
              </div>
              <div className="font-mono text-[10px] text-nvidia-muted">
                Stability Rating
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-mono text-lg font-bold ${cfg.color}`}>
              {analysis.overallScore}
            </div>
            <div className="font-mono text-[10px] text-nvidia-muted">Score</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-nvidia-border bg-nvidia-bg/30 px-3 py-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Bug className="h-3 w-3 text-nvidia-muted" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-muted">
            Detected Anomalies
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <AnomalyCount
            label="High"
            count={analysis.anomalies.filter((a) => a.severity === 'high').length}
            color="text-nvidia-danger"
          />
          <AnomalyCount
            label="Medium"
            count={analysis.anomalies.filter((a) => a.severity === 'medium').length}
            color="text-nvidia-warning"
          />
          <AnomalyCount
            label="Low"
            count={analysis.anomalies.filter((a) => a.severity === 'low').length}
            color="text-nvidia-muted"
          />
        </div>
      </div>

      {analysis.instabilityWarnings.length > 0 && (
        <div className="space-y-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-nvidia-warning">
            Warnings
          </span>
          {analysis.instabilityWarnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded bg-nvidia-warning/5 px-2.5 py-1.5 ring-1 ring-nvidia-warning/20"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-nvidia-warning" />
              <span className="font-mono text-[11px] leading-relaxed text-nvidia-text/80">
                {w}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnomalyCount({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`font-mono text-sm font-bold ${color}`}>{count}</div>
      <div className="font-mono text-[9px] uppercase text-nvidia-muted">{label}</div>
    </div>
  );
}
