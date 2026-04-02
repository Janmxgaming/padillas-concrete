import { useTranslation } from 'react-i18next';
import { Armchair, Car, Footprints, LayoutGrid, Layers, Stamp, Wrench } from 'lucide-react';
import SectionHeader from './SectionHeader';

const SERVICES = [
  { icon: Armchair,   key: 'service1' },
  { icon: Car,        key: 'service2' },
  { icon: Footprints, key: 'service3' },
  { icon: LayoutGrid, key: 'service4' },
  { icon: Layers,     key: 'service5' },
  { icon: Stamp,      key: 'service6' },
  { icon: Wrench,     key: 'service7' },
];

export default function Services() {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeader titleKey="services.title" subtitleKey="services.subtitle" />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map(({ icon: Icon, key }) => (
            <div
              key={key}
              className="glass-card rounded-2xl p-8 hover:bg-black/50 hover:border-red-600 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-14 h-14 mb-4 text-red-500">
                <Icon className="w-full h-full" strokeWidth={1.5} />
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