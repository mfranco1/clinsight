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
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Profile Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-teal-100 border-2 border-teal-200 flex items-center justify-center text-2xl font-bold text-teal-700 shadow-inner">
                MF
              </div>
              <div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                  Change Avatar
                </button>
                <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">
                  Max size of 2MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Marty Franco"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="m.franco@clinsight.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Clinical Preferences */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Clinical Preferences
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Default Specialization
                </label>
                <select
                  value={localSpecialization}
                  onChange={(e) => setLocalSpecialization(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none"
                >
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                  Default Model
                </label>
                <select
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none"
                >
                  {MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-teal-50/50 rounded-xl border border-teal-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-700">
                  <Icons.Assistance className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Auto-save Drafts
                  </p>
                  <p className="text-xs text-slate-500">
                    Automatically save your clinical notes every 30 seconds.
                  </p>
                </div>
              </div>
              <div className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-teal-600 transition-colors duration-200 ease-in-out">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
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
                  <p className="text-sm font-bold text-slate-900">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${item.enabled ? "bg-teal-600" : "bg-slate-200"}`}
                >
                  <span
                    className={`${item.enabled ? "translate-x-5" : "translate-x-0"} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-50 bg-red-50/30">
            <h2 className="text-sm font-bold text-red-700 uppercase tracking-wider">
              Danger Zone
            </h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Delete Account</p>
              <p className="text-xs text-slate-500">
                Permanently remove your account and all clinical data. This
                cannot be undone.
              </p>
            </div>
            <button className="px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors shadow-sm">
              Delete Account
            </button>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4 items-center">
          <button className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md flex items-center gap-2 ${
              isSaved
                ? "bg-teal-500 text-white shadow-teal-100"
                : "bg-teal-600 text-white hover:bg-teal-700 shadow-teal-100"
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
