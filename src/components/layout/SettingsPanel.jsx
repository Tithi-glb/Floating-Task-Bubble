import { useEffect, useState } from "react";

const themeOptions = [
  { value: "light", label: "Light mode", description: "Bright and airy workspace." },
  { value: "dark", label: "Dark mode", description: "Low-light, high-focus theme." },
];

function SettingsPanel({ theme, settings, onSave, userProfile, onLogout }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateLocalSettings = (changes) => {
    const nextSettings = { ...localSettings, ...changes };
    setLocalSettings(nextSettings);
    onSave(nextSettings);
  };

  const handleSave = () => {
    onSave(localSettings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 10000);
  };

  const panelText = theme === "dark" ? "text-slate-100" : "text-slate-900";
  const secondaryText = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const sectionBg = theme === "dark"
    ? "border-slate-800 bg-slate-900/95"
    : "border-slate-200 bg-white/90";
  const cardBg = theme === "dark"
    ? "border-slate-700 bg-slate-900/80 text-slate-100"
    : "border-slate-200 bg-slate-50 text-slate-900";
  const profileCardBg = theme === "dark"
    ? "border-slate-700 bg-slate-950/80 text-slate-100"
    : "border-slate-200 bg-white/90 text-slate-900";

  return (
    <div className={`flex-1 overflow-y-auto p-8 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-transparent text-slate-900"}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-3">
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${panelText}`}>
            <div>
              <p className={`text-sm font-semibold uppercase tracking-[0.24em] ${secondaryText}`}>
                Application Settings
              </p>
              <h1 className={`text-3xl font-bold ${panelText}`}>Customize your workspace</h1>
            </div>
            <div className={`rounded-3xl border px-4 py-3 text-sm shadow-sm ${profileCardBg}`}>
              Logged in as
              <div className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{userProfile?.name || "Guest"}</div>
              <div className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{userProfile?.email || "no-email@domain"}</div>
            </div>
          </div>
          <p className={`max-w-2xl text-sm ${secondaryText}`}>
            Manage theme, notification behavior, and default task preferences. Your choices are saved locally in the browser.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <section className={`rounded-3xl border p-6 shadow-sm ${sectionBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-semibold ${panelText}`}>Appearance</h2>
                  <p className={`mt-1 text-sm ${secondaryText}`}>Choose the application theme that matches your focus style.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {themeOptions.map((option) => {
                  const isActive = localSettings.theme === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateLocalSettings({ theme: option.value })}
                      className={`rounded-3xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-[#4F7CFF] bg-slate-800 text-slate-100 shadow-sm"
                          : theme === "dark"
                          ? "border-slate-700 bg-slate-900/80 hover:border-slate-600"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-base font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{option.label}</span>
                        {isActive && <span className="rounded-full bg-[#4F7CFF] px-2 py-1 text-[10px] font-bold text-white">Active</span>}
                      </div>
                      <p className={`mt-2 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className={`rounded-3xl border p-6 shadow-sm ${sectionBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-semibold ${panelText}`}>Notifications</h2>
                  <p className={`mt-1 text-sm ${secondaryText}`}>Control reminder alerts and in-app updates.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <label className={`flex items-center gap-3 rounded-3xl border px-4 py-4 ${theme === "dark" ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <input
                    type="checkbox"
                    checked={localSettings.notificationsEnabled}
                    onChange={(e) => updateLocalSettings({ notificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#4F7CFF] focus:ring-[#4F7CFF]"
                  />
                  <div>
                    <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Enable deadline alerts</p>
                    <p className={`text-sm ${secondaryText}`}>Show notifications for upcoming tasks when available.</p>
                  </div>
                </label>

                <label className={`flex flex-col gap-2 rounded-3xl border px-4 py-4 ${theme === "dark" ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Auto open new task modal</p>
                      <p className={`text-sm ${secondaryText}`}>Prompt you to create a task after app load.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.autoOpenNewTask}
                      onChange={(e) => updateLocalSettings({ autoOpenNewTask: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-[#4F7CFF] focus:ring-[#4F7CFF]"
                    />
                  </div>
                </label>
              </div>
            </section>

            <section className={`rounded-3xl border p-6 shadow-sm ${sectionBg}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={`text-xl font-semibold ${panelText}`}>Default task preferences</h2>
                  <p className={`mt-1 text-sm ${secondaryText}`}>Set the defaults used when creating new tasks.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  { value: "High", label: "High priority" },
                  { value: "Medium", label: "Medium priority" },
                  { value: "Low", label: "Low priority" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateLocalSettings({ defaultPriority: option.value })}
                    className={`rounded-3xl border px-4 py-3 text-left transition-all ${
                      localSettings.defaultPriority === option.value
                        ? theme === "dark"
                          ? "border-[#4F7CFF] bg-slate-800 text-slate-100 shadow-sm"
                          : "border-[#4F7CFF] bg-[#EFF6FF] shadow-sm"
                        : theme === "dark"
                        ? "border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-600"
                        : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{option.label}</p>
                    <p className={`mt-1 text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Use this priority for newly created tasks.</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className={`rounded-3xl border p-6 shadow-sm ${sectionBg}`}>
              <h2 className={`text-xl font-semibold ${panelText}`}>Account</h2>
              <p className={`mt-1 text-sm ${secondaryText}`}>Your profile details are managed when you log in.</p>
              <div className={`mt-5 space-y-3 rounded-3xl p-4 text-sm ${theme === "dark" ? "bg-slate-900/80 text-slate-200" : "bg-slate-50 text-slate-600"}`}>
                <div>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Name</p>
                  <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{userProfile?.name || "Guest User"}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Email</p>
                  <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{userProfile?.email || "user@example.com"}</p>
                </div>
                <div>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Role</p>
                  <p className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{userProfile?.role || "Viewer"}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className={`w-full mt-3 inline-flex items-center justify-center rounded-2xl px-4 py-3 font-semibold transition ${
                    theme === "dark"
                      ? "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Log out
                </button>
              </div>
            </section>

            <section className={`rounded-3xl border p-6 shadow-sm ${sectionBg}`}>
              <h2 className={`text-xl font-semibold ${panelText}`}>Helpful tips</h2>
              <div className={`mt-4 space-y-3 text-sm ${secondaryText}`}>
                <p>• Use the sidebar gear icon or Settings tab to return here anytime.</p>
                <p>• Toggle deadline alerts if you want quiet focus sessions.</p>
                <p>• Light and dark themes are kept in browser storage so they stay after refresh.</p>
              </div>
            </section>
          </aside>
        </div>

        <div className={`flex flex-col gap-3 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between ${sectionBg}`}>
          <div className={`text-sm ${secondaryText}`}>
            {saved ? "Your settings were saved." : "Remember to save your changes after updating preferences."}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-full bg-[#4F7CFF] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#4F7CFF]/20 transition hover:bg-[#3b6ce5]"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
