import {
  AlertTriangle,
  Eye,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

function BriefItem({ icon: Icon, label, children, tone = "" }) {
  return (
    <article className={`brief-item ${tone ? `brief-item--${tone}` : ""}`}>
      <div className="brief-item-icon">
        <Icon size={17} aria-hidden="true" />
      </div>
      <div>
        <span>{label}</span>
        <p>{children}</p>
      </div>
    </article>
  );
}

export default function DecisionBrief({ brief }) {
  if (!brief) return null;

  return (
    <section className="v3-card decision-brief-card">
      <div className="v3-card-title">
        <div>
          <span>QUICK READ</span>
          <h3>What the model is telling you</h3>
        </div>
        <Target size={19} aria-hidden="true" />
      </div>

      <div className="decision-summary">
        <strong>Bottom line</strong>
        <p>{brief.summary}</p>
      </div>

      <div className="brief-grid">
        <BriefItem icon={Eye} label="Why they match">
          {brief.why}
        </BriefItem>

        <BriefItem icon={Target} label="Biggest edge">
          {brief.edge}
        </BriefItem>

        <BriefItem icon={ShieldCheck} label={brief.reliabilityLabel} tone="good">
          {brief.reliability}
        </BriefItem>

        <BriefItem icon={TrendingUp} label="What to watch">
          {brief.watch}
        </BriefItem>

        <BriefItem icon={AlertTriangle} label="Decision note" tone="warning">
          {brief.decision}
        </BriefItem>
      </div>

      <div className="forecast-note">
        <AlertTriangle size={15} aria-hidden="true" />
        <span>{brief.forecast}</span>
      </div>
    </section>
  );
}
