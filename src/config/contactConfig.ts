/**
 * Global Contact & Support Configuration for Omove Store
 */
export const CONTACT_CONFIG = {
  whatsapp: {
    display: '+91 9242899827',
    rawNumber: '919242899827',
    numberOnly: '9242899827',
    countryCode: '+91',
    getLink: (message?: string) => {
      const baseUrl = 'https://wa.me/919242899827';
      return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
    },
  },
  email: 'omovetech@gmail.com',
  location: 'Kolkata, West Bengal, India',
};
