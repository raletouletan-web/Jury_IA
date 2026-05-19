/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Mic, MicOff, Activity, ShieldCheck, ClipboardList, Info, Loader2 } from 'lucide-react';
import { useLiveApi } from './hooks/useLiveApi';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { status, transcription, connect, disconnect } = useLiveApi();
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        setHasMicrophonePermission(true);
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => setHasMicrophonePermission(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#2C2C2C] font-sans selection:bg-[#E5E2D9]">
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white px-4 py-2 rounded-full border border-[#E5E2D9] shadow-sm text-xs font-bold text-[#6B705C] uppercase tracking-wider">
          Savoirscope - Patrice DIAKITÉ
        </div>
      </div>
      {transcription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white p-8 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 font-serif italic text-[#3A3D2F]">Synthèse de votre évaluation</h3>
            <p className="text-sm text-[#2C2C2C] leading-relaxed mb-6 whitespace-pre-line">{transcription}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#6B705C] text-white py-2 px-4 rounded-xl font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      <header className="bg-white border-b border-[#E5E2D9] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#6B705C] p-2 rounded-md">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif italic font-semibold text-[#3A3D2F] tracking-tight leading-tight">Jury IA : VAE Aide-Soignant</h1>
              <p className="text-xs text-[#A5A295] font-medium uppercase tracking-wider mt-0.5">Entraînement Officiel & Simulation</p>
            </div>
          </div>
          <div className="flex items-center">
            {status === 'connected' ? (
              <span className="inline-flex items-center space-x-2 bg-[#F0EFEB] text-[#6B705C] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#D6D3C9] shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>En direct avec le Jury</span>
              </span>
            ) : status === 'connecting' ? (
              <span className="inline-flex items-center space-x-2 bg-[#FDFCF9] text-[#A5A295] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#E5E2D9] shadow-sm">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Connexion en cours...</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-2 bg-white text-[#A5A295] px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-[#D6D3C9] shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#D6D3C9]"></span>
                <span>Déconnecté</span>
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#FDFCF9] rounded-[40px] shadow-xl shadow-[#6B705C]/5 border border-[#E5E2D9] overflow-hidden flex flex-col h-[500px] relative">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')" }}></div>
              <div className="p-6 flex items-center justify-center z-10 relative">
                <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A5A295] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#6B705C]" />
                  Espace d'Entretien
                </h2>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative isolate">
                <AnimatePresence mode="wait">
                  {status === 'connected' ? (
                    <motion.div 
                      key="connected"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-[#6B705C] rounded-full animate-ping opacity-20"></div>
                        <div className="absolute inset-0 bg-[#A5A295] rounded-full animate-pulse opacity-20" style={{ animationDuration: '2s' }}></div>
                        <div className="bg-[#B7B7A4] rounded-full p-8 shadow-inner relative z-10 border-4 border-white flex items-center justify-center">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-serif italic text-[#3A3D2F] mb-2">Le Jury vous écoute</h3>
                      <p className="text-sm font-medium italic text-[#6B705C] max-w-md mx-auto">
                        Parlez naturellement. L'IA analysera vos réponses et interagira avec vous en temps réel.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="disconnected"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-w-md mx-auto z-10 relative"
                    >
                      <div className="bg-[#B7B7A4] rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center text-white ring-4 ring-white shadow-inner">
                        <MicOff className="w-10 h-10" />
                      </div>
                      <h3 className="font-serif italic text-3xl text-[#3A3D2F] mb-3">Prêt pour votre oral ?</h3>
                      <p className="text-sm text-[#A5A295] font-medium tracking-wide mb-8 leading-relaxed">
                        Cliquez sur le bouton ci-dessous pour démarrer la simulation. Assurez-vous d'être dans un environnement calme et d'avoir autorisé l'accès à votre microphone.
                      </p>
                      
                      {hasMicrophonePermission === false && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-xs flex items-start text-left border border-red-100">
                          <Info className="w-4 h-4 flex-shrink-0 mr-2 mt-0.5" />
                          <p>Accès au microphone bloqué. Veuillez l'autoriser dans les paramètres de votre navigateur pour utiliser la simulation.</p>
                        </div>
                      )}

                      <button
                        onClick={connect}
                        disabled={status === 'connecting'}
                        className="bg-[#6B705C] hover:bg-[#5A5E4D] disabled:bg-[#A5A295] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-[#6B705C]/20 transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto"
                      >
                        {status === 'connecting' ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Connexion...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5" />
                            <span>Démarrer l'Entretien</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {status === 'connected' && (
                  <div className="absolute bottom-8 z-10">
                    <button
                      onClick={disconnect}
                      className="bg-white hover:bg-[#F0EFEB] text-[#6B705C] border border-[#D6D3C9] font-bold text-sm py-2 px-6 rounded-xl transition-colors duration-200 flex items-center space-x-2"
                    >
                      <MicOff className="w-4 h-4" />
                      <span>Terminer l'entretien</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Guide Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#FAF9F6] p-5 rounded-xl border border-[#E5E2D9] text-[#2C2C2C]">
                <div className="flex items-center gap-2 mb-3 text-[#6B705C]">
                  <ClipboardList className="w-5 h-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wider">Sujets couverts</h4>
                </div>
                <ul className="text-[13px] opacity-80 space-y-2 list-inside">
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Activités de la vie quotidienne</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Appréciation de l'état clinique</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Réalisation de soins adaptés</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Hygiène et transmissions</li>
                </ul>
              </div>
              <div className="bg-[#FAF9F6] p-5 rounded-xl border border-[#E5E2D9] text-[#2C2C2C]">
                <div className="flex items-center gap-2 mb-3 text-[#6B705C]">
                  <Info className="w-5 h-5" />
                  <h4 className="font-bold text-sm uppercase tracking-wider">Conseils</h4>
                </div>
                <ul className="text-[13px] opacity-80 space-y-2 list-inside">
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Soyez clair et précis</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Utilisez des exemples concrets</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Analysez vos pratiques</li>
                  <li className="flex items-start"><span className="mr-2 text-[#6B705C] font-bold">•</span> Ne vous pressez pas</li>
                </ul>
              </div>
            </div>
          </div>

          <aside className="space-y-8">
            <section className="bg-white rounded-[24px] border border-[#E5E2D9] p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#A5A295] font-bold mb-6">Déroulement de l'entretien</h3>
              
              <div className="space-y-4">
                
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#6B705C] text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">1</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3A3D2F]">Présentation</h4>
                    <p className="text-xs text-[#A5A295]">Introduction et parcours.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#6B705C] text-[#6B705C] flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3A3D2F]">Cas Pratiques</h4>
                    <p className="text-xs text-[#A5A295]">Mise en situation métiers.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-5 h-5 rounded-full border border-[#D6D3C9] flex items-center justify-center text-[10px] shrink-0 text-[#A5A295]">3</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3A3D2F]">Analyse</h4>
                    <p className="text-xs text-[#A5A295]">Posture professionnelle.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-5 h-5 rounded-full border border-[#D6D3C9] flex items-center justify-center text-[10px] shrink-0 text-[#A5A295]">4</div>
                  <div>
                    <h4 className="text-sm font-bold text-[#3A3D2F]">Feedback</h4>
                    <p className="text-xs text-[#A5A295]">Retours sur la prestation.</p>
                  </div>
                </div>
                
              </div>
            </section>
            
            <section className="p-5 bg-[#F8F7F2] rounded-2xl border-l-4 border-[#6B705C]">
              <h3 className="text-[11px] uppercase font-bold text-[#6B705C] mb-2">Confidentialité</h3>
              <p className="text-sm text-[#2C2C2C] italic leading-snug">
                Les échanges sont traités en temps réel par l'IA et ne sont pas stockés à l'issue de votre session.
              </p>
            </section>
          </aside>
          
        </div>
      </main>
    </div>
  );
}

