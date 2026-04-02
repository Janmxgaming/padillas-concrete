import { useTranslation } from 'react-i18next';
import SectionHeader from './SectionHeader';

// Professional SVG Icons for concrete services
const Icons = {
  // Patio: Umbrella with table
  patio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M2 10C2 5.03 6.48 2 12 2s10 3.03 10 8H2z" />
      <line x1="12" y1="10" x2="12" y2="20" />
      <path d="M7 16h10" />
      <line x1="9" y1="16" x2="9" y2="20" />
      <line x1="15" y1="16" x2="15" y2="20" />
      <path d="M6 20h12" />
    </svg>
  ),

  // Driveway: Road in perspective
  driveway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M4 22L10 2h4l6 20H4z" />
      <line x1="10.5" y1="8" x2="13.5" y2="8" />
      <line x1="9.5" y1="14" x2="14.5" y2="14" />
      <line x1="12" y1="3" x2="12" y2="6" strokeDasharray="2 2" />
      <line x1="12" y1="9" x2="12" y2="12" strokeDasharray="2 2" />
      <line x1="12" y1="15" x2="12" y2="18" strokeDasharray="2 2" />
    </svg>
  ),

  // Walkway: Path flanked by plants
  walkway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <line x1="9" y1="2" x2="9" y2="22" />
      <line x1="15" y1="2" x2="15" y2="22" />
      <line x1="9" y1="7" x2="15" y2="7" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="17" x2="15" y2="17" />
      <path d="M4 8c1-2 3-2 4 0" />
      <path d="M4 14c1-2 3-2 4 0" />
      <path d="M20 8c-1-2-3-2-4 0" />
      <path d="M20 14c-1-2-3-2-4 0" />
    </svg>
  ),

  // Sidewalk: Concrete pavement slabs
  sidewalk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="2" y="5" width="20" height="14" rx="1" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="10" y1="5" x2="10" y2="12" />
      <line x1="18" y1="5" x2="18" y2="12" />
      <line x1="6" y1="12" x2="6" y2="19" />
      <line x1="14" y1="12" x2="14" y2="19" />
    </svg>
  ),

  // Reinforced Concrete: Rebar grid with tie wires
  reinforced: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <line x1="5" y1="3" x2="5" y2="21" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="19" y1="3" x2="19" y2="21" />
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="16" x2="21" y2="16" />
      <circle cx="5" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="5" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),

  // Stamped Concrete: Staggered brick/stone pattern
  stamped: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <rect x="2" y="2" width="20" height="20" rx="1" />
      <line x1="2" y1="8.5" x2="22" y2="8.5" />
      <line x1="9" y1="2" x2="9" y2="8.5" />
      <line x1="17" y1="2" x2="17" y2="8.5" />
      <line x1="2" y1="15" x2="22" y2="15" />
      <line x1="13" y1="8.5" x2="13" y2="15" />
      <line x1="7" y1="15" x2="7" y2="22" />
      <line x1="17" y1="15" x2="17" y2="22" />
    </svg>
  ),

  // And More: Concrete trowel
  other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
      <path d="M5 21l-2-2 6-6 2 2-6 6z" />
      <line x1="11" y1="13" x2="16" y2="8" />
      <path d="M15 4l5 5-4 4-5-5 1.5-3L15 4z" />
    </svg>
  ),
};

const SERVICES = [
  { icon: Icons.patio, key: 'service1' },
  { icon: Icons.driveway, key: 'service2' },
  { icon: Icons.walkway, key: 'service3' },
  { icon: Icons.sidewalk, key: 'service4' },
  { icon: Icons.reinforced, key: 'service5' },
  { icon: Icons.stamped, key: 'service6' },
  { icon: Icons.other, key: 'service7' },
];

export default function Services() {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader titleKey="services.title" subtitleKey="services.subtitle" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map(({ icon, key }) => (
            <div
              key={key}
              className="glass-card rounded-2xl p-8 hover:bg-black/50 hover:border-red-600 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 mb-4 text-red-500">
                {icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 text-shadow">{t(`services.${key}.name`)}</h3>
              <p className="text-white text-shadow">{t(`services.${key}.description`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}