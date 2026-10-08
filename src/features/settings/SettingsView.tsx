import React from "react";
import { Icons } from "../../components/ui/Icons";
import { SPECIALIZATIONS, MODELS } from "../../config/appConfig";

interface SettingsViewProps {
  defaultSpecialization: string;
  setDefaultSpecialization: (val: string) => void;
  defaultModel: string;
  setDefaultModel: (val: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  defaultSpecialization,
  setDefaultSpecialization,
  defaultModel,
  setDefaultModel,
}) => {
  const [localSpecialization, setLocalSpecialization] = React.useState(
    defaultSpecialization,
  );
  const [localModel, setLocalModel] = React.useState(defaultModel);
  const [isSaved, setIsSaved] = React.useState(false);

  const handleSave = () => {
    try {
      setDefaultSpecialization(localSpecialization);
      setDefaultModel(localModel);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in-up">
      <div className="space-y-8">
        {/* Profile Section */}
        <section className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-canvas/50">
            <h2 className="text-sm font-bold text-content-strong uppercase tracking-wider">
              Profile Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-action-100 border-2 border-action-border flex items-center justify-center text-2xl font-bold text-action-hover shadow-inner">
                MF
              </div>
              <div>
                <button className="px-4 py-2 bg-surface border border-border-default rounded-xl text-xs font-bold text-content-primary hover:bg-canvas transition-colors shadow-sm">
                  Change Avatar
                </button>
                <p className="text-[10px] text-content-muted mt-2 uppercase font-bold tracking-widest">
                  Max size of 2MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Marty Franco"
                  className="w-full px-4 py-2.5 bg-canvas border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-focus-ring outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="m.franco@clinsight.com"
                  className="w-full px-4 py-2.5 bg-canvas border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-focus-ring outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Preferences */}
        <section className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-canvas/50">
            <h2 className="text-sm font-bold text-content-strong uppercase tracking-wider">
              Clinical Preferences
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider ml-1">
                  Default Specialization
                </label>
                <select
                  value={localSpecialization}
                  onChange={(e) => setLocalSpecialization(e.target.value)}
                  className="w-full px-4 py-2.5 bg-canvas border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-focus-ring outline-none transition-all appearance-none"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider ml-1">
                  Default Model
                </label>
                <select
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-canvas border border-border-default rounded-xl text-sm focus:ring-2 focus:ring-focus-ring outline-none transition-all appearance-none"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-action-subtle/50 rounded-xl border border-action-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-action-100 rounded-lg text-action-hover">
                  <Icons.Assistance className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-content-strong">
                    Auto-save Drafts
                  </p>
                  <p className="text-xs text-content-secondary">
                    Automatically save your clinical notes every 30 seconds.
                  </p>
                </div>
              </div>
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-action transition-colors duration-200 ease-in-out">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out"></span>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-surface rounded-2xl border border-border-default shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border-subtle bg-canvas/50">
            <h2 className="text-sm font-bold text-content-strong uppercase tracking-wider">
              Notifications
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              {
                title: "Critical Alerts",
                desc: "Get notified immediately when critical events are detected",
                enabled: true,
              },
              {
                title: "Summary Reminders",
                desc: "Receive a reminder 30 minutes before shift change",
                enabled: true,
              },
              {
                title: "System Updates",
                desc: "Stay informed about new features and maintenance",
                enabled: false,
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-content-strong">
                    {item.title}
                  </p>
                  <p className="text-xs text-content-secondary">{item.desc}</p>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.enabled ? "bg-action" : "bg-neutral-200"}`}
                >
                  <span
                    className={`${item.enabled ? "translate-x-5" : "translate-x-0"} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out`}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-surface rounded-2xl border border-danger-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-danger-50 bg-danger-50/30">
            <h2 className="text-sm font-bold text-danger-700 uppercase tracking-wider">
              Danger Zone
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-content-strong">
                Delete Account
              </p>
              <p className="text-xs text-content-secondary">
                Permanently remove your account and all clinical data. This
                cannot be undone.
              </p>
            </div>
            <button className="px-4 py-2 bg-surface border border-danger-200 rounded-xl text-xs font-bold text-danger-600 hover:bg-danger-50 transition-colors shadow-sm">
              Delete Account
            </button>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4 items-center">
          <button className="px-6 py-2.5 bg-surface border border-border-default rounded-xl text-sm font-bold text-content-default hover:bg-canvas transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md flex items-center gap-2 ${
              isSaved
                ? "bg-action-subtle text-white shadow-action-100"
                : "bg-action text-white hover:bg-action-hover shadow-action-100"
            }`}
          >
            {isSaved ? (
              <>
                <Icons.Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
