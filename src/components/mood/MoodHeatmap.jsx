import { motion } from 'framer-motion';
import { MOODS } from '../../utils/constants';
import { getLast90Days } from '../../utils/helpers';

export default function MoodHeatmap({ checkins = {}, streak = 0 }) {
  const days = getLast90Days();
  const weeks = [];

  // Group into weeks
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getMoodColor = (date) => {
    const checkin = checkins[date];
    if (!checkin) return '#E8E4FF';
    const mood = MOODS.find(m => m.id === checkin.mood);
    return mood?.color || '#7C6FF7';
  };

  const getMoodEmoji = (date) => {
    const checkin = checkins[date];
    if (!checkin) return null;
    return MOODS.find(m => m.id === checkin.mood)?.emoji;
  };

  return (
    <div className="space-y-3">
      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="font-semibold text-soul-text">{streak} day streak!</span>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const emoji = getMoodEmoji(day);
                const color = getMoodColor(day);
                const hasCheckin = !!checkins[day];

                return (
                  <motion.div
                    key={day}
                    title={`${day}${emoji ? ' ' + emoji : ''}`}
                    className="w-4 h-4 rounded-sm cursor-pointer relative group"
                    style={{ backgroundColor: color }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: (wi * 7 + di) * 0.003,
                      type: 'spring',
                      stiffness: 500,
                    }}
                    whileHover={{ scale: 1.5, zIndex: 10 }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex items-center gap-1 bg-soul-text text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-20 pointer-events-none">
                      {emoji && <span>{emoji}</span>}
                      <span>{day}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-soul-muted">Mood legend:</span>
        {MOODS.map(mood => (
          <div key={mood.id} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: mood.color }} />
            <span className="text-xs text-soul-muted">{mood.emoji}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
