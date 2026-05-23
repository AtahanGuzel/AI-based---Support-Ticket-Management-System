from flask import Flask, request, jsonify
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Veritabanı bağlantısı
engine = create_engine(os.getenv("DATABASE_URL"))
Base = declarative_base()

# Tablo Modeli
class Mesaj(Base):
    __tablename__ = 'mesajlar'
    id = Column(Integer, primary_key=True)
    gonderen = Column(String)
    icerik = Column(String)
    tarih = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(engine)

def mesaj_kaydet(kullanici, mesaj_text):
    Session = sessionmaker(bind=engine)
    session = Session()
    yeni_mesaj = Mesaj(gonderen=kullanici, icerik=mesaj_text)
    session.add(yeni_mesaj)
    session.commit()
    session.close()
    return "Mesaj kaydedildi!"

@app.route('/test-kayit', methods=['GET'])
def test_kayit():
    mesaj_kaydet("Ahmet", "Bu bir deneme mesajıdır")
    return "Veritabanına deneme mesajı eklendi!"

@app.route('/gonder', methods=['POST'])
def gonder():
    data = request.json
    sonuc = mesaj_kaydet(data.get('gonderen'), data.get('icerik'))
    return jsonify({"durum": "başarılı", "mesaj": sonuc})

if __name__ == '__main__':
    app.run(debug=True)