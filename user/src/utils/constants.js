/**
 * App Constants
 * Shared data for items, helplines, tracking stages
 */

export const FOOD_ITEMS = [
  { id: 'biscuit', icon: '🍪', en: 'Biscuits / Snack Packs', unit: 'boxes', names: { hi: 'बिस्किट', bn: 'বিস্কুট / স্ন্যাক', ta: 'பிஸ்கட் / நொறுக்கு', te: 'బిస్కట్లు', mr: 'बिस्किटे', gu: 'બિસ્કિટ', pa: 'ਬਿਸਕੁਟ', kn: 'ಬಿಸ್ಕೀಟ್', ml: 'ബിസ്കറ്റ്', or: 'ବିସ୍କୁଟ', ur: 'بسکٹ' } },
  { id: 'choco', icon: '🍫', en: 'Chocolate Bars', unit: 'bars', names: { hi: 'चॉकलेट', bn: 'চকোলেট বার', ta: 'சாக்லேட் பார்', te: 'చాకొలేట్ బార్', mr: 'चॉकलेट बार', gu: 'ચોકલેટ બાર', pa: 'ਚਾਕਲੇਟ ਬਾਰ', kn: 'ಚಾಕಲೇಟ್ ಬಾರ್', ml: 'ചോക്ലേറ്റ്', or: 'ଚକଲେଟ ବାର', ur: 'چاکلیٹ بار' } },
  { id: 'milkpwd', icon: '🥛', en: 'Milk Powder (500 g)', unit: 'cans', names: { hi: 'मिल्क पाउडर', bn: 'গুঁড়ো দুধ', ta: 'பால் பொடி', te: 'పాల పొడి', mr: 'दूध पावडर', gu: 'દૂધ પાવડર', pa: 'ਦੁੱਧ ਪਾਊਡਰ', kn: 'ಹಾಲಿನ ಪುಡಿ', ml: 'പാൽ പൊടി', or: 'କ୍ଷୀର ଗୁଣ୍ଡ', ur: 'دودھ پاؤڈر' } },
  { id: 'coffee', icon: '☕', en: 'Coffee Powder (200 g)', unit: 'packets', names: { hi: 'कॉफी पाउडर', bn: 'কফি পাউডার', ta: 'காபி பொடி', te: 'కాఫీ పొడి', mr: 'कॉफी पावडर', gu: 'કૉફી પાવડર', pa: 'ਕੌਫੀ ਪਾਊਡਰ', kn: 'ಕಾಫಿ ಪುಡಿ', ml: 'കോഫി പൊടി', or: 'କଫି ପାଉଡର', ur: 'کافی پاؤڈر' } },
  { id: 'snacks', icon: '🍿', en: 'Small Foods / Energy Bars', unit: 'packs', names: { hi: 'छोटे खाद्य पदार्थ', bn: 'ছোট খাবার / এনার্জি', ta: 'சிற்றுண்டி / எனர்ஜி', te: 'చిరుతిండి', mr: 'छोटे खाद्य', gu: 'નાનો ખોરાક', pa: 'ਛੋਟੇ ਖਾਣੇ', kn: 'ಸಣ್ಣ ತಿಂಡಿ', ml: 'ചെറു ഭക്ഷണം', or: 'ଛୋଟ ଖାଦ୍ୟ', ur: 'چھوٹا کھانا' } },
];

export const MEDICINE_ITEMS = [
  { id: 'para', icon: '💊', en: 'Paracetamol 500mg', unit: 'strips', names: { hi: 'पैरासिटामोल', bn: 'প্যারাসিটামল', ta: 'பாராசிட்டமால்', te: 'పారాసిటమాల్', mr: 'पॅरासिटामोल', gu: 'પૅરાસિટામોલ', pa: 'ਪੈਰਾਸੀਟਾਮੋਲ', kn: 'ಪ್ಯಾರಾಸಿಟಮಾಲ್', ml: 'പാരസിറ്റമോൾ', or: 'ପ୍ୟାରାସିଜ୍ଣାମୟ', ur: 'پیراسیٹامول' } },
  { id: 'ors', icon: '🧂', en: 'ORS Packets', unit: 'packets', names: { hi: 'ORS पैकेट', bn: 'ORS প্যাকেট', ta: 'ORS தொகுப்பு', te: 'ORS ప్యాకెట్', mr: 'ORS पाकीट', gu: 'ORS પૅકેટ', pa: 'ORS ਪੈਕੇਟ', kn: 'ORS ಪ್ಯಾಕೆಟ್', ml: 'ORS പ്പോക്കറ്റ്', or: 'ORS ପ୍ୟାକେଟ', ur: 'ORS پیکٹ' } },
  { id: 'bandage', icon: '🩹', en: 'Bandage / Gauze', unit: 'rolls', names: { hi: 'पट्टी / गॉज', bn: 'ব্যান্ডেজ / গজ', ta: 'தொத்துக்கட்டு', te: 'కట్టు / గాజ్', mr: 'पट्टी / गॉज', gu: 'પટ્ટી / ગૉઝ', pa: 'ਪੱਟੀ / ਗੌਜ਼', kn: 'ಬ್ಯಾಂಡೇಜ್', ml: 'ബാൻഡേജ്', or: 'ପଟ୍ଟି / ଗଜ', ur: 'پٹی / گاز' } },
  { id: 'antisep', icon: '🧴', en: 'Antiseptic Solution', unit: 'bottles', names: { hi: 'एंटीसेप्टिक', bn: 'অ্যান্টিসেপটিক', ta: 'கிருமிநாசினி', te: 'యాంటిసెప్టిక్', mr: 'जंतुनाशक', gu: 'એન્ટિસેપ્ટિક', pa: 'ਐਂਟੀਸੈਪਟਿਕ', kn: 'ಆಂಟಿಸೆಪ್ಟಿಕ್', ml: 'ആൻറിസെപ്റ്റിക്', or: 'ଏଣ୍ଟିସେପ୍ଟିକ', ur: 'جراثیم کش' } },
  { id: 'gloves', icon: '🧤', en: 'Surgical Gloves', unit: 'pairs', names: { hi: 'दस्ताने', bn: 'সার্জিক্যাল গ্লাভস', ta: 'அறுவை கையுறை', te: 'శస్త్రచికిత్స గ్లాస్', mr: 'शस्त्रक्रिया हातमोजे', gu: 'સર્જિકલ ગ્લોઝ', pa: 'ਸਰਜੀਕਲ ਦਸਤਾਨੇ', kn: 'ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ ಕೈಗವಸು', ml: 'സർജിക്കൽ ഗ്ലൗസ്', or: 'ସର୍ଜିକାଲ ଦସ୍ତା', ur: 'سرجیکل دستانے' } },
  { id: 'bp', icon: '💉', en: 'BP Medication', unit: 'strips', names: { hi: 'BP दवाई', bn: 'রক্তচাপের ওষুধ', ta: 'BP மருந்து', te: 'BP మందు', mr: 'BP औषध', gu: 'BP દવા', pa: 'BP ਦਵਾਈ', kn: 'BP ಔಷಧ', ml: 'BP മരുന്ന്', or: 'BP ଔଷଧ', ur: 'بلڈ پریشر دوا' } },
  { id: 'diab', icon: '🩸', en: 'Diabetes Medication', unit: 'strips', names: { hi: 'शुगर दवाई', bn: 'ডায়াবেটিসের ওষুধ', ta: 'நீரிழிவு மருந்து', te: 'మధుమేహం మందు', mr: 'मधुमेह औषध', gu: 'ડાયાબિટીસ દવા', pa: 'ਸ਼ੂਗਰ ਦਵਾਈ', kn: 'ಮಧುಮೇಹ ಔಷಧ', ml: 'പ്രമേഹ മരുന്ന്', or: 'ଡାଇବେଟିସ ଔଷଧ', ur: 'شوگر کی دوا' } },
  { id: 'insulin', icon: '💉', en: 'Insulin Vials', unit: 'vials', names: { hi: 'इंसुलिन', bn: 'ইনসুলিন ভায়াল', ta: 'இன்சுலின்', te: 'ఇన్సులిన్ వయల్స్', mr: 'इन्सुलिन', gu: 'ઇન્સ્યુલિન', pa: 'ਇੰਸੁਲਿਨ', kn: 'ಇನ್ಸುಲಿನ್', ml: 'ഇൻസുലിൻ', or: 'ଇନ୍ସୁଲିନ', ur: 'انسولین' } },
  { id: 'painrel', icon: '🔵', en: 'Pain Relief (Ibupro.)', unit: 'strips', names: { hi: 'दर्द निवारक', bn: 'ব্যথার ওষুধ', ta: 'வலி நிவாரணி', te: 'నొప్పి నివారణ', mr: 'वेदनाशामक', gu: 'દર્દ નિવારક', pa: 'ਦਰਦ ਨਿਵਾਰਕ', kn: 'ನೋವು ಶಮನ', ml: 'വേദന സംഹാരി', or: 'ଯନ୍ତ୍ରଣା ନିବାରକ', ur: 'درد کی دوا' } },
  { id: 'cough', icon: '🫁', en: 'Cough Syrup', unit: 'bottles', names: { hi: 'खांसी की दवाई', bn: 'কাশির সিরাপ', ta: 'இருமல் சிரப்', te: 'దగ్గు సిరప్', mr: 'खोकल्याचे सिरप', gu: 'ઉધરસ સિરપ', pa: 'ਖੰਘ ਦਾ ਸਿਰਪ', kn: 'ಕೆಮ್ಮಿನ ಸಿರಪ್', ml: 'ചുമ സിറപ്പ്', or: 'କାଶ ସିରପ', ur: 'کھانسی کا شربت' } },
];

export const CATEGORIES = [
  { id: 'Food', icon: '🍲', nameKey: 'foodName', descKey: 'foodDesc', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'Medicine', icon: '💊', nameKey: 'medName', descKey: 'medDesc', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
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
