const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối PostgreSQL Supabase qua biến DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 1. API Lấy danh sách sinh viên
app.get('/api/sinhvien', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "QuanLySinhVien" ORDER BY "MaSV" ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Loi GET:", err.message);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu: " + err.message });
    }
});

// 2. API Thêm sinh viên mới (Đã tối ưu câu lệnh SQL)
app.post('/api/sinhvien', async (req, res) => {
    const { HoTen, MaSV, Lop, Nganh } = req.body;
    
    if (!HoTen || !MaSV || !Lop || !Nganh) {
        return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
    }

    try {
        const queryText = `
            INSERT INTO "QuanLySinhVien" ("HoTen", "MaSV", "Lop", "Nganh") 
            VALUES ($1, $2, $3, $4)
        `;
        await pool.query(queryText, [HoTen.trim(), MaSV.trim(), Lop.trim(), Nganh.trim()]);
        res.json({ message: "Thêm sinh viên thành công!" });
    } catch (err) {
        console.error("Loi INSERT:", err);
        // Kiểm tra nếu thực sự bị trùng khóa chính (mã lỗi PostgreSQL: 23505)
        if (err.code === '23505') {
            return res.status(400).json({ message: `Mã sinh viên [${MaSV}] đã tồn tại trong hệ thống!` });
        }
        // Trả về thông báo lỗi chi tiết thay vì báo nhầm trùng mã
        res.status(500).json({ message: "Lỗi Database: " + (err.detail || err.message) });
    }   
});

// 3. API Xóa sinh viên theo Mã SV
app.delete('/api/sinhvien/:masv', async (req, res) => {
    const { masv } = req.params;
    try {
        await pool.query('DELETE FROM "QuanLySinhVien" WHERE "MaSV" = $1', [masv]);
        res.json({ message: "Xóa sinh viên thành công!" });
    } catch (err) {
        console.error("Loi DELETE:", err.message);
        res.status(500).json({ message: "Lỗi khi xóa sinh viên: " + err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));