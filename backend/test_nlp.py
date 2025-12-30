import re
from __init__ import app  # Import app để có kết nối DB
from models import City   # Import model City thật từ database

def local_intent_recognition(user_message):
    """
    Hàm xử lý ngôn ngữ tự nhiên sử dụng dữ liệu thật từ Database
    """
    # 1. Chuẩn hóa câu input về chữ thường
    raw_msg = user_message.lower().strip()
    
    # 2. Lấy danh sách thành phố từ Database thật
    # (Lưu ý: Hàm này phải được gọi bên trong app.app_context())
    all_cities = City.query.all() 
    
    detected_city = None
    
    # 3. Tìm thành phố trong câu nói
    # Sắp xếp theo độ dài tên giảm dần để ưu tiên bắt tên dài trước (VD: "Hồ Chí Minh" trước "Hồ")
    sorted_cities = sorted(all_cities, key=lambda x: len(x.name), reverse=True)
    
    for c in sorted_cities:
        c_name_lower = c.name.lower()
        if c_name_lower in raw_msg:
            detected_city = c.name # Lấy tên gốc viết hoa đẹp
            # Xóa tên thành phố khỏi câu để lọc keyword
            raw_msg = raw_msg.replace(c_name_lower, "")
            break
            
    # 4. Làm sạch để lấy Keyword
    # Danh sách từ nối cần loại bỏ
    stop_words = [
        "tìm", "kiếm", "muốn", "mua", "ở", "tại", "quán", "cửa hàng", "shop", 
        "có", "bán", "không", "cho", "tôi", "em", "mình", "nhé", "ạ", "gì", "đâu", "nào"
    ]
    
    for word in stop_words:
        # Dùng regex xóa từ đứng riêng lẻ (tránh xóa nhầm từ trong từ ghép)
        raw_msg = re.sub(r'\b' + word + r'\b', '', raw_msg)
        
    # Xóa ký tự đặc biệt và khoảng trắng thừa
    keyword = re.sub(r'[^\w\s]', '', raw_msg).strip()
    keyword = re.sub(r'\s+', ' ', keyword) # Gộp nhiều dấu cách thành 1
    
    # Xác định xem user có đang tìm kiếm không
    is_searching = bool(keyword or detected_city)
    
    return {
        "keyword": keyword,
        "city": detected_city,
        "is_searching": is_searching
    }

# --- PHẦN CHẠY CHƯƠNG TRÌNH (MAIN) ---
if __name__ == "__main__":
    # Quan trọng: Phải bọc trong app_context để truy cập được Database
    with app.app_context():
        print("\n" + "="*50)
        print("HỆ THỐNG TEST NHẬN DIỆN Ý ĐỊNH (REAL DATA)")
        print("="*50)
        
        # Kiểm tra kết nối DB trước
        try:
            count = City.query.count()
            print(f"-> Kết nối DB thành công! Đang có {count} thành phố trong hệ thống.")
        except Exception as e:
            print(f"-> Lỗi kết nối Database: {e}")
            exit()

        print("-> Nhập câu hỏi của bạn (gõ 'exit' để thoát).")
        print("-" * 50)

        while True:
            try:
                # Nhập từ terminal
                user_input = input("\nUser: ")
                
                if user_input.lower() in ['exit', 'quit', 'thoat']:
                    print("Đã thoát chương trình.")
                    break
                
                if not user_input.strip():
                    continue

                # Gọi hàm xử lý
                result = local_intent_recognition(user_input)

                # In kết quả đẹp
                print(f"Bot phân tích:")
                print(f"   ► Keyword: {result['keyword']}")
                print(f"   ► City:    {result['city']}")
                print(f"   ► Search?: {result['is_searching']}")
                
            except KeyboardInterrupt:
                print("\nĐã thoát.")
                break
            except Exception as ex:
                print(f"Lỗi: {ex}")