/**
 * App Constants
 * Shared data for items, helplines, tracking stages
 */

export const FOOD_ITEMS = [
  { id: 'biscuit', icon: 'nutrition', image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd4b9e1?w=300&h=300&fit=crop', en: 'Biscuits / Snack Packs', unit: 'boxes', names: { hi: 'बिस्किट', bn: 'বিস্কুট / স্ন্যাক', ta: 'பிஸ்கட் / நொறுக்கு', te: 'బిస్కట్లు', mr: 'बिस्किटे', gu: 'બિસ્કિટ', pa: 'ਬਿਸਕੁਟ', kn: 'ಬಿಸ್ಕೀಟ್', ml: 'ബിസ್കറ്റ്', or: 'ବିସ୍କୁଟ', ur: 'بسکٹ' } },
  { id: 'protein', icon: 'fitness', image: 'https://images.unsplash.com/photo-1590080876457-cd85d92d57bf?w=300&h=300&fit=crop', en: 'Protein Bars', unit: 'bars', names: { hi: 'प्रोटीन बार', bn: 'প্রোটিন বার', ta: 'புரதம் பார்', te: 'ప్రోటీన్ బార్', mr: 'प्रोटीन बार', gu: 'પ્રોટીન બાર', pa: 'ਪ੍ਰੋਟੀਨ ਬਾਰ', kn: 'ಪ୍ರೋಟೀನ್ ಬಾರ್', ml: 'പ്രോറ്റിൻ ബാർ', or: 'ପ୍ରୋଟିନ ବାର', ur: 'پروٹین بار' } },
  { id: 'milkpwd', icon: 'water', image: 'https://images.unsplash.com/photo-1608194701473-3f692a64e48f?w=300&h=300&fit=crop', en: 'Milk Powder (500 g)', unit: 'cans', names: { hi: 'मिल्क पाउडर', bn: 'গুঁড়ো দুধ', ta: 'பால் பொடி', te: 'పాల పొడి', mr: 'दूध पावडर', gu: 'દૂધ પાવડર', pa: 'ਦੁੱਧ ਪਾਊਡਰ', kn: 'ಹಾಲಿನ ಪುಡಿ', ml: 'പാൽ പൊടി', or: 'କ୍ଷୀର ଗୁଣ୍ଡ', ur: 'دودھ پاؤڈر' } },
  { id: 'fruits', icon: 'leaf', image: 'https://images.unsplash.com/photo-1560806674-9a308b3c5c3a?w=300&h=300&fit=crop', en: 'Fresh Fruits', unit: 'boxes', names: { hi: 'ताजे फल', bn: 'তাজা ফল', ta: 'புதிய பழங்கள்', te: 'తాజా ఫలాలు', mr: 'ताजे फळ', gu: 'તજા ફળ', pa: 'ਤਾਜ਼ਾ ਫਲ', kn: 'ತಾಜಾ ಫಲ', ml: 'ताज ഫലങ്ങൾ', or: 'ତାଜା ଫଳ', ur: 'تازہ پھل' } },
  { id: 'noodles', icon: 'restaurant', image: 'https://images.unsplash.com/photo-1585238341710-4b4e6ceaf302?w=300&h=300&fit=crop', en: 'Instant Noodles', unit: 'packs', names: { hi: 'इंस्टेंट नूडल्स', bn: 'তাত্ক্ষণিক নুডলস', ta: 'உடனடி நூடுல்ஸ்', te: 'తక్షణ నూడిల్‌లు', mr: 'तात्काळिक नुडल्स', gu: 'ત્વરિત નૂડલ્સ', pa: 'ਤਤਕਾਲ ਨੂਡਲਜ਼', kn: 'ತಕ್ಷಣ ನೂಡಲ್ಸ್', ml: 'താൻ നൂഡിലുകൾ', or: 'ତାତକ୍ଷଣିକ ନୁଡୁଲ', ur: 'فوری نوڈلز' } },
];

export const MEDICINE_ITEMS = [
  { id: 'para', icon: 'medical', en: 'Paracetamol 500mg', unit: 'strips', names: { hi: 'पैरासिटामोल', bn: 'প্যারাসিটামল', ta: 'பாராசிட்டமால்', te: 'పారాసిటమాల్', mr: 'पॅरासिटामोल', gu: 'પૅરાસિટામોલ', pa: 'ਪੈਰਾਸੀਟਾਮੋਲ', kn: 'ಪ್ಯಾರಾಸಿಟಮಾಲ್', ml: 'പാരസിറ്റമോൾ', or: 'ପ୍ୟାରାସିଜ୍ଣାମୟ', ur: 'پیراسیٹامول' } },
  { id: 'ors', icon: 'water', en: 'ORS Packets', unit: 'packets', names: { hi: 'ORS पैकेट', bn: 'ORS প্যাকেট', ta: 'ORS தொகுப்பு', te: 'ORS ప్యాకెట్', mr: 'ORS पाकीट', gu: 'ORS પૅકેટ', pa: 'ORS ਪੈਕੇਟ', kn: 'ORS ಪ್ಯಾಕೆಟ್', ml: 'ORS പ്പോക്കറ്റ്', or: 'ORS ପ୍ୟାକେଟ', ur: 'ORS پیکٹ' } },
  { id: 'bandage', icon: 'bandage', en: 'Bandage / Gauze', unit: 'rolls', names: { hi: 'पट्टी / गॉज', bn: 'ব্যান্ডেজ / গজ', ta: 'தொத்துக்கட்டு', te: 'కట్టు / గాజ్', mr: 'पट्टी / गॉज', gu: 'પટ્ટી / ગૉઝ', pa: 'ਪੱਟੀ / ਗੌਜ਼', kn: 'ಬ್ಯಾಂಡೇಜ್', ml: 'ബാൻഡേജ്', or: 'ପଟ୍ଟି / ଗଜ', ur: 'پٹی / گاز' } },
  { id: 'antisep', icon: 'beaker', en: 'Antiseptic Solution', unit: 'bottles', names: { hi: 'एंटीसेप्टिक', bn: 'অ্যান্টিসেপটিক', ta: 'கிருமிநாசினி', te: 'యాంటిసెప్టిక్', mr: 'जंतुनाशक', gu: 'એન્ટિસેપ્ટિક', pa: 'ਐਂਟੀਸੈਪਟਿਕ', kn: 'ಆಂಟಿಸೆಪ್ಟಿಕ್', ml: 'ആൻറിസെപ്റ്റിക്', or: 'ଏଣ୍ଟିସେପ୍ଟିକ', ur: 'جراثیم کش' } },
  { id: 'gloves', icon: 'hand-left', en: 'Surgical Gloves', unit: 'pairs', names: { hi: 'दस्ताने', bn: 'সার্জিক্যাল গ্লাভস', ta: 'அறுவை கையுறை', te: 'శస్త్రచికిత్స గ్లాస్', mr: 'शस्त्रक्रिया हातमोजे', gu: 'સર્જિકલ ગ્લોઝ', pa: 'ਸਰਜੀਕਲ ਦਸਤਾਨੇ', kn: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಕೈಗವಸು', ml: 'സർജിക്കൽ ഗ്ലൗസ്', or: 'ସର୍ଜିକାଲ ଦସ୍ତା', ur: 'سرجیکل دستانے' } },
  { id: 'bp', icon: 'medical', en: 'BP Medication', unit: 'strips', names: { hi: 'BP दवाई', bn: 'রক্তচাপের ওষুধ', ta: 'BP மருந்து', te: 'BP మందు', mr: 'BP औषध', gu: 'BP દવા', pa: 'BP ਦਵਾਈ', kn: 'BP ಔಷಧ', ml: 'BP മരുന്ന്', or: 'BP ଔଷଧ', ur: 'بلڈ پریشر دوا' } },
  { id: 'diab', icon: 'droplet', en: 'Diabetes Medication', unit: 'strips', names: { hi: 'शुगर दवाई', bn: 'ডায়াবেটিসের ওষুধ', ta: 'நீரிழிவு மருந்து', te: 'మధుమేహం మందు', mr: 'मधुमेह औषध', gu: 'ડાયાબિટીસ દવા', pa: 'ਸ਼ੂਗਰ ਦਵਾਈ', kn: 'ಮಧುಮೇಹ ಔಷಧ', ml: 'പ്രമേഹ മരുന്ന്', or: 'ଡାଇବେଟିସ ଔଷଧ', ur: 'شوگر کی دوا' } },
  { id: 'insulin', icon: 'medical', en: 'Insulin Vials', unit: 'vials', names: { hi: 'इंसुलिन', bn: 'ইনসুলিন ভায়াল', ta: 'இன்சுலின்', te: 'ఇన్సులిన్ వయల్స్', mr: 'इन्सुलिन', gu: 'ઇન્સ્યુલિન', pa: 'ਇੰਸੁਲਿਨ', kn: 'ಇನ್ಸುಲಿನ್', ml: 'ഇൻസുലിൻ', or: 'ଇନ୍ସୁଲିନ', ur: 'انسولین' } },
  { id: 'painrel', icon: 'body', en: 'Pain Relief (Ibupro.)', unit: 'strips', names: { hi: 'दर्द निवारक', bn: 'ব্যথার ওষুধ', ta: 'வலி நிவாரணி', te: 'నొప్పి నివారణ', mr: 'वेदनाशामक', gu: 'દર્દ નિવારક', pa: 'ਦਰਦ ਨਿਵਾਰਕ', kn: 'ನೋವು ಶಮನ', ml: 'വേദന സംഹാരി', or: 'ଯନ୍ତ୍ରଣା ନିବାରକ', ur: 'درد کی دوا' } },
  { id: 'cough', icon: 'wind', en: 'Cough Syrup', unit: 'bottles', names: { hi: 'खांसी की दवाई', bn: 'কাশির সিরাপ', ta: 'இருமல் சிரப்', te: 'దగ్గు సిరప్', mr: 'खोकल्याचे सिरप', gu: 'ઉધરસ સિરપ', pa: 'ਖੰਘ ਦਾ ਸਿਰਪ', kn: 'ಕೆಮ್ಮಿನ ಸಿರಪ್', ml: 'ചുമ സിറപ്പ്', or: 'କାଶ ସିରପ', ur: 'کھانسی کا شربت' } },
  { id: 'napkin', icon: 'layers', en: 'Napkins / Tissues', unit: 'packs', names: { hi: 'नैपकिन / टिश्यू', bn: 'নেপকিন / টিস্যু', ta: 'நாப்கின் / திசு', te: 'నాప్‌కిన్ / టిష్యూ', mr: 'नॅपकिन / टिश्यू', gu: 'નેપકિન / ટીશ્યુ', pa: 'ਨੈਪਕਿਨ / ਟਿਸ਼ੂ', kn: 'ನ್ಯಾಪ್ಕಿನ್ / ಟಿಸ್ಯೂ', ml: 'നാപ്കിൻ / ടിഷ്യു', or: 'ନ୍ୟାପକିନ / ଟିସୁ', ur: 'نیپکن / ٹشو' } },
];

export const FIRST_AID_ITEMS = [
  { id: 'bandage', icon: 'bandage', en: 'Bandage / Gauze', unit: 'rolls', names: { hi: 'पट्टी / गॉज', bn: 'ব্যান্ডেজ / গজ', ta: 'தொத்துக்கட்டு', te: 'కట్టు / గాజ్', mr: 'पट्टी / गॉज', gu: 'પટ્ટી / ગૉઝ', pa: 'ਪੱਟੀ / ਗੌਜ਼', kn: 'ಬ್ಯಾಂಡೇಜ್', ml: 'ബാൻഡേജ്', or: 'ପଟ୍ଟି / ଗଜ', ur: 'پٹی / گاز' } },
  { id: 'antisep', icon: 'beaker', en: 'Antiseptic Solution', unit: 'bottles', names: { hi: 'एंटीसेप्टिक', bn: 'অ্যান্টিসেপটिক', ta: 'கிருமிநாசินี', te: 'యాంటిసెప్టిక్', mr: 'जंतुनाशक', gu: 'એન્ટિસેપ્ટિક', pa: 'ਐਂਟੀਸੈਪਟਿਕ', kn: 'ಆಂಟಿಸೆಪ್ಟಿಕ್', ml: 'ആൻറിസെപ്റ്റിക്', or: 'ଏଣ୍ଟିସେପ୍ଟିକ', ur: 'جراثیم کش' } },
  { id: 'gloves', icon: 'hand-left', en: 'Surgical Gloves', unit: 'pairs', names: { hi: 'दस्ताने', bn: 'সার্জিক্যাল গ্লাভস', ta: 'அறுவை கையுறை', te: 'శస్త్రచికిత్స గ్లాస్', mr: 'शस्त्रक्रिया हातमोजे', gu: 'સર્જિકલ ગ્લોઝ', pa: 'ਸਰਜੀਕਲ ਦਸਤਾਨੇ', kn: 'ಶಸ್ತ୍ರಚಿಕಿತ್ಸೆ ಕೈಗವಸು', ml: 'സർജിക്കൽ ഗ്ലૌഞ്സ്', or: 'ସର୍ଜିକାଲ ଦସ୍ତା', ur: 'سرجیکل دستانے' } },
  { id: 'napkin', icon: 'layers', en: 'Napkins / Tissues', unit: 'packs', names: { hi: 'नैपकिन / टिश्यू', bn: 'নেপকिন / টিস্যু', ta: 'நாப்கின் / திசு', te: 'నాప్‌కిన్ / టిష్యూ', mr: 'नॅपकिन / टिश्यू', gu: 'નેપકિન / ટીશ્યુ', pa: 'ਨੈਪਕਿਨ / ਟਿਸ਼ੂ', kn: 'ನ್ಯಾಪ್ಕಿನ್ / ಟಿಸ್ಯೂ', ml: 'നാപ്കിൻ / ടിഷ്യു', or: 'ନ୍ୟାପକିନ / ଟିସୁ', ur: 'نیپکن / ٹشو' } },
];

export const CATEGORIES = [
  { id: 'Food', icon: 'restaurant', nameKey: 'food', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  { id: 'Medicine', icon: 'medical', nameKey: 'medicine', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { id: 'FirstAid', icon: 'medkit', nameKey: 'firstaid', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
];

export const RESOURCE_LABELS = {
  food: 'Food',
  medicine: 'Medicine',
  firstaid: 'First Aid',
};

export const URGENCY_LEVELS = [
  { id: 'urgent', label: 'Urgent', color: '#ef4444', description: 'Immediate emergency response' },
  { id: 'high', label: 'High', color: '#f59e0b', description: 'Priority assistance needed' },
  { id: 'normal', label: 'Normal', color: '#06b6d4', description: 'Regular assistance needed' },
];

export const HELPLINES = [
  { name: 'National Emergency', number: '112', color: '#dc2626', icon: '🚨' },
  { name: 'NDRF Helpline', number: '1078', color: '#1d4ed8', icon: '🚁' },
  { name: 'Flood Control', number: '1070', color: '#0369a1', icon: '💧' },
  { name: 'Ambulance', number: '108', color: '#16a34a', icon: '🏥' },
  { name: 'Disaster Mgmt', number: '1077', color: '#7c3aed', icon: '⚠️' },
];

export const TRACK_STAGE_ICONS = ['📡', '🎯', '🚁', '📦', '✅'];

export const TRACKING_STAGES = [
  { stage: 1, title: 'Request Logged', subtitle: 'Your request is queued in command center', icon: '📡' },
  { stage: 2, title: 'Team Assigned', subtitle: 'Nearest relief team is assigned to you', icon: '🎯' },
  { stage: 3, title: 'Dispatched', subtitle: 'Relief unit is on the way', icon: '🚁' },
  { stage: 4, title: 'Delivered', subtitle: 'Aid package reached your location', icon: '📦' },
  { stage: 5, title: 'Confirmed', subtitle: 'You confirmed the delivery', icon: '✅' },
];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'اردو' },
];
