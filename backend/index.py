from __init__ import app, login
from flask import request, jsonify, make_response, render_template
import utils
import math
import cloudinary.uploader
from flask_login import login_user, logout_user, current_user, login_required
import random
from datetime import datetime, timedelta
import os
from search_by_image import phan_tich_hinh_anh 
from challenge import challenge_bp
from models import ChatHistory 

# --- 1. API SẢN PHẨM & TRANG CHỦ ---
@app.route("/api/shops", methods=['GET']) 
def api_get_shops():
    kw = request.args.get('keyword')
    page = request.args.get('page', 1, type=int)
    from_price = request.args.get('from_price')
    to_price = request.args.get('to_price')
    city = request.args.get('city')
    category = request.args.get('category')
    min_rating = request.args.get('rating')
    user_lat = request.args.get('lat')
    user_lon = request.args.get('lon')
    radius = request.args.get('radius')

    shops, total_count = utils.load_shops(
        kw=kw, from_price=from_price, to_price=to_price,
        city=city, category=category, min_rating=min_rating,
        user_lat=user_lat, user_lon=user_lon, radius=radius, page=page
    )

    shops_data = [s.to_dict() for s in shops] 
    categories = utils.get_all_categories()
    cities = utils.get_all_cities()

    return jsonify({
        'data': shops_data,
        'pagination': {
            'current_page': page,
            'total_pages': math.ceil(total_count / app.config['PAGE_SIZE']),
            'total_count': total_count
        },
        'filters': {
            'cities': cities,
            'categories': categories
        }
    })

@app.route('/api/shops/<int:shop_id>', methods=['GET'])
def api_shop_detail(shop_id):
    shop = utils.get_shop_by_id(shop_id)
    if not shop: return jsonify({'error': 'Không tìm thấy cửa hàng'}), 404
    comments = utils.get_comments(shop_id)
    
    return jsonify({
        'shop': shop.to_dict(),
        'comments': [c.to_dict() for c in comments] 
    })

# --- 2. API AUTH ---
@app.route('/api/register', methods=['POST'])
def api_register():
    name = request.form.get('name')
    username = request.form.get('username')
    password = request.form.get('pass')
    email = request.form.get('email')
    confirm = request.form.get('confirm')
    avatar = request.files.get('avatar')

    if not username or not password: return jsonify({'error': 'Thiếu thông tin'}), 400
    if password.strip() != confirm.strip(): return jsonify({'error': 'Mật khẩu không khớp'}), 400

    try:
        avatar_path = None
        if avatar:
            res = cloudinary.uploader.upload(avatar)
            avatar_path = res['secure_url']
        utils.add_user(name=name, username=username, password=password, email=email, avatar=avatar_path)
        return jsonify({'message': 'Đăng ký thành công', 'success': True}), 201
    except Exception as ex:
        return jsonify({'error': str(ex), 'success': False}), 500

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        username = request.form.get('username')
        password = request.form.get('pass')
    else:
        username = data.get('username')
        password = data.get('password')

    user = utils.check_login(username=username, password=password)
    if user:
        login_user(user=user)
        return jsonify({'message': 'Thành công', 'user': user.to_dict(), 'success': True})
    return jsonify({'error': 'Sai tài khoản/mật khẩu', 'success': False}), 401

@app.route('/api/logout', methods=['POST'])
def api_logout():
    logout_user()
    return jsonify({'message': 'Đăng xuất thành công'})

@app.route("/api/current-user")
def api_get_current_user():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict(), 'is_authenticated': True})
    return jsonify({'user': None, 'is_authenticated': False})

# --- 3. API TÍNH NĂNG (CHAT CẬP NHẬT MỚI) ---

@app.route('/api/chat', methods=['POST'])
@login_required 
def api_chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        if not user_message: return jsonify({'reply': 'Tin nhắn trống', 'success': False}), 400

        # A. Lưu tin user
        utils.save_chat_message(current_user.id, 'user', user_message)

        # B. Lấy lịch sử 10 tin gần nhất
        db_history = ChatHistory.query.filter_by(user_id=current_user.id)\
                                      .order_by(ChatHistory.created_date.desc())\
                                      .limit(10).all()
        db_history.reverse()
        
        formatted_history = []
        for h in db_history:
            formatted_history.append({"role": h.role, "parts": [h.message]})

        # C. Gọi AI
        ai_result = utils.get_gemini_response(user_message, chat_history=formatted_history)
        ai_reply_text = ai_result.get('answer', 'Lỗi hệ thống')

        # D. Lưu tin AI
        utils.save_chat_message(current_user.id, 'model', ai_reply_text)
        
        suggested_shops = []
        if ai_result.get('shop_ids'):
            for sid in ai_result['shop_ids']:
                s = utils.get_shop_by_id(sid)
                if s: suggested_shops.append(s.to_dict())

        return jsonify({
            'reply': ai_reply_text,
            'shop_ids': ai_result.get('shop_ids'),
            'shops': suggested_shops,
            'success': True
        })

    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({'reply': 'Lỗi server', 'success': False}), 500

@app.route('/api/chat/history', methods=['GET'])
@login_required
def api_get_chat_history():
    history = utils.get_user_chat_history(current_user.id)
    return jsonify({'success': True, 'data': [h.to_dict() for h in history]})

@app.route('/api/chat/message/<int:msg_id>', methods=['DELETE'])
@login_required
def api_delete_chat_message(msg_id):
    if utils.delete_chat_message(msg_id, current_user.id):
        return jsonify({'success': True, 'message': 'Đã xóa'})
    return jsonify({'success': False, 'error': 'Không tìm thấy'}), 404

@app.route('/api/chat/history', methods=['DELETE'])
@login_required
def api_clear_chat_history():
    if utils.clear_all_chat_history(current_user.id):
        return jsonify({'success': True, 'message': 'Đã xóa lịch sử'})
    return jsonify({'success': False, 'error': 'Lỗi'}), 500

@app.route('/api/search-by-ai', methods=['POST'])
def api_search_by_ai():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        if not prompt: return jsonify({'shops': [], 'message': 'Trống'})

        ai_result = utils.get_gemini_response(prompt, chat_history=[])
        found_shops = []
        if ai_result.get('shop_ids'):
            for sid in ai_result['shop_ids']:
                s = utils.get_shop_by_id(sid)
                if s: found_shops.append(s.to_dict())
        
        return jsonify({'shops': found_shops, 'ai_reply': ai_result.get('answer', ''), 'success': True})
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

# --- CÁC TÍNH NĂNG KHÁC (Comment, Favorite, Reset Password) ---
@app.route('/api/shops/<int:shop_id>/comments', methods=['POST'])
@login_required
def api_add_comment(shop_id):
    try:
        content = request.form.get('content')
        rating = request.form.get('rating', type=int)
        files = request.files.getlist('images')
        if len(files) > 3: return jsonify({'error': 'Tối đa 3 ảnh'}), 400

        uploaded_urls = []
        for file in files:
            if file and file.filename:
                res = cloudinary.uploader.upload(file)
                uploaded_urls.append(res['secure_url'])

        new_comment = utils.add_comment(content, shop_id, current_user.id, rating, uploaded_urls)
        return jsonify({'message': 'Thành công', 'comment': new_comment.to_dict()})
    except Exception as ex: return jsonify({'error': str(ex)}), 500

@app.route('/api/update-avatar', methods=['POST'])
@login_required
def api_update_avatar():
    avatar = request.files.get('avatar')
    if not avatar: return jsonify({'error': 'Chưa chọn ảnh'}), 400
    try:
        res = cloudinary.uploader.upload(avatar)
        url = res['secure_url']
        if utils.update_user_avatar(current_user.id, url):
            return jsonify({'message': 'Thành công', 'avatar_url': url, 'success': True})
        return jsonify({'error': 'Lỗi DB'}), 500
    except Exception as ex: return jsonify({'error': str(ex)}), 500

@app.route('/api/search-by-image', methods=['POST'])
def api_search_by_image():
    file = request.files.get('image')
    if not file: return jsonify({'error': 'Chưa gửi ảnh'}), 400
    try:
        res = cloudinary.uploader.upload(file)
        url = res['secure_url']
        items = phan_tich_hinh_anh(url)
        shops = [s.to_dict() for s in utils.search_shops_by_items(items)] if items else []
        return jsonify({'identified_items': items, 'image_url': url, 'shops': shops})
    except Exception as e: return jsonify({'error': str(e)}), 500

# API Favorites
@app.route('/api/favorites', methods=['GET'])
@login_required
def api_get_favorites():
    fav_shops = utils.get_user_favorite_shops(current_user.id)
    return jsonify({'favorites': [s.to_dict() for s in fav_shops], 'ids': [s.id for s in fav_shops], 'success': True})

@app.route('/api/favorites/toggle', methods=['POST'])
@login_required
def api_toggle_favorite():
    data = request.get_json()
    action = utils.toggle_shop_favorite(current_user.id, data.get('shop_id'))
    if action: return jsonify({'message': 'Thành công', 'action': action, 'success': True})
    return jsonify({'error': 'Lỗi'}), 400

# API Reset Password
@app.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
    email = request.form.get('email') or request.get_json().get('email')
    user = utils.get_user_by_email(email)
    if user and utils.generate_and_send_reset_code(user.id):
        return jsonify({'message': 'Đã gửi mã', 'user_id': user.id, 'success': True})
    return jsonify({'error': 'Lỗi hoặc không tìm thấy email', 'success': False}), 404

@app.route('/api/verify-code', methods=['POST'])
def api_verify_code():
    data = request.get_json()
    if utils.verify_reset_code(data.get('user_id'), data.get('reset_code')):
        return jsonify({'message': 'Mã hợp lệ', 'valid': True})
    return jsonify({'error': 'Mã sai', 'valid': False}), 400

@app.route('/api/reset-password', methods=['POST'])
def api_reset_password():
    data = request.get_json()
    if not utils.verify_reset_code(data.get('user_id'), data.get('reset_code')):
        return jsonify({'error': 'Hết hạn'}), 400
    if utils.update_password(data.get('user_id'), data.get('new_password')):
        return jsonify({'message': 'Thành công', 'success': True})
    return jsonify({'error': 'Lỗi'}), 500

@login.user_loader
def user_load(user_id):
    return utils.get_user_by_id(user_id=user_id)

app.register_blueprint(challenge_bp, url_prefix='/api/challenge')

if __name__ == '__main__':
    if not os.getenv("GEMINI_API_KEY"): print("CẢNH BÁO: Chưa có key Gemini")
    app.run(debug=True)