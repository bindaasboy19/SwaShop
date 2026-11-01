import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.nearby': 'Nearby',
    'nav.b2b': 'B2B Hub',
    'nav.orders': 'Orders',
    'nav.sell': 'Sell on SwaShop',
    'nav.sellerDashboard': 'Seller Dashboard',
    'nav.adminDashboard': 'Admin Portal',
    'nav.login': 'Log In',
    'nav.register': 'Register',
    'nav.logout': 'Log Out',
    'nav.favourites': 'Saved Items',

    // Search
    'search.placeholder': 'Search local crafts, products, or ask naturally (e.g. eco-friendly gift under ₹1500 near me)...',
    'search.button': 'Search',
    'search.voice': 'Voice Search',
    'search.filterNearby': 'Nearby Only',
    'search.filterVerified': 'Verified Artisans',

    // Product & Actions
    'product.enquire': 'Enquire Directly',
    'product.buy': 'Buy / Order Now',
    'product.shareWhatsApp': 'Share on WhatsApp',
    'product.qrStorefront': 'View Digital QR',
    'product.verifiedArtisan': 'Verified Local Artisan',
    'product.available': 'In Stock',
    'product.outOfStock': 'Out of Stock',
    'product.price': 'Price',
    'product.features': 'Craft Specifications',

    // Order & Fulfilment
    'order.checkout': 'Confirm Order',
    'order.fulfilment': 'Delivery & Fulfilment',
    'order.pickup': 'In-Store Pickup (Free)',
    'order.delivery': 'Local Store Delivery',
    'order.courier': 'Standard Courier Delivery',
    'order.cashOnDelivery': 'Pay on Delivery / In Store',
    'order.onlineUpi': 'Pay via UPI / Card',

    // B2B
    'b2b.title': 'B2B Wholesale & Artisan Linkage',
    'b2b.postRequirement': 'Post Custom Requirement',
    'b2b.submitQuote': 'Submit Quotation (RFQ)',
    'b2b.acceptQuote': 'Accept & Create Order',

    // Seller AI
    'seller.aiStudio': 'Seller AI Studio',
    'seller.voiceCatalog': 'Voice Catalog Generator',
    'seller.speakHint': 'Tap mic and speak naturally in Hindi or English...',
    'seller.demandForecast': 'Market Demand Intelligence',
    'seller.growthRecs': 'Actionable Growth Advice'
  },
  hi: {
    // Navigation
    'nav.home': 'मुख्य पृष्ठ',
    'nav.explore': 'उत्पाद खोजें',
    'nav.nearby': 'आसपास के शिल्पकार',
    'nav.b2b': 'बी2बी हब',
    'nav.orders': 'मेरे ऑर्डर',
    'nav.sell': 'स्वशॉप पर बेचें',
    'nav.sellerDashboard': 'विक्रेता डैशबोर्ड',
    'nav.adminDashboard': 'एडमिन पोर्टल',
    'nav.login': 'लॉग इन',
    'nav.register': 'खाता बनाएं',
    'nav.logout': 'लॉग आउट',
    'nav.favourites': 'पसंदीदा उत्पाद',

    // Search
    'search.placeholder': 'स्थानीय उत्पाद, शिल्प खोजें या बोलें (जैसे ₹1500 के अंदर उपहार)...',
    'search.button': 'खोजें',
    'search.voice': 'आवाज से खोजें',
    'search.filterNearby': 'सिर्फ पास में',
    'search.filterVerified': 'प्रमाणित कारीगर',

    // Product & Actions
    'product.enquire': 'सीधी पूछताछ करें',
    'product.buy': 'अभी खरीदें / ऑर्डर करें',
    'product.shareWhatsApp': 'व्हाट्सएप पर शेयर करें',
    'product.qrStorefront': 'डिजिटल स्टोर क्यूआर',
    'product.verifiedArtisan': 'सत्यापित स्थानीय कारीगर',
    'product.available': 'उपलब्ध है',
    'product.outOfStock': 'स्टॉक समाप्त',
    'product.price': 'मूल्य',
    'product.features': 'शिल्प की विशेषताएं',

    // Order & Fulfilment
    'order.checkout': 'ऑर्डर की पुष्टि करें',
    'order.fulfilment': 'वितरण और पूर्ति विकल्प',
    'order.pickup': 'दुकान से पिकअप (मुफ़्त)',
    'order.delivery': 'स्थानीय स्टोर डिलीवरी',
    'order.courier': 'कूरियर डिलीवरी',
    'order.cashOnDelivery': 'डिलीवरी पर नकद / दुकान पर भुगतान',
    'order.onlineUpi': 'यूपीआई / कार्ड से भुगतान',

    // B2B
    'b2b.title': 'बी2बी थोक एवं कारीगर लिंकेज',
    'b2b.postRequirement': 'थोक मांग दर्ज करें',
    'b2b.submitQuote': 'कोटेशन (आरएफक्यू) भेजें',
    'b2b.acceptQuote': 'स्वीकारें और ऑर्डर बनाएं',

    // Seller AI
    'seller.aiStudio': 'विक्रेता एआई स्टूडियो',
    'seller.voiceCatalog': 'आवाज से उत्पाद सूची बनाएं',
    'seller.speakHint': 'माइक दबाएं और हिंदी या अंग्रेजी में उत्पाद का विवरण बोलें...',
    'seller.demandForecast': 'बाजार मांग पूर्वानुमान',
    'seller.growthRecs': 'व्यापार वृद्धि सुझाव'
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('swashop_lang') || 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('swashop_lang', lang);
  };

  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations.en;
    if (langDict[key]) return langDict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
