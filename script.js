document.getElementById('studentForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const hoTen = document.getElementById('hoTen').value.trim();
    const maSV = document.getElementById('maSV').value.trim();
    const lop = document.getElementById('lop').value.trim();
    const nganh = document.getElementById('nganh').value.trim();

    const thongBao = document.getElementById('thongBao');
    const btnSubmit = document.getElementById('btnSubmit');

    thongBao.className = 'status-message';
    thongBao.innerText = 'Đang đồng bộ dữ liệu...';
    thongBao.style.display = 'block';
    thongBao.style.background = '#f1f5f9';
    thongBao.style.color = '#475569';
    btnSubmit.disabled = true;

    try {
        // Tạm thời kết nối tới Render/Localhost
        const response = await fetch('https://quanlysinhvien-semm.onrender.com/api/them-sinh-vien', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hoTen, maSV, lop, nganh })
        });

        const data = await response.json();

        if (data.success) {
            thongBao.className = 'status-message success';
            thongBao.innerText = '✓ ' + data.message;
            document.getElementById('studentForm').reset();
        } else {
            thongBao.className = 'status-message error';
            thongBao.innerText = '✕ Lỗi: ' + (data.error || data.message);
        }
    } catch (err) {
        thongBao.className = 'status-message error';
        thongBao.innerText = '✕ Không thể kết nối tới Server!';
    } finally {
        btnSubmit.disabled = false;
    }
});