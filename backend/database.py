from sqlalchemy import create_engine, Column, Float, String, DateTime, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

Base = declarative_base()

class StockPrice(Base):
    __tablename__ = "stock_prices"
    id = Column(Integer, primary_key=True)
    ticker = Column(String)
    date = Column(DateTime)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"
    id = Column(Integer, primary_key=True)
    ticker = Column(String)
    date = Column(DateTime)
    close = Column(Float)
    anomaly_score = Column(Float)
    is_anomaly = Column(Integer)

engine = create_engine("sqlite:///finsight.db")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)