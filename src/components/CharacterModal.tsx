import React, { useEffect, useState } from 'react';
import { X, User, Calendar, Heart, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { anilistApi, CharacterDetails, cleanAnimeDescription, getAnimeImageUrl } from '../lib/anilist';

interface CharacterModalProps {
  characterId: string | number | null;
  onClose: () => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({ characterId, onClose }) => {
  const [data, setData] = useState<CharacterDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!characterId) {
      setData(null);
      return;
    }

    let isMounted = true;
    async function fetchCharacter() {
      setLoading(true);
      setError(null);
      try {
        const details = await anilistApi.getCharacterInfo(characterId!);
        if (isMounted) setData(details);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load character details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCharacter();
    return () => {
      isMounted = false;
    };
  }, [characterId]);

  if (!characterId) return null;

  const fullName =
    typeof data?.name === 'object'
      ? data.name.userPreferred || data.name.full || `${data.name.first || ''} ${data.name.last || ''}`.trim()
      : String(data?.name || 'Character');

  const nativeName = typeof data?.name === 'object' ? data.name.native : undefined;
  const image = getAnimeImageUrl(data?.image);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[85vh] bg-[#0d0e15] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121420]/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Character Profile</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                <p className="text-sm font-medium">Loading character information...</p>
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 my-8">
                {error}
              </div>
            )}

            {!loading && data && (
              <div className="space-y-6">
                {/* Character Main Row */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {image ? (
                    <img
                      src={image}
                      alt={fullName}
                      className="w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-2xl border border-white/10 shadow-lg shrink-0 mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/10">
                      <User className="w-12 h-12 text-slate-500" />
                    </div>
                  )}

                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <h2 className="text-2xl font-black text-white">{fullName}</h2>
                      {nativeName && (
                        <p className="text-sm text-slate-400 font-medium mt-0.5">{nativeName}</p>
                      )}
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                      {data.gender && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300">
                          Gender: {data.gender}
                        </span>
                      )}
                      {data.bloodType && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300">
                          Blood: {data.bloodType}
                        </span>
                      )}
                      {data.age && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300">
                          Age: {data.age}
                        </span>
                      )}
                      {data.dateOfBirth?.year && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-teal-400" />
                          <span>
                            {data.dateOfBirth.month}/{data.dateOfBirth.day}/{data.dateOfBirth.year}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Alternative names */}
                    {data.name.alternative && data.name.alternative.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Also Known As:
                        </span>
                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                          {data.name.alternative.slice(0, 6).map((alt, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-teal-300/90 bg-teal-950/40 border border-teal-500/20 px-2 py-0.5 rounded-md"
                            >
                              {alt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Biography */}
                {data.description && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-400" />
                      <span>Biography</span>
                    </h3>
                    <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-black/30 p-4 rounded-2xl border border-white/5 max-h-64 overflow-y-auto">
                      {cleanAnimeDescription(data.description)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
