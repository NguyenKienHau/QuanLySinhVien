// URL Backend đã deploy trên Render
const API_URL = 'https://quanlysinhvien-semm.onrender.com';

let allStudents = [];

// Tự động tải danh sách sinh viên khi vào trang
document.addEventListener('DOMContentLoaded', () => {
    loadStudents();
});

// Hàm lấy danh sách sinh viên từ Server Render
async function loadStudents() {
    const tableBody = document.getElementById('studentTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    
    refreshIcon.classList.add('fa-spin');

    try {
        const response = await fetch(`${API_URL}/api/sinhvien`);
        if (!response.ok) throw new Error("Không thể kết nối đến máy chủ");

        allStudents = await response.json();
        renderTable(allStudents);
        updateStats(allStudents);

    } catch (error) {
        console.error('Lỗi khi tải danh sách:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#f87171; padding:20px;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Không thể tải dữ liệu từ Server Render.
                </td>
            </tr>`;
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

// Hàm hiển thị dữ liệu ra bảng
function renderTable(data) {
    const tableBody = document.getElementById('studentTableBody');

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color: #94a3b8; padding:30px;">
                    Chưa có sinh viên nào trong danh sách.
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = data.map(sv => `
        <tr>
            <td><strong>${escapeHtml(sv.MaSV || '')}</strong></td>
            <td>${escapeHtml(sv.HoTen || '')}</td>
            <td><span class="tag-class">${escapeHtml(sv.Lop || '')}</span></td>
            <td>${escapeHtml(sv.Nganh || '')}</td>
            <td>
                <button class="btn-delete" onclick="deleteStudent('${sv.MaSV}')" title="Xóa sinh viên">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Cập nhật thẻ thống kê
function updateStats(data) {
    document.getElementById('totalStudents').innerText = data.length;
    const uniqueClasses = new Set(data.map(sv => sv.Lop)).size;
    document.getElementById('totalClasses').innerText = uniqueClasses;
}

// Lọc tìm kiếm sinh viên
function filterStudents() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allStudents.filter(sv => 
        (sv.HoTen && sv.HoTen.toLowerCase().includes(keyword)) ||
        (sv.MaSV && sv.MaSV.toLowerCase().includes(keyword)) ||
        (sv.Lop && sv.Lop.toLowerCase().includes(keyword)) ||
        (sv.Nganh && sv.Nganh.toLowerCase().includes(keyword))
    );
    renderTable(filtered);
}

// Thêm Sinh Viên Mới
async function addStudent() {
    const btnSubmit = document.getElementById('btnSubmit');
    const hoTen = document.getElementById('hoTen').value.trim();
    const maSV = document.getElementById('maSV').value.trim();
    const lop = document.getElementById('lop').value.trim();
    const nganh = document.getElementById('nganh').value.trim();

    if (!hoTen || !maSV || !lop || !nganh) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang đồng bộ...`;

    try {
        const response = await fetch(`${API_URL}/api/sinhvien`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ HoTen: hoTen, MaSV: maSV, Lop: lop, Nganh: nganh })
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Thành Công!',
                text: 'Thông tin sinh viên đã được lưu vào Supabase!',
                background: '#1e293b',
                color: '#fff',
                confirmButtonColor: '#6366f1'
            });
            document.getElementById('studentForm').reset();
            loadStudents(); // Tải lại bảng sau khi thêm
        } else {
            throw new Error(result.message || 'Lỗi thêm dữ liệu');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Lưu Thất Bại',
            text: error.message,
            background: '#1e293b',
            color: '#fff'
        });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="btn-text">Lưu Dữ Liệu Cloud</span> <i class="fa-solid fa-cloud-arrow-up btn-icon"></i>`;
    }
}

// Xóa Sinh Viên
async function deleteStudent(maSV) {
    const confirm = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc muốn xóa sinh viên mã [${maSV}]?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy',
        background: '#1e293b',
        color: '#fff'
    });

    if (confirm.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/api/sinhvien/${maSV}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã xóa!',
                    background: '#1e293b',
                    color: '#fff'
                });
                loadStudents();
            } else {
                throw new Error('Không thể xóa dữ liệu');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error.message,
                background: '#1e293b',
                color: '#fff'
            });
        }
    }
}

// Escape HTML chống XSS
function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}