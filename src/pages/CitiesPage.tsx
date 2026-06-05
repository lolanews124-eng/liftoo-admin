import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function CitiesPage() {
  return (
    <div className="page">
      <PageHeader
        title="Service area"
        subtitle="Automatic GPS-based coverage — no manual city or venue lists"
      />

      <div className="service-area-layout">
        <div className="card service-area-card">
          <div className="service-area-icon" aria-hidden>📍</div>
          <h2 className="card-heading">How it works</h2>
          <ul className="service-area-list">
            <li>
              Customers pick up using <strong>current GPS location</strong> or saved addresses.
            </li>
            <li>Assistants are matched within the configured radius from the pickup point.</li>
            <li>
              No admin needs to add cities, malls, or venues — everything is coordinate-based (like Swiggy).
            </li>
          </ul>
        </div>

        <div className="card service-area-card service-area-card--action">
          <div className="service-area-icon" aria-hidden>⚙</div>
          <h2 className="card-heading">Adjust coverage radius</h2>
          <p className="service-area-desc">
            Change how far assistants can receive booking requests from the customer&apos;s location.
          </p>
          <Link to="/settings" className="btn btn-primary">
            Open Settings → Matching radius
          </Link>
        </div>
      </div>
    </div>
  );
}
