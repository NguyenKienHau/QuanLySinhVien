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
        const result = await pool.query('SELECT * FROM "SinhVien" ORDER BY "MaSV" ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi kết nối cơ sở dữ liệu" });
    }
});

// 2. API Thêm sinh viên mới
app.post('/api/sinhvien', async (req, res) => {
    const { HoTen, MaSV, Lop, Nganh } = req.body;
    try {
        await pool.query(
            'INSERT INTO "SinhVien" ("HoTen", "MaSV", "Lop", "Nganh") VALUES ($1, $2, $3, $4)',
            [HoTen, MaSV, Lop, Nganh]
        );
        res.json({ message: "Thêm sinh viên thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Không thể chèn dữ liệu. Mã sinh viên có thể đã tồn tại!" });
    }
});

// 3. API Xóa sinh viên theo Mã SV
app.delete('/api/sinhvien/:masv', async (req, res) => {
    const { masv } = req.params;
    try {
        await pool.query('DELETE FROM "SinhVien" WHERE "MaSV" = $1', [masv]);
        res.json({ message: "Xóa sinh viên thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Lỗi khi xóa sinh viên" });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));