from sqlalchemy import Column, Integer, String, Enum, Float, Boolean, DateTime, ForeignKey, Text
from __init__ import db, app
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as UserEnum
from flask_login import UserMixin
import csv, os

class BaseModel(db.Model):
    __abstract__ = True
    id = Column(Integer, primary_key=True, autoincrement=True)

# Bảng trung gian lưu trữ yêu thích (User <-> Shop)
favorites = db.Table('favorites',
    Column('user_id', Integer, ForeignKey('user.id'), primary_key=True),
    Column('shop_id', Integer, ForeignKey('shop.id'), primary_key=True),
    Column('created_at', DateTime, default=datetime.now)
)

class UserRole(UserEnum):
    ADMIN = 1
    USER = 2

class User(BaseModel, UserMixin):
    __tablename__ = 'user'
    name = Column(String(50), nullable=False)
    username = Column(String(50), nullable=False, unique=True)
    password = Column(String(50), nullable=False)
    avatar = Column(String(100))
    email = Column(String(50))
    active = Column(Boolean, default=True)
    joined_date = Column(DateTime, default=datetime.now()) 
    user_role = Column(Enum(UserRole), default=UserRole.USER)
    points = Column(Integer, default=0)
    favorite_shops = relationship('Shop', secondary=favorites, backref='favorited_by', lazy='dynamic')

    reset_code = Column(String(10), nullable=True) 
    code_expiration = Column(DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'username': self.username,
            'email': self.email,
            'avatar': self.avatar,
            'points' : self.points
        }

# --- 1. TẠO BẢNG CITY RIÊNG ---
class City(BaseModel):
    __tablename__ = 'city'
    name = Column(String(100), nullable=False, unique=True) # Tên tỉnh thành duy nhất
    
    # Quan hệ ngược: Một city có nhiều shop
    shops = relationship('Shop', backref='city_obj', lazy=True)

    def __str__(self):
        return self.name

# --- 2. TẠO BẢNG CATEGORY RIÊNG ---
class Category(BaseModel):
    __tablename__ = 'category'
    name = Column(String(50), nullable=False, unique=True) # Tên danh mục duy nhất
    
    # Quan hệ ngược: Một category có nhiều shop
    shops = relationship('Shop', backref='category_obj', lazy=True)

    def __str__(self):
        return self.name

# --- 3. SỬA BẢNG SHOP LIÊN KẾT VỚI 2 BẢNG TRÊN ---
class Shop(BaseModel):
    __tablename__ = 'shop'
    shop_name = Column(String(100), nullable=False)
    address = Column(String(255))
    items = Column(Text) 
    price = Column(String(50)) 
    rating = Column(Float)
    lat = Column(Float)
    lon = Column(Float)
    
    # Thay cột String cũ bằng Khóa ngoại (ForeignKey)
    city_id = Column(Integer, ForeignKey('city.id'), nullable=False)
    category_id = Column(Integer, ForeignKey('category.id'), nullable=False)

    def __str__(self):
        return self.shop_name
        
    def to_dict(self):
        # --- XỬ LÝ AN TOÀN CHO PRICE ---
        try:
            real_price = float(self.price) if self.price else 0
        except ValueError:
            real_price = 0

        return {
            'id': self.id,
            'name': self.shop_name,
            'price': real_price,
            'address': self.address,
            'rating': self.rating,
            'items': self.items,
            'lat': self.lat,
            'lon': self.lon,
            'category': self.category_obj.name if self.category_obj else None, 
            'city': self.city_obj.name if self.city_obj else None
        }

class Comment(BaseModel):
    __tablename__ = 'comment'
    content = Column(String(255), nullable=False)
    created_date = Column(DateTime, default=datetime.now())
    
    shop_id = Column(Integer, ForeignKey('shop.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    
    rating = Column(Integer, default=0)
    image = Column(Text)
    
    user = relationship('User', backref='comments')
    shop = relationship('Shop', backref='comments')

    def __str__(self):
        return self.content
        
    def to_dict(self):
        return {
            'id': self.id,
            'content': self.content,
            'rating': self.rating,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else "Ẩn danh",
            'created_date': self.created_date.strftime("%Y-%m-%d %H:%M:%S"),
            'images': self.image.split(';') if self.image else []
        }
    
class TikTokVideo(BaseModel):
    __tablename__ = "tiktok_video"
    video_url = Column(String(255), nullable=False)
    embed_url = Column(String(255), nullable=False)
    description = Column(String(255))
    
    shop_id = Column(Integer, ForeignKey("shop.id"), nullable=False)
    shop = relationship("Shop", backref="videos")

class ChallengeSession(BaseModel):
    __tablename__ = "challenge_session"
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    target_shops = Column(Text, nullable=False) 
    current_step = Column(Integer, default=0) 
    status = Column(String(20), default="ACTIVE") 
    created_date = Column(DateTime, default=datetime.now)

    user = relationship("User", backref="challenge_sessions")

class Voucher(BaseModel):
    __tablename__ = 'voucher'
    code = Column(String(50), nullable=False, unique=True)
    description = Column(String(255), nullable=False)
    point_cost = Column(Integer, nullable=False)
    image_url = Column(String(255))
    
    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "point_cost": self.point_cost,
            "image_url": self.image_url
        }

class UserVoucher(BaseModel):
    __tablename__ = 'user_voucher'
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    voucher_id = Column(Integer, ForeignKey('voucher.id'), nullable=False)
    created_date = Column(DateTime, default=datetime.now)
    status = Column(String(20), default="UNUSED") 

    user = relationship("User", backref="owned_vouchers")
    voucher = relationship("Voucher")

# --- MỚI THÊM: BẢNG LỊCH SỬ CHAT ---
class ChatHistory(BaseModel):
    __tablename__ = 'chat_history'
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    role = Column(String(10), nullable=False) # 'user' hoặc 'model'
    message = Column(Text, nullable=False) # Nội dung tin nhắn
    created_date = Column(DateTime, default=datetime.now)

    user = relationship('User', backref='chat_history')

    def to_dict(self):
        return {
            'id': self.id,
            'role': self.role,
            'message': self.message,
            'created_date': self.created_date.strftime("%Y-%m-%d %H:%M:%S")
        }

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all() 
        db.create_all() # Chạy dòng này để tạo bảng ChatHistory mới
        print("Đã cập nhật cấu trúc bảng dữ liệu!")