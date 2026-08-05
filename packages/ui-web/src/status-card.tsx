type StatusCardProps = {
  title: string;
  status: string;
  detail: string;
};

export function StatusCard({ title, status, detail }: StatusCardProps) {
  return (
    <article className="status-card">
      <div className="status-card__row">
        <h2>{title}</h2>
        <strong>{status}</strong>
      </div>
      <p>{detail}</p>
    </article>
  );
}
