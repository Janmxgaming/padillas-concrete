import { useState, useEffect, useRef } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SectionHeader from './SectionHeader';
import { validateFormData, sanitizeFormData } from '../utils/validation';
import { showSuccess, showError, showValidationErrors, showLoading, closeAlert } from '../utils/alerts';
import { contactFormLimiter, validateHoneypot } from '../utils/spamPrevention';

const INITIAL_FORM = {
  name: '', email: '', phone: '', service: '', message: '',
  street: '', apt: '', city: '', state: '', zip: '',
  honeypot: '',
};

const CONTACT_INFO = [
  { Icon: Phone, labelKey: 'contact.phone', href: 'tel:+17195657189', text: '(719) 565-7189' },
  { Icon: Mail, labelKey: 'contact.email', href: 'mailto:vpadilla604@gmail.com', text: 'vpadilla604@gmail.com' },
  { Icon: MapPin, labelKey: 'contact.location', text: null },
];

const SERVICE_OPTIONS = [
  { value: 'Patios', key: 'services.service1.name' },
  { value: 'Driveways', key: 'services.service2.name' },
  { value: 'Walkways', key: 'services.service3.name' },
  { value: 'Sidewalks', key: 'services.service4.name' },
  { value: 'Concrete Reinforced', key: 'services.service5.name' },
  { value: 'Stamped Concrete', key: 'services.service6.name' },
  { value: 'Other', key: 'contact.form.other' },
];

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Cloudflare Turnstile site key (test key for dev; set VITE_TURNSTILE_SITE_KEY in .env.local for prod)
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

/**
 * Cloudflare Turnstile CAPTCHA widget (no npm package needed)
 */
function TurnstileWidget({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  const renderWidget = () => {
    if (!containerRef.current || !window.turnstile || widgetIdRef.current !== null) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onExpire,
      theme: 'light',
      size: 'normal',
    });
  };

  useEffect(() => {
    if (window.turnstile) {
      renderWidget();
      return;
    }

    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      // Script tag already exists; wait for it
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="cf-turnstile" />;
}

const inputClass = (hasError) =>
  `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition bg-white ${hasError ? 'border-red-500' : 'border-gray-300'}`;

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [turnstileToken, setTurnstileToken] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateHoneypot(formData.honeypot)) {
      showError(t('validation.errorTitle'), t('validation.spamDetected'));
      return;
    }

    const rateLimitCheck = contactFormLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      showError(t('validation.rateLimitTitle'), t('validation.rateLimitMessage', { seconds: rateLimitCheck.remainingTime }));
      return;
    }

    if (!turnstileToken) {
      showError(t('validation.errorTitle'), t('contact.form.captchaError'));
      return;
    }

    const sanitizedData = sanitizeFormData(formData);
    const validation = validateFormData(sanitizedData);

    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).map(errorKey => t(errorKey));
      showValidationErrors(t('validation.errorsTitle'), errorMessages);
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    showLoading(t('contact.form.sending'));

    try {
      contactFormLimiter.recordAttempt();

      const dataToSend = {
        ...sanitizedData,
        turnstileToken,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
      };

      const apiBase = import.meta.env.DEV
        ? 'http://localhost:8787/api'
        : 'https://padillas-concrete-api.angel-padillaf-dev.workers.dev/api';

      const response = await fetch(`${apiBase}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.errorEs || result.error || 'Failed to send');

      closeAlert();
      await showSuccess(t('validation.successTitle'), t('validation.successMessage'));
      setFormData(INITIAL_FORM);
      setTurnstileToken(null);
      // Reset Turnstile widget
      if (window.turnstile) window.turnstile.reset();
    } catch (error) {
      closeAlert();
      showError(t('validation.errorTitle'), t('validation.errorMessage'));
      console.error('Error sending form:', error);
      // Reset Turnstile on error so user can try again
      if (window.turnstile) window.turnstile.reset();
      setTurnstileToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader titleKey="contact.title" subtitleKey="contact.subtitle" />

        {/* Contact info cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* eslint-disable-next-line no-unused-vars */}
          {CONTACT_INFO.map(({ Icon, labelKey, href, text }) => (
            <div key={labelKey} className="flex flex-col items-center text-center glass-card rounded-3xl p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-white mb-2 text-shadow">{t(labelKey)}</h3>
              {href ? (
                <a href={href} className="text-white hover:text-red-400 transition text-shadow">{text}</a>
              ) : (
                <p className="text-white text-shadow">{t('contact.address')}</p>
              )}
            </div>
          ))}
        </div>

        {/* Formulario de contacto */}
        <div className="max-w-2xl mx-auto glass-card rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center text-shadow">
            {t('contact.form.title')}
          </h3>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.name')} *
              </label>
              <input
                type="text" id="name" name="name"
                value={formData.name} onChange={handleChange} required
                className={inputClass(fieldErrors.name)}
                placeholder={t('contact.form.namePlaceholder')}
              />
              {fieldErrors.name && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.name)}</p>}
            </div>

            {/* Email + Teléfono */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-white font-semibold mb-2 text-shadow">
                  {t('contact.form.email')} *
                </label>
                <input
                  type="email" id="email" name="email"
                  value={formData.email} onChange={handleChange} required
                  className={inputClass(fieldErrors.email)}
                  placeholder={t('contact.form.emailPlaceholder')}
                />
                {fieldErrors.email && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.email)}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-white font-semibold mb-2 text-shadow">
                  {t('contact.form.phone')} *
                </label>
                <input
                  type="tel" id="phone" name="phone"
                  value={formData.phone} onChange={handleChange} required
                  className={inputClass(fieldErrors.phone)}
                  placeholder={t('contact.form.phonePlaceholder')}
                />
                {fieldErrors.phone && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.phone)}</p>}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <p className="block text-white font-semibold mb-3 text-shadow">{t('contact.form.address')} *</p>

              {/* Calle + Apt */}
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label htmlFor="street" className="block text-white text-sm mb-1 text-shadow">
                    {t('contact.form.street')} *
                  </label>
                  <input
                    type="text" id="street" name="street"
                    value={formData.street} onChange={handleChange} required
                    className={inputClass(fieldErrors.street)}
                    placeholder={t('contact.form.streetPlaceholder')}
                  />
                  {fieldErrors.street && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.street)}</p>}
                </div>
                <div>
                  <label htmlFor="apt" className="block text-white text-sm mb-1 text-shadow">
                    {t('contact.form.apt')}
                  </label>
                  <input
                    type="text" id="apt" name="apt"
                    value={formData.apt} onChange={handleChange}
                    className={inputClass(false)}
                    placeholder={t('contact.form.aptPlaceholder')}
                  />
                </div>
              </div>

              {/* Ciudad + Estado + CP */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="city" className="block text-white text-sm mb-1 text-shadow">
                    {t('contact.form.city')} *
                  </label>
                  <input
                    type="text" id="city" name="city"
                    value={formData.city} onChange={handleChange} required
                    className={inputClass(fieldErrors.city)}
                    placeholder={t('contact.form.cityPlaceholder')}
                  />
                  {fieldErrors.city && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.city)}</p>}
                </div>
                <div>
                  <label htmlFor="state" className="block text-white text-sm mb-1 text-shadow">
                    {t('contact.form.state')} *
                  </label>
                  <select
                    id="state" name="state"
                    value={formData.state} onChange={handleChange} required
                    className={inputClass(fieldErrors.state)}
                  >
                    <option value="">{t('contact.form.selectState')}</option>
                    {US_STATES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {fieldErrors.state && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.state)}</p>}
                </div>
                <div>
                  <label htmlFor="zip" className="block text-white text-sm mb-1 text-shadow">
                    {t('contact.form.zip')} *
                  </label>
                  <input
                    type="text" id="zip" name="zip"
                    value={formData.zip} onChange={handleChange} required
                    className={inputClass(fieldErrors.zip)}
                    placeholder={t('contact.form.zipPlaceholder')}
                    maxLength={10}
                  />
                  {fieldErrors.zip && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.zip)}</p>}
                </div>
              </div>
            </div>

            {/* Servicio */}
            <div>
              <label htmlFor="service" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.service')} *
              </label>
              <select
                id="service" name="service"
                value={formData.service} onChange={handleChange} required
                className={inputClass(fieldErrors.service)}
              >
                <option value="">{t('contact.form.selectService')}</option>
                {SERVICE_OPTIONS.map(({ value, key }) => (
                  <option key={value} value={value}>{t(key)}</option>
                ))}
              </select>
              {fieldErrors.service && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.service)}</p>}
            </div>

            {/* Mensaje */}
            <div>
              <label htmlFor="message" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.message')} *
              </label>
              <textarea
                id="message" name="message"
                value={formData.message} onChange={handleChange} required
                rows="5"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition resize-none bg-white ${fieldErrors.message ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('contact.form.messagePlaceholder')}
              />
              {fieldErrors.message && <p className="text-red-400 text-sm mt-1">{t(fieldErrors.message)}</p>}
            </div>

            {/* Honeypot (oculto para usuarios, visible para bots) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="honeypot">Leave this field empty</label>
              <input
                type="text" id="honeypot" name="honeypot"
                value={formData.honeypot} onChange={handleChange}
                tabIndex="-1" autoComplete="off"
              />
            </div>

            {/* Cloudflare Turnstile CAPTCHA */}
            <div>
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-semibold text-white transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? t('contact.form.sending') : t('contact.form.send')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

