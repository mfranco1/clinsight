import React from "react";

interface LandingPageProps {
  onLaunchApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  return (
    <div className="min-h-screen bg-surface font-sans text-content-strong selection:bg-action-100 selection:text-action-900 flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-action rounded-lg flex items-center justify-center shadow-lg shadow-action-600/20">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-content-strong">
              Clinsight
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#product"
              className="text-sm font-medium text-content-secondary hover:text-action transition-colors"
            >
              Product
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-content-secondary hover:text-action transition-colors"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-content-secondary hover:text-action transition-colors"
            >
              Stories
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onLaunchApp}
              className="hidden md:block text-sm font-medium text-content-default hover:text-content-strong"
            >
              Log in
            </button>
            <button
              onClick={onLaunchApp}
              className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-all shadow-md ring-offset-2 focus:ring-2 focus:ring-neutral-900"
            >
              Launch Workspace
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:40px_40px] opacity-20 [mask-image:linear-gradient(to_bottom,black,transparent)]"></div>

        {/* Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-action-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-[10%] right-[-5%] w-[400px] h-[400px] bg-accent-100/40 rounded-full blur-3xl pointer-events-none mix-blend-multiply"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-canvas border border-border-default text-content-default text-xs font-semibold mb-8 animate-fade-in-up shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-action-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-action-subtle"></span>
              </span>
              v2.5: Advanced Pediatric Templating
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-content-strong mb-8 leading-[1.05]">
              Medical charting, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-action-600 to-accent-600">
                reimagined for speed.
              </span>
            </h1>

            <p className="text-xl text-content-secondary mb-10 max-w-xl mx-auto leading-relaxed">
              Transform fragmented notes into hospital-grade documentation
              instantly. Designed for the high-volume workflows of Filipino
              physicians.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={onLaunchApp}
                className="px-8 py-4 rounded-xl bg-action text-white font-semibold text-base shadow-xl shadow-action-200 hover:bg-action-hover hover:-translate-y-1 transition-all duration-200"
              >
                Start Charting
              </button>
              <button className="px-8 py-4 rounded-xl bg-surface text-content-primary border border-border-default font-semibold text-base hover:bg-canvas hover:border-neutral-300 transition-all duration-200 shadow-sm">
                View Sample Output
              </button>
            </div>
          </div>

          {/* Product Visual */}
          <div className="relative mx-auto max-w-6xl mt-12 perspective-1000">
            <div className="relative bg-surface rounded-xl border border-border-default shadow-2xl overflow-hidden aspect-[16/10] flex flex-col transform rotate-x-2 transition-transform duration-700 hover:rotate-0">
              {/* App Window Header */}
              <div className="h-12 border-b border-border-subtle bg-canvas/80 flex items-center px-4 gap-2 justify-between">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
                  <div className="w-3 h-3 rounded-full bg-neutral-300"></div>
                </div>
                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-md border border-border-default shadow-sm">
                  <svg
                    className="w-3 h-3 text-content-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-content-secondary">
                    clinsight.ai/workspace
                  </span>
                </div>
                <div className="w-16"></div>
              </div>

              {/* App Window Body */}
              <div className="flex-1 flex overflow-hidden bg-canvas">
                {/* Sidebar */}
                <div className="w-64 border-r border-border-default bg-surface p-5 hidden md:flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-action rounded"></div>
                    <div className="h-4 w-20 bg-neutral-200 rounded"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-8 w-full bg-action-subtle text-action-hover rounded-md flex items-center px-3 text-xs font-medium border border-action-100">
                      Active Patient
                    </div>
                    <div className="h-8 w-full bg-surface text-content-secondary rounded-md flex items-center px-3 text-xs font-medium hover:bg-canvas">
                      History
                    </div>
                    <div className="h-8 w-full bg-surface text-content-secondary rounded-md flex items-center px-3 text-xs font-medium hover:bg-canvas">
                      Settings
                    </div>
                  </div>
                  <div className="mt-auto p-4 bg-canvas rounded-lg border border-border-subtle">
                    <div className="h-2 w-3/4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-2 w-1/2 bg-neutral-200 rounded"></div>
                  </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 p-6 md:p-8 grid grid-cols-12 gap-6 overflow-hidden">
                  <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
                    <div className="bg-surface p-4 rounded-xl border border-border-default shadow-sm h-full flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-action-subtle"></div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="h-3 w-24 bg-neutral-200 rounded"></div>
                        <div className="h-6 w-16 bg-action-100 rounded-full"></div>
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="h-2 w-full bg-surface-muted rounded"></div>
                        <div className="h-2 w-full bg-surface-muted rounded"></div>
                        <div className="h-2 w-5/6 bg-surface-muted rounded"></div>
                        <div className="h-2 w-full bg-surface-muted rounded"></div>
                        <div className="h-2 w-4/6 bg-surface-muted rounded"></div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-neutral-50 flex gap-2">
                        <div className="h-8 w-8 rounded-full bg-surface-muted"></div>
                        <div className="h-8 flex-1 rounded-md bg-canvas border border-border-subtle"></div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
                    <div className="bg-surface p-6 rounded-xl border border-border-default shadow-md h-full relative">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-action-100 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-action"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="h-3 w-32 bg-neutral-800 rounded mb-1"></div>
                          <div className="h-2 w-20 bg-neutral-400 rounded"></div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="h-3 w-24 bg-action/20 rounded mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-surface-muted rounded"></div>
                            <div className="h-2 w-11/12 bg-surface-muted rounded"></div>
                            <div className="h-2 w-full bg-surface-muted rounded"></div>
                          </div>
                        </div>
                        <div>
                          <div className="h-3 w-20 bg-action/20 rounded mb-3"></div>
                          <div className="space-y-2">
                            <div className="h-2 w-10/12 bg-surface-muted rounded"></div>
                            <div className="h-2 w-full bg-surface-muted rounded"></div>
                          </div>
                        </div>
                        <div className="absolute bottom-6 right-6">
                          <div className="h-10 w-28 bg-action rounded-lg shadow-lg shadow-action-200"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-action-subtle/20 blur-2xl -z-10 rounded-[30px]"></div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-border-subtle bg-canvas/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-content-muted uppercase tracking-widest mb-8">
            Trusted by clinicians at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
            <div className="flex items-center gap-2 font-bold text-xl text-neutral-800 font-serif tracking-tight">
              <span className="w-6 h-6 bg-neutral-800 text-white flex items-center justify-center text-xs rounded-sm">
                M
              </span>
              MakatiMed
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-neutral-800 tracking-tight">
              <span className="w-6 h-6 border-2 border-neutral-800 rounded-full"></span>
              St. Luke's
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-neutral-800 font-mono tracking-tighter">
              <span className="text-2xl text-action-hover">PGH</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-neutral-800 tracking-tight">
              <span className="w-6 h-6 bg-gradient-to-tr from-neutral-700 to-neutral-500 rounded-tr-lg rounded-bl-lg"></span>
              The Medical City
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-surface relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-content-strong mb-6 tracking-tight">
              Precision tools for the modern ward.
            </h2>
            <p className="text-lg text-content-secondary leading-relaxed">
              Clinical workflows are messy. Clinsight imposes structure without
              slowing you down, turning raw thoughts into structured medical
              records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[400px]">
            <div className="md:col-span-4 bg-canvas rounded-3xl p-10 border border-border-subtle relative overflow-hidden group hover:border-border-default transition-colors">
              <div className="relative z-10 max-w-md h-full flex flex-col justify-between">
                <div>
                  <div className="h-12 w-12 bg-surface rounded-xl shadow-sm border border-border-subtle flex items-center justify-center mb-6 text-action">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-content-strong mb-3">
                    Context-Aware SOAP
                  </h3>
                  <p className="text-content-secondary leading-relaxed">
                    The engine synthesizes history, labs, and vitals into a
                    cohesive narrative. It knows pertinent positives from
                    negatives and structures them automatically.
                  </p>
                </div>
                <div
                  onClick={onLaunchApp}
                  className="inline-flex items-center text-action-hover font-semibold mt-6 cursor-pointer group-hover:translate-x-1 transition-transform"
                >
                  Try Workspace Now{" "}
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </div>
              <div className="absolute top-10 right-[-100px] w-[350px] h-[450px] bg-surface rounded-xl shadow-2xl border border-border-default transform rotate-[-8deg] p-6 opacity-80 group-hover:rotate-[-6deg] group-hover:translate-x-[-10px] transition-all duration-500">
                <div className="space-y-4">
                  <div className="flex gap-3 items-center border-b border-border-subtle pb-4">
                    <div className="h-8 w-8 rounded-full bg-action-subtle"></div>
                    <div className="h-2 w-24 bg-surface-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-surface-muted rounded"></div>
                    <div className="h-2 w-full bg-surface-muted rounded"></div>
                    <div className="h-2 w-3/4 bg-surface-muted rounded"></div>
                  </div>
                  <div className="p-4 bg-action-subtle rounded-lg border border-action-100 mt-4">
                    <div className="h-2 w-full bg-action-100 rounded mb-2"></div>
                    <div className="h-2 w-1/2 bg-action-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-neutral-900 rounded-3xl p-10 border border-neutral-800 relative overflow-hidden text-white flex flex-col justify-between group">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-800"></div>
              <div className="relative z-10">
                <div className="h-12 w-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-6 border border-neutral-700">
                  <svg
                    className="w-6 h-6 text-action-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">Patient Summaries</h3>
                <p className="text-content-muted leading-relaxed">
                  Shift changes are critical. Generate standardized summaries
                  instantly to reduce errors.
                </p>
              </div>
              <div className="relative z-10 mt-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-action-900/50 border border-action-800 text-action-300 text-xs font-mono tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-action-400 mr-2 animate-pulse"></span>
                  Safety First Protocol
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-gradient-to-br from-action-50 to-white rounded-3xl p-10 border border-action-100 group relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 relative z-10">
                <div className="h-12 w-12 bg-surface rounded-xl shadow-sm flex items-center justify-center mb-6">
                  <svg
                    className="w-6 h-6 text-action"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-content-strong mb-3">
                  Evidence-Based Grounding
                </h3>
                <p className="text-content-secondary leading-relaxed">
                  Every plan connects to real-world clinical guidelines. Search
                  integration ensures ICD-10 codes and treatment protocols are
                  current.
                </p>
              </div>

              <div className="w-full md:w-1/2 bg-surface rounded-xl border border-action-100 shadow-lg p-5 relative transform md:rotate-3 transition-transform group-hover:rotate-0">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-8 w-8 rounded-full bg-action-100 flex items-center justify-center text-action-hover">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 bg-canvas p-3 rounded-lg rounded-tl-none text-sm text-content-default leading-relaxed">
                    Recommend initiating ACE inhibitor therapy for hypertension
                    management{" "}
                    <span className="text-action font-semibold cursor-pointer hover:underline">
                      [1]
                    </span>
                    .
                  </div>
                </div>
                <div className="border-t border-border-subtle pt-3">
                  <div className="flex items-center gap-2 text-xs text-content-muted mb-1">
                    Source [1]
                  </div>
                  <div className="text-xs font-semibold text-action-hover truncate">
                    acc.org/guidelines/hbp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-32 bg-canvas border-y border-border-default"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-content-strong">
              Loved by Filipino Physicians
            </h2>
            <p className="text-content-secondary mt-3 text-lg">
              Join colleagues reclaiming their evenings from paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border-subtle flex flex-col relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-8 right-8 text-neutral-200">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
              </div>
              <p className="text-content-default leading-relaxed mb-8 flex-1 relative z-10">
                "Documentation used to take 2 hours after my rounds. With
                Clinsight, I finish my notes while walking between wards. It
                captures the nuance of my Taglish dictations perfectly."
              </p>
              <div className="flex items-center gap-4 border-t border-neutral-50 pt-6">
                <div className="h-12 w-12 bg-action-100 rounded-full flex items-center justify-center font-bold text-action-hover text-sm">
                  MR
                </div>
                <div>
                  <div className="text-sm font-bold text-content-strong">
                    Dr. Maria Reyes
                  </div>
                  <div className="text-xs text-content-secondary font-medium uppercase tracking-wide">
                    Internal Medicine • St. Luke's
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border-subtle flex flex-col relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-8 right-8 text-neutral-200">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
              </div>
              <p className="text-content-default leading-relaxed mb-8 flex-1 relative z-10">
                "The pediatric templates are a lifesaver. It automatically
                structures the developmental history and immunization records
                correctly. A must-have for busy clinics."
              </p>
              <div className="flex items-center gap-4 border-t border-neutral-50 pt-6">
                <div className="h-12 w-12 bg-accent-100 rounded-full flex items-center justify-center font-bold text-accent-700 text-sm">
                  GV
                </div>
                <div>
                  <div className="text-sm font-bold text-content-strong">
                    Dr. Gabriel Velasco
                  </div>
                  <div className="text-xs text-content-secondary font-medium uppercase tracking-wide">
                    Pediatrics • TMC
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-8 rounded-2xl shadow-sm border border-border-subtle flex flex-col relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-8 right-8 text-neutral-200">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 10.3303 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
                </svg>
              </div>
              <p className="text-content-default leading-relaxed mb-8 flex-1 relative z-10">
                "I used to stay late at the hospital just to finish discharge
                summaries. Now I generate them in seconds. The accuracy on
                ICD-10 codes is impressive."
              </p>
              <div className="flex items-center gap-4 border-t border-neutral-50 pt-6">
                <div className="h-12 w-12 bg-surface-muted rounded-full flex items-center justify-center font-bold text-content-primary text-sm">
                  BD
                </div>
                <div>
                  <div className="text-sm font-bold text-content-strong">
                    Dr. Bea Dizon
                  </div>
                  <div className="text-xs text-content-secondary font-medium uppercase tracking-wide">
                    Surgery • PGH
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-content-strong mb-6 tracking-tight">
            Ready to modernize your practice?
          </h2>
          <p className="text-xl text-content-secondary mb-10 max-w-2xl mx-auto">
            No credit card required. Start generating compliant, professional
            notes immediately.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="px-8 py-4 bg-neutral-900 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-neutral-800 hover:scale-[1.02] transition-all"
            >
              Launch Workspace
            </button>
            <button className="px-8 py-4 bg-surface text-content-primary border border-border-default rounded-xl font-bold text-lg hover:bg-canvas hover:border-neutral-300 transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-canvas text-content-secondary py-12 border-t border-border-default mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 bg-neutral-900 rounded flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="font-bold text-xl text-content-strong">
                Clinsight
              </span>
            </div>
            <p className="text-sm text-content-secondary max-w-xs leading-relaxed">
              Intelligent clinical documentation for the next generation of
              healthcare providers. Built with privacy in mind.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-content-strong mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Changelog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-content-strong mb-4 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-content-strong mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-action transition-colors">
                  BAA
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border-default text-center text-xs text-content-muted">
          &copy; {new Date().getFullYear()} Clinsight Health Inc. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
