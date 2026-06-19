import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";
import { formatDateShort } from "../utils/date";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.adminDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="card page-card">
        <PageHeader title="Dashboard" subtitle="High level activity and overdue insights" />
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card page-card">
        <PageHeader title="Dashboard" subtitle="High level activity and overdue insights" />
        <p className="notice">Loading dashboard data...</p>
      </div>
    );
  }

  const labels = (data.activity || []).map((a) => a.date);
  const counts = (data.activity || []).map((a) => a.count);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Borrows',
        data: counts,
        backgroundColor: 'rgba(67,56,202,0.8)',
        borderRadius: 10,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { beginAtZero: true, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="page-card">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Clear activity, overdue alerts, and system summaries in one place."
      />

      <div className="dashboard-grid">
        <div className="stat-card">
          <span className="stat-label">Total Books</span>
          <strong>{data.total_books}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Users</span>
          <strong>{data.total_users}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Currently Borrowed</span>
          <strong>{data.borrowed}</strong>
        </div>
        <div className="stat-card overdue-card">
          <span className="stat-label">Overdue Books</span>
          <strong>{data.overdue}</strong>
        </div>
      </div>

      <section className="dashboard-sections">
        <div className="dashboard-panel">
          <div className="section-card">
            <div className="section-card-header">
              <h3>Upcoming Due Dates</h3>
              <span className="section-note">Next 7 days</span>
            </div>
            {data.upcoming.length === 0 ? (
              <p className="empty">No upcoming due dates.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Book</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcoming.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDateShort(r.due_date)}</td>
                      <td>{r.title}</td>
                      <td>{r.borrower_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="section-card chart-card">
            <div className="section-card-header">
              <h3>Activity</h3>
              <span className="section-note">Last 7 days</span>
            </div>
            {data.activity.length === 0 ? (
              <p className="empty">No recent activity.</p>
            ) : (
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
