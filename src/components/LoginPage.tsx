import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowRight, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { login, changePassword, initUsers } from '../lib/auth';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('lastUsername') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Change Password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // const [changePasswordMessage, setChangePasswordMessage] = useState('');

  // Init users silently on mount (ensures tables and users exist)
  useEffect(() => {
    initUsers();
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Automatically convert to UPPERCASE and replace spaces with dots
    setUsername(e.target.value.toUpperCase().replace(/\s+/g, '.'));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError('');
    setLoading(true);
    
    if (!username || !password) {
      toast.error('Preencha o usuário e a senha.');
      setLoading(false);
      return;
    }

    const res = await login(username, password);
    if (res.success && res.username) {
      localStorage.setItem('lastUsername', res.username);
      setLoginSuccess(true);
      toast.success('Login aprovado!');
      setTimeout(() => {
        onLogin(res.username!);
      }, 2000);
    } else {
      if (res.message === 'force-password-change') {
        toast.info('Atenção: Por motivos de segurança, você precisa criar uma nova senha.', { duration: 5000 });
        setShowChangePassword(true);
      } else {
        toast.error(res.message);
      }
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // setChangePasswordMessage('');
    
    if (!username || !currentPassword || !newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('As novas senhas não coincidem.');
      return;
    }

    setLoading(true);
    const res = await changePassword(username, currentPassword, newPassword);
    
    if (res.success) {
      toast.success('Senha alterada com sucesso! Você pode fazer login agora.');
      setTimeout(() => {
        setShowChangePassword(false);
        setPassword('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // setChangePasswordMessage('');
      }, 3000);
    } else {
      toast.error(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative premium background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-orange-500/10 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-sky-400/10 blur-3xl mix-blend-screen pointer-events-none"></div>
        <div className="absolute top-[40%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/10 blur-3xl mix-blend-screen pointer-events-none"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div layout className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden transition-all">
          
          <AnimatePresence mode="wait">
            {!showChangePassword ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="relative flex flex-col"
              >
                <motion.div 
                  layout
                  animate={{ 
                    scale: loginSuccess ? 1.2 : 1,
                    y: (loading || loginSuccess) ? 40 : 0
                  }}
                  transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                  className="flex justify-center mb-8 relative z-20"
                >
                  {/* Logo Premium CICLO - Abstract C Cycle */}
                  <div className="relative group flex justify-center items-center">
                    {/* Outer Glow */}
                    <motion.div 
                      animate={{ 
                        opacity: loginSuccess ? 1 : (loading ? 0.8 : 0.4),
                        scale: loginSuccess ? 1.5 : (loading ? 1.2 : 1)
                      }}
                      className={`absolute inset-0 bg-gradient-to-tr ${loginSuccess ? 'from-emerald-500/60 to-emerald-400/60' : 'from-orange-500/40 to-sky-500/40'} blur-[32px] rounded-full transition-all duration-700 pointer-events-none`}
                    />
                    
                    <motion.div 
                      animate={{
                        borderColor: loginSuccess ? 'rgba(52, 211, 153, 0.5)' : (loading ? 'rgba(249, 115, 22, 0.5)' : 'rgba(51, 65, 85, 0.5)')
                      }}
                      className="relative flex items-center justify-center w-24 h-24 bg-slate-900/80 border-2 rounded-[2rem] shadow-2xl backdrop-blur-xl z-10 overflow-hidden transition-colors duration-500"
                    >
                      {/* Internal abstract elements */}
                      <motion.div 
                        animate={{ rotate: loginSuccess ? 720 : (loading ? 360 : 0) }}
                        transition={{ duration: loginSuccess ? 1 : (loading ? 2 : 0), repeat: loading && !loginSuccess ? Infinity : 0, ease: "linear" }}
                        className={`absolute top-1/4 right-1/4 w-12 h-12 border-[3px] ${loginSuccess ? 'border-t-emerald-400 border-r-emerald-400' : 'border-t-orange-500 border-r-orange-500'} border-b-transparent border-l-transparent rounded-full`}
                      />
                      <motion.div 
                        animate={{ rotate: loginSuccess ? -720 : (loading ? -360 : 0) }}
                        transition={{ duration: loginSuccess ? 1 : (loading ? 2 : 0), repeat: loading && !loginSuccess ? Infinity : 0, ease: "linear" }}
                        className={`absolute bottom-1/4 left-1/4 w-12 h-12 border-[3px] ${loginSuccess ? 'border-b-emerald-400 border-l-emerald-400' : 'border-b-sky-400 border-l-sky-400'} border-t-transparent border-r-transparent rounded-full`}
                      />
                      
                      {loginSuccess ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>
                          <ShieldCheck className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                        </motion.div>
                      ) : (
                        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] z-20 group-hover:scale-150 transition-transform duration-500"></div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                <AnimatePresence mode="wait">
                  {(!loading && !loginSuccess) ? (
                    <motion.div
                      key="form-content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <div className="text-center mb-8">
                        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-1">CICLO</h1>
                        <p className="text-sky-300 text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Gestão Inteligente de Enxovais</p>
                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-inner">
                          <p className="text-orange-400 text-[9px] font-bold tracking-[0.2em] uppercase flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Acesso Restrito
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={handleUsernameChange}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:border-sky-500/50 focus:bg-slate-700/50 hover:bg-slate-700/50 hover:border-orange-500/50 transition-all font-medium placeholder:text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        placeholder="NOME.SOBRENOME"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="w-5 h-5 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:border-orange-500/50 focus:bg-slate-700/50 hover:bg-slate-700/50 hover:border-orange-500/50 transition-all font-medium placeholder:text-slate-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]"
                        placeholder="••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 group disabled:opacity-50 mt-6"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Entrar no Sistema
                        <ArrowRight className="w-5 h-5 text-sky-400 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowChangePassword(true); }}
                      className="text-xs font-medium text-slate-500 hover:text-sky-300 transition-colors uppercase tracking-wider"
                    >
                      Precisa alterar sua senha?
                    </button>
                  </div>
                  </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-[260px] flex flex-col items-center justify-center"
                    >
                      <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-sm font-bold tracking-[0.2em] uppercase ${loginSuccess ? 'text-emerald-400' : 'text-orange-400 animate-pulse'}`}
                      >
                        {loginSuccess ? 'Acesso Liberado' : 'Autenticando...'}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="change-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-400" />
                    Alterar Senha
                  </h2>
                  <button
                    onClick={() => { setShowChangePassword(false); }}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 focus:outline-none focus:border-sky-500/50 hover:bg-slate-700/50 hover:border-sky-500/30 transition-all font-medium placeholder:text-slate-600"
                      placeholder="Usuário (NOME.SOBRENOME)"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 focus:outline-none focus:border-orange-500/50 hover:bg-slate-700/50 hover:border-orange-500/30 transition-all font-medium placeholder:text-slate-600"
                      placeholder="Senha Atual"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 focus:outline-none focus:border-orange-500/50 hover:bg-slate-700/50 hover:border-orange-500/30 transition-all font-medium placeholder:text-slate-600"
                      placeholder="Nova Senha"
                    />
                  </div>

                  <div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-3 px-4 focus:outline-none focus:border-orange-500/50 hover:bg-slate-700/50 hover:border-orange-500/30 transition-all font-medium placeholder:text-slate-600"
                      placeholder="Confirmar Nova Senha"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white/5 border border-white/10 hover:bg-orange-500/10 hover:border-orange-500/50 text-white font-bold py-3.5 px-6 rounded-2xl transition-all hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] flex items-center justify-center gap-2 group disabled:opacity-50 mt-6"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-8 text-center text-[10px] text-slate-500 font-medium tracking-wider uppercase">
            SISTEMA EXCLUSIVO - GRUPO LAGOA
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-4 sm:bottom-6 w-full px-4 z-10 text-center pointer-events-none">
        <p className="text-[9px] sm:text-[10px] text-slate-500/70 leading-relaxed max-w-3xl mx-auto font-medium">
          <strong>Todos os direitos reservados à Lagoa Parques e Hotéis - Caldas Novas - GO &copy;.</strong><br/>
          É expressamente proibido ceder ou compartilhar o acesso a este aplicativo com terceiros. A cópia, distribuição ou uso não autorizado constitui infração, sujeita às penalidades da Lei do Software (Lei nº 9.609/1998).
        </p>
      </div>
    </div>
  );
};
