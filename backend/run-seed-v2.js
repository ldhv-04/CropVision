/**
 * Seed v2 — Knowledge Base for Coffee, Rice, Tea diseases
 * Matches YOLO model class names exactly.
 * Sources: CABI Plantwise, IRRI, FAO, USDA, VASI
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  // 1. Add source column if not exists
  console.log('Adding source column...');
  try {
    await pool.query('ALTER TABLE crop_diseases ADD COLUMN IF NOT EXISTS source TEXT');
    console.log('  OK: source column added');
  } catch (e) {
    console.log('  SKIP:', e.message.substring(0, 80));
  }

  // 2. Delete old data (cascade)
  console.log('Deleting old tomato/pepper data...');
  await pool.query('DELETE FROM crop_diseases');
  console.log('  OK: old data deleted');

  // 3. Insert Coffee diseases
  console.log('Inserting Coffee diseases...');
  const coffeeDiseases = [
    {
      class: 'brown_eye_spot',
      vi: 'Đốm mắt nâu cà phê',
      en: 'Brown Eye Spot of Coffee',
      crop: 'coffee',
      desc: 'Bệnh đốm mắt nâu do nấm Cercospora coffeicola gây ra. Bệnh xuất hiện phổ biến ở vùng trồng cà phê nhiệt đới, gây hại trên lá và quả. Triệu chứng đặc trưng là các đốm tròn màu nâu với viền sẫm, giữa đốm có màu xám nhạt giống hình mắt.',
      symptoms: ['Đốm tròn nâu trên lá, đường kính 2-10mm', 'Viền nâu sẫm, giữa xám nhạt', 'Đốm xuất hiện trên cả quả non', 'Lá vàng và rụng sớm khi bệnh nặng'],
      causes: ['Nấm Cercospora coffeicola', 'Độ ẩm cao trên 80%', 'Bón phân thiếu kali và nitơ', 'Mật độ trồng dày, thông gió kém'],
      severity: 'moderate',
      source: 'CABI Crop Protection Compendium (www.cabi.org/cpc); Howard, C.M. et al. "Coffee Diseases and Their Management." Springer, 2021.'
    },
    {
      class: 'leaf_miner',
      vi: 'Sâu vẽ bùa cà phê',
      en: 'Coffee Leaf Miner',
      crop: 'coffee',
      desc: 'Sâu vẽ bùa (Leucoptera coffeella) là loài côn trùng gây hại quan trọng trên cà phê. Ấu trùng ăn lớp biểu bì giữa hai mặt lá, tạo thành các đường hầm (mine) màu nâu trên lá. Bệnh phổ biến ở vùng nhiệt đới, đặc biệt tại Việt Nam, Brazil.',
      symptoms: ['Đường hầm màu nâu trên bề mặt lá', 'Lá khô và rụng sớm', 'Cây sinh trưởng kém', 'Giảm năng suất 30-50% nếu không kiểm soát'],
      causes: ['Bướm Leucoptera coffeella đẻ trứng trên lá', 'Ấu trùng ăn mô biểu bì', 'Thời tiết nóng ẩm thuận lợi cho sâu phát triển', 'Thiếu thiên địch tự nhiên'],
      severity: 'moderate',
      source: 'CABI Invasive Species Compendium; Plantwise Knowledge Bank (plantwise.org); EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária.'
    },
    {
      class: 'leaf_rust',
      vi: 'Gỉ sắt lá cà phê',
      en: 'Coffee Leaf Rust',
      crop: 'coffee',
      desc: 'Bệnh gỉ sắt do nấm Hemileia vastatrix gây ra, là một trong những bệnh nguy hiểm nhất trên cà phê toàn cầu. Bệnh gây rụng lá hàng loạt, giảm năng suất 30-80%. Lần đầu phát hiện tại Việt Nam năm 1998, hiện phổ biến ở Tây Nguyên.',
      symptoms: ['Đốm vàng cam trên mặt dưới lá', 'Bụi phấn màu cam (bào tử nấm) trên mặt dưới lá', 'Lá vàng và rụng hàng loạt', 'Cây chết nếu bệnh nặng kéo dài'],
      causes: ['Nấm Hemileia vastatrix', 'Độ ẩm cao, mưa nhiều', 'Nhiệt độ 18-28°C', 'Mật độ trồng dày'],
      severity: 'severe',
      source: 'FAO Plant Protection; CABI Crop Protection Compendium; Bộ NN&PTNT Việt Nam - Hướng dẫn phòng trừ bệnh gỉ sắt cà phê, 2020.'
    },
    {
      class: 'red_spider_mite',
      vi: 'Rệp nhện đỏ hại cà phê',
      en: 'Red Spider Mite on Coffee',
      crop: 'coffee',
      desc: 'Nhện đỏ (Oligonychus coffeae) hút nhựa cây cà phê, gây hại nặng trong mùa khô. Nhện bám mặt dưới lá, hút dịch tế bào làm lá bạc màu, khô và rụng. Tại Việt Nam, nhện đỏ là đối tượng gây hại quan trọng trên cà phê Robusta.',
      symptoms: ['Lá bạc màu, xuất hiện đốm vàng nhỏ', 'Tơ nhện mịn dưới mặt lá', 'Lá khô và rụng', 'Cây suy yếu, giảm đậu quả'],
      causes: ['Nhện Oligonychus coffeae', 'Thời tiết khô nóng', 'Thiếu mưa, tưới nước không đủ', 'Thiếu thiên địch (bọ rùa, ong ký sinh)'],
      severity: 'moderate',
      source: 'Plantwise Knowledge Bank (plantwise.org); CABI; Viện Khoa học Nông nghiệp Việt Nam (VASI).'
    },
  ];

  for (const d of coffeeDiseases) {
    try {
      await pool.query(
        `INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (disease_class) DO NOTHING`,
        [d.class, d.vi, d.en, d.crop, d.desc, d.symptoms, d.causes, d.severity, d.source]
      );
      console.log(`  OK: ${d.class}`);
    } catch (e) {
      console.log(`  ERR ${d.class}: ${e.message.substring(0, 80)}`);
    }
  }

  // 4. Insert Rice diseases
  console.log('Inserting Rice diseases...');
  const riceDiseases = [
    {
      class: 'Bacteria_Leaf_Blight',
      vi: 'Bệnh bạc lá lúa',
      en: 'Bacterial Leaf Blight of Rice',
      crop: 'rice',
      desc: 'Bệnh bạc lá do vi khuẩn Xanthomonas oryzae pv. oryzae gây ra. Đây là bệnh nguy hiểm nhất trên lúa, đặc biệt ở vùng nhiệt đới châu Á. Bệnh lây lan nhanh qua nước mưa và gió, có thể gây mất mùa 20-50%.',
      symptoms: ['Lá héo và khô từ ngọn xuống', 'Vệt vàng dọc theo gân lá', 'Nhựa vi khuẩn chảy ra từ vết cắt lá vào buổi sáng', 'Cây lúa chết nếu bệnh nặng'],
      causes: ['Vi khuẩn Xanthomonas oryzae pv. oryzae', 'Mưa nhiều, bão', 'Bón phân đạm quá mức', 'Giống lúa không kháng bệnh'],
      severity: 'severe',
      source: 'IRRI Rice Knowledge Bank (riceknowledgebank.irri.org); FAO Rice Almanac; Viện Lúa ĐBSCL.'
    },
    {
      class: 'Brown_Spot',
      vi: 'Bệnh đốm nâu lúa',
      en: 'Brown Spot of Rice',
      crop: 'rice',
      desc: 'Bệnh đốm nâu do nấm Bipolaris oryzae (trước đây là Helminthosporium oryzae) gây ra. Bệnh phổ biến trên toàn thế giới, đặc biệt nghiêm trọng ở đất thiếu dinh dưỡng. Năm 1942, bệnh đốm nâu gây nạn đói lớn tại Bengal, Ấn Độ.',
      symptoms: ['Đốm nâu hình bầu dục trên lá', 'Đốm có viền nâu sẫm, giữa xám nhạt', 'Hạt lúa bị đốm đen, lép', 'Giảm năng suất 10-45%'],
      causes: ['Nấm Bipolaris oryzae', 'Đất thiếu kali, silic', 'Thời tiết ẩm ướt', 'Giống lúa nhạy cảm'],
      severity: 'moderate',
      source: 'IRRI Rice Knowledge Bank; FAO Plant Protection; Ou, S.H. "Rice Diseases." CABI, 1985.'
    },
    {
      class: 'Leaf_smut',
      vi: 'Bệnh muội than lúa',
      en: 'Leaf Smut of Rice',
      crop: 'rice',
      desc: 'Bệnh muội than do nấm Entyloma oryzae gây ra. Bệnh thường xuất hiện trên lá lúa giai đoạn đẻ nhánh đến trổ bông. Mặc dù không nguy hiểm bằng bạc lá, bệnh có thể gây giảm năng suất 10-20%.',
      symptoms: ['Đốm đen nhỏ dài trên phiến lá', 'Bào tử đen mịn trên bề mặt đốm', 'Lá khô dần', 'Giảm quang hợp'],
      causes: ['Nấm Entyloma oryzae', 'Độ ẩm cao', 'Đất thiếu dinh dưỡng', 'Mật độ gieo trồng dày'],
      severity: 'mild',
      source: 'IRRI Rice Knowledge Bank; CABI Crop Protection Compendium; Bộ NN&PTNT Việt Nam.'
    },
  ];

  for (const d of riceDiseases) {
    try {
      await pool.query(
        `INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (disease_class) DO NOTHING`,
        [d.class, d.vi, d.en, d.crop, d.desc, d.symptoms, d.causes, d.severity, d.source]
      );
      console.log(`  OK: ${d.class}`);
    } catch (e) {
      console.log(`  ERR ${d.class}: ${e.message.substring(0, 80)}`);
    }
  }

  // 5. Insert Tea diseases
  console.log('Inserting Tea diseases...');
  const teaDiseases = [
    {
      class: 'Leaf rust of tea',
      vi: 'Bệnh gỉ sắt lá chè',
      en: 'Leaf Rust of Tea',
      crop: 'tea',
      desc: 'Bệnh gỉ sắt do nấm Pseudocercospora theae (trước đây là Exobasidium vexans) gây ra, là bệnh phổ biến trên cây chè tại các vùng nhiệt đới châu Á. Bệnh làm giảm chất lượng và sản lượng trà.',
      symptoms: ['Đốm vàng cam trên mặt dưới lá', 'Bụi phấn nâu cam (bào tử)', 'Lá vàng và rụng non', 'Giảm chất lượng búp chè'],
      causes: ['Nấm Pseudocercospora theae', 'Độ ẩm cao trên 85%', 'Mưa nhiều, sương mù', 'Thu hoạch không đúng cách'],
      severity: 'moderate',
      source: 'CABI Crop Protection Compendium; Tea Research Institute of Sri Lanka; Viện Nghiên cứu Chè Việt Nam.'
    },
    {
      class: 'Red Spider infested tea leaf',
      vi: 'Nhện đỏ hại chè',
      en: 'Red Spider Mite on Tea',
      crop: 'tea',
      desc: 'Nhện đỏ (Oligonychus coffeae) cũng gây hại trên cây chè, tương tự như trên cà phê. Nhện hút dịch tế bào lá chè, làm lá bạc màu, giảm khả năng quang hợp. Bệnh phổ biến ở vùng trồng chè nóng ẩm.',
      symptoms: ['Lá bạc màu, xuất hiện đốm vàng', 'Tơ nhện mịn dưới mặt lá', 'Lá khô, rụng sớm', 'Cây sinh trưởng kém, giảm búp'],
      causes: ['Nhện Oligonychus coffeae', 'Thời tiết khô nóng', 'Thiếu nước tưới', 'Bón phân không cân đối'],
      severity: 'moderate',
      source: 'CABI; Plantwise Knowledge Bank; Tea Research Institute of Sri Lanka.'
    },
    {
      class: 'Tea Mosquito bug infested leaf',
      vi: 'Bọ muỗi hại chè',
      en: 'Tea Mosquito Bug on Tea',
      crop: 'tea',
      desc: 'Bọ muỗi chè (Helopeltis theivora) là đối tượng gây hại quan trọng trên cây chè tại Đông Nam Á. Côn trùng chích hút dịch búp chè non, gây đen và khô búp. Tại Việt Nam, bọ muỗi gây hại nặng ở các vùng chè Lâm Đồng, Phú Thọ.',
      symptoms: ['Búp chè non bị đen và khô', 'Vết chích hình tròn nhỏ trên lá', 'Lá non xoăn và biến dạng', 'Giảm chất lượng và sản lượng trà'],
      causes: ['Côn trùng Helopeltis theivora', 'Vườn chè rậm rạp, thiếu ánh sáng', 'Thời tiết ẩm ướt', 'Thiếu thiên địch tự nhiên'],
      severity: 'moderate',
      source: 'CABI Invasive Species Compendium; Plantwise Knowledge Bank; Viện Nghiên cứu Chè Việt Nam; Tea Research Association of India.'
    },
  ];

  for (const d of teaDiseases) {
    try {
      await pool.query(
        `INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (disease_class) DO NOTHING`,
        [d.class, d.vi, d.en, d.crop, d.desc, d.symptoms, d.causes, d.severity, d.source]
      );
      console.log(`  OK: ${d.class}`);
    } catch (e) {
      console.log(`  ERR ${d.class}: ${e.message.substring(0, 80)}`);
    }
  }

  // 6. Insert treatments
  console.log('Inserting treatments...');
  const treatments = [
    // Coffee - brown_eye_spot
    { disease: 'brown_eye_spot', type: 'chemical', name: 'Phun thuốc gốc đồng', desc: 'Sử dụng Copper hydroxide hoặc Bordeaux mixture để phòng trừ nấm Cercospora.', guide: 'Phun 2-3 lần, cách nhau 15-20 ngày khi bệnh mới xuất hiện.', freq: '2-3 lần/vụ', eff: 4 },
    { disease: 'brown_eye_spot', type: 'cultural', name: 'Bón phân cân đối + tỉa cành', desc: 'Bón đầy đủ kali, lân. Tỉa cành tạo thông thoáng, giảm độ ẩm tán lá.', guide: 'Bón NPK theo tỷ lệ 2:1:2. Tỉa cành sau mỗi vụ thu hoạch.', freq: 'Theo mùa vụ', eff: 3 },
    // Coffee - leaf_miner
    { disease: 'leaf_miner', type: 'chemical', name: 'Phun thuốc trừ sâu sinh học', desc: 'Sử dụng Abamectin hoặc Chlorantraniliprole để diệt sâu vẽ bùa.', guide: 'Phun khi thấy đường hầm đầu tiên trên lá. Phun buổi chiều mát.', freq: '1-2 lần/vụ', eff: 4 },
    { disease: 'leaf_miner', type: 'biological', name: 'Thả thiên địch', desc: 'Thả ong ký sinh Phyllocnistis citrella để kiểm soát sâu vẽ bùa tự nhiên.', guide: 'Thả ong ký sinh theo hướng dẫn của Viện BVTV.', freq: 'Theo mùa', eff: 3 },
    // Coffee - leaf_rust
    { disease: 'leaf_rust', type: 'chemical', name: 'Phun Triazole + Mancozeb', desc: 'Sử dụng Hexaconazole hoặc Propiconazole kết hợp Mancozeb để kiểm soát nấm gỉ sắt.', guide: 'Phun ngay khi phát hiện đốm vàng đầu tiên. Phun 3-4 lần, cách nhau 15-20 ngày.', freq: '15-20 ngày/lan', eff: 5 },
    { disease: 'leaf_rust', type: 'cultural', name: 'Chọn giống kháng + bón phân', desc: 'Trồng giống cà phê kháng bệnh (TR4, TR9). Bón phân cân đối tăng sức đề kháng.', guide: 'Mua giống tại Viện Eakmat Tây Nguyên. Bón phân hữu cơ ủ hoai.', freq: 'Mỗi vụ', eff: 4 },
    // Coffee - red_spider_mite
    { disease: 'red_spider_mite', type: 'chemical', name: 'Phun thuốc trừ nhện', desc: 'Sử dụng Abamectin hoặc Spiromesifen để diệt nhện đỏ.', guide: 'Phun đều mặt dưới lá. Phun 2 lần, cách nhau 7-10 ngày.', freq: '7-10 ngày/lan', eff: 4 },
    { disease: 'red_spider_mite', type: 'biological', name: 'Thả bọ rùa Stethorus', desc: 'Thả bọ rùa Stethorus punctillum — thiên địch tự nhiên của nhện đỏ.', guide: 'Thả 5-10 con/cây khi mật độ nhện thấp.', freq: 'Theo mùa', eff: 3 },
    // Rice - Bacteria_Leaf_Blight
    { disease: 'Bacteria_Leaf_Blight', type: 'chemical', name: 'Phun Copper hydroxide', desc: 'Sử dụng thuốc gốc đồng (Copper hydroxide, Bordeaux mixture) để ức chế vi khuẩn.', guide: 'Phun ngay khi phát hiện triệu chứng đầu. Phun 2-3 lần, cách nhau 7-10 ngày.', freq: '7-10 ngày/lan', eff: 3 },
    { disease: 'Bacteria_Leaf_Blight', type: 'cultural', name: 'Chọn giống kháng + quản lý nước', desc: 'Trồng giống lúa kháng bệnh (IR24, IR64). Quản lý nước hợp lý, không để ruộng ngập sâu kéo dài.', guide: 'Tham khảo danh mục giống kháng tại IRRI hoặc Viện Lúa ĐBSCL.', freq: 'Mỗi vụ', eff: 5 },
    // Rice - Brown_Spot
    { disease: 'Brown_Spot', type: 'chemical', name: 'Phun Carbendazim', desc: 'Sử dụng Carbendazim hoặc Mancozeb để phòng trừ nấm Bipolaris oryzae.', guide: 'Phun khi bệnh mới xuất hiện. Phun 2-3 lần, cách nhau 10-15 ngày.', freq: '10-15 ngày/lan', eff: 4 },
    { disease: 'Brown_Spot', type: 'cultural', name: 'Bón phân kali + silic', desc: 'Bón đầy đủ kali và silic để tăng sức đề kháng cho cây lúa.', guide: 'Bón KCl 40-50kg/ha. Bón phân lân 200-300kg/ha.', freq: 'Đầu vụ', eff: 4 },
    // Rice - Leaf_smut
    { disease: 'Leaf_smut', type: 'chemical', name: 'Phun Propiconazole', desc: 'Sử dụng Propiconazole hoặc Tebuconazole để kiểm soát nấm muội than.', guide: 'Phun 1-2 lần khi bệnh mới xuất hiện.', freq: '10-15 ngày/lan', eff: 3 },
    { disease: 'Leaf_smut', type: 'cultural', name: 'Bón phân cân đối + vệ sinh đồng ruộng', desc: 'Bón phân NPK cân đối, vệ sinh tàn dư cây bệnh sau thu hoạch.', guide: 'Thu gom rơm rạ bệnh, không đốt trên đồng. Bón vôi 1-2 tấn/ha.', freq: 'Sau thu hoạch', eff: 3 },
    // Tea - Leaf rust of tea
    { disease: 'Leaf rust of tea', type: 'chemical', name: 'Phun Mancozeb', desc: 'Sử dụng Mancozeb hoặc Copper oxychloride để phòng trừ bệnh gỉ sắt chè.', guide: 'Phun 2-3 lần, cách nhau 15-20 ngày vào mùa mưa.', freq: '15-20 ngày/lan', eff: 4 },
    { disease: 'Leaf rust of tea', type: 'cultural', name: 'Tỉa cành + vệ sinh vườn chè', desc: 'Tỉa cành tạo tán thông thoáng, thu gom lá bệnh rụng dưới gốc.', guide: 'Tỉa cành sau mỗi đợt hái búp. Phơi khô lá bệnh rồi ủ phân.', freq: 'Sau mỗi đợt hái', eff: 3 },
    // Tea - Red Spider infested tea leaf
    { disease: 'Red Spider infested tea leaf', type: 'chemical', name: 'Phun Abamectin', desc: 'Sử dụng Abamectin hoặc Spiromesifen để diệt nhện đỏ trên chè.', guide: 'Phun đều mặt dưới lá. Phun 2 lần, cách nhau 7 ngày. Chú ý thời gian cách ly trước hái búp.', freq: '7 ngày/lan', eff: 4 },
    { disease: 'Red Spider infested tea leaf', type: 'biological', name: 'Thả thiên địch nhện săn mồi', desc: 'Thả nhện săn mồi Amblyseius và bọ rùa để kiểm soát nhện đỏ tự nhiên.', guide: 'Thả thiên địch khi mật độ nhện đỏ còn thấp.', freq: 'Theo mùa', eff: 3 },
    // Tea - Tea Mosquito bug infested leaf
    { disease: 'Tea Mosquito bug infested leaf', type: 'chemical', name: 'Phun thuốc trừ sâu', desc: 'Sử dụng Chlorpyrifos hoặc Cypermethrin để diệt bọ muỗi chè.', guide: 'Phun khi thấy búp chè bị đen. Phun buổi chiều mát, 2 lần cách nhau 7 ngày.', freq: '7 ngày/lan', eff: 4 },
    { disease: 'Tea Mosquito bug infested leaf', type: 'cultural', name: 'Tỉa cành + thu gom búp bệnh', desc: 'Tỉa cành tạo thông thoáng, thu gom và tiêu hủy búp chè bị hại.', guide: 'Thu gom búp bệnh ngay khi phát hiện. Tỉa cành tạo tán rộng.', freq: 'Thường xuyên', eff: 3 },
  ];

  for (const t of treatments) {
    try {
      await pool.query(
        `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
         SELECT id, $2, $3, $4, $5, $6, $7 FROM crop_diseases WHERE disease_class = $1`,
        [t.disease, t.type, t.name, t.desc, t.guide, t.freq, t.eff]
      );
      console.log(`  OK: ${t.disease} - ${t.type}`);
    } catch (e) {
      console.log(`  ERR: ${t.disease} - ${e.message.substring(0, 80)}`);
    }
  }

  // 7. Insert pesticides (Vietnamese market)
  console.log('Inserting pesticides...');
  const pesticideData = [
    { trade: 'Boocil 50WP', active: 'Copper hydroxide', conc: '50WP', mfg: 'Bayer', dose: '30-40g/20 lít nước', method: 'Phun đều 2 mặt lá', safety: ['Đeo găng tay', 'Mặc áo bảo hộ'], phi: 3, price: 'Trung bình' },
    { trade: 'Dithane M-45 80WP', active: 'Mancozeb', conc: '80WP', mfg: 'Corteva', dose: '30-40g/20 lít nước', method: 'Phun khi trời khô ráo', safety: ['Đeo găng tay', 'Mặt nạ phòng độc'], phi: 7, price: 'Rẻ' },
    { trade: 'Score 250EC', active: 'Difenoconazole', conc: '250EC', mfg: 'Syngenta', dose: '10ml/20 lít nước', method: 'Phun lá, cách nhau 15-20 ngày', safety: ['Đeo găng tay', 'Kính bảo hộ'], phi: 14, price: 'Cao' },
    { trade: 'Anvil 5SC', active: 'Hexaconazole', conc: '5SC', mfg: 'Pioneer', dose: '10-15ml/20 lít nước', method: 'Phun khi phát hiện bệnh gỉ sắt', safety: ['Đeo găng tay', 'Mặt nạ'], phi: 14, price: 'Trung bình' },
    { trade: 'Confidor 200SL', active: 'Imidacloprid', conc: '200SL', mfg: 'Bayer', dose: '2-3ml/20 lít nước', method: 'Phun khi thấy sâu hại', safety: ['Đeo găng tay', 'Tránh ao cá'], phi: 14, price: 'Trung bình' },
    { trade: 'Abamectin 18EC', active: 'Abamectin', conc: '18EC', mfg: 'Nông nghiệp VN', dose: '5-7ml/20 lít nước', method: 'Phun đều mặt dưới lá', safety: ['Đeo găng tay', 'Mặt nạ'], phi: 7, price: 'Rẻ' },
    { trade: 'Vimonyl 75WP', active: 'Carbendazim', conc: '75WP', mfg: 'Công ty VCP', dose: '20-30g/20 lít nước', method: 'Phun khi bệnh mới xuất hiện', safety: ['Đeo găng tay', 'Áo bảo hộ'], phi: 14, price: 'Rẻ' },
    { trade: 'Trichoderma Harzianum', active: 'Trichoderma harzianum', conc: 'SP', mfg: 'Nông nghiệp sinh học', dose: '5g/20 lít nước', method: 'Phun đất và lá', safety: ['Bảo quản nơi khô mát'], phi: 0, price: 'Rẻ' },
  ];

  for (const p of pesticideData) {
    try {
      await pool.query(
        `INSERT INTO pesticides (trade_name, active_ingredient, concentration, manufacturer, dosage, application_method, safety_precautions, pre_harvest_interval, price_range)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING`,
        [p.trade, p.active, p.conc, p.mfg, p.dose, p.method, p.safety, p.phi, p.price]
      );
      console.log(`  OK: ${p.trade}`);
    } catch (e) {
      console.log(`  ERR: ${e.message.substring(0, 80)}`);
    }
  }

  // 8. Insert pesticide-disease mappings
  console.log('Inserting pesticide-disease mappings...');
  const mappings = [
    { pest: 'Boocil 50WP', dis: 'brown_eye_spot', eff: 4 },
    { pest: 'Boocil 50WP', dis: 'Leaf rust of tea', eff: 4 },
    { pest: 'Dithane M-45 80WP', dis: 'leaf_rust', eff: 4 },
    { pest: 'Dithane M-45 80WP', dis: 'Brown_Spot', eff: 4 },
    { pest: 'Dithane M-45 80WP', dis: 'Leaf rust of tea', eff: 4 },
    { pest: 'Score 250EC', dis: 'leaf_rust', eff: 5 },
    { pest: 'Anvil 5SC', dis: 'leaf_rust', eff: 5 },
    { pest: 'Anvil 5SC', dis: 'Leaf rust of tea', eff: 4 },
    { pest: 'Confidor 200SL', dis: 'leaf_miner', eff: 4 },
    { pest: 'Confidor 200SL', dis: 'Tea Mosquito bug infested leaf', eff: 4 },
    { pest: 'Abamectin 18EC', dis: 'red_spider_mite', eff: 4 },
    { pest: 'Abamectin 18EC', dis: 'Red Spider infested tea leaf', eff: 4 },
    { pest: 'Vimonyl 75WP', dis: 'Brown_Spot', eff: 4 },
    { pest: 'Vimonyl 75WP', dis: 'Leaf_smut', eff: 3 },
    { pest: 'Trichoderma Harzianum', dis: 'brown_eye_spot', eff: 3 },
    { pest: 'Trichoderma Harzianum', dis: 'Leaf rust of tea', eff: 3 },
  ];

  for (const m of mappings) {
    try {
      await pool.query(
        `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
         SELECT p.id, d.id, $3 FROM pesticides p, crop_diseases d
         WHERE p.trade_name = $1 AND d.disease_class = $2 ON CONFLICT DO NOTHING`,
        [m.pest, m.dis, m.eff]
      );
      console.log(`  OK: ${m.pest} → ${m.dis}`);
    } catch (e) {
      console.log(`  ERR: ${e.message.substring(0, 80)}`);
    }
  }

  // 9. Recreate disease_summary view
  console.log('\nRecreating disease_summary view...');
  try {
    await pool.query(`
      CREATE OR REPLACE VIEW disease_summary AS
      SELECT 
        d.id, d.disease_class, d.disease_name_vi, d.crop_type, d.severity, d.description, d.symptoms, d.source,
        COALESCE(json_agg(json_build_object('method_type', t.method_type, 'method_name', t.method_name, 'effectiveness', t.effectiveness)) FILTER (WHERE t.id IS NOT NULL), '[]') AS treatments,
        COALESCE(json_agg(json_build_object('trade_name', p.trade_name, 'active_ingredient', p.active_ingredient, 'dosage', p.dosage, 'pre_harvest_interval', p.pre_harvest_interval)) FILTER (WHERE p.id IS NOT NULL), '[]') AS pesticides
      FROM crop_diseases d
      LEFT JOIN treatment_methods t ON t.disease_id = d.id
      LEFT JOIN pesticide_disease_map pdm ON pdm.disease_id = d.id
      LEFT JOIN pesticides p ON p.id = pdm.pesticide_id
      GROUP BY d.id, d.disease_class, d.disease_name_vi, d.crop_type, d.severity, d.description, d.symptoms, d.source
    `);
    console.log('  OK: disease_summary view updated (with source)');
  } catch (e) {
    console.log('  ERR:', e.message);
  }

  // 10. Verify
  console.log('\n=== Verification ===');
  try {
    const result = await pool.query(`
      SELECT disease_class, disease_name_vi, crop_type, severity,
             json_array_length(treatments::json) as treatments_count,
             json_array_length(pesticides::json) as pesticides_count
      FROM disease_summary ORDER BY crop_type, disease_class
    `);
    console.log('\nDisease Summary:');
    console.log('─'.repeat(80));
    for (const row of result.rows) {
      console.log(`  [${row.crop_type}] ${row.disease_class}: ${row.disease_name_vi}`);
      console.log(`    Severity: ${row.severity} | Treatments: ${row.treatments_count} | Pesticides: ${row.pesticides_count}`);
    }
    console.log('─'.repeat(80));
    console.log(`\nTotal: ${result.rows.length} diseases`);
  } catch (e) {
    console.log('  ERR:', e.message);
  }

  await pool.end();
  console.log('\nDone!');
}

run();