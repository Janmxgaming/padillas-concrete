import { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SectionHeader from './SectionHeader';
import { validateFormData, sanitizeFormData } from '../utils/validation';
import { showSuccess, showError, showValidationErrors, showLoading, closeAlert } from '../utils/alerts';
import { contactFormLimiter, validateHoneypot } from '../utils/spamPrevention';

const INITIAL_FORM = { name: '', email: '', phone: '', service: '', message: '', honeypot: '' };

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

/**
 * Componente Contact - Sección de contacto
 * Incluye:
 * - Información de contacto (teléfono, email, ubicación)
 * - Formulario de contacto con validación y seguridad
 * 
 * Características de seguridad:
 * - Validación completa de campos
 * - Sanitización de entradas
 * - Prevención de doble envío
 * - Rate limiting
 * - Campo honeypot anti-spam
 * - Preparado para integración con Cloudflare Workers
 */
export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario comienza a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Maneja el envío del formulario con validación y seguridad
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevenir doble envío
    if (isSubmitting) return;

    // Validar honeypot (anti-spam)
    if (!validateHoneypot(formData.honeypot)) {
      showError(t('validation.errorTitle'), t('validation.spamDetected'));
      return;
    }

    // Verificar rate limiting
    const rateLimitCheck = contactFormLimiter.checkLimit();
    if (!rateLimitCheck.allowed) {
      showError(
        t('validation.rateLimitTitle'),
        t('validation.rateLimitMessage', { seconds: rateLimitCheck.remainingTime })
      );
      return;
    }

    // Sanitizar datos
    const sanitizedData = sanitizeFormData(formData);

    // Validar datos
    const validation = validateFormData(sanitizedData);

    if (!validation.isValid) {
      // Mostrar errores de validación
      const errorMessages = Object.values(validation.errors).map(errorKey => t(errorKey));
      showValidationErrors(t('validation.errorsTitle'), errorMessages);
      setFieldErrors(validation.errors);
      return;
    }

    // Limpiar errores previos
    setFieldErrors({});

    // Iniciar envío
    setIsSubmitting(true);
    showLoading(t('contact.form.sending'));

    try {
      // Registrar intento de envío
      contactFormLimiter.recordAttempt();

      // Preparar datos para el backend (Cloudflare Workers)
      const dataToSend = {
        ...sanitizedData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language
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

      if (!response.ok) {
        throw new Error(result.errorEs || result.error || 'Failed to send');
      }

      // Cerrar loading y mostrar éxito
      closeAlert();
      await showSuccess(
        t('validation.successTitle'),
        t('validation.successMessage')
      );

      // Limpiar el formulario
      setFormData(INITIAL_FORM);

    } catch (error) {
      // Cerrar loading y mostrar error
      closeAlert();
      showError(
        t('validation.errorTitle'),
        t('validation.errorMessage')
      );
      console.error('Error sending form:', error);
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
                <a href={href} className="text-white hover:text-red-400 transition text-shadow">
                  {text}
                </a>
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
            {/* Campo: Nombre */}
            <div>
              <label htmlFor="name" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder={t('contact.form.namePlaceholder')}
              />
              {fieldErrors.name && (
                <p className="text-red-400 text-sm mt-1">{t(fieldErrors.name)}</p>
              )}
            </div>

            {/* Campos: Email y Teléfono en la misma fila */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Campo: Email */}
              <div>
                <label htmlFor="email" className="block text-white font-semibold mb-2 text-shadow">
                  {t('contact.form.email')} *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t('contact.form.emailPlaceholder')}
                />
                {fieldErrors.email && (
                  <p className="text-red-400 text-sm mt-1">{t(fieldErrors.email)}</p>
                )}
              </div>

              {/* Campo: Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-white font-semibold mb-2 text-shadow">
                  {t('contact.form.phone')} *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t('contact.form.phonePlaceholder')}
                />
                {fieldErrors.phone && (
                  <p className="text-red-400 text-sm mt-1">{t(fieldErrors.phone)}</p>
                )}
              </div>
            </div>

            {/* Campo: Servicio */}
            <div>
              <label htmlFor="service" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.service')} *
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition bg-white ${fieldErrors.service ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">{t('contact.form.selectService')}</option>
                {SERVICE_OPTIONS.map(({ value, key }) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                ))}
              </select>
              {fieldErrors.service && (
                <p className="text-red-400 text-sm mt-1">{t(fieldErrors.service)}</p>
              )}
            </div>

            {/* Campo: Mensaje */}
            <div>
              <label htmlFor="message" className="block text-white font-semibold mb-2 text-shadow">
                {t('contact.form.message')} *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition resize-none ${fieldErrors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder={t('contact.form.messagePlaceholder')}
              />
              {fieldErrors.message && (
                <p className="text-red-400 text-sm mt-1">{t(fieldErrors.message)}</p>
              )}
            </div>

            {/* Campo Honeypot (oculto para usuarios, visible para bots) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="honeypot">Leave this field empty</label>
              <input
                type="text"
                id="honeypot"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                tabIndex="-1"
                autoComplete="off"
              />
            </div>

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-lg font-semibold text-white transition ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
                }`}
            >
              {isSubmitting ? t('contact.form.sending') : t('contact.form.send')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
