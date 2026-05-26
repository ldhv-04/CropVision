const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function seedCoffee() {
  try {
    console.log("Seeding coffee diseases...");
    
    // Check if they exist
    const check = await pool.query("SELECT disease_class FROM crop_diseases WHERE crop_type = 'coffee'");
    if (check.rows.length > 0) {
      console.log("Coffee diseases already seeded.");
      // We'll delete and re-insert just in case
      await pool.query("DELETE FROM crop_diseases WHERE crop_type = 'coffee'");
    }

    const query = `
      INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity)
      VALUES 
      ('3', 'Khỏe mạnh (Cà phê)', 'Healthy', 'coffee', 'Lá cà phê khỏe mạnh, không có dấu hiệu bệnh', ARRAY['Lá xanh', 'Không có vết đốm'], ARRAY['Môi trường tốt'], 'mild'),
      ('brown_eye_spot', 'Đốm mắt nâu', 'Brown Eye Spot', 'coffee', 'Bệnh do nấm Cercospora coffeicola gây ra, tạo các vết đốm màu nâu trên lá.', ARRAY['Đốm tròn màu nâu', 'Có quầng sáng xung quanh', 'Lá rụng sớm'], ARRAY['Nấm Cercospora coffeicola', 'Thiếu dinh dưỡng'], 'moderate'),
      ('leaf_miner', 'Sâu vẽ bùa', 'Leaf Miner', 'coffee', 'Ấu trùng ruồi đục lá tạo ra các đường hầm ngoằn ngoèo màu trắng bạt trên lá.', ARRAY['Đường hầm màu trắng trên lá', 'Lá bị nhăn nheo'], ARRAY['Sâu non của ngài Leucoptera coffeella'], 'moderate'),
      ('leaf_rust', 'Bệnh gỉ sắt', 'Leaf Rust', 'coffee', 'Bệnh nghiêm trọng nhất trên cây cà phê do nấm Hemileia vastatrix gây ra.', ARRAY['Đốm màu vàng cam mặt dưới lá', 'Rụng lá hàng loạt', 'Khô cành'], ARRAY['Nấm Hemileia vastatrix', 'Độ ẩm cao'], 'severe')
    `;

    await pool.query(query);
    console.log("Coffee diseases seeded successfully!");
  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    pool.end();
  }
}

seedCoffee();
