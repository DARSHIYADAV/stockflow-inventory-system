import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/roleHome";

const FEATURES = [
  {
    icon: "📊",
    title: "Stock, Always Accurate",
    description:
      "Every stock in/out is logged as a transaction. Quantity is never a number someone can overwrite — it's always the sum of real history.",
  },
  {
    icon: "💻",
    title: "Track Every Asset",
    description:
      "Assign specific equipment — a laptop, a monitor — to an employee, and get it back later. Every handoff is recorded, nothing is silent.",
  },
  {
    icon: "🔒",
    title: "Built-In Role Control",
    description:
      "Admins, managers, and employees each see exactly what they're meant to — full control, day-to-day operations, or just their own gear.",
  },
];

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(var(--color-border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, black 40%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10rem] z-0 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-accent/20 blur-[120px]"
      />

      <div className="relative z-10">
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg shadow-card">
              📦
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              StockFlow
            </span>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 pb-16 pt-20 text-center">
        <span className="mb-5 inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          ✨ Inventory & asset management
        </span>
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
          Track stock and assets{" "}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-gray-400">
          Record stock movements, assign equipment to employees, and see
          everything in one place — every change logged, nothing overwritten.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/login/admin" className="btn-primary px-6 py-3 text-sm">
            Sign in as Admin
          </Link>
          <Link to="/login/manager" className="btn-secondary px-6 py-3 text-sm">
            Sign in as Manager
          </Link>
          <Link
            to="/login/employee"
            className="btn-secondary px-6 py-3 text-sm"
          >
            Sign in as Employee
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="stat-card text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-panel2 text-xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-gray-400">{f.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-xs text-gray-600">
          StockFlow — track, assign, manage.
        </p>
      </section>
      </div>
    </div>
  );
}
