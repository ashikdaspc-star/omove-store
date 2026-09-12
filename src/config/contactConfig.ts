/**
 * Global Contact & Support Configuration for Omove Store
 */
export const CONTACT_CONFIG = {
  whatsapp: {
    display: '+91 7719108841',
    rawNumber: '917719108841',
    numberOnly: '7719108841',
    countryCode: '+91',
    getLink: (message?: string) => {
      const baseUrl = 'https://wa.me/917719108841';
      return message ? `${baseUrl}?text=${encodeURIComponent(message)}` : baseUrl;
    },
  },
  email: 'omovetech@gmail.com',
  location: 'Kolkata, West Bengal, India',
};
