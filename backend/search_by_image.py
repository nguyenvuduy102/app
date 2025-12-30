import json
import ast
import os
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai

# --- 1. CẤU HÌNH API ---
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path, override=True)

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("⚠️ CẢNH BÁO: Không tìm thấy GEMINI_API_KEY")

# --- 2. DỮ LIỆU KHO HÀNG 
category_items_map = {
    "convenience": ["Bánh snack", "Chai nước", "Mì ly", "Nước ngọt", "Bánh quy", "Sữa hộp", "Kẹo", "Mì gói", "Nước suối", "Nước tăng lực", "Trà đóng chai", "Cà phê lon", "Bánh mì sandwich", "Sữa chua uống", "Kẹo cao su", "Khoai tây chiên", "Thịt hộp", "Bánh bao mini", "Bàn chải đánh răng", "Kem đánh răng", "Xà phòng tắm", "Dầu gội", "Khăn giấy", "Khẩu trang y tế", "Dao cạo râu", "Lăn khử mùi", "Bật lửa", "Pin AA", "Pin sạc", "Dây sạc điện thoại", "Túi nylon", "Bao rác", "Bóng đèn LED mini", "Sổ tay nhỏ", "Bút bi", "Ô dù gấp", "Khăn ướt", "Găng tay nilon", "Cốc nhựa", "Muỗng nhựa", "Gối cổ du lịch"],
    "supermarket": ["Gạo", "Đường", "Muối", "Bột ngọt", "Nước mắm", "Dầu ăn", "Trứng gà", "Thịt heo", "Cá hộp", "Rau củ quả", "Nước tương", "Sốt cà chua", "Bơ thực vật", "Bột mì", "Sữa tươi", "Sữa chua", "Nước trái cây", "Snack", "Mì gói", "Ngũ cốc ăn sáng", "Trà túi lọc", "Cà phê hòa tan", "Bột giặt", "Nước xả vải", "Nước rửa chén", "Giấy vệ sinh", "Khăn giấy", "Bàn chải", "Nước lau sàn", "Túi đựng rác", "Kem dưỡng da", "Sữa tắm", "Dầu gội", "Kem cạo râu", "Son dưỡng môi", "Nước hoa mini", "Khẩu trang y tế", "Bông tẩy trang", "Chảo chống dính", "Dao bếp", "Thớt", "Muỗng nĩa", "Ly thủy tinh", "Đĩa sứ", "Khay nhựa", "Giấy bọc thực phẩm"],
    "mall": ["Áo thun", "Áo sơ mi", "Váy dạ hội", "Đầm công sở", "Quần jean", "Quần short", "Áo khoác", "Giày thể thao", "Dép sandal", "Túi xách", "Ví da", "Thắt lưng", "Đồng hồ", "Nước hoa", "Kính mát", "Khăn choàng", "Nón thời trang", "Mỹ phẩm trang điểm", "Kem nền", "Son môi", "Phấn má", "Mascara", "Dầu dưỡng tóc", "Máy sấy tóc", "Lược điện", "Đồ chơi trẻ em", "Sách", "Tai nghe Bluetooth", "Ốp điện thoại", "Đồng hồ thông minh", "Laptop mini", "Vali kéo", "Ba lô thời trang", "Áo khoác da", "Túi tote", "Găng tay", "Giày cao gót", "Bông tai", "Vòng tay"],
    "marketplace": ["Trái cây tươi", "Rau củ sạch", "Cá tươi", "Thịt heo", "Thịt bò", "Hải sản", "Gia vị", "Đặc sản địa phương", "Đồ thủ công", "Túi đan tay", "Nón lá", "Khăn dệt tay", "Áo bà ba", "Quần áo vải thô", "Gạo đặc sản", "Bánh pía", "Bánh tráng", "Mắm ruốc", "Khô cá lóc", "Khô mực", "Đồ nhựa gia dụng", "Rổ nhựa", "Chổi quét nhà", "Giỏ tre", "Hoa tươi", "Cây cảnh nhỏ", "Đồ chơi trẻ em", "Vật dụng học tập", "Bút chì", "Bút bi", "Thước kẻ", "Vở học sinh", "Đồ lưu niệm", "Móc khóa", "Thiệp thủ công", "Đèn dầu cổ", "Khăn choàng tay", "Quạt nan"],
    "department_store": ["Sữa tươi", "Sữa bột", "Sữa chua", "Bánh kẹo", "Mì gói", "Gạo", "Dầu ăn", "Nước mắm", "Đường", "Muối", "Trà", "Cà phê", "Nước suối", "Nước ngọt", "Thực phẩm đóng hộp", "Ngũ cốc", "Bột nêm", "Bột giặt", "Nước rửa chén", "Nước lau sàn", "Nước xả vải", "Dầu gội", "Sữa tắm", "Kem đánh răng", "Khăn giấy", "Giấy vệ sinh", "Tã em bé", "Khăn ướt", "Bình sữa", "Sữa bột trẻ em", "Bánh ăn dặm"],
    "gift": ["Quà lưu niệm", "Móc khóa", "Bưu thiếp", "Đồ thủ công", "Khung ảnh", "Nến thơm", "Thiệp chúc mừng", "Tượng nhỏ", "Gấu bông mini", "Bình hoa nhỏ", "Hộp quà tặng", "Đèn trang trí nhỏ", "Đồng hồ để bàn", "Tranh mini", "Ly in hình", "Sổ tay dễ thương", "Bút ký cao cấp", "Khăn lụa", "Gối in hình", "Bình giữ nhiệt", "Cốc đôi", "Móc khóa đôi", "Túi đựng quà", "Bánh handmade", "Chậu cây mini", "Khung ảnh LED"],
    "souvenir": ["Đồ gỗ mỹ nghệ", "Đồ dệt", "Tượng gốm", "Đồ sơn mài", "Móc khóa du lịch", "Tranh thêu", "Đĩa lưu niệm", "Áo du lịch", "Nón lá nhỏ", "Đồ gốm trang trí", "Tượng đồng", "Đèn lồng Hội An", "Khăn choàng lụa", "Vòng tay tre", "Hộp nhạc cổ điển", "Thẻ đánh dấu sách", "Túi thổ cẩm", "Hình chụp phong cảnh", "Chai cát nghệ thuật", "Vỏ ốc trang trí", "Bút thủ công", "Tranh dán cát", "Huy hiệu du lịch", "Gối thêu tay"],
    "craft": ["Giỏ đan", "Đồ trang trí mây tre", "Thêu tay", "Lọ mây", "Đèn lồng giấy", "Tranh treo tường thủ công", "Gối handmade", "Bình tre", "Túi đan tay", "Khung tre", "Lồng đèn mây", "Thảm cói", "Giá để chén bằng tre", "Ghế đan tay", "Khung ảnh tre", "Đĩa mây", "Rổ tre", "Bàn tre mini", "Giá sách nhỏ", "Túi tote vải bố", "Đèn treo mây", "Đồ trang trí vintage", "Bình mây tre", "Tấm lót bàn", "Hộp quà thủ công"],
    "ceramics": ["Bình gốm", "Bộ ấm trà", "Đĩa gốm", "Lọ hoa gốm", "Tượng gốm", "Ly sứ", "Bình trà", "Chén gốm", "Tô gốm", "Bình đựng nước gốm", "Gạt tàn gốm", "Đèn ngủ gốm", "Bình phong gốm", "Chậu cây gốm", "Đồ thờ gốm", "Tượng linh vật", "Gạch gốm trang trí", "Bộ ly espresso gốm", "Lọ tinh dầu", "Bình đựng tăm gốm", "Bộ chén đĩa cao cấp", "Bộ ly trà đạo", "Tượng Phật nhỏ", "Bộ bình sake", "Bình trang trí men lam"],
    "art": ["Tranh", "Tranh canvas", "Tượng điêu khắc", "Tranh sơn dầu", "Tranh acrylic", "Tượng nhỏ", "Tranh phong cảnh", "Tượng gỗ", "Tranh trừu tượng", "Tranh chân dung", "Tranh tường", "Tranh ký họa", "Tranh màu nước", "Tượng đất nung", "Tượng đá cẩm thạch", "Mô hình nghệ thuật", "Tượng kim loại", "Tranh sơn mài", "Tranh thêu tay", "Tranh nghệ thuật hiện đại", "Tượng đồng nhỏ", "Tranh nghệ thuật 3D", "Tượng nhân vật cổ điển", "Tranh thư pháp", "Tranh nghệ thuật dân gian", "Tranh đương đại", "Tranh giấy cuộn"]
}

INVENTORY_CONTEXT = json.dumps(category_items_map, ensure_ascii=False)

def phan_tich_hinh_anh(url_anh, debug=True):
    """
    Input: URL ảnh
    Output: List tên sản phẩm tiếng Việt (VD: ['Chai nước', 'Bánh snack'])
    Param debug: Nếu False sẽ tắt các print không cần thiết
    """
    if debug: print(f"--- ĐANG XỬ LÝ ẢNH: {url_anh} ---")
    
    try:
        # 1. Tải ảnh (Thêm Header để giả danh trình duyệt - Fix lỗi 403)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        try:
            response = requests.get(url_anh, headers=headers, timeout=10)
            if response.status_code != 200:
                if debug: print(f"❌ Không tải được ảnh. Code: {response.status_code}")
                return []
            img_data = Image.open(BytesIO(response.content))
        except Exception as e:
            if debug: print(f"❌ Lỗi download/mở ảnh: {e}")
            return []
        
        # 2. Setup Gemini
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # 3. Prompt
        prompt = f"""
        Đóng vai một nhân viên kho hàng. Kho hàng: {INVENTORY_CONTEXT}
        
        NHIỆM VỤ:
        Nhìn hình ảnh, xác định vật thể, tìm tên gọi TIẾNG VIỆT tương ứng trong kho.
        
        YÊU CẦU:
        - Chỉ trả về Python List string. VD: ['Chai nước'].
        - Nếu không có trả về [].
        """
        
        # 4. Gửi yêu cầu 
        if debug: print("-> Đang gửi ảnh cho Gemini...")
        
        try:
            response = model.generate_content([prompt, img_data])
            text_response = response.text.strip()
            if debug: print(f"-> Gemini phản hồi: {text_response}")
        except Exception as e:
            err_str = str(e)
            # Nếu lỗi Quota (429), trả về rỗng để code chạy tiếp
            if "429" in err_str or "Quota" in err_str:
                if debug: print("⚠️ Hết lượt Free (Quota Exceeded)")
                return [] 
            if debug: print(f"Lỗi Gemini API: {e}")
            return []
        
        # 5. Parse kết quả
        clean_text = text_response.replace("```json", "").replace("```python", "").replace("```", "").strip()
        
        try:
            result_list = ast.literal_eval(clean_text)
            if isinstance(result_list, list):
                return result_list
            return []
        except:
            if "[" in clean_text and "]" in clean_text:
                try:
                    start = clean_text.find('[')
                    end = clean_text.rfind(']') + 1
                    return ast.literal_eval(clean_text[start:end])
                except: pass
            return []

    except Exception as e:
        if debug: print(f"LỖI HỆ THỐNG: {str(e)}")
        return []