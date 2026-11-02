import React, { useEffect, useState } from 'react';
import { X, UserCheck, Calendar, Briefcase, MapPin, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { anilistApi, StaffDetails, cleanAnimeDescription, getAnimeImageUrl } from '../lib/anilist';

interface StaffModalProps {
  staffId: string | number | null;
  onClose: () => void;
}

export const StaffModal: React.FC<StaffModalProps> = ({ staffId, onClose }) => {
  const [data, setData] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId) {
      setData(null);
      return;
    }

    let isMounted = true;
    async function fetchStaff() {
      setLoading(true);
      setError(null);
      try {
        const details = await anilistApi.getStaffInfo(staffId!);
        if (isMounted) setData(details);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load staff details');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchStaff();
    return () => {
      isMounted = false;
    };
  }, [staffId]);

  if (!staffId) return null;

  const fullName =
    typeof data?.name === 'object'
      ? data.name.userPreferred || data.name.full || `${data.name.first || ''} ${data.name.last || ''}`.trim()
      : String(data?.name || 'Staff');

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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121420]/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Briefcase className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Creator & Staff Info</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                <p className="text-sm font-medium">Loading staff details...</p>
              </div>
            )}

            {error && (
              <div className="p-6 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 my-8">
                {error}
              </div>
            )}

            {!loading && data && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {image ? (
                    <img
                      src={image}
                      alt={fullName}
                      className="w-32 h-44 sm:w-40 sm:h-56 object-cover rounded-2xl border border-white/10 shadow-lg shrink-0 mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-32 h-44 sm:w-40 sm:h-56 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-white/10">
                      <UserCheck className="w-12 h-12 text-slate-500" />
                    </div>
                  )}

                  <div className="flex-1 space-y-3 text-center sm:text-left">
                    <div>
                      <h2 className="text-2xl font-black text-white">{fullName}</h2>
                      {nativeName && (
                        <p className="text-sm text-slate-400 font-medium mt-0.5">{nativeName}</p>
                      )}
                    </div>

                    {/* Primary Occupations */}
                    {data.primaryOccupations && data.primaryOccupations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                        {data.primaryOccupations.map((occ, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300"
                          >
                            {occ}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Details row */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                      {data.homeTown && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>{data.homeTown}</span>
                        </span>
                      )}
                      {data.age && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300">
                          Age: {data.age}
                        </span>
                      )}
                      {data.dateOfBirth?.year && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/10 text-slate-300 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>
                            {data.dateOfBirth.month}/{data.dateOfBirth.day}/{data.dateOfBirth.year}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Biography */}
                {data.description && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Biography & Career</span>
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
