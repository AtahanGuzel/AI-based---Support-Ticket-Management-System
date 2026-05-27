# AI-Based Support Ticket Management System

[cite_start]Bu proje, kurum içi BT destek süreçlerini otomatikleştirmek, veri güvenliğini sağlamak ve destek ekiplerinin performansını optimize etmek amacıyla geliştirilmiş, **Local LLM** destekli yapay zeka tabanlı bir bilet yönetim sistemidir[cite: 1, 9, 30].

## 🚀 Proje Hakkında
[cite_start]Geleneksel destek sistemlerinin aksine bu sistem; kullanıcıların sorunlarını doğal dilde iletmelerine olanak tanır, AI yardımıyla otomatik sınıflandırma yapar ve öncelik bazlı kuyruk yapısı ile kritik sorunlara hızlı müdahale sağlar[cite: 36, 38, 52, 62].

### Temel Özellikler
* [cite_start]**Local LLM Entegrasyonu:** Tüm veriler yerel ağda işlenerek veri sızıntısı riski ortadan kaldırılır[cite: 10, 29, 78].
* [cite_start]**Akıllı Önceliklendirme:** İlk gelen ilk hizmet (FIFO) yerine AI tarafından belirlenen aciliyet skoruna göre kuyruk yönetimi[cite: 24, 62].
* [cite_start]**Otomatik Bağlam Yakalama:** IP, cihaz bilgisi ve logların otomatik olarak biletle ilişkilendirilmesi[cite: 65].
* [cite_start]**Bilet Birleştirme:** Aynı sistem hataları için açılan benzer biletlerin otomatik tespiti ve birleştirilmesi[cite: 48, 66].
* [cite_start]**SLA Takibi:** Performans metriklerinin şeffaf raporlanması[cite: 12, 67, 81].

## 🛠 Teknik Mimari
Proje, yüksek performanslı ve modüler bir mimari ile geliştirilmiştir:
* **Backend:** FastAPI (Modern, asenkron ve hızlı API altyapısı).
* **Veritabanı:** PostgreSQL (SQLAlchemy ORM ile yönetilen ilişkisel veri yapısı).
* **Güvenlik:** OAuth2 & JWT tabanlı kimlik doğrulama, Rol Bazlı Erişim Kontrolü (RBAC).

## ⚙️ Kurulum

### Gereksinimler
* Python 3.10+
* PostgreSQL

### Adımlar
1.  **Projeyi Klonlayın:**
    ```bash
    git clone [REPO_LINKINIZ]
    cd AI-based-Support-Ticket-Management-System
    ```

2.  **Sanal Ortam Kurun:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

3.  **Bağımlılıkları Yükleyin:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Çevresel Değişkenleri Ayarlayın (.env):**
    ```text
    DATABASE_URL=postgresql://user:password@localhost/dbname
    SECRET_KEY=gizli_anahtariniz
    ```

5.  **Sunucuyu Başlatın:**
    ```bash
    uvicorn main:app --reload
    ```

## 📑 API Dokümantasyonu
Sistem çalışırken tüm API rotalarını ve detaylarını şu adresten inceleyebilirsiniz:
`http://127.0.0.1:8000/docs`

## 💡 İletişim & Geliştirici
* **Proje Sahibi:** Ahmet Yiğit Özer
* **Yeditepe Üniversitesi - Computer Systems Engineering**