import React, { useState, useEffect, useRef } from 'react';
import './App.css'
import {
    Search, MapPin, Star, ShoppingBag,
    Camera, MessageCircle, X, Send, LogOut,
    ChevronRight, CheckCircle, Gift,
    Trophy, Video, Navigation, User as UserIcon,
    Mail, Lock, Monitor, Smartphone, SlidersHorizontal, ListFilter, Heart, Sparkles
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// --- DATA & CONSTANTS (TỪ APP 1) ---
const DEFAULT_BG = 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop';
const DEFAULT_IMAGE = '/assets/stores/default.png'; // Fallback image


const CATEGORY_VN = {
    'all': 'Tất cả loại',
    'convenience': 'Cửa hàng tiện lợi',
    'gift': 'Quà lưu niệm',
    'supermarket': 'Siêu thị',
    'marketplace': 'Chợ truyền thống',
    'mall': 'Trung tâm thương mại',
    'craft': 'Đồ thủ công',
    'ceramics': 'Gốm sứ',
    'art': 'Tranh ảnh nghệ thuật',
    'department_store': 'Cửa hàng bách hóa'
};

const CITY_TRANSLATION = {
    'Ho Chi Minh City': 'TP. Hồ Chí Minh',
    'Ha Noi': 'TP. Hà Nội',
    'Da Nang City': 'TP. Đà Nẵng',
    'Hai Phong': 'TP. Hải Phòng',
    'Can Tho': 'TP. Cần Thơ',
    'An Giang Province': 'An Giang',
    'Ba Ria - Vung Tau Province': 'Bà Rịa - Vũng Tàu',
    'Bac Giang Province': 'Bắc Giang',
    'Bac Kan Province': 'Bắc Kạn',
    'Bac Lieu Province': 'Bạc Liêu',
    'Bac Ninh Province': 'Bắc Ninh',
    'Ben Tre Province': 'Bến Tre',
    'Binh Dinh Province': 'Bình Định',
    'Binh Duong Province': 'Bình Dương',
    'Binh Phuoc Province': 'Bình Phước',
    'Binh Thuan Province': 'Bình Thuận',
    'Ca Mau Province': 'Cà Mau',
    'Cao Bang Province': 'Cao Bằng',
    'Dak Lak Province': 'Đắk Lắk',
    'Dak Nong Province': 'Đắk Nông',
    'Dien Bien Province': 'Điện Biên',
    'Dong Nai Province': 'Đồng Nai',
    'Dong Thap Province': 'Đồng Tháp',
    'Gia Lai Province': 'Gia Lai',
    'Ha Giang Province': 'Hà Giang',
    'Ha Nam Province': 'Hà Nam',
    'Ha Tinh Province': 'Hà Tĩnh',
    'Hai Duong Province': 'Hải Dương',
    'Hau Giang Province': 'Hậu Giang',
    'Hoa Binh Province': 'Hòa Bình',
    'Hung Yen Province': 'Hưng Yên',
    'Khanh Hoa Province': 'Khánh Hòa',
    'Kien Giang Province': 'Kiên Giang',
    'Kon Tum Province': 'Kon Tum',
    'Lai Chau Province': 'Lai Châu',
    'Lam Dong Province': 'Lâm Đồng',
    'Lang Son Province': 'Lạng Sơn',
    'Lao Cai Province': 'Lào Cai',
    'Long An Province': 'Long An',
    'Nam Dinh Province': 'Nam Định',
    'Nghe An Province': 'Nghệ An',
    'Ninh Binh Province': 'Ninh Bình',
    'Ninh Thuan Province': 'Ninh Thuận',
    'Phu Tho Province': 'Phú Thọ',
    'Phu Yen Province': 'Phú Yên',
    'Quang Binh Province': 'Quảng Bình',
    'Quang Nam Province': 'Quảng Nam',
    'Quang Ngai Province': 'Quảng Ngãi',
    'Quang Ninh Province': 'Quảng Ninh',
    'Quang Tri Province': 'Quảng Trị',
    'Soc Trang Province': 'Sóc Trăng',
    'Son La Province': 'Sơn La',
    'Tay Ninh Province': 'Tây Ninh',
    'Thai Binh Province': 'Thái Bình',
    'Thai Nguyen Province': 'Thái Nguyên',
    'Thanh Hoa Province': 'Thanh Hóa',
    'Thua Thien-Hue': 'Thừa Thiên Huế',
    'Tien Giang Province': 'Tiền Giang',
    'Tra Vinh Province': 'Trà Vinh',
    'Tuyen Quang Province': 'Tuyên Quang',
    'Vinh Long Province': 'Vĩnh Long',
    'Vinh Phuc Province': 'Vĩnh Phúc',
    'Yen Bai Province': 'Yên Bái'
};

const getCityVN = (name) => {
    if (!name || name === 'all') return 'Mọi nơi';
    // Trả về tên tiếng Việt có dấu nếu tìm thấy, nếu không thì giữ nguyên tên gốc
    return CITY_TRANSLATION[name] || name;
};
const CITY_BG = {
    'Ho Chi Minh City': '/assets/cities/hcm.jpg',
    'Ha Noi': '/assets/cities/hanoi.jpg',
    'Da Nang City': '/assets/cities/danang.jpg',
    'Hai Phong': '/assets/cities/haiphong.jpg',
    'Can Tho': '/assets/cities/cantho.png',
    'An Giang Province': '/assets/cities/angiang.png',
    'Ba Ria - Vung Tau Province': '/assets/cities/bariavungtau.jpg',
    'Bac Lieu Province': '/assets/cities/baclieu.png',
    'Bac Giang Province': '/assets/cities/bacgiang.jpg',
    'Bac Kan Province': '/assets/cities/backan.jpg',
    'Bac Ninh Province': '/assets/cities/bacninh.jpg',
    'Ben Tre Province': '/assets/cities/bentre.jpg',
    'Binh Duong Province': '/assets/cities/binhduong.png',
    'Binh Dinh Province': '/assets/cities/binhdinh.jpg',
    'Binh Phuoc Province': '/assets/cities/binhphuoc.jpg',
    'Binh Thuan Province': '/assets/cities/binhthuan.png',
    'Ca Mau Province': '/assets/cities/binhthuan.png',
    'Cao Bang Province': '/assets/cities/caobang.jpg',
    'Dak Lak Province': '/assets/cities/daklak.jpg',
    'Dak Nong Province': '/assets/cities/daknong.png',
    'Dien Bien Province': '/assets/cities/dienbien.png',
    'Dong Nai Province': '/assets/cities/dongnai.jpg',
    'Dong Thap Province': '/assets/cities/dongthap.jpg',
    'Gia Lai Province': '/assets/cities/gialai.jpg',
    'Ha Giang Province': '/assets/cities/hagiang.png',
    'Ha Nam Province': '/assets/cities/hanam.jpg',
    'Ha Tinh Province': '/assets/cities/hatinh.png',
    'Hai Duong Province': '/assets/cities/haiduong.png',
    'Hau Giang Province': '/assets/cities/haugiang.jpg',
    'Hoa Binh Province': '/assets/cities/hoabinh.jpg',
    'Hung Yen Province': '/assets/cities/hungyen.jpg',
    'Khanh Hoa Province': '/assets/cities/khanhhoa.jpg',
    'Kien Giang Province': '/assets/cities/kiengiang.jpg',
    'Kon Tum Province': '/assets/cities/kontum.jpg',
    'Lai Chau Province': '/assets/cities/laichau.jpg',
    'Lang Son Province': '/assets/cities/langson.jpg',
    'Lao Cai Province': '/assets/cities/laocai.jpg',
    'Lam Dong Province': '/assets/cities/lamdong.png',
    'Long An Province': '/assets/cities/longan.jpg',
    'Nam Dinh Province': '/assets/cities/namdinh.png',
    'Nghe An Province': '/assets/cities/nghean.jpg',
    'Ninh Binh Province': '/assets/cities/ninhbinh.jpg',
    'Ninh Thuan Province': '/assets/cities/ninhthuan.png',
    'Phu Tho Province': '/assets/cities/phutho.png',
    'Phu Yen Province': '/assets/cities/phuyen.jpg',
    'Quang Binh Province': '/assets/cities/quangbinh.jpg',
    'Quang Nam Province': '/assets/cities/quangnam.jpg',
    'Quang Ngai Province': '/assets/cities/quangngai.jpg',
    'Quang Ninh Province': '/assets/cities/quangninh.jpg',
    'Quang Tri Province': '/assets/cities/quangtri.jpg',
    'Soc Trang Province': '/assets/cities/soctrang.jpg',
    'Son La Province': '/assets/cities/sonla.jpg',
    'Tay Ninh Province': '/assets/cities/tayninh.jpg',
    'Thai Binh Province': '/assets/cities/thaibinh.png',
    'Thai Nguyen Province': '/assets/cities/thainguyen.jpg',
    'Thanh Hoa Province': '/assets/cities/thanhhoa.jpg',
    'Thua Thien-Hue': '/assets/cities/thuathienhue.jpg',
    'Tien Giang Province': '/assets/cities/tiengiang.jpg',
    'Tra Vinh Province': '/assets/cities/travinh.png',
    'Tuyen Quang Province': '/assets/cities/tuyenquang.png',
    'Vinh Long Province': '/assets/cities/vinhlong.jpg',
    'Vinh Phuc Province': '/assets/cities/vinhphuc.png',
    'Yen Bai Province': '/assets/cities/yenbai.jpg'
};

const CATEGORY_DEFAULTS = {
    'convenience': '/assets/stores/convenience/taphoa2.png',
    'gift': '/assets/stores/gift/1.jpg',
    'supermarket': '/assets/stores/supermarket/supermarket.png',
    'marketplace': '/assets/stores/marketplace/5.jpg',
    'mall': '/assets/stores/mall/mall2.png',
    'craft': '/assets/stores/gift/3.jpg',
    'ceramics': '/assets/stores/gift/4.jpg',
    'art': '/assets/stores/gift/tranh.png',
    'department_store': '/assets/stores/convenience/taphoa.png',
};

const BRAND_LOGOS = {
    'gom': '/assets/stores/gift/1.jpg',
    'circle k': '/assets/stores/convenience/circlek.png',
    'gs25': '/assets/stores/convenience/GS25.png',
    '7-eleven': '/assets/stores/convenience/7-Eleven.png',
    'familymart': '/assets/stores/convenience/familymart.png',
    'ministop': '/assets/stores/convenience/ministop.png',
    'aeon citymart': '/assets/stores/convenience/aeoncitymart.png',
    'bach hoa xanh': '/assets/stores/convenience/bachhoaxanh.png',
    "b'smart": '/assets/stores/convenience/bsmart.png',
    "cheers": '/assets/stores/convenience/cheers.png',
    'co.op food': '/assets/stores/convenience/coopfood.png',
    'co.op mart': '/assets/stores/supermarket/coopmart.png',
    'co.opmart': '/assets/stores/supermarket/coopmart.png',
    'co-opmart': '/assets/stores/supermarket/coopmart.png',
    'co.opMart': '/assets/stores/supermarket/coopmart.png',
    'satra foods': '/assets/stores/convenience/satrafoods.png',
    'winmart': '/assets/stores/convenience/winmart.png',
    'vinmart+': '/assets/stores/convenience/winmart.png',
    'winmart+': '/assets/stores/convenience/winmart.png',
    'co.op extra': '/assets/stores/supermarket/coopxtra.png',
    'coop extra': '/assets/stores/supermarket/coopxtra.png',
    'aeon': '/assets/stores/supermarket/aeon.png',
    'bigc': '/assets/stores/supermarket/BigC.png',
    'big c': '/assets/stores/supermarket/BigC.png',
    'emart': '/assets/stores/supermarket/emart.png',
    'go': '/assets/stores/supermarket/Go!.png',
    'lottemart': '/assets/stores/supermarket/lottemart.png',
    'vincom': '/assets/stores/supermarket/vincom.png',
    'non la': '/assets/stores/gift/nonla.jpg',
    'dt744': '/assets/stores/convenience/taphoa3.png',
    'tap hoa': '/assets/stores/convenience/taphoa2.png',
    'tranh': '/assets/stores/gift/tranh.png'
};

// --- HELPER FUNCTIONS ---
const removeAccents = (str) => {
    if (!str) return "";
    return str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D");
}

const getSmartShopImage = (shop) => {
    if (!shop) return DEFAULT_IMAGE;

    // 1. Xử lý tên: Chuyển về chữ thường + BỎ DẤU TIẾNG VIỆT
    const rawName = shop.name || '';
    const cleanName = removeAccents(rawName).toLowerCase();

    // 2. So sánh với danh sách thương hiệu
    for (const [brand, logo] of Object.entries(BRAND_LOGOS)) {
        if (cleanName.includes(brand)) return logo;
    }

    // 3. Nếu không phải thương hiệu -> Lấy hình riêng DB
    if (shop.image && shop.image !== DEFAULT_IMAGE) return shop.image;

    // 4. Check Category (Cũng bỏ dấu luôn cho chắc)
    if (shop.category) {
        const cleanCat = removeAccents(shop.category).toLowerCase().trim();
        if (CATEGORY_DEFAULTS[cleanCat]) {
            return CATEGORY_DEFAULTS[cleanCat];
        }
        for (const [catKey, catImg] of Object.entries(CATEGORY_DEFAULTS)) {
            if (cleanCat.includes(catKey)) return catImg;
        }
    }

    return DEFAULT_IMAGE;
};

// --- CẤU HÌNH API ---

const API_BASE = "http://localhost:5000";

// --- FIX LỖI ICON MARKER TRONG REACT LEAFLET ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- COMPONENT DROPDOWN CÓ TÌM KIẾM ---
const SearchableSelect = ({ options, value, onChange, placeholder, type, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Lọc danh sách dựa trên từ khóa tìm kiếm
    const filteredOptions = options.filter(opt => {
        const label = type === 'city' ? getCityVN(opt) : (CATEGORY_VN[opt] || opt);
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Lấy nhãn hiển thị hiện tại
    const currentLabel = type === 'city' ? getCityVN(value) : (CATEGORY_VN[value] || value);

    return (
        <div className="sb-item" ref={wrapperRef} style={{ position: 'relative', cursor: 'pointer' }}>
            {icon}
            <div
                className="custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{ flex: 1, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <span>{currentLabel}</span>
                <ChevronRight size={16} transform={`rotate(${isOpen ? -90 : 90})`} color="#999" />
            </div>

            {isOpen && (
                <div className="custom-dropdown-menu fade-in">
                    <div className="dropdown-search-box">
                        <Search size={14} color="#888" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="dropdown-list">
                        {/* Option mặc định */}
                        <div
                            className={`dropdown-option ${value === 'all' ? 'selected' : ''}`}
                            onClick={() => { onChange('all'); setIsOpen(false); setSearchTerm(''); }}
                        >
                            {type === 'city' ? 'Mọi nơi' : 'Tất cả loại'}
                        </div>

                        {filteredOptions.map(opt => (
                            <div
                                key={opt}
                                className={`dropdown-option ${value === opt ? 'selected' : ''}`}
                                onClick={() => { onChange(opt); setIsOpen(false); setSearchTerm(''); }}
                            >
                                {type === 'city' ? getCityVN(opt) : (CATEGORY_VN[opt] || opt)}
                            </div>
                        ))}
                        {filteredOptions.length === 0 && <div style={{ padding: '10px', color: '#999', fontSize: '13px' }}>Không tìm thấy</div>}
                    </div>
                </div>
            )}
        </div>
    );
};
// --- COMPONENT NÚT VỀ VỊ TRÍ HIỆN TẠI ---
const RecenterControl = ({ lat, lon }) => {
    const map = useMap();
    const handleRecenter = (e) => {
        e.stopPropagation();
        if (lat && lon) map.flyTo([lat, lon], 16, { duration: 1.5 });
    };

    return (
        <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control leaflet-bar">
                <button
                    onClick={handleRecenter}
                    title="Về vị trí của tôi"
                    style={{
                        width: '40px', height: '40px',
                        background: 'white', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#007bff', boxShadow: '0 1px 5px rgba(0,0,0,0.65)'
                    }}
                >
                    <Navigation size={20} fill="#007bff" />
                </button>
            </div>
        </div>
    );
};

// --- COMPONENT NÚT KÍCH HOẠT CHỈ ĐƯỜNG ---
const DirectionsControl = ({ onStart }) => {
    return (
        <div className="leaflet-bottom leaflet-left">
            <div className="leaflet-control leaflet-bar">
                <button
                    onClick={(e) => { e.stopPropagation(); onStart(); }}
                    style={{
                        padding: '10px 15px', backgroundColor: '#007bff', color: 'white',
                        border: 'none', cursor: 'pointer', fontWeight: 'bold',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                >
                    <Navigation size={18} /> Chỉ đường tới đây
                </button>
            </div>
        </div>
    );
};

// --- COMPONENT VẼ ĐƯỜNG (ROUTING MACHINE) ---
const RoutingMachine = ({ userLat, userLon, shopLat, shopLon }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;
        if (userLat == null || userLon == null || shopLat == null || shopLon == null) return;

        const routingControl = L.Routing.control({
            waypoints: [L.latLng(userLat, userLon), L.latLng(shopLat, shopLon)],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
            lineOptions: { styles: [{ color: '#007bff', weight: 5, opacity: 0.7 }] },
            createMarker: function () { return null; }
        }).addTo(map);

        const container = routingControl.getContainer();
        if (container) container.style.display = 'none';

        return () => {
            try {
                if (routingControl) {
                    routingControl.getPlan().setWaypoints([]);
                    if (map) map.removeControl(routingControl);
                }
            } catch (e) { console.warn("Lỗi dọn dẹp Routing:", e); }
        };
    }, [map, userLat, userLon, shopLat, shopLon]);

    return null;
};

// --- COMPONENT: CHAT PAGE (FULL SCREEN) ---
function ChatPageUI({ onBack, user }) {
    const [history, setHistory] = useState([
        { role: 'bot', text: `Chào ${user ? user.name : 'bạn'}! 👋\nTôi là trợ lý AI chuyên về quà lưu niệm.\nTôi có thể giúp bạn tìm đặc sản, gợi ý quà tặng hoặc tư vấn địa điểm mua sắm.` }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [history, loading]);

    const handleSend = async (text = input) => {
        if (!text.trim()) return;
        const userMsg = { role: 'user', text: text };
        setHistory(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const payload = {
                message: text,
                history: history.map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.text }]
                }))
            };
            const res = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include'
            });
            const data = await res.json();
            setHistory(prev => [...prev, { role: 'bot', text: data.reply || "Xin lỗi, tôi không hiểu ý bạn." }]);
        } catch (e) {
            setHistory(prev => [...prev, { role: 'bot', text: "⚠️ Lỗi kết nối với server." }]);
        }
        setLoading(false);
    };

    const suggestions = ["Đặc sản Quảng Ngãi làm quà?", "Mua đồ gốm ở đâu uy tín?", "Tư vấn quà tặng cho mẹ", "Món gì để được lâu?"];

    return (
        <div className="container fade-in" style={{ paddingTop: '30px', paddingBottom: '30px' }}>
            <button className="btn-back" onClick={onBack} style={{ marginBottom: '15px' }}>
                <ChevronRight transform="rotate(180)" size={20} /> Quay lại
            </button>
            <div className="chat-page-container">
                <div className="chat-header-pro">
                    <div style={{ width: '45px', height: '45px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <MessageCircle size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontFamily: 'Roboto Slab', fontSize: '18px' }}>Trợ lý SLocal AI</h3>
                        <div style={{ fontSize: '13px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#4cd964', borderRadius: '50%' }}></span> Sẵn sàng hỗ trợ
                        </div>
                    </div>
                </div>
                <div className="chat-body-pro">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`msg-bubble ${msg.role}`}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                        </div>
                    ))}
                    {loading && <div className="msg-bubble bot"><span className="loader" style={{ width: '20px', height: '20px', border: '3px solid #ccc', borderBottomColor: 'transparent' }}></span> Đang nhập...</div>}
                    {history.length < 3 && (
                        <div style={{ alignSelf: 'center', marginTop: '20px', textAlign: 'center' }}>
                            <p style={{ color: '#999', fontSize: '13px', marginBottom: '10px' }}>Gợi ý câu hỏi:</p>
                            <div className="suggestion-chips" style={{ justifyContent: 'center' }}>
                                {suggestions.map(s => <div key={s} className="chip" onClick={() => handleSend(s)}>{s}</div>)}
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
                <div className="chat-footer-pro">
                    <input className="chat-input-pro" placeholder="Nhập câu hỏi..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={loading} />
                    <button onClick={() => handleSend()} disabled={loading} style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={22} style={{ marginLeft: '3px' }} /></button>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: FORGOT PASSWORD ---
function ForgotPasswordForm({ onClose, onSwitchToLogin }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(null);
    const [code, setCode] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleSendEmail = async () => {
        if (!email) return alert("Vui lòng nhập email");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/forgot-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (data.success) { setUserId(data.user_id); setStep(2); } else alert(data.error || "Email không tồn tại");
        } catch { alert("Lỗi kết nối server"); }
        setLoading(false);
    };

    const handleVerifyCode = async () => {
        if (!code) return alert("Vui lòng nhập mã");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/verify-code`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, reset_code: code })
            });
            const data = await res.json();
            if (data.valid) setStep(3); else alert(data.error || "Mã không đúng");
        } catch { alert("Lỗi kết nối server"); }
        setLoading(false);
    };

    const handleResetPass = async () => {
        if (!newPass) return alert("Vui lòng nhập mật khẩu mới");
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/reset-password`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, reset_code: code, new_password: newPass })
            });
            const data = await res.json();
            if (data.success) { alert("Thành công! Vui lòng đăng nhập lại."); onSwitchToLogin(); } else alert(data.error);
        } catch { alert("Lỗi kết nối server"); }
        setLoading(false);
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                <div className="auth-close" onClick={onClose}><X size={24} /></div>
                <h2 className="auth-title">Khôi phục tài khoản</h2>
                <div className="step-dots">
                    {[1, 2, 3].map(s => <div key={s} className={`dot ${step >= s ? 'active' : ''}`}></div>)}
                </div>
                {step === 1 && (
                    <div className="fade-in">
                        <p className="auth-subtitle">Nhập email để nhận mã xác nhận.</p>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} />
                            <input className="modern-input" style={{ paddingLeft: '45px' }} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <button className="btn-auth-full" onClick={handleSendEmail} disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}</button>
                    </div>
                )}
                {step === 2 && (
                    <div className="fade-in">
                        <p className="auth-subtitle">Nhập mã 6 số gửi tới <b>{email}</b></p>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} />
                            <input className="modern-input" style={{ paddingLeft: '45px', letterSpacing: '5px', fontWeight: 'bold' }} placeholder="######" maxLength="6" value={code} onChange={e => setCode(e.target.value)} />
                        </div>
                        <button className="btn-auth-full" onClick={handleVerifyCode} disabled={loading}>{loading ? 'Đang kiểm tra...' : 'Xác thực'}</button>
                    </div>
                )}
                {step === 3 && (
                    <div className="fade-in">
                        <p className="auth-subtitle">Thiết lập mật khẩu mới.</p>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} />
                            <input className="modern-input" style={{ paddingLeft: '45px' }} placeholder="Mật khẩu mới" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                        </div>
                        <button className="btn-auth-full" onClick={handleResetPass} disabled={loading}>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer' }} onClick={onSwitchToLogin}>Quay lại Đăng nhập</span>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: USER PROFILE ---
function UserProfileUI({ user, setUser, onLogout, favoriteShops, onToggleFavorite, onViewDetail }) {
    const [uploading, setUploading] = useState(false);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('avatar', file);
        try {
            const res = await fetch(`${API_BASE}/api/update-avatar`, {
                method: 'POST', body: fd, credentials: 'include'
            });
            const data = await res.json();
            if (data.success) { setUser(prev => ({ ...prev, avatar: data.new_avatar_url })); alert("Cập nhật ảnh thành công!"); }
            else alert(data.error || "Lỗi cập nhật ảnh");
        } catch { alert("Lỗi kết nối server"); }
        setUploading(false);
    };

    if (!user) return <div className="container" style={{ padding: '50px', textAlign: 'center' }}>Vui lòng đăng nhập</div>;

    return (
        <div className="fade-in profile-container">
            <div className="profile-sidebar">
                <div style={{ position: 'relative', width: '120px', margin: '0 auto 15px', cursor: 'pointer' }} onClick={() => !uploading && document.getElementById('avatar-upload').click()}>
                    <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="avatar" className="p-avatar-large" style={{ opacity: uploading ? 0.5 : 1, width: '100%', height: '120px', margin: 0 }} />
                    <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--accent)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                        {uploading ? <span className="loader" style={{ width: '12px', height: '12px', border: '2px solid white' }}></span> : <Camera size={16} />}
                    </div>
                    <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
                </div>
                <h2 className="p-name">{user.name}</h2>
                <div className="p-username">@{user.username}</div>
                <div className="p-stat-grid">
                    <div className="p-stat-box"><div className="p-stat-num">{user.points || 0}</div><div className="p-stat-label">Điểm</div></div>
                    <div className="p-stat-box"><div className="p-stat-num">0</div><div className="p-stat-label">Voucher</div></div>
                </div>
                <button className="btn-secondary" style={{ marginTop: '25px', width: '100%', color: '#e53e3e', borderColor: '#e53e3e' }} onClick={onLogout}>
                    <LogOut size={16} style={{ marginRight: '5px' }} /> Đăng xuất
                </button>
            </div>
            <div className="profile-main">
                <h3 style={{ fontFamily: 'Roboto Slab', fontSize: '20px', color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Thông tin tài khoản</h3>
                <div className="info-group"><label className="info-label">Họ và tên</label><span className="info-value">{user.name}</span></div>
                <div className="info-group"><label className="info-label">Email</label><span className="info-value">{user.email || "Chưa cập nhật"}</span></div>
                <div className="info-group"><label className="info-label">Tên đăng nhập</label><span className="info-value">{user.username}</span></div>
                <div className="info-group"><label className="info-label">Vai trò</label><span className="info-value">Thành viên</span></div>
                {/* --- PHẦN MỚI THÊM: DANH SÁCH YÊU THÍCH --- */}
                <h3 style={{ fontFamily: 'Roboto Slab', fontSize: '20px', color: 'var(--primary)', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px', marginTop: '40px' }}>
                    Cửa hàng đã lưu ({favoriteShops ? favoriteShops.length : 0})
                </h3>

                <div>
                    {favoriteShops && favoriteShops.length > 0 ? (
                        favoriteShops.map(shop => (
                            // Tái sử dụng ShopCard nhưng có thể chỉnh CSS lại một chút nếu muốn
                            <ShopCard
                                key={shop.id}
                                shop={shop}
                                isFavorite={true} // Trong list này thì chắc chắn là favorite rồi
                                onToggleFavorite={onToggleFavorite}
                                onClick={() => onViewDetail(shop.id)}
                            />
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: '#999', padding: '20px', border: '1px dashed #ddd', borderRadius: '8px' }}>
                            <Heart size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>Bạn chưa lưu cửa hàng nào.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT: SHOP CARD (ĐÃ SỬA) ---
const ShopCard = ({ shop, onClick, isFavorite, onToggleFavorite }) => {
    return (
        <div className="shop-card-booking" onClick={onClick} style={{ minHeight: '160px', marginBottom: '20px', position: 'relative' }}>
            <div
                className={`btn-heart ${isFavorite ? 'active' : ''}`}
                style={{
                    left: '10px',   // Canh trái
                    right: 'auto',  // Hủy canh phải mặc định của CSS
                    top: '10px'     // Khoảng cách từ trên xuống
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(shop.id);
                }}
            >
                <Heart size={20} fill={isFavorite ? "#e53e3e" : "none"} color={isFavorite ? "#e53e3e" : "#ccc"} />
            </div>

            <div className="sc-img" style={{ width: '220px', minHeight: 'auto' }}>
                <img
                    src={getSmartShopImage(shop)}
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_IMAGE; }}
                    alt={shop.name}
                    style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                />
            </div>
            <div className="sc-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
                    <h2 style={{ fontSize: '20px', margin: 0, color: '#4e382d', fontFamily: 'Roboto Slab, serif' }}>{shop.name}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#fff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <span style={{ fontWeight: 'bold', color: '#2c2420', fontSize: '15px' }}>{shop.rating || 4.5}</span>
                        <Star size={16} fill="#f5a623" color="#f5a623" />
                    </div>
                </div>
                <div style={{ fontSize: '15px', color: '#555', lineHeight: '1.6' }}>
                    <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                    <span style={{ fontWeight: '500' }}>{shop.city}</span><span style={{ margin: '0 8px', color: '#ccc' }}>•</span><span style={{ color: '#666' }}>{shop.address}</span>
                </div>
                {shop.matched_items && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#008234', background: '#e6f6eb', padding: '5px 10px', borderRadius: '4px', width: 'fit-content' }}>
                        <CheckCircle size={12} style={{ marginRight: '5px' }} />
                        Có bán: <b>{shop.matched_items}</b>
                    </div>
                )}
            </div>
            <div className="sc-price-col" style={{ justifyContent: 'center', width: '200px', borderLeft: '1px solid #f0f0f0' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Giá tham khảo</div>
                    <div className="sc-price-value" style={{ fontSize: '24px', color: '#4e382d' }}>{new Intl.NumberFormat('vi-VN').format(shop.price)},000 ₫</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>Đã bao gồm thuế</div>
                </div>
                <button className="btn-view-detail" style={{ marginTop: '20px', background: '#d4a373', fontSize: '14px', padding: '10px' }}>
                    Xem chi tiết <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function App() {
    const [view, setView] = useState('home');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [shops, setShops] = useState([]);
    const [inputKeyword, setInputKeyword] = useState('');
    const [filters, setFilters] = useState({ keyword: '', city: 'all', category: 'all', rating: 0, from_price: '', to_price: '', lat: null, lon: null, radius: null });
    const [metaData, setMetaData] = useState({ cities: [], categories: [] });

    const [selectedShop, setSelectedShop] = useState(null);
    const [shopComments, setShopComments] = useState([]);
    const [shopProducts, setShopProducts] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const [showChat, setShowChat] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    const [myLocation, setMyLocation] = useState(null);
    const [isMobileMode, setIsMobileMode] = useState(false);
    const [showMobileFilter, setShowMobileFilter] = useState(false);

    const [imageSearchFile, setImageSearchFile] = useState(null);
    const [aiDetectionText, setAiDetectionText] = useState('');
    const [rawImageResults, setRawImageResults] = useState([]);

    const [favoriteIds, setFavoriteIds] = useState([]);
    const [favoriteShopsList, setFavoriteShopsList] = useState([]);

    const [isAiMode, setIsAiMode] = useState(false);

    const fetchFavorites = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/favorites`, { credentials: 'include' });
            const data = await res.json();
            if (data.favorites) {
                setFavoriteShopsList(data.favorites);
                setFavoriteIds(data.ids || []);
            }
        } catch (e) { console.error("Lỗi tải yêu thích", e); }
    };


    useEffect(() => {
        if (user) fetchFavorites();
        else {
            setFavoriteIds([]);
            setFavoriteShopsList([]);
        }
    }, [user]);


    const handleToggleFavorite = async (shopId) => {
        if (!user) {
            alert("Vui lòng đăng nhập để lưu cửa hàng!");
            setView('login');
            return;
        }


        const isCurrentlyFav = favoriteIds.includes(shopId);
        let newFavIds;
        if (isCurrentlyFav) {
            newFavIds = favoriteIds.filter(id => id !== shopId);

            setFavoriteShopsList(prev => prev.filter(s => s.id !== shopId));
        } else {
            newFavIds = [...favoriteIds, shopId];

        }
        setFavoriteIds(newFavIds);

        try {
            const res = await fetch(`${API_BASE}/api/favorites/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop_id: shopId }),
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.success) {

                alert("Có lỗi xảy ra");
                fetchFavorites();
            } else {

                if (data.action === 'added') fetchFavorites();
            }
        } catch (e) {
            alert("Lỗi kết nối");
            fetchFavorites();
        }
    };

    useEffect(() => {
        const checkScreen = () => { if (window.innerWidth <= 768) setIsMobileMode(true); };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    const handleStartNavigation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => { setMyLocation({ lat: position.coords.latitude, lon: position.coords.longitude }); },
                () => alert("Không thể lấy vị trí. Vui lòng kiểm tra quyền GPS.")
            );
        } else alert("Trình duyệt không hỗ trợ định vị.");
    };

    useEffect(() => {
        if (view !== 'home') return;

        if (imageSearchFile) {
            let results = [...rawImageResults];
            if (filters.city !== 'all') results = results.filter(s => s.city === filters.city);
            if (filters.category !== 'all') results = results.filter(s => s.category === filters.category);
            if (filters.rating > 0) results = results.filter(s => (s.rating || 0) >= filters.rating);
            if (filters.from_price) results = results.filter(s => s.price >= parseFloat(filters.from_price));
            if (filters.to_price) results = results.filter(s => s.price <= parseFloat(filters.to_price));
            setShops(results);
            return;
        }

        setLoading(true);
        const params = new URLSearchParams();
        if (filters.keyword) params.append('keyword', filters.keyword);
        if (filters.city !== 'all') params.append('city', filters.city);
        if (filters.category !== 'all') params.append('category', filters.category);
        if (filters.rating > 0) params.append('rating', filters.rating);
        if (filters.from_price) params.append('from_price', filters.from_price);
        if (filters.to_price) params.append('to_price', filters.to_price);
        if (filters.lat && filters.lon) {
            params.append('lat', filters.lat); params.append('lon', filters.lon); params.append('radius', filters.radius || 5);
        }

        fetch(`${API_BASE}/api/shops?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setShops(data.data);
                if (data.filters) setMetaData({ cities: data.filters.cities || [], categories: data.filters.categories || [] });
                setLoading(false);
            })
            .catch(err => { console.error(err); setLoading(false); });

    }, [filters, view, imageSearchFile, rawImageResults]);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageSearchFile(file);
        setLoading(true);
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await fetch(`${API_BASE}/api/search-by-image`, { method: 'POST', body: fd, credentials: 'include' });
            const data = await res.json();
            if (data.shops) {
                const mappedShops = data.shops.map(s => ({ ...s, matched_items: data.identified_items ? data.identified_items.join(', ') : '' }));
                setRawImageResults(mappedShops); setShops(mappedShops);
                setAiDetectionText(data.identified_items ? data.identified_items.join(', ') : '');
            } else { setShops([]); setRawImageResults([]); }
        } catch { alert("Lỗi khi tìm kiếm bằng hình ảnh"); }
        setLoading(false);
    };

    const clearImageSearch = () => {
        setImageSearchFile(null); setAiDetectionText(''); setRawImageResults([]); setFilters(prev => ({ ...prev, keyword: '' }));
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/current-user`, { credentials: 'include' }).then(res => res.json()).then(data => { if (data.is_authenticated) setUser(data.user); });
    }, []);

    useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);
    const doSearch = async () => {
        // 1. Nếu đang ở chế độ AI
        if (isAiMode) {
            if (!inputKeyword.trim()) return;
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/search-by-ai`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: inputKeyword })
                });
                const data = await res.json();

                if (data.shops) {
                    setShops(data.shops);
                    // Có thể hiện thêm thông báo AI đã tìm thấy gì đó nếu muốn
                    if (data.ai_reply) setAiDetectionText(data.ai_reply);
                } else {
                    setShops([]);
                }
            } catch (e) {
                alert("Lỗi tìm kiếm AI");
            }
            setLoading(false);
        }
        // 2. Nếu tìm kiếm thường (Giữ nguyên logic cũ)
        else {
            setFilters(prev => ({ ...prev, keyword: inputKeyword }));
        }
    };

    const handleLogin = async (username, password) => {
        try {
            const res = await fetch(`${API_BASE}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }), credentials: 'include' });
            const data = await res.json();
            if (data.success) { setUser(data.user); setView('home'); } else alert(data.error);
        } catch { alert('Lỗi kết nối server!'); }
    };

    const handleRegister = async (formData) => {
        try {
            const res = await fetch(`${API_BASE}/api/register`, { method: 'POST', body: formData, credentials: 'include' });
            const data = await res.json();
            if (data.success) { alert("Đăng ký thành công!"); setView('login'); } else alert(data.error);
        } catch { alert('Lỗi kết nối server!'); }
    }

    const openDetail = async (id) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/shops/${id}`);
            const data = await res.json();
            if (data.error) alert(data.error);
            else {
                setSelectedShop(data.shop);
                setShopComments(data.comments);
                if (data.products) setShopProducts(data.products);
                else setShopProducts([
                    { id: 1, name: 'Combo Quà Tặng Gốm', price: 250000, image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=400' },
                    { id: 2, name: 'Áo Dài Cách Tân', price: 450000, image: 'https://images.unsplash.com/photo-1583391733958-e02316e3c09e?auto=format&fit=crop&w=400' },
                    { id: 3, name: 'Nón Lá Vẽ Tay', price: 80000, image: 'https://images.unsplash.com/photo-1596324900779-130454316681?auto=format&fit=crop&w=400' },
                    { id: 4, name: 'Khăn Rằn Nam Bộ', price: 45000, image: 'https://images.unsplash.com/photo-1528698715783-057d627341e2?auto=format&fit=crop&w=400' }
                ]);
                setView('detail');
            }
        } catch { alert('Không tải được chi tiết shop!'); }
        setLoading(false);
    };

    const sendChat = async () => {
        if (!chatInput.trim()) return;
        const userText = chatInput;
        setChatInput('');
        setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
        try {
            const payload = { message: userText, history: chatHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })) };
            const res = await fetch(`${API_BASE}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'include' });
            const data = await res.json();
            setChatHistory(prev => [...prev, { role: 'bot', text: data.reply || "Xin lỗi, tôi chưa hiểu." }]);
        } catch { setChatHistory(prev => [...prev, { role: 'bot', text: "Lỗi kết nối AI." }]); }
    };

    return (
        <div className="app-root" style={{ background: isMobileMode ? '#333' : 'inherit', minHeight: '100vh', transition: 'background 0.5s' }}>
            <div className="device-toggle-btn" onClick={() => setIsMobileMode(!isMobileMode)} title={isMobileMode ? "PC Mode" : "Mobile Mode"}>
                {isMobileMode ? <Monitor size={24} /> : <Smartphone size={24} />}
            </div>

            <div className={`mobile-simulator-wrapper ${isMobileMode ? 'active force-mobile' : ''}`}>
                <div className="scroll-container" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
                    <nav className="navbar">
                        <div className="container nav-inner">
                            <div className="logo" onClick={() => setView('home')}>
                                <img src="/logo.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', marginRight: '10px' }} />
                                <span className="logo-text">SLocaL</span>
                            </div>
                            <div className="auth-block">
                                <button className={`nav-btn ${view === 'challenge' ? 'active' : ''}`} onClick={() => setView('challenge')}><Trophy size={18} /> Thử thách</button>
                                <button className={`nav-btn ${view === 'chat' ? 'active' : ''}`} onClick={() => setView('chat')}><MessageCircle size={18} /> Trợ lý AI</button>
                                {user ? (
                                    <div className="user-profile">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setView('profile')}>
                                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="avatar" alt="avt" />
                                            <div className="user-info-text"><div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.name}</div></div>
                                        </div>
                                        <button className="btn-logout" onClick={async () => { await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' }); setUser(null); setView('home'); }}><LogOut size={16} /></button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '10px' }}><button className="btn-secondary" onClick={() => setView('register')}>Đăng ký</button><button className="btn-secondary" onClick={() => setView('login')}>Đăng nhập</button></div>
                                )}
                            </div>
                        </div>
                    </nav>

                    <main>
                        {view === 'home' && (
                            <div className="fade-in">
                                <div className="hero-header" style={{
                                    backgroundImage: `linear-gradient(rgba(78, 56, 45, 0.6), rgba(78, 56, 45, 0.4)), url(${CITY_BG[filters.city] || DEFAULT_BG})`,
                                    backgroundSize: 'cover', backgroundPosition: 'center', transition: 'background-image 0.5s ease-in-out', minHeight: '500px',       // Tăng chiều cao lên 500px (bạn có thể sửa số này to hơn nếu muốn)
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <div className="container">
                                        <h1>Mua sắm thỏa thích cho chuyến đi của bạn!</h1>
                                        <p>Khám phá hàng ngàn trung tâm thương mại & cửa hàng lưu niệm.</p>
                                    </div>
                                </div>

                                <div className="container search-container-wrapper">
                                    <div className="search-bar-booking">
                                        <div className="sb-item sb-input-keyword" style={{ display: 'flex', alignItems: 'center', paddingRight: '15px' }}>
                                            {imageSearchFile ? (
                                                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '15px' }}>
                                                    <div style={{ position: 'relative', width: '50px', height: '50px' }}>
                                                        <img src={URL.createObjectURL(imageSearchFile)} alt="search-preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--accent)' }} />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '11px', color: '#888' }}>Đang tìm kiếm theo ảnh:</div>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {loading ? "Đang phân tích..." : (aiDetectionText || "Đang tải...")}
                                                        </div>
                                                    </div>
                                                    <button onClick={clearImageSearch} style={{ background: '#eee', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa ảnh"><X size={16} color="#666" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Nút Toggle AI Mode */}
                                                    <div
                                                        onClick={() => setIsAiMode(!isAiMode)}
                                                        title={isAiMode ? "Tắt AI Mode" : "Bật AI Mode"}
                                                        style={{
                                                            cursor: 'pointer',
                                                            marginRight: '10px',
                                                            padding: '8px',
                                                            borderRadius: '8px',
                                                            background: isAiMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
                                                            color: isAiMode ? 'white' : '#888',
                                                            transition: 'all 0.3s',
                                                            boxShadow: isAiMode ? '0 4px 10px rgba(118, 75, 162, 0.4)' : 'none',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}
                                                    >
                                                        <Sparkles size={20} fill={isAiMode ? "white" : "none"} />
                                                    </div>

                                                    {/* Input Field */}
                                                    <input
                                                        type="text"
                                                        placeholder={isAiMode ? "Mô tả mong muốn của bạn..." : "Tìm kiếm sản phẩm, cửa hàng"}
                                                        value={inputKeyword}
                                                        onChange={e => setInputKeyword(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && doSearch()}
                                                        style={{
                                                            flex: 1,
                                                            color: isAiMode ? '#764ba2' : 'inherit',
                                                            fontWeight: isAiMode ? 'bold' : '600'
                                                        }}
                                                    />

                                                    {!isAiMode && (
                                                        <>
                                                            <div style={{ width: '1px', height: '24px', background: '#eee', margin: '0 10px' }}></div>
                                                            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Tải ảnh lên để tìm">
                                                                <Camera size={22} color="var(--accent)" />
                                                                <input type="file" hidden accept="image/*" capture="environment" onChange={handleImageSelect} />
                                                            </label>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {/* 1. Dropdown Tỉnh/Thành phố */}
                                        <SearchableSelect
                                            options={metaData.cities}
                                            value={filters.city}
                                            onChange={(val) => setFilters({ ...filters, city: val })}
                                            type="city"
                                            icon={<MapPin className="sb-icon" size={20} />}
                                        />

                                        {/* 2. Dropdown Danh mục */}
                                        <SearchableSelect
                                            options={metaData.categories}
                                            value={filters.category}
                                            onChange={(val) => setFilters({ ...filters, category: val })}
                                            type="category"
                                            icon={<ShoppingBag className="sb-icon" size={20} />}
                                        />
                                        <div className="sb-item mobile-filter-row" onClick={() => setShowMobileFilter(!showMobileFilter)}>
                                            <div className="sb-filter-left"><ListFilter className="sb-icon" /><span style={{ fontWeight: '600', color: '#4e382d' }}>Bộ lọc</span></div>
                                            <SlidersHorizontal className="sb-icon" />
                                        </div>
                                        <button
                                            className="sb-btn"
                                            onClick={doSearch}
                                            style={{
                                                background: isAiMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--primary)',
                                                transition: 'all 0.5s'
                                            }}
                                        >
                                            {isAiMode ? <><Sparkles size={16} style={{ marginRight: '5px' }} /> Hỏi AI</> : 'Tìm kiếm'}
                                        </button>
                                    </div>
                                </div>

                                <div className="container main-layout">
                                    <div className={`sidebar ${showMobileFilter ? 'mobile-visible' : ''}`}>
                                        <div className="filter-box">
                                            <h3>Đánh giá</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div className="rating-input-group" style={{ width: '120px' }}>
                                                    <input type="number" min="0" max="5" step="0.5" placeholder="0" value={filters.rating > 0 ? filters.rating : ''} onChange={e => setFilters({ ...filters, rating: parseFloat(e.target.value) || 0 })} />
                                                    <div className="rating-suffix">/ 5</div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3' }}><span style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>Sao trở lên</span><small style={{ color: '#888', fontSize: '11px' }}>Nhập số sao</small></div>
                                            </div>
                                        </div>
                                        <div className="filter-box">
                                            <h3>Vị trí</h3>
                                            <div className="filter-row">
                                                <input type="checkbox" id="chk-nearby" style={{ transform: 'scale(1.2)', cursor: 'pointer' }} checked={!!filters.lat} onChange={(e) => {
                                                    if (e.target.checked) {
                                                        if (navigator.geolocation) {
                                                            navigator.geolocation.getCurrentPosition(
                                                                (pos) => setFilters({ ...filters, lat: pos.coords.latitude, lon: pos.coords.longitude, radius: 10 }),
                                                                () => { alert("Vui lòng bật GPS."); e.target.checked = false; }
                                                            );
                                                        } else alert("Không hỗ trợ định vị.");
                                                    } else setFilters({ ...filters, lat: null, lon: null, radius: null });
                                                }} />
                                                <label htmlFor="chk-nearby" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', marginLeft: '5px' }}><span style={{ fontWeight: '600' }}>Gần tôi nhất</span><span style={{ fontSize: '12px', color: '#666' }}>Bán kính 10km</span></label>
                                            </div>
                                        </div>
                                        <div className="filter-box">
                                            <h3>Ngân sách</h3>
                                            <div className="price-inputs" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div className="price-input-wrapper"><input type="number" placeholder="0" value={filters.from_price} onChange={e => setFilters({ ...filters, from_price: e.target.value })} /><span className="price-suffix">,000đ</span></div>
                                                <span style={{ fontWeight: 'bold', color: '#ccc' }}>-</span>
                                                <div className="price-input-wrapper"><input type="number" placeholder="0" value={filters.to_price} onChange={e => setFilters({ ...filters, to_price: e.target.value })} /><span className="price-suffix">,000đ</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="content-list">
                                        {imageSearchFile && !loading && (
                                            <div style={{ marginBottom: '20px', padding: '15px', background: '#e6f6eb', borderRadius: '8px', border: '1px solid #c3e6cb', color: '#155724', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <CheckCircle size={20} />
                                                <div>AI đã nhận diện: <b>{aiDetectionText}</b><div style={{ fontSize: '13px' }}>Tìm thấy {shops.length} cửa hàng.</div></div>
                                            </div>
                                        )}
                                        {loading ? <div style={{ textAlign: 'center', padding: '20px' }}><span className="loader"></span> Đang tải...</div> : (
                                            <div>
                                                {shops.length > 0 ? (
                                                    // --- ĐOẠN CODE MỚI: SẮP XẾP YÊU THÍCH LÊN ĐẦU ---
                                                    [...shops] // Tạo bản sao mảng để không ảnh hưởng dữ liệu gốc
                                                        .sort((a, b) => {
                                                            const isFavA = favoriteIds.includes(a.id);
                                                            const isFavB = favoriteIds.includes(b.id);
                                                            // Nếu A được thích, B không -> A lên trước (-1)
                                                            if (isFavA && !isFavB) return -1;
                                                            // Nếu B được thích, A không -> B lên trước (1)
                                                            if (!isFavA && isFavB) return 1;
                                                            // Nếu cả 2 cùng thích hoặc cùng không -> Giữ nguyên thứ tự (0)
                                                            return 0;
                                                        })
                                                        .map(shop => (
                                                            <ShopCard
                                                                key={shop.id}
                                                                shop={shop}
                                                                isFavorite={favoriteIds.includes(shop.id)}
                                                                onToggleFavorite={handleToggleFavorite}
                                                                onClick={() => openDetail(shop.id)}
                                                            />
                                                        ))
                                                    // --- KẾT THÚC ĐOẠN SẮP XẾP ---
                                                ) : <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>Không tìm thấy cửa hàng.</div>}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {view === 'challenge' && <ChallengeUI user={user} onLoginRequest={() => setView('login')} onBack={() => setView('home')} />}
                        {view === 'forgotPassword' && <ForgotPasswordForm onClose={() => setView('home')} onSwitchToLogin={() => setView('login')} />}
                        {view === 'profile' && user && (
                            <UserProfileUI
                                user={user}
                                setUser={setUser}
                                onLogout={async () => {
                                    await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' });
                                    setUser(null);
                                    setView('home');
                                }}

                                favoriteShops={favoriteShopsList}
                                onToggleFavorite={handleToggleFavorite}
                                onViewDetail={openDetail}
                            />
                        )}                        {(view === 'login' || view === 'register') && <AuthForm type={view} onSwitch={(target) => { if (target === 'forgot-password') setView('forgotPassword'); else setView(view === 'login' ? 'register' : 'login'); }} onLogin={handleLogin} onRegister={handleRegister} onClose={() => setView('home')} />}
                        {view === 'chat' && <ChatPageUI user={user} onBack={() => setView('home')} />}
                        {view === 'detail' && selectedShop && (
                            <div className="fade-in" style={{ paddingBottom: '60px' }}>
                                <div className="container" style={{ marginTop: '20px' }}>
                                    <button className="btn-back" onClick={() => setView('home')} style={{ color: '#666', fontSize: '14px' }}><ChevronRight transform="rotate(180)" size={16} /> Quay lại danh sách</button>
                                </div>
                                <div className="detail-container-pro">
                                    <div className="detail-header-pro">
                                        <div className="dh-info">
                                            <span className="pro-badge">{selectedShop.category || "Địa điểm"}</span>
                                            <h1 className="pro-title">{selectedShop.name}</h1>
                                            <div className="pro-address"><MapPin size={18} color="#888" /><span>{selectedShop.address}, {selectedShop.city}</span></div>
                                            <div className="pro-rating">
                                                <div style={{ display: 'flex' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={18} fill={s <= (selectedShop.rating || 5) ? "#f5a623" : "#e0e0e0"} color="none" />)}</div>
                                                <span style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{selectedShop.rating || 5.0} / 5.0</span>
                                            </div>
                                        </div>
                                        <div className="dh-price-box">
                                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Giá tham khảo</div>
                                            <div className="pro-price">{new Intl.NumberFormat('vi-VN').format(selectedShop.price)},000 ₫</div>
                                            <div style={{ marginTop: '15px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#008234', fontSize: '13px', fontWeight: 'bold', background: '#e6f6eb', padding: '5px 10px', borderRadius: '20px' }}><CheckCircle size={14} /> Đang mở cửa</div>
                                        </div>
                                    </div>

                                    <div style={{ padding: '0 40px 40px 40px', background: '#fff' }}>
                                        <h3 style={{ fontFamily: 'Roboto Slab', margin: '30px 0 20px', fontSize: '20px', borderLeft: '4px solid var(--accent)', paddingLeft: '15px', color: 'var(--primary)' }}>Danh sách mặt hàng nổi bật</h3>
                                        {shopProducts.length > 0 ? (
                                            <div className="product-text-grid">
                                                {(isExpanded ? shopProducts : shopProducts.slice(0, 4)).map((prod) => (
                                                    <div key={prod.id} className="product-simple-card">
                                                        <div className="psc-icon"><ShoppingBag size={18} /></div>
                                                        <div className="psc-name">{prod.name}</div>
                                                    </div>
                                                ))}
                                                {!isExpanded && shopProducts.length > 4 && <div className="product-simple-card psc-more" onClick={() => setIsExpanded(true)}><span>+{shopProducts.length - 4} món khác...</span></div>}
                                                {isExpanded && shopProducts.length > 4 && <div className="product-simple-card psc-more" onClick={() => setIsExpanded(false)} style={{ background: '#fff0f0', color: '#e53e3e', borderColor: '#feb2b2' }}><span>Thu gọn <ChevronRight transform="rotate(-90)" size={14} /></span></div>}
                                            </div>
                                        ) : <div style={{ color: '#999', fontStyle: 'italic', padding: '20px 0' }}>Chưa cập nhật sản phẩm.</div>}
                                    </div>

                                    <div className="map-section-pro" style={{ height: '500px', width: '100%', zIndex: 0 }}>
                                        {selectedShop.lat && selectedShop.lon ? (
                                            <MapContainer center={[parseFloat(selectedShop.lat), parseFloat(selectedShop.lon)]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                                                <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <Marker position={[selectedShop.lat, selectedShop.lon]}><Popup><b>{selectedShop.name}</b><br />{selectedShop.address}</Popup></Marker>
                                                {myLocation ? (
                                                    <>
                                                        <Marker position={[myLocation.lat, myLocation.lon]}><Popup>Vị trí của bạn</Popup></Marker>
                                                        <RoutingMachine userLat={parseFloat(myLocation.lat)} userLon={parseFloat(myLocation.lon)} shopLat={parseFloat(selectedShop.lat)} shopLon={parseFloat(selectedShop.lon)} />
                                                        <RecenterControl lat={myLocation.lat} lon={myLocation.lon} />
                                                    </>
                                                ) : <DirectionsControl onStart={handleStartNavigation} />}
                                            </MapContainer>
                                        ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', background: '#eee' }}>Không có dữ liệu bản đồ</div>}
                                    </div>

                                    <div className="action-bar-pro">
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#e0e0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={20} color="#555" /></div>
                                            <div><div style={{ fontWeight: 'bold', fontSize: '14px' }}>Hỗ trợ trực tuyến</div><div style={{ fontSize: '12px', color: '#666' }}>Hỏi AI về sản phẩm tại đây</div></div>
                                        </div>
                                        <button onClick={() => { setShowChat(true); setChatHistory(prev => [...prev, { role: 'bot', text: `Chào bạn! Bạn cần tư vấn gì về ${selectedShop.name}?` }]); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(78, 56, 45, 0.2)' }}>Chat ngay <MessageCircle size={18} /></button>
                                    </div>

                                    <div style={{ padding: '40px', background: '#fff' }}>
                                        <h3 style={{ fontFamily: 'Roboto Slab', margin: '0 0 25px', fontSize: '20px', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px', display: 'inline-block' }}>Đánh giá từ cộng đồng</h3>
                                        {user ? <CommentForm shopId={selectedShop.id} onSuccess={() => openDetail(selectedShop.id)} /> : <div style={{ padding: '15px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'center', fontSize: '14px' }}><span style={{ color: '#666' }}>Vui lòng </span><a onClick={() => setView('login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>đăng nhập</a><span style={{ color: '#666' }}> để gửi đánh giá.</span></div>}
                                        <div style={{ marginTop: '30px' }}>
                                            {shopComments.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa có đánh giá nào.</p>}
                                            {shopComments.map(c => (
                                                <div key={c.id} style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid #f5f5f5', paddingBottom: '25px' }}>
                                                    <div style={{ width: '45px', height: '45px', background: '#d4a373', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>{c.user_name?.[0]?.toUpperCase()}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}><strong style={{ fontSize: '15px', color: '#222' }}>{c.user_name}</strong><small style={{ color: '#999', fontSize: '12px' }}>{c.created_date}</small></div>
                                                        <div style={{ marginBottom: '8px' }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < (c.rating || 5) ? "#f5a623" : "#e0e0e0"} color="none" />)}</div>
                                                        <div style={{ color: '#444', fontSize: '14px', lineHeight: '1.6' }}>{c.content}</div>
                                                        {c.images && c.images.length > 0 && <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>{c.images.map((img, idx) => <img key={idx} src={img} alt="review" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }} />)}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>

                    <div className="about-section">
                        <div className="container">
                            <div className="about-grid">
                                <div>
                                    <h2 className="about-title">About Us</h2>
                                    <h3 style={{ fontFamily: 'Roboto Slab', color: '#333', marginTop: 0 }}>Kết nối văn hóa qua từng món quà!</h3>
                                    <p className="about-desc">SLocal không chỉ là ứng dụng tìm kiếm cửa hàng thông thường, mà là người bạn đồng hành giúp du khách khám phá những nét đẹp văn hóa tiềm ẩn. Chúng tôi tin rằng mỗi món quà lưu niệm đều mang trong mình một câu chuyện riêng của vùng đất đó.</p>
                                </div>
                                <div className="feature-box-grid">
                                    <div className="feature-mini-card"><div style={{ color: 'var(--accent)', marginBottom: '10px' }}><Camera size={32} /></div><h4 style={{ margin: '5px 0', color: 'var(--primary)' }}>AI Vision</h4><small style={{ color: '#666' }}>Tìm kiếm bằng hình ảnh</small></div>
                                    <div className="feature-mini-card"><div style={{ color: 'var(--accent)', marginBottom: '10px' }}><MapPin size={32} /></div><h4 style={{ margin: '5px 0', color: 'var(--primary)' }}>Bản đồ số</h4><small style={{ color: '#666' }}>Định vị shop gần bạn</small></div>
                                    <div className="feature-mini-card"><div style={{ color: 'var(--accent)', marginBottom: '10px' }}><MessageCircle size={32} /></div><h4 style={{ margin: '5px 0', color: 'var(--primary)' }}>Trợ lý ảo</h4><small style={{ color: '#666' }}>Tư vấn 24/7</small></div>
                                    <div className="feature-mini-card"><div style={{ color: 'var(--accent)', marginBottom: '10px' }}><Gift size={32} /></div><h4 style={{ margin: '5px 0', color: 'var(--primary)' }}>Đổi quà</h4><small style={{ color: '#666' }}>Tích điểm nhận voucher</small></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="footer-credit">
                        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>© 2025 <b>SLocal Project</b>. All rights reserved.</div>
                            <div>Phát triển bởi <b>Nhóm 6</b></div>
                        </div>
                    </div>
                </div>

                {!showChat && <div className="chat-btn" onClick={() => setShowChat(true)}><MessageCircle size={28} /></div>}
                {showChat && (
                    <div className="chat-window">
                        <div className="chat-header"><span>Trợ lý SLocal AI</span><div style={{ cursor: 'pointer' }} onClick={() => setShowChat(false)}><X size={20} /></div></div>
                        <div className="chat-content">
                            {chatHistory.length === 0 && <div style={{ textAlign: 'center', marginTop: '20px', color: '#999' }}>Chào bạn! Tôi có thể giúp gì về quà lưu niệm?</div>}
                            {chatHistory.map((msg, i) => <div key={i} className={`chat-msg ${msg.role}`}>{msg.text}</div>)}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="chat-input">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()} placeholder="Nhập câu hỏi..." />
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} onClick={sendChat}><Send size={18} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: CHALLENGE UI ---
function ChallengeUI({ user, onLoginRequest, onBack }) {
    const [activeTab, setActiveTab] = useState('discover');
    const [loading, setLoading] = useState(false);
    const [videos, setVideos] = useState([]);
    const [myQuests, setMyQuests] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [userPoints, setUserPoints] = useState(0);
    const [userLocation, setUserLocation] = useState({ lat: null, lon: null });
    const [navigatingQuest, setNavigatingQuest] = useState(null);

const getLocation = (onSuccess, onError) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                    setUserLocation(coords);
                    if (onSuccess) onSuccess(coords);
                },
                (err) => {
                    console.error("Lỗi GPS:", err);
                    // Nếu lỗi, vẫn gọi callback nhưng không có coords
                    if (onError) onError(); 
                }
            );
        } else {
            alert("Trình duyệt không hỗ trợ Geolocation.");
            if (onError) onError();
        }
    };

    // SỬA USE EFFECT NÀY:
    useEffect(() => {
        // Cố gắng lấy vị trí, nếu được thì tải video theo vị trí
        getLocation(
            (coords) => fetchVideos(coords), 
            () => fetchVideos({ lat: null, lon: null }) // Nếu lỗi GPS, vẫn tải video (không lọc khoảng cách)
        );

        if (user) { fetchMyQuests(); fetchVouchers(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchVideos = async (coords = userLocation) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/challenge/videos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lat: coords.lat, lon: coords.lon, radius: 20 }), credentials: 'include'
            });
            const data = await res.json(); setVideos(data.videos || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchMyQuests = async () => {
        if (!user) return;
        try {
            const url = userLocation.lat ? `${API_BASE}/api/challenge/current?lat=${userLocation.lat}&lon=${userLocation.lon}` : `${API_BASE}/api/challenge/current`;
            const res = await fetch(url, { credentials: 'include' });
            const data = await res.json(); setMyQuests(data.shops || []);
        } catch (e) { console.error(e); }
    };

    const fetchVouchers = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${API_BASE}/api/challenge/vouchers`, { credentials: 'include' });
            const data = await res.json(); setVouchers(data.vouchers || []); setUserPoints(data.user_points || 0);
        } catch (e) { console.error(e); }
    };

    const handleAcceptChallenge = async (shopId) => {
        if (!user) return onLoginRequest();
        if (myQuests.length >= 3) return alert("Tối đa 3 thử thách cùng lúc!");
        try {
            const res = await fetch(`${API_BASE}/api/challenge/add`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId }), credentials: 'include'
            });
            if (res.ok) { alert("Đã nhận thử thách!"); fetchMyQuests(); setActiveTab('my-quest'); } else alert("Lỗi");
        } catch { alert("Lỗi kết nối"); }
    };

    const handleGiveUp = async (shopId) => {
        if (!window.confirm("Huỷ thử thách này?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/challenge/remove`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shop_id: shopId }), credentials: 'include'
            });
            if (res.ok) fetchMyQuests();
        } catch { alert("Lỗi kết nối"); }
    };

    const handleCheckIn = () => {
        getLocation(async (coords) => {
            const fd = new FormData(); fd.append('user_lat', coords.lat); fd.append('user_lon', coords.lon);
            try {
                const res = await fetch(`${API_BASE}/api/challenge/checkin`, { method: 'POST', body: fd, credentials: 'include' });
                const data = await res.json();
                if (data.success) { alert(data.message); fetchMyQuests(); fetchVouchers(); } else alert(data.error);
            } catch { alert("Lỗi hệ thống Check-in"); }
        });
    };

    const handleRedeem = async (voucherId) => {
        if (!window.confirm("Đổi voucher này?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/challenge/redeem`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucher_id: voucherId }), credentials: 'include'
            });
            const data = await res.json();
            if (data.success) { alert(data.message); fetchVouchers(); } else alert(data.error);
        } catch { alert("Lỗi đổi quà"); }
    };

    return (
        <div className="fade-in">
            <div className="hero-header challenge-mode">
                <div className="container">
                    <h1>Du lịch & Săn Quà Địa Phương</h1>
                    <p>Khám phá địa điểm qua video - Check-in nhận điểm - Đổi quà hấp dẫn</p>
                    {user && (
                        <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(5px)' }}>
                            <Trophy color="#FFD700" size={24} style={{ marginRight: '10px' }} />
                            <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>Điểm của bạn: {userPoints}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="container" style={{ marginTop: '30px', minHeight: '600px' }}>
                <div className="container" style={{ marginTop: '20px', marginBottom: '10px' }}>
                    <button className="btn-back" onClick={onBack}><ChevronRight transform="rotate(180)" size={20} /> Quay lại</button>
                </div>
                <div className="challenge-tabs">
                    <button className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`} onClick={() => setActiveTab('discover')}><Video size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Khám phá</button>
                    <button className={`tab-btn ${activeTab === 'my-quest' ? 'active' : ''}`} onClick={() => { if (!user) return onLoginRequest(); setActiveTab('my-quest'); fetchMyQuests(); }}><MapPin size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Nhiệm vụ ({myQuests.length}/3)</button>
                    <button className={`tab-btn ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => { if (!user) return onLoginRequest(); setActiveTab('rewards'); fetchVouchers(); }}><Gift size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Kho Quà</button>
                </div>

                {activeTab === 'discover' && (
                    <div className="fade-in">
                        {loading && <div style={{ textAlign: 'center' }}>Đang tải...</div>}
                        <div className="video-feed-grid">
                            {videos.map(vid => (
                                <div key={vid.video_id} className="video-card-pro">
                                    <iframe src={vid.embed_url} className="vc-frame" title={vid.video_id} allowFullScreen></iframe>
                                    <div className="vc-info">
                                        <h3 className="vc-shop-name">{vid.shop.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}><MapPin size={14} />{vid.shop.address}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#008234', background: '#e6f6eb', padding: '4px 8px', borderRadius: '4px' }}>Cách bạn {vid.shop.distance_km} km</div>
                                            <button className="btn-booking-primary" style={{ padding: '8px 16px', fontSize: '13px', width: 'auto' }} onClick={() => handleAcceptChallenge(vid.shop.id)} disabled={myQuests.some(q => q.shop_id === vid.shop.id)}>{myQuests.some(q => q.shop_id === vid.shop.id) ? 'Đã nhận' : 'Nhận thử thách'}</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'my-quest' && (
                    <div className="fade-in">
                        {navigatingQuest ? (
                            <div className="fade-in">
                                <button className="btn-back" onClick={() => setNavigatingQuest(null)} style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}><ChevronRight transform="rotate(180)" size={16} /> Quay lại danh sách nhiệm vụ</button>
                                <div className="map-section-pro" style={{ height: '500px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                    <MapContainer center={[navigatingQuest.lat, navigatingQuest.lon]} zoom={15} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={[navigatingQuest.lat, navigatingQuest.lon]}><Popup><b>{navigatingQuest.name}</b><br />{navigatingQuest.address}</Popup></Marker>
                                        <Marker position={[navigatingQuest.userLat, navigatingQuest.userLon]}><Popup>Vị trí của bạn</Popup></Marker>
                                        <RoutingMachine userLat={navigatingQuest.userLat} userLon={navigatingQuest.userLon} shopLat={navigatingQuest.lat} shopLon={navigatingQuest.lon} />
                                        <RecenterControl lat={navigatingQuest.userLat} lon={navigatingQuest.userLon} />
                                    </MapContainer>
                                </div>
                                <div style={{ marginTop: '20px', padding: '20px', background: '#f0fff4', border: '1px solid #48bb78', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <Navigation size={32} color="#48bb78" />
                                    <div><h4 style={{ margin: '0 0 5px', color: '#2f855a' }}>Đang dẫn đường tới: {navigatingQuest.name}</h4><p style={{ margin: 0, fontSize: '14px', color: '#555' }}>Hãy di chuyển đến địa điểm này và nhấn <b>"Check-in tại đây"</b> phía trên.</p></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="progress-header">
                                    <h2 style={{ fontFamily: 'Roboto Slab', color: 'var(--primary)', margin: 0 }}>Tiến độ hành trình</h2>
                                    <p style={{ color: '#666' }}>Hoàn thành check-in để nhận điểm thưởng.</p>
                                    <div style={{ maxWidth: '400px', margin: '0 auto' }}><div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(myQuests.length / 3) * 100}%` }}></div></div><small>{myQuests.length}/3 Thử thách đang kích hoạt</small></div>
                                </div>
                                <div className="quest-list">
                                    {myQuests.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#999', border: '2px dashed #eee', borderRadius: '12px' }}><MapPin size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><p>Bạn chưa nhận thử thách nào.</p><button className="btn-secondary" onClick={() => setActiveTab('discover')}>Tìm thử thách ngay</button></div>
                                    ) : (
                                        <>
                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}><button className="btn-booking-primary" style={{ margin: '0 auto', padding: '15px 40px', fontSize: '18px', boxShadow: '0 4px 15px rgba(78, 56, 45, 0.4)' }} onClick={handleCheckIn}><MapPin size={20} /> CHECK-IN TẠI ĐÂY</button></div>
                                            {myQuests.map((quest) => (
                                                <div key={quest.shop_id} className="quest-card">
                                                    <div className="quest-icon"><ShoppingBag size={24} /></div>
                                                    <div className="quest-details">
                                                        <h3 style={{ margin: '0 0 5px', fontFamily: 'Roboto Slab', color: 'var(--primary)' }}>{quest.name}</h3>
                                                        <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>{quest.address}</p>
                                                        <div style={{ marginTop: '8px', display: 'flex', gap: '10px', fontSize: '13px' }}><span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Khoảng cách: {quest.distance_km} km</span><span style={{ color: '#008234' }}>+15 điểm</span></div>
                                                    </div>
                                                    <div className="quest-actions">
                                                        <button className="btn-secondary" style={{ color: '#e53e3e', borderColor: '#e53e3e', fontSize: '13px' }} onClick={() => handleGiveUp(quest.shop_id)}>Huỷ bỏ</button>
                                                        <button className="btn-secondary" style={{ color: '#007bff', borderColor: '#007bff', fontWeight: 'bold' }} onClick={() => startNavigation(quest)}><Navigation size={14} style={{ marginRight: '5px' }} /> Chỉ đường</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="fade-in">
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}><h2 style={{ fontFamily: 'Dancing Script', fontSize: '42px', color: 'var(--accent)' }}>Kho Quà Tặng</h2><p>Sử dụng điểm tích lũy của bạn để đổi lấy những ưu đãi độc quyền.</p></div>
                        <div className="reward-grid">
                            {vouchers.map(v => (
                                <div key={v.id} className="voucher-ticket-pro">
                                    <div className="v-left"><h3 style={{ margin: '0 0 5px', color: 'var(--primary)' }}>{v.code}</h3><p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{v.description}</p><div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}><CheckCircle size={12} style={{ marginRight: '4px' }} /> Có hiệu lực ngay</div></div>
                                    <div className="v-right"><div className="point-cost">{v.point_cost}</div><div style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Điểm</div><button style={{ background: userPoints >= v.point_cost ? 'var(--primary)' : '#ccc', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: userPoints >= v.point_cost ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }} onClick={() => userPoints >= v.point_cost && handleRedeem(v.id)}>Đổi ngay</button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUB-COMPONENT: AUTH FORM ---
function AuthForm({ type, onSwitch, onLogin, onRegister, onClose }) {
    const [form, setForm] = useState({ username: '', password: '', name: '', email: '', confirm: '', avatar: null });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const handleKeyDown = (e) => { if (e.key === 'Enter') submit(); };

    const submit = () => {
        if (type === 'login') {
            if (!form.username || !form.password) return alert("Vui lòng nhập đủ thông tin");
            onLogin(form.username, form.password);
        } else {
            if (!form.username || !form.password || !form.name || !form.email || !form.confirm) return alert("Vui lòng nhập đủ thông tin");
            if (form.password !== form.confirm) return alert("Mật khẩu xác nhận không khớp");
            const fd = new FormData();
            fd.append('name', form.name); fd.append('username', form.username); fd.append('pass', form.password); fd.append('confirm', form.confirm); fd.append('email', form.email);
            if (form.avatar) fd.append('avatar', form.avatar);
            onRegister(fd);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-card">
                <div className="auth-close" onClick={onClose}><X size={24} /></div>
                <h2 className="auth-title">{type === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</h2>
                <p className="auth-subtitle">{type === 'login' ? 'Chào mừng bạn quay trở lại' : 'Tham gia cộng đồng quà lưu niệm'}</p>
                {type === 'register' && (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                            <label style={{ cursor: 'pointer' }}>
                                {avatarPreview ? <img src={avatarPreview} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} alt="avatar" /> : <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><Camera size={24} color="#888" /></div>}
                                <input type="file" hidden accept="image/*" onChange={e => { if (e.target.files[0]) { setForm({ ...form, avatar: e.target.files[0] }); setAvatarPreview(URL.createObjectURL(e.target.files[0])); } }} />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Chọn ảnh đại diện</div>
                            </label>
                        </div>
                        <input className="modern-input" placeholder="Họ và tên" onChange={e => setForm({ ...form, name: e.target.value })} />
                        <input className="modern-input" placeholder="Email" type="email" onChange={e => setForm({ ...form, email: e.target.value })} />
                    </>
                )}
                <div style={{ position: 'relative' }}><UserIcon size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} /><input className="modern-input" style={{ paddingLeft: '45px' }} placeholder="Tên đăng nhập" onChange={e => setForm({ ...form, username: e.target.value })} /></div>
                <div style={{ position: 'relative' }}><Lock size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} /><input className="modern-input" style={{ paddingLeft: '45px' }} placeholder="Mật khẩu" type="password" onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={handleKeyDown} /></div>
                {type === 'register' && <div style={{ position: 'relative' }}><Lock size={18} style={{ position: 'absolute', top: '15px', left: '15px', color: '#aaa' }} /><input className="modern-input" style={{ paddingLeft: '45px' }} placeholder="Nhập lại mật khẩu" type="password" onChange={e => setForm({ ...form, confirm: e.target.value })} /></div>}
                <button className="btn-auth-full" onClick={submit}>{type === 'login' ? 'Đăng nhập' : 'Đăng ký ngay'}</button>
                {type === 'login' && <div style={{ textAlign: 'center', marginTop: '15px' }}><span style={{ color: '#666', fontSize: '13px', cursor: 'pointer' }} onClick={() => { onClose(); onSwitch('forgot-password'); }}>Quên mật khẩu?</span></div>}
                <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>{type === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}<span style={{ color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} onClick={onSwitch}>{type === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}</span></div>
            </div>
        </div>
    )
}

function CommentForm({ shopId, onSuccess }) {
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [images, setImages] = useState([]);
    const submit = async () => {
        if (!content) return;
        const fd = new FormData(); fd.append('content', content); fd.append('rating', rating);
        if (images.length > 0) { for (let i = 0; i < images.length; i++) fd.append('images', images[i]); }
        await fetch(`${API_BASE}/api/shops/${shopId}/comments`, { method: 'POST', body: fd, credentials: 'include' });
        setContent(''); setImages([]); onSuccess();
    };
    return (
        <div style={{ background: '#fafafa', padding: '15px', borderRadius: '4px', marginTop: '10px' }}>
            <div style={{ marginBottom: '10px' }}>{[1, 2, 3, 4, 5].map(s => <Star key={s} size={20} fill={s <= rating ? "#d4a373" : "#eee"} color={s <= rating ? "#d4a373" : "#eee"} onClick={() => setRating(s)} style={{ cursor: 'pointer', marginRight: '2px' }} />)}</div>
            <textarea style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '2px' }} rows="3" placeholder="Viết đánh giá của bạn..." value={content} onChange={e => setContent(e.target.value)}></textarea>
            <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} style={{ marginTop: '10px' }} />
            <button className="btn-booking-primary" style={{ marginTop: '10px' }} onClick={submit}>Gửi đánh giá</button>
        </div>
    )
}