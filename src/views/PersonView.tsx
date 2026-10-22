import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar, MapPin } from 'lucide-react';
import { tmdb, PersonDetails, TMDBMedia, getImageUrl } from '../lib/tmdb';
import { MovieCard } from '../components/MovieCard';
import { useRouter } from '../context/RouterContext';

interface PersonViewProps {
  id: string;
}

export const PersonView: React.FC<PersonViewProps> = ({ id }) => {
  const { goBack } = useRouter();
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPerson() {
      try {
        setLoading(true);
        const data = await tmdb.getPersonDetails(id);
        if (isMounted) setPerson(data);
      } catch (err) {
        console.error('Failed to load person details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPerson();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-[70dvh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-[#e50914]/30 border-t-[#e50914] rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-xs">Profile not found.</p>
        <button onClick={goBack} className="mt-3 px-4 py-2 bg-white/10 rounded-xl text-white text-xs">
          Go Back
        </button>
      </div>
    );
  }

  const allCredits = [
    ...(person.combined_credits?.cast || []),
    ...(person.combined_credits?.crew || []),
  ];

  const uniqueCredits: TMDBMedia[] = [];
  const seenIds = new Set<number>();
  for (const c of allCredits) {
    if (c.id && !seenIds.has(c.id) && (c.poster_path || c.backdrop_path)) {
      seenIds.add(c.id);
      uniqueCredits.push(c);
    }
  }

  uniqueCredits.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 sm:py-8 w-full pb-24">
      {/* Back button */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white mb-5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/[0.08] active:scale-95 transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-start mb-10">
        <div className="w-32 sm:w-48 rounded-2xl overflow-hidden bg-[#12131a] border border-white/[0.08] shrink-0 shadow-2xl">
          <img
            src={getImageUrl(person.profile_path, 'w500')}
            alt={person.name}
            className="w-full aspect-[2/3] object-cover"
          />
        </div>

        <div className="flex-1 space-y-3">
          <span className="inline-block px-2 py-0.5 rounded-md bg-[#e50914]/20 text-rose-400 font-bold uppercase tracking-wider text-[10px] border border-[#e50914]/40">
            {person.known_for_department || 'Artist'}
          </span>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{person.name}</h1>

          {/* Quick Details */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            {person.birthday && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Born: {person.birthday}</span>
              </span>
            )}
            {person.place_of_birth && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{person.place_of_birth}</span>
              </span>
            )}
          </div>

          {/* Biography */}
          {person.biography && (
            <div className="pt-1">
              <p
                className={`text-xs sm:text-sm text-slate-300 leading-relaxed ${
                  !bioExpanded ? 'line-clamp-3 sm:line-clamp-5' : ''
                }`}
              >
                {person.biography}
              </p>
              {person.biography.length > 200 && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold mt-1"
                >
                  {bioExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filmography Credits */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 sm:h-5 bg-[#e50914] rounded-full inline-block" />
            Known Filmography ({uniqueCredits.length})
          </h2>
        </div>

        {uniqueCredits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {uniqueCredits.slice(0, 30).map((media) => (
              <MovieCard key={`credit-${media.id}`} media={media} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No credits recorded.</p>
        )}
      </section>
    </div>
  );
};
