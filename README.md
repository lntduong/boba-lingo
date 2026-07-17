<div align="center">
  <img src="public/icon-512x512.png" alt="Boba Lingo Logo" width="120" />

  # 🧋 Boba Lingo
  
  **Your Ultimate Taiwan Travel & Language Companion**
  
  <p align="center">
    Một ứng dụng học ngôn ngữ (Tiếng Trung Phồn Thể & Tiếng Anh) kết hợp tra từ điển từ vựng được thiết kế tối giản, hiện đại dành riêng cho du khách và du học sinh tại Đài Loan.
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Google Sheets API](https://img.shields.io/badge/Google_Sheets_API-34A853?style=flat&logo=google-sheets&logoColor=white)](https://developers.google.com/sheets/api)
</div>

---

## ✨ Tính năng nổi bật (Features)

*   **📚 Sổ tay Từ vựng (Vocabulary):** Quản lý và phân loại các mẫu câu giao tiếp theo chủ đề (Ví dụ: Sân bay, Mua sắm, Ăn uống).
*   **🧠 Chế độ Ôn tập (Flashcards):** Luyện tập trí nhớ với bộ thẻ lật trực quan, có tính năng phát âm và xáo trộn thẻ thông minh.
*   **📴 Chế độ Ngoại tuyến (Offline Mode):** Tự động lưu trữ (cache) dữ liệu vào trình duyệt. Yên tâm tra cứu từ vựng ngay cả khi bạn đang trên máy bay hay dưới ga tàu điện ngầm không có mạng.
*   **⭐ Đánh dấu Yêu thích (Bookmarks):** Lưu ngay những câu giao tiếp khẩn cấp để truy cập nhanh chóng.
*   **📋 Sao chép Nhanh (1-Click Copy):** Dễ dàng copy đoạn tiếng Trung để gửi qua Zalo, Line hoặc đưa cho tài xế taxi đọc.
*   **🗣 Phát âm Chuẩn (Text-to-Speech):** Tích hợp giọng đọc bản xứ (zh-TW và en-US) giúp bạn luyện nghe và phát âm chuẩn xác.
*   **🌍 Dịch thuật Thông minh:** Tự động dịch từ tiếng Việt sang tiếng Trung (Phồn thể) kèm phiên âm Pinyin và tiếng Anh dự phòng.

## 🛠 Công nghệ sử dụng (Tech Stack)

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Ngôn ngữ:** [TypeScript](https://www.typescriptlang.org/)
*   **Giao diện:** [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), Lucide Icons
*   **Cơ sở dữ liệu:** Google Sheets (via `google-spreadsheet` package)
*   **Dịch thuật & Phiên âm:** `translate-google`, `pinyin-pro`

## 🚀 Hướng dẫn cài đặt (Getting Started)

### 1. Clone repository
```bash
git clone https://github.com/lntduong/boba-lingo.git
cd boba-lingo
```

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` ở thư mục gốc của dự án và điền các thông tin xác thực Google Service Account để kết nối với Google Sheets:

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL="your-service-account-email@your-project-id.iam.gserviceaccount.com"
SPREADSHEET_ID="your-google-spreadsheet-id"
```

### 4. Chạy dự án
```bash
npm run dev
```
Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000) (Mã PIN đăng nhập mặc định: 1712)

## 📱 Hình ảnh Giao diện (Screenshots)

*(Thêm hình ảnh giao diện ứng dụng tại đây)*

---
**Phát triển bởi [lntduong](https://github.com/lntduong)** 💖
