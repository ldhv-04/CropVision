-- Disease Knowledge Base for CropVision AI Chatbot
-- Migration 003: Adds crop_diseases, treatment_methods, pesticides tables

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. BẢNG BỆNH CÂY TRỒNG
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS crop_diseases (
    id SERIAL PRIMARY KEY,
    disease_class VARCHAR(255) NOT NULL UNIQUE,  -- Match YOLO output (e.g., "Tomato___Bacterial_spot")
    disease_name_vi VARCHAR(255) NOT NULL,       -- Tên tiếng Việt
    disease_name_en VARCHAR(255),                -- Tên tiếng Anh
    crop_type VARCHAR(100),                      -- tomato, rice, corn, pepper, potato
    description TEXT,
    symptoms TEXT[],                             -- PostgreSQL array
    causes TEXT[],
    severity VARCHAR(20) DEFAULT 'moderate',     -- mild/moderate/severe
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crop_diseases_class ON crop_diseases(disease_class);
CREATE INDEX IF NOT EXISTS idx_crop_diseases_crop ON crop_diseases(crop_type);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. BẢNG PHƯƠNG PHÁP ĐIỀU TRỊ
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS treatment_methods (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES crop_diseases(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,            -- chemical/biological/cultural
    method_name VARCHAR(255) NOT NULL,
    description TEXT,
    application_guide TEXT,
    frequency VARCHAR(100),
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_treatment_disease ON treatment_methods(disease_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. BẢNG THUỐC BVTV
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS pesticides (
    id SERIAL PRIMARY KEY,
    trade_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255) NOT NULL,
    concentration VARCHAR(100),
    manufacturer VARCHAR(255),
    dosage VARCHAR(255),
    application_method TEXT,
    safety_precautions TEXT[],
    pre_harvest_interval INTEGER DEFAULT 0,
    price_range VARCHAR(50),
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

CREATE INDEX IF NOT EXISTS idx_pesticide_disease ON pesticide_disease_map(disease_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. SEED DATA — BỆNH CÂY CÀ CHUA (Tomato)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity) VALUES
-- Healthy
('Tomato___Healthy', 'Cà chua khỏe mạnh', 'Tomato Healthy', 'tomato', 
 'Cây cà chua phát triển bình thường, không có dấu hiệu bệnh.', 
 ARRAY['Lá xanh đậm', 'Hoa nở đều', 'Quả phát triển tốt'], 
 ARRAY['Điều kiện trồng trọt tốt'], 'mild'),

-- Bacterial Spot
('Tomato___Bacterial_spot', 'Bacterial spot — Cháy lá vi khuẩn', 'Bacterial Spot', 'tomato',
 'Bệnh do vi khuẩn Xanthomonas campestris gây ra, tấn công lá, thân và quả cà chua.',
 ARRAY['Đốm nâu đen nhỏ trên lá', 'Đốm có viền vàng', 'Lá vàng và rụng', 'Quả có đốm nổi'],
 ARRAY['Vi khuẩn Xanthomonas', 'Lây lan qua nước mưa', 'Bảo quản hạt giống kém'],
 'moderate'),

-- Early Blight
('Tomato___Early_blight', 'Early blight — Cháy lá sớm', 'Early Blight', 'tomato',
 'Bệnh nấm Alternaria solani gây cháy lá sớm, thường xuất hiện ở lá dưới trước.',
 ARRAY['Đốm nâu tròn có tâm đen', 'Vàng lá từ dưới lên', 'Thối quả'],
 ARRAY['Nấm Alternaria solani', 'Độ ẩm cao', 'Thiếu dinh dưỡng'],
 'moderate'),

-- Late Blight
('Tomato___Late_blight', 'Late blight — Cháy lá muộn', 'Late Blight', 'tomato',
 'Bệnh nấm Phytophthora infestans gây cháy lá muộn, rất nguy hiểm, có thể phá hủy toàn bộ vụ mùa.',
 ARRAY['Đốm nâu xanh đậm trên lá', 'Mùi hôi thối', 'Thối quả nhanh', 'Cây chết hàng loạt'],
 ARRAY['Nấm Phytophthora infestans', 'Thời tiết lạnh ẩm', 'Mưa nhiều'],
 'severe'),

-- Leaf Mold
('Tomato___Leaf_Mold', 'Nấm mốc lá', 'Leaf Mold', 'tomato',
 'Bệnh nấm Fulvia fulva gây mốc lá, thường gặp trong nhà kính.',
 ARRAY['Vàng lá trên', 'Mốc xanh nâu dưới lá', 'Lá cuộn lại'],
 ARRAY['Nấm Fulvia fulva', 'Độ ẩm cao', 'Thông khí kém'],
 'mild'),

-- Septoria Leaf Spot
('Tomato___Septoria_leaf_spot', 'Septoria — Đốm lá Septoria', 'Septoria Leaf Spot', 'tomato',
 'Bệnh nấm Septoria lycopersici gây đốm lá nhỏ, lan rộng.',
 ARRAY['Đốm tròn nhỏ màu xám', 'Viền đen', 'Lá vàng và rụng'],
 ARRAY['Nấm Septoria lycopersici', 'Mưa nhiều', 'Cây mọc dày'],
 'moderate'),

-- Spider Mites
('Tomato___Spider_mites', 'Nhện đỏ', 'Spider Mites', 'tomato',
 'Nhện đỏ (Tetranychus urticae) hút nhựa cây, gây vàng lá.',
 ARRAY['Lá vàng đốm', 'Tơ nhện dưới lá', 'Lá khô và rụng'],
 ARRAY['Nhện đỏ Tetranychus urticae', 'Khô nóng', 'Thiếu thiên địch'],
 'mild'),

-- Target Spot
('Tomato___Target_Spot', 'Đốm lá hình bia', 'Target Spot', 'tomato',
 'Bệnh nấm Corynespora cassiicola gây đốm lá hình tròn concentric.',
 ARRAY['Đốm nâu hình tròn同心', 'Lá vàng và chết', 'Thân có đốm'],
 ARRAY['Nấm Corynespora cassiicola', 'Độ ẩm cao', 'Thông khí kém'],
 'moderate'),

-- Yellow Leaf Curl Virus
('Tomato___Yellow_Leaf_Curl_Virus', 'Virus cuộn lá vàng', 'Yellow Leaf Curl Virus', 'tomato',
 'Bệnh virus TYLCV lây truyền bởi rệp phấn trắng, gây cuộn lá và chậm phát triển.',
 ARRAY['Lá cuộn lên', 'Vàng lá', 'Cây còi cọc', 'Ít quả'],
 ARRAY['Virus TYLCV', 'Rệp phấn trắng truyền bệnh', 'Gieo trồng mùa vụ muộn'],
 'severe'),

-- Mosaic Virus
('Tomato___Tomato_mosaic_virus', 'Virus khảm cà chua', 'Tomato Mosaic Virus', 'tomato',
 'Bệnh virus ToMV gây khảm lá, lây lan qua tiếp xúc.',
 ARRAY['Lá khảm xanh vàng', 'Lá cuộn', 'Quả có đốm', 'Cây phát triển kém'],
 ARRAY['Virus ToMV', 'Lây qua tay, dụng cụ', 'Hạt giống nhiễm bệnh'],
 'moderate');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SEED DATA — BỆNH CÂY TIÊU (Pepper)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity) VALUES
('Pepper__bell___Bacterial_spot', 'Bacterial spot — Ớt bacterial spot', 'Bacterial Spot', 'pepper',
 'Bệnh vi khuẩn trên ớt, gây đốm trên lá và quả.',
 ARRAY['Đốm nâu nhỏ trên lá', 'Quả có đốm nổi', 'Lá vàng rụng'],
 ARRAY['Vi khuẩn Xanthomonas', 'Mưa nhiều', 'Hạt giống nhiễm'],
 'moderate'),

('Pepper__bell___healthy', 'Ớt khỏe mạnh', 'Pepper Healthy', 'pepper',
 'Cây ớt phát triển bình thường.',
 ARRAY['Lá xanh', 'Quả chắc', 'Không có đốm'],
 ARRAY['Điều kiện tốt'], 'mild');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. SEED DATA — PHƯƠNG PHÁP ĐIỀU TRỊ
-- ═══════════════════════════════════════════════════════════════════════════════

-- Treatment cho Bacterial Spot (Tomato)
INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness) VALUES
((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot'), 
 'chemical', 'Phun đồng (Copper-based)', 
 'Sử dụng thuốc đồng để kiểm soát vi khuẩn. Hiệu quả cao khi phun sớm.',
 'Phun 1-2 lần/tuần, phun vào buổi sáng sớm. Phun đều cả 2 mặt lá.',
 '1-2 lần/tuần', 4),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot'), 
 'cultural', 'Xoay vụ + làm sạch vườn',
 'Thay đổi vị trí trồng hàng năm, loại bỏ cây bệnh, vệ sinh dụng cụ.',
 'Gieo trồng cách cây cũ ít nhất 200m. Khử trùng dụng cụ sau mỗi vụ.',
 'Mỗi vụ', 3),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot'), 
 'biological', 'Sử dụng chế phẩm sinh học',
 'Sử dụng Bacillus subtilis hoặc Pseudomonas fluorescens để ức chế vi khuẩn.',
 'Phun chế phẩm sinh học theo hướng dẫn nhà sản xuất.',
 '1 lần/tuần', 3);

-- Treatment cho Late Blight (Tomato) — NGUY HIỂM
INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness) VALUES
((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight'), 
 'chemical', 'Phun Mancozeb + Metalaxyl',
 'Kết hợp thuốc bảo vệ thực vật có chứa Mancozeb và Metalaxyl để kiểm soát nấm Phytophthora.',
 'Phun ngay khi phát hiện triệu chứng. Phun 5-7 ngày/lần. Luôn đeo đồ bảo hộ.',
 '5-7 ngày/lần', 5),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight'), 
 'cultural', 'Loại bỏ cây bệnh + thông khí',
 'Cắt bỏ ngay phần cây bị bệnh, tăng khoảng cách trồng, đảm bảo thông khí.',
 'Cắt bỏ và đốt cây bệnh. Trồng thưa, tỉa cành, làm cỏ regularly.',
 'Liên tục', 4),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight'), 
 'biological', 'Trichoderma + Bacillus',
 'Sử dụng nấm Trichoderma và vi khuẩn Bacillus để cạnh tranh với Phytophthora.',
 'Bón phân hữu cơ có Trichoderma, phun Bacillus subtilis định kỳ.',
 '2 tuần/lần', 3);

-- Treatment cho Early Blight (Tomato)
INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness) VALUES
((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Early_blight'), 
 'chemical', 'Phun Chlorothalonil',
 'Sử dụng thuốc có chứa Chlorothalonil để phòng trừ nấm Alternaria.',
 'Phun khi thấy đốm đầu tiên. Phun 7-10 ngày/lần.',
 '7-10 ngày/lần', 4),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Early_blight'), 
 'cultural', 'Bón phân cân đối + làm sạch',
 'Bón phân kali đầy đủ, loại bỏ lá bệnh, tưới gốc thay vì phun.',
 'Bón KCl 30kg/ha. Tưới nhỏ giọt thay vì tưới phun.',
 'Theo mùa vụ', 3);

-- Treatment cho Yellow Leaf Curl Virus (Tomato) — NGUY HIỂM
INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness) VALUES
((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus'), 
 'cultural', 'Diệt rệp phấn trắng + lưới chắn',
 'Kiểm soát rệp phấn trắng — vector truyền bệnh. Sử dụng lưới chống côn trùng.',
 'Lắp lưới 50 mesh quanh nhà kính. Phun thuốc trừ rệp khi cần thiết.',
 'Liên tục', 4),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus'), 
 'biological', 'Sử dụng thiên địch',
 'Thả bọ rùa và ong ký sinh để kiểm soát rệp phấn trắng tự nhiên.',
 'Thả Chrysoperla carnea hoặc Encarsia formosa theo hướng dẫn.',
 'Theo tuần', 3),

((SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus'), 
 'cultural', 'Chọn giống kháng bệnh',
 'Sử dụng giống cà chua có gen kháng TYLCV (ví dụ: các giống F1 kháng virus).',
 'Mua giống từ nhà cung cấp uy tín, kiểm tra ghi chú "kháng TYLCV".',
 'Mỗi vụ', 5);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. SEED DATA — THUỐC BVTV (Việt Nam)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO pesticides (trade_name, active_ingredient, concentration, manufacturer, dosage, application_method, safety_precautions, pre_harvest_interval, price_range) VALUES
-- Thuốc đồng
('Boocil 50WP', 'Copper hydroxide', '50WP', 'Bayer', 
 '30-40g/20 lít nước', 'Phun đều lá, tránh phun khi trời nắng gắt',
 ARRAY['Đeo găng tay cao su', 'Mặc áo bảo hộ', 'Rửa tay sau khi dùng'], 
 3, 'Trung bình'),

-- Mancozeb
('Dithane M-45 80WP', 'Mancozeb', '80WP', 'Corteva',
 '30-40g/20 lít nước', 'Phun khi trời khô ráo, tránh mưa trong 4 giờ',
 ARRAY['Đeo găng tay', 'Mặt nạ phòng độc', 'Không ăn uống khi phun'],
 7, 'Rẻ'),

-- Metalaxyl + Mancozeb
('Ridomil Gold 68WP', 'Metalaxyl + Mancozeb', '68WP', 'Syngenta',
 '20-25g/20 lít nước', 'Phun gốc hoặc phun lá, 7-10 ngày/lần',
 ARRAY['Đeo găng tay', 'Kính bảo hộ', 'Tránh tiếp xúc da'],
 14, 'Cao'),

-- Chlorothalonil
('Daconil 75WP', 'Chlorothalonil', '75WP', 'Syngenta',
 '25-30g/20 lít nước', 'Phun khi trời mát, 7-10 ngày/lần',
 ARRAY['Đeo găng tay', 'Mặt nạ', 'Áo bảo hộ'],
 7, 'Trung bình'),

-- Thuốc trừ rệp
('Confidor 200SL', 'Imidacloprid', '200SL', 'Bayer',
 '2-3ml/20 lít nước', 'Phun khi thấy rệp, tránh phun khi có ong thụ phấn',
 ARRAY['Đeo găng tay', 'Mặt nạ', 'Tránh ao cá', 'Cách ly 3 ngày'],
 14, 'Trung bình'),

-- Thuốc trừ rệp (khác)
('Actara 25WG', 'Thiamethoxam', '25WG', 'Syngenta',
 '3-5g/20 lít nước', 'Phun lá hoặc tưới gốc, hiệu quả 15-20 ngày',
 ARRAY['Đeo găng tay', 'Mặt nạ', 'Không phun khi có ong'],
 14, 'Cao'),

-- Trichoderma (sinh học)
('Trichoderma Harzianum', 'Trichoderma harzianum', 'SP', 'Nông nghiệp sinh học',
 '5g/20 lít nước', 'Phun đất và lá, 2 tuần/lần, phun lúc chiều mát',
 ARRAY['Bảo quản nơi khô mát', 'Không dùng chung với thuốc trừ nấm'],
 0, 'Rẻ'),

-- Bacillus subtilis (sinh học)
('Bacsub 1000WP', 'Bacillus subtilis', '1000WP', 'Công nghệ sinh học',
 '10-15g/20 lít nước', 'Phun lá khi trời mát, 7-10 ngày/lần',
 ARRAY['Bảo quản nơi mát', 'Dùng ngay sau khi pha'],
 0, 'Trung bình');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. SEED DATA — PIVOT TABLE (Thuốc trị bệnh)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Bacterial Spot được trị bởi Boocil (đồng)
INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness) VALUES
((SELECT id FROM pesticides WHERE trade_name = 'Boocil 50WP'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot'), 4),

-- Late Blight được trị bởi Ridomil Gold
((SELECT id FROM pesticides WHERE trade_name = 'Ridomil Gold 68WP'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight'), 5),

-- Late Blight được trị bởi Dithane M-45
((SELECT id FROM pesticides WHERE trade_name = 'Dithane M-45 80WP'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight'), 4),

-- Early Blight được trị bởi Daconil
((SELECT id FROM pesticides WHERE trade_name = 'Daconil 75WP'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Early_blight'), 4),

-- Yellow Leaf Curl Virus — Confidor trị rệp (vector)
((SELECT id FROM pesticides WHERE trade_name = 'Confidor 200SL'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus'), 4),

-- Yellow Leaf Curl Virus — Actara trị rệp
((SELECT id FROM pesticides WHERE trade_name = 'Actara 25WG'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus'), 4),

-- Leaf Mold — Trichoderma sinh học
((SELECT id FROM pesticides WHERE trade_name = 'Trichoderma Harzianum'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Leaf_Mold'), 3),

-- Septoria — Bacillus sinh học
((SELECT id FROM pesticides WHERE trade_name = 'Bacsub 1000WP'),
 (SELECT id FROM crop_diseases WHERE disease_class = 'Tomato___Septoria_leaf_spot'), 3);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. CẬP NHẬT chat_messages — Thêm inference_id + metadata
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS inference_id INTEGER REFERENCES crop_samples(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. VIEW — Disease Summary (dễ query cho chatbot)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW disease_summary AS
SELECT 
    d.id,
    d.disease_class,
    d.disease_name_vi,
    d.crop_type,
    d.severity,
    d.description,
    d.symptoms,
    COALESCE(
        json_agg(
            json_build_object(
                'method_type', t.method_type,
                'method_name', t.method_name,
                'effectiveness', t.effectiveness
            )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
    ) AS treatments,
    COALESCE(
        json_agg(
            json_build_object(
                'trade_name', p.trade_name,
                'active_ingredient', p.active_ingredient,
                'dosage', p.dosage,
                'pre_harvest_interval', p.pre_harvest_interval
            )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'
    ) AS pesticides
FROM crop_diseases d
LEFT JOIN treatment_methods t ON t.disease_id = d.id
LEFT JOIN pesticide_disease_map pdm ON pdm.disease_id = d.id
LEFT JOIN pesticides p ON p.id = pdm.pesticide_id
GROUP BY d.id, d.disease_class, d.disease_name_vi, d.crop_type, d.severity, d.description, d.symptoms;
