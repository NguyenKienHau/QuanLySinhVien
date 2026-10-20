const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Lấy chuỗi kết nối từ Render Environment Variable hoặc dùng trực tiếp chuỗi Supabase
const connectionString = process.env.DATABASE_URL || 'postgres://postgres.xxx:MAT_KHAU_THAT@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Bắt buộc khi kết nối Supabase Cloud
});

// API nhận dữ liệu từ Web và lưu vào Supabase
app.post('/api/them-sinh-vien', async (req, res) => {
    const { hoTen, maSV, lop, nganh } = req.body;

    try {
        const queryText = 'INSERT INTO SinhVien (HoTen, MaSV, Lop, Nganh) VALUES ($1, $2, $3, $4)';
        await pool.query(queryText, [hoTen, maSV, lop, nganh]);

        res.json({ success: true, message: 'Lưu thông tin sinh viên thành công!' });
    } catch (err) {
        console.error('Lỗi Database:', err);
        res.status(500).json({ success: false, message: 'Lưu dữ liệu thất bại', error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});