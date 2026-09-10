import MaintenanceToggle from "./MaintenanceToggle";

export default function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-[#050b16] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 rounded-full bg-cyan-400" />

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Manage your EarnNova platform settings.
              </p>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <MaintenanceToggle />

      </div>
    </main>
  );
}