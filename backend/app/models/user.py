from sqlalchemy import Column, String, Boolean, DateTime, Enum, func
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    CUSTOMER = "customer"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    # Agreements consent flags
    terms_accepted = Column(Boolean, default=True, nullable=False)
    terms_accepted_at = Column(DateTime, server_default=func.now())
    privacy_accepted = Column(Boolean, default=True, nullable=False)
    privacy_accepted_at = Column(DateTime, server_default=func.now())
    consent_accepted = Column(Boolean, default=True, nullable=False)
    consent_accepted_at = Column(DateTime, server_default=func.now())

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
