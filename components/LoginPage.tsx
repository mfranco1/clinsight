
import React, { useState } from 'react';
import { Icons } from './ui/Icons';

interface LoginPageProps {
  onLogin: () => void;
  onGoToAbout: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onGoToAbout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-cyan-100/40 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="h-12 w-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-100 mb-3 animate-fade-in-up">
              <Icons.Logo className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Clinsight</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.15em]">Intelligent Medical Charting</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="p-10 pb-8">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Work Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icons.Mail className="h-4 w-4 text-slate-300" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none text-sm transition-all placeholder-slate-300"
                    placeholder="name@hospital.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Icons.Lock className="h-4 w-4 text-slate-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none text-sm transition-all placeholder-slate-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-teal-600 transition-colors"
                  >
                    {showPassword ? (
                      <Icons.EyeOff className="h-4 w-4" />
                    ) : (
                      <Icons.Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                  <input id="remember-me" type="checkbox" className="h-4 w-4 text-teal-600 bg-white border-slate-200 focus:ring-teal-500 rounded-full cursor-pointer transition-all" />
                  <label htmlFor="remember-me" className="ml-2.5 block text-[13px] text-slate-500 font-medium cursor-pointer">Remember this device</label>
                </div>
                <button type="button" className="text-[13px] font-bold text-teal-600 hover:text-teal-700">Forgot password?</button>
              </div>

              <div className="pt-4">
                <button
                    type="submit"
                    className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold text-base shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-0.5 transition-all focus:ring-4 focus:ring-teal-100 active:scale-[0.98]"
                >
                    Continue to Workspace
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-slate-50/50 px-10 py-5 border-t border-slate-100 flex items-center justify-center gap-2">
            <Icons.ShieldCheck className="h-4 w-4 text-teal-600/70" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Secure, HIPAA-Compliant Access</span>
          </div>
        </div>

        <div className="mt-12 text-center flex items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <button className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors">Terms of Service</button>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <button className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors">Privacy Policy</button>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <button className="text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors">Support</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
