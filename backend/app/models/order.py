from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, func, JSON
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class OrderStatus(str, enum.Enum):
    NEW = "new"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(String(100), nullable=False)
    price = Column(String(100), nullable=True)
    contact = Column(String(255), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.NEW, nullable=False)

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    files = Column(JSON, nullable=True, default=list)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="orders")
