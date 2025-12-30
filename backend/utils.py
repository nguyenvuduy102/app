import hashlib
from __init__ import app, db, mail
from models import User, Shop, Comment, City, Category, ChatHistory, favorites
import random
from datetime import datetime, timedelta
from flask_mail import Message
from sqlalchemy import or_, and_, cast, Float, func
import math
from dotenv import load_dotenv
import google.generativeai as genai
import os
import json
import re

# Lấy đường dẫn tuyệt đối đến file .env
dotenv_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path, override=True)

# Lấy API Key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
client = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        client = True 
        print("Đã cấu hình Gemini Client thành công.")
    except Exception as e:
        print(f"LỖI CẤU HÌNH GEMINI: {e}")
else:
    print("CẢNH BÁO: Không tìm thấy GEMINI_API_KEY.")

SOUVENIR_SYSTEM_INSTRUCTION = (
    "Bạn là 'Souvenir Expert AI' (Chuyên gia Quà Lưu Niệm) thân thiện và nhiệt tình. "
    "Nhiệm vụ của bạn là tư vấn cho du khách về các món quà lưu niệm độc đáo, "
    "kinh nghiệm mua sắm, mẹo trả giá, và các địa điểm mua sắm (chợ, cửa hàng) tại Việt Nam."
    "Phản hồi của bạn phải ngắn gọn, hữu ích, và sử dụng ngôn ngữ tiếng Việt tự nhiên."
)

def apply_smart_search(query, keyword_str):
    if not keyword_str:
        return query
    keywords = [k.strip() for k in keyword_str.split(',') if k.strip()]
    if not keywords:
        return query
    filters = []
    for k in keywords:
        filters.append(Shop.shop_name.contains(k))
        filters.append(Shop.items.contains(k))
    return query.filter(or_(*filters))

# --- Hàm AI RAG (Retrieval Augmented Generation) ---
def get_gemini_response(user_message, chat_history=[]):
    global client
    if not client:
        return {"answer": "Lỗi kết nối AI.", "shop_ids": []}

    try:
        # GIAI ĐOẠN 1: Hiểu ý định (Intent Recognition)
        intent_prompt = f"""
        Phân tích câu nói: "{user_message}"
        Output JSON duy nhất:
        {{
            "keyword": "tên món/quán (ví dụ: gốm, tranh)",
            "city": "tên thành phố (ví dụ: Hà Nội)",
            "is_searching": true/false (true nếu tìm mua)
        }}
        """
        model_flash = genai.GenerativeModel('gemini-2.5-flash')
        intent_resp = model_flash.generate_content(intent_prompt)
        
        try:
            clean_intent = intent_resp.text.replace("```json", "").replace("```", "").strip()
            intent_data = json.loads(clean_intent)
        except:
            intent_data = {"keyword": user_message, "city": None, "is_searching": True}

        # GIAI ĐOẠN 2: Tìm Database (Retrieval)
        found_shops = []
        context_text = ""
        
        if intent_data.get("is_searching"):
            kw = intent_data.get("keyword")
            city = intent_data.get("city")
            
            if kw or city:
                shops_db = search_shops_from_db(keywords=kw, city=city, limit=4)
                if shops_db:
                    context_text = "DỮ LIỆU TÌM ĐƯỢC TỪ HỆ THỐNG:\n"
                    for s in shops_db:
                        items_str = s.items if s.items else "Nhiều món"
                        city_name = s.city_obj.name if s.city_obj else ""
                        line = (f"- ID: {s.id} | Tên: {s.shop_name} | Đ/C: {s.address}, {city_name} "
                                f"| Món: {items_str} | Giá: {s.price}\n")
                        context_text += line
                        found_shops.append(s.id)
                else:
                    context_text = "Không tìm thấy quán phù hợp trong database."
        
        # GIAI ĐOẠN 3: Tổng hợp trả lời (Generation)
        # Chuyển đổi chat_history về string đơn giản nếu cần, ở đây Gemini nhận list object cũng được
        # nhưng để an toàn ta đưa history vào context string
        
        FINAL_PROMPT = f"""
        {SOUVENIR_SYSTEM_INSTRUCTION}
        
        THÔNG TIN TÌM ĐƯỢC:
        {context_text}
        
        LỊCH SỬ CHAT:
        {json.dumps(chat_history, ensure_ascii=False)}
        
        USER HỎI: "{user_message}"
        
        YÊU CẦU:
        1. Trả lời dựa trên thông tin tìm được.
        2. Nếu không có quán, hãy xin lỗi và gợi ý khác.
        3. Output JSON: {{ "answer": "...", "shop_ids": {found_shops} }}
        """
        
        final_resp = model_flash.generate_content(FINAL_PROMPT)
        final_clean = final_resp.text.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(final_clean)
        except:
             return {"answer": final_clean, "shop_ids": found_shops}

    except Exception as e:
        print(f"LỖI RAG: {e}")
        return {"answer": "Hệ thống đang bận, vui lòng thử lại sau.", "shop_ids": []}

# --- CÁC HÀM QUẢN LÝ USER ---
def add_user(name, username, password, **kwargs):
    password = str(hashlib.md5(password.strip().encode('utf-8')).hexdigest())
    user = User(name=name.strip(), username=username.strip(),password=password,
                email=kwargs.get('email'),
                avatar=kwargs.get('avatar'))
    db.session.add(user)
    db.session.commit()

def check_login(username, password):
    if username and password:
        password = str(hashlib.md5(password.strip().encode('utf-8')).hexdigest())
        return User.query.filter(User.username.__eq__(username.strip()),
                                 User.password.__eq__(password)).first()
    return None

def get_user_by_id(user_id):
    return User.query.get(user_id)

def get_user_by_email(email):
    return User.query.filter(User.email.__eq__(email.strip())).first()

# --- CÁC HÀM SHOP & LOGIC KHÁC ---
def calculate_distance(lat1, lon1, lat2, lon2):
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return float('inf')
    R = 6371
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def load_shops(kw=None, from_price=None, to_price=None, 
               city=None, category=None, min_rating=None, 
               user_lat=None, user_lon=None, radius=None, page=1):
    query = Shop.query
    if kw: query = apply_smart_search(query, kw)
    if city and city != 'all': query = query.join(City).filter(City.name == city)
    if category and category != 'all': query = query.join(Category).filter(Category.name == category)
    if from_price: query = query.filter(cast(Shop.price, Float) >= float(from_price))
    if to_price: query = query.filter(cast(Shop.price, Float) <= float(to_price))
    if min_rating: query = query.filter(Shop.rating >= float(min_rating))

    shops = query.all()
    
    if user_lat and user_lon and radius:
        try:
            user_lat, user_lon, radius = float(user_lat), float(user_lon), float(radius)
            filtered_shops = []
            for s in shops:
                s_lat = s.lat if s.lat is not None else 0
                s_lon = s.lon if s.lon is not None else 0
                dist = calculate_distance(user_lat, user_lon, s_lat, s_lon)
                s.distance = round(dist, 1)
                if dist <= radius: filtered_shops.append(s)
            shops = sorted(filtered_shops, key=lambda x: x.distance)
        except ValueError: pass 

    total_count = len(shops)
    page_size = app.config['PAGE_SIZE']
    start = (page - 1) * page_size
    return shops[start:start+page_size], total_count

def get_all_cities():
    return [c.name for c in City.query.order_by(City.name).all()]

def get_all_categories():
    return [c.name for c in Category.query.order_by(Category.name).all()]

def search_shops_by_items(item_list):
    if not item_list: return []
    query = Shop.query
    filters = []
    for item in item_list:
        filters.append(Shop.items.contains(item))
    return query.filter(or_(*filters)).all()

def get_shop_by_id(shop_id):
    return Shop.query.get(shop_id)

def get_comments(shop_id):
    return Comment.query.filter(Comment.shop_id == shop_id).order_by(Comment.created_date.desc()).all()

def add_comment(content, shop_id, user_id, rating=0, images=[]):
    image_string = ";".join(images) if images else None
    c = Comment(content=content, shop_id=shop_id, user_id=user_id, rating=rating, image=image_string)
    db.session.add(c)
    db.session.commit()
    
    avg_rating = db.session.query(func.avg(Comment.rating)).filter(Comment.shop_id == shop_id).scalar()
    shop = Shop.query.get(shop_id)
    shop.rating = round(avg_rating, 1)
    db.session.commit()
    return c

def update_user_avatar(user_id, avatar_url):
    try:
        u = get_user_by_id(user_id)
        if u:
            u.avatar = avatar_url
            db.session.commit()
            return True
    except: return False

def search_shops_from_db(keywords=None, city=None, limit=5):
    query = Shop.query
    if keywords:
        query = query.filter(or_(Shop.shop_name.contains(keywords), Shop.items.contains(keywords)))
    if city:
        query = query.join(City).filter(City.name.contains(city))
    return query.limit(limit).all()

# --- MỚI THÊM: CÁC HÀM QUẢN LÝ LỊCH SỬ CHAT ---
def save_chat_message(user_id, role, message):
    MAX_HISTORY = 50 
    new_msg = ChatHistory(user_id=user_id, role=role, message=message)
    db.session.add(new_msg)
    
    count = ChatHistory.query.filter_by(user_id=user_id).count()
    if count > MAX_HISTORY:
        limit = count - MAX_HISTORY
        old_msgs = ChatHistory.query.filter_by(user_id=user_id)\
            .order_by(ChatHistory.created_date.asc())\
            .limit(limit).all()
        for msg in old_msgs:
            db.session.delete(msg)
            
    db.session.commit()
    return new_msg

def get_user_chat_history(user_id):
    return ChatHistory.query.filter_by(user_id=user_id)\
                            .order_by(ChatHistory.created_date.asc()).all()

def delete_chat_message(msg_id, user_id):
    msg = ChatHistory.query.filter_by(id=msg_id, user_id=user_id).first()
    if msg:
        db.session.delete(msg)
        db.session.commit()
        return True
    return False

def clear_all_chat_history(user_id):
    try:
        ChatHistory.query.filter_by(user_id=user_id).delete()
        db.session.commit()
        return True
    except:
        db.session.rollback()
        return False

# --- CÁC HÀM FAVORITE ---
def get_user_favorite_shops(user_id):
    u = User.query.get(user_id)
    return u.favorite_shops if u else []

def toggle_shop_favorite(user_id, shop_id):
    u = User.query.get(user_id)
    s = Shop.query.get(shop_id)
    if not u or not s: return None
    
    if s in u.favorite_shops:
        u.favorite_shops.remove(s)
        db.session.commit()
        return 'removed'
    else:
        u.favorite_shops.append(s)
        db.session.commit()
        return 'added'

# --- QUÊN MẬT KHẨU ---
def generate_and_send_reset_code(user_id):
    user = get_user_by_id(user_id) 
    if not user: return False
    code = str(random.randint(100000, 999999))
    user.reset_code = code
    user.code_expiration = datetime.now() + timedelta(minutes=15)
    try:
        db.session.commit()
        msg = Message("Mã xác nhận SLocal", recipients=[user.email])
        msg.body = f"Mã xác nhận của bạn là: {code}"
        mail.send(msg)
        return True
    except Exception as ex:
        db.session.rollback()
        print("Lỗi gửi mail:", ex)
        return False

def verify_reset_code(user_id, code):
    user = get_user_by_id(user_id)
    if user and user.reset_code == code.strip() and user.code_expiration > datetime.now():
        return True
    return False

def update_password(user_id, new_password):
    user = get_user_by_id(user_id)
    if user:
        user.password = str(hashlib.md5(new_password.strip().encode('utf-8')).hexdigest())
        user.reset_code = None
        user.code_expiration = None
        db.session.commit()
        return True
    return False