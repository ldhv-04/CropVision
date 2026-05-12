# Kế Hoạch Triển Khai AI Chatbot Tư Vấn Bệnh Cây Trồng — Phiên Bản 2.0

> **Dựa trên:** Đánh giá plan V1 + Kiểm tra codebase thực tế
>
> **Tóm tắt:** Dự án đã có sẵn infrastructure chat generic (sessions, messages, 9Router proxy). Việc cần làm là **specialize** hệ thống này cho nông nghiệp, thêm **disease knowledge base**, và **tích hợp với inference flow**.

---

## 📊 Phân Tích Codebase Hiện Tại

### ✅ Đã Có Sẵn (KHÔNG cần xây lại)

| Component | File | Trạng Thái |
|-----------|------|------------|
| **Chat Sessions** | `chat_sessions` table | ✅ Hoạt động |
| **Chat Messages** | `chat_messages` table | ✅ Hoạt động (role, content, tokens) |
| **LLM Proxy** | `chatService.js` | ✅ 9Router integration |
| **REST API** | `chatController.js` + `chatRoutes.js` | ✅ CRUD sessions + send message |
| **Conversation History** | `buildMessagesPayload()` | ✅ Cap 50 messages |
| **Auth** | JWT middleware | ✅ User ownership verified |

### ❌ Thiếu (Cần Xây Mới)

| Component | Mô Tả | Ưu Tiên |
|-----------|-------|---------|
| **Disease Knowledge Base** | Bảng `crop_diseases` + seed data | CRITICAL |
| **Treatment Methods** | Bảng `treatment_methods` | CRITICAL |
| **Pesticide Database** | Bảng `pesticides` | HIGH |
| **RAG Context Injection** | Gửi disease info vào system prompt | CRITICAL |
| **Inference→Chat Bridge** | Gửi YOLO results vào chat context | CRITICAL |
| **ChatSidebar UI** | Component hiển thị chat trong inference page | HIGH |
| **System Prompt Specialization** | Prompt cho expert plant disease | HIGH |
| **Feedback System** | Rating + comment cho AI responses | MEDIUM |

---

## 🏗️ Kiến Trúc Đề Xuất (Thực Tế)

### Không cần Vector DB — Dùng Direct Lookup + LLM

**Lý do:** 
1. Disease knowledge base có thể nhỏ (100-500 entries) → Direct SQL query nhanh hơn RAG
2. YOLO đã cho `disease_class` chính xác → Không cần semantic search
3. Chỉ cần JOIN tables để lấy treatment info → Đơn giản, reliable, không hallucinate

```
┌─────────────────────────────────────────────────────────────────┐
│                 SIMPLIFIED ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Upload Image                                               │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────┐                                                │
│  │  YOLOv8      │──→ disease_class: "bacterial_spot"            │
│  │  Detection   │──→ confidence: 0.87                            │
│  └──────────────┘                                                │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │  Direct SQL Lookup (NO Vector DB needed) │                   │
│  │                                           │                   │
│  │  SELECT * FROM crop_diseases              │                   │
│  │  WHERE disease_class = 'bacterial_spot';  │                   │
│  │                                           │                   │
│  │  SELECT * FROM treatment_methods          │                   │
│  │  WHERE disease_id = ?;                    │                   │
│  │                                           │                   │
│  │  SELECT * FROM pesticides                 │                   │
│  │  WHERE disease_id = ?;                    │                   │
│  └──────────────────────────────────────────┘                   │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────────────────────────────────┐                   │
│  │  System Prompt + Context Injection        │                   │
│  │                                           │                   │
│  │  [System] Bạn là chuyên gia BVTV...      │                   │
│  │  [Context] Bệnh: bacterial_spot           │                   │
│  │           Triệu chứng: ...                │                   │
│  │           Điều trị: ...                   │                   │
│  │           Thuốc: ...                       │                   │
│  │  [User] "Bệnh này chữa thế nào?"         │                   │
│  └──────────────────────────────────────────┘                   │
│        │                                                         │
│        ▼                                                         │
│  ┌──────────────┐                                                │
│  │  9Router     │──→ AI Response (Vietnamese)                   │
│  │  (LLM)       │                                                │
│  └──────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tại sao không dùng Vector DB (RAG)?**
- YOLO đã cho `disease_class` chính xác → Direct SQL lookup nhanh hơn, rẻ hơn
- Knowledge base nhỏ (100-500 entries) → Không cần embedding
- Tránh hallucination → Info từ DB directly injected vào prompt
- Nếu sau này cần semantic search (user hỏi "cây lá vàng phải làm sao") → Có thể thêm RAG sau

---

## 📋 Database Schema (Cập Nhật)

### 3.1 Bảng `crop_diseases`

```sql
CREATE TABLE IF NOT EXISTS crop_diseases (
    id SERIAL PRIMARY KEY,
    disease_class VARCHAR(255) NOT NULL UNIQUE,  -- Match YOLO output
    disease_name_vi VARCHAR(255) NOT NULL,       -- Tên tiếng Việt
    disease_name_en VARCHAR(255),                -- Tên tiếng Anh
    crop_type VARCHAR(100),                      -- tomato, rice, corn...
    description TEXT,
    symptoms TEXT[],                             -- PostgreSQL array
    causes TEXT[],
    severity VARCHAR(20) DEFAULT 'moderate',     -- mild/moderate/severe
    image_url TEXT,                              -- Ảnh minh họa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crop_diseases_class ON crop_diseases(disease_class);
```

### 3.2 Bảng `treatment_methods`

```sql
CREATE TABLE IF NOT EXISTS treatment_methods (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES crop_diseases(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,            -- chemical/biological/cultural
    method_name VARCHAR(255) NOT NULL,
    description TEXT,
    application_guide TEXT,
    frequency VARCHAR(100),
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),  -- 1-5 stars
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treatment_disease ON treatment_methods(disease_id);
```

### 3.3 Bảng `pesticides`

```sql
CREATE TABLE IF NOT EXISTS pesticides (
    id SERIAL PRIMARY KEY,
    trade_name VARCHAR(255) NOT NULL,            -- Tên thương mại
    active_ingredient VARCHAR(255) NOT NULL,      -- Hoạt chất
    concentration VARCHAR(100),
    manufacturer VARCHAR(255),
    dosage VARCHAR(255),                         -- Liều lượng
    application_method TEXT,                      -- Cách dùng
    safety_precautions TEXT[],
    pre_harvest_interval INTEGER DEFAULT 0,      -- Ngày cách ly
    price_range VARCHAR(50),                     -- Thấp/Trung bình/Cao
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pivot table: thuốc trị bệnh nào
CREATE TABLE IF NOT EXISTS pesticide_disease_map (
    pesticide_id INTEGER NOT NULL REFERENCES pesticides(id) ON DELETE CASCADE,
    disease_id INTEGER NOT NULL REFERENCES crop_diseases(id) ON DELETE CASCADE,
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),
    PRIMARY KEY (pesticide_id, disease_id)
);

CREATE INDEX idx_pesticide_disease ON pesticide_disease_map(disease_id);
```

### 3.4 Cập nhật `chat_consultations` (Optional — cho analytics)

```sql
-- Thêm cột vào chat_messages thay vì tạo bảng mới
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS inference_id INTEGER REFERENCES crop_samples(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;  -- disease info, recommendations
```

---

## 📋 Implementation Phases (Cập Nhật)

### Phase 1: Database + Seed Data (1-2 ngày)

| Task | Mô Tả | Thời Gian |
|------|-------|-----------|
| 1.1 | Tạo migration `003-diseases.sql` với 3 bảng + pivot | 2 giờ |
| 1.2 | Seed 50+ bệnh phổ biến Việt Nam (tomato, rice, corn, pepper) | 4 giờ |
| 1.3 | Seed 100+ thuốc BVTV có sẵn tại VN | 4 giờ |
| 1.4 | Tạo `diseaseService.js` — lookup by disease_class | 2 giờ |

### Phase 2: Backend Integration (1-2 ngày)

| Task | Mô Tả | Thời Gian |
|------|-------|-----------|
| 2.1 | Tạo system prompt specialist trong `chatService.js` | 2 giờ |
| 2.2 | Thêm context injection: YOLO results → LLM prompt | 3 giờ |
| 2.3 | Tạo endpoint `POST /api/chat/consult` — inference-specific chat | 2 giờ |
| 2.4 | Thêm error handling: timeout, fallback, zero-hit | 2 giờ |

### Phase 3: Frontend (2-3 ngày)

| Task | Mô Tả | Thời Gian |
|------|-------|-----------|
| 3.1 | Tạo `ChatWidget.jsx` cho GridShell | 3 giờ |
| 3.2 | Tạo `ChatMessage.jsx` — message bubbles | 2 giờ |
| 3.3 | Tạo `TreatmentCard.jsx` — formatted treatment info | 2 giờ |
| 3.4 | Tạo `useChat.js` hook — connect to existing API | 2 giờ |
| 3.5 | Tích hợp vào inference layout (thay Results widget hoặc thêm mới) | 2 giờ |
| 3.6 | Auto-populate context từ inference results | 2 giờ |

### Phase 4: Testing + Polish (1 ngày)

| Task | Mô Tả | Thời Gian |
|------|-------|-----------|
| 4.1 | Unit tests cho diseaseService | 2 giờ |
| 4.2 | Integration test: inference → chat flow | 2 giờ |
| 4.3 | UI polish + responsive | 2 giờ |

**Tổng thời gian: 5-8 ngày** (thay vì 10-14 ngày của plan V1)

---

## 🔑 Key Design Decisions

### 1. Không dùng Vector DB / RAG
- **Lý do:** YOLO đã cho `disease_class` chính xác → Direct SQL lookup
- **Lợi ích:** Đơn giản, nhanh, rẻ, không hallucinate
- **Trade-off:** Không hỗ trợ semantic search ("cây lá vàng") — có thể thêm sau

### 2. On-demand Chat (không auto-trigger)
- **Lý do:** UX tốt hơn, tiết kiệm token
- **Cách làm:** Hiển thị nút "💬 Tư vấn điều trị" sau khi inference xong
- **Chỉ gọi LLM khi user click**

### 3. Reuse Existing Chat Infrastructure
- **KHÔNG tạo bảng mới** — dùng `chat_sessions` + `chat_messages` đã có
- **Chỉ thêm cột** `inference_id` + `metadata` vào `chat_messages`
- **Giữ nguyên API** — chỉ thêm 1 endpoint mới `/api/chat/consult`

### 4. System Prompt với Hard Guardrails
```
NHIỆM VỤ: Tư vấn bệnh cây trồng dựa trên kết quả YOLO detection.

BIỆN PHÁP AN TOÀN (code-level, không chỉ prompt):
1. Nếu disease_class không có trong DB → "Chưa có thông tin"
2. Nếu confidence < 0.4 → "Kết quả chưa đủ tin cậy"
3. Nếu user hỏi ngoài scope → "Tôi chỉ tư vấn bệnh cây trồng"
4. Luôn hiển thị disclaimer: "Tham khảo ý kiến chuyên gia BVTV"
```

---

## 📁 Files Cần Tạo/Sửa

### Mới:
```
backend/initdb/003-diseases.sql          -- Migration
backend/src/services/diseaseService.js   -- Disease lookup
backend/src/controllers/chatController.js (SỬA)  -- Thêm consult endpoint
```

### Sửa:
```
backend/src/services/chatService.js      -- Thêm system prompt + context injection
backend/initdb/002-chat.sql              -- ALTER TABLE cho inference_id + metadata
```

### Frontend Mới:
```
App/src/modules/@core/components/GridShell/widgets/ChatWidget.jsx
App/src/modules/chat/components/ChatMessage.jsx
App/src/modules/chat/components/TreatmentCard.jsx
App/src/modules/chat/hooks/useChat.js
App/src/modules/chat/services/chatService.js
```

### Config:
```
App/src/modules/@core/components/GridShell/layoutConfig.js  -- Thêm ChatWidget
```

---

## ✅ Checklist Before Implementation

- [ ] Confirm disease_class values from YOLO model (xem `ai_core/` classes)
- [ ] Confirm 9Router model supports Vietnamese well
- [ ] Decide: ChatWidget replaces Results widget hay thêm cột mới?
- [ ] Get seed data source (Cục BVTV Việt Nam, FAO, etc.)
- [ ] Confirm UI design with team (nếu có)

---

## 🎯 Kết Luận

Plan V2 này **thực tế hơn** vì:
1. **Dựa trên codebase thực tế** — không xây lại những gì đã có
2. **Đơn giản hơn** — không cần Vector DB, embedding, background jobs
3. **Nhanh hơn** — 5-8 ngày thay vì 10-14 ngày
4. **Dễ maintain** — Direct SQL lookup > RAG pipeline phức tạp
5. **Scale được** — Nếu sau này cần semantic search, có thể thêm RAG layer sau

**Sẵn sàng implement Phase 1 khi được approve.**
