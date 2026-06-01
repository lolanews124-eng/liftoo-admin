import { Link } from 'react-router-dom';

export function CitiesPage() {
  return (
    <div className="page">
      <h1 className="page-title">Service area</h1>
      <p className="page-sub">Automatic GPS-based coverage — no manual city or venue lists</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>How it works</h2>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, color: 'var(--muted)' }}>
          <li>Customers pick up using <strong>current GPS location</strong> or saved addresses.</li>
          <li>Assistants are matched within the configured radius from the pickup point.</li>
          <li>No admin needs to add cities, malls, or venues — everything is coordinate-based (like Swiggy).</li>
        </ul>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Adjust coverage radius</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14 }}>
          Change how far assistants can receive booking requests from the customer&apos;s location.
        </p>
        <Link to="/settings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
          Open Settings → Matching radius
        </Link>
      </div>
    </div>
  );
}
