const API_URL = 'https://quanlysinhvien-semm.onrender.com';

// Mật khẩu Admin của bạn (Có thể đổi thành mật khẩu tùy thích)
const ADMIN_PASSWORD = "123456";

let isAdmin = false;
let allStudents = [];

// Xử lý Đăng nhập / Đăng xuất Admin
async function toggleAdminAuth() {
    if (isAdmin) {
        // Đăng xuất
        isAdmin = false;
        document.getElementById('adminSection').style.display = 'none';
        document.getElementById('mainGrid').className = 'content-grid single-column';
        document.getElementById('adminBtnText').innerText = 'Đăng nhập Admin';
        document.getElementById('btnAdminLogin').classList.remove('logged-in');
        
        Swal.fire({
            icon: 'info',
            title: 'Đã đăng xuất Admin',
            background: '#1e293b',
            color: '#fff',
            timer: 1500,
            showConfirmButton: false
        });
    } else {
        // Hiện popup nhập mật khẩu Admin
        const { value: password } = await Swal.fire({
            title: 'Quyền Quản Trị Admin',
            input: 'password',
            inputLabel: 'Nhập mật khẩu Admin để xem danh sách:',
            inputPlaceholder: 'Nhập mật khẩu...',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập',
            cancelButtonText: 'Hủy',
            background: '#1e293b',
            color: '#fff',
            confirmButtonColor: '#6366f1'
        });

        if (password === ADMIN_PASSWORD) {
            isAdmin = true;
            document.getElementById('adminSection').style.display = 'block';
            document.getElementById('mainGrid').className = 'content-grid two-columns';
            document.getElementById('adminBtnText').innerText = 'Thoát Admin';
            document.getElementById('btnAdminLogin').classList.add('logged-in');

            Swal.fire({
                icon: 'success',
                title: 'Đăng nhập thành công!',
                background: '#1e293b',
                color: '#fff',
                timer: 1500,
                showConfirmButton: false
            });

            loadStudents(); // Tải dữ liệu sau khi mở khóa
        } else if (password) {
            Swal.fire({
                icon: 'error',
                title: 'Sai mật khẩu!',
                text: 'Bạn không có quyền xem danh sách này.',
                background: '#1e293b',
                color: '#fff'
            });
        }
    }
}

// Tải dữ liệu từ Server Render
async function loadStudents() {
    if (!isAdmin) return;

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
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#f87171;">Lỗi tải dữ liệu</td></tr>`;
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('studentTableBody');

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Chưa có dữ liệu sinh viên.</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(sv => `
        <tr>
            <td><strong>${escapeHtml(sv.MaSV || '')}</strong></td>
            <td>${escapeHtml(sv.HoTen || '')}</td>
            <td>${escapeHtml(sv.Lop || '')}</td>
            <td>${escapeHtml(sv.Nganh || '')}</td>
            <td>
                <button class="btn-delete" onclick="deleteStudent('${sv.MaSV}')" title="Xóa sinh viên">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats(data) {
    document.getElementById('totalStudents').innerText = data.length;
    const uniqueClasses = new Set(data.map(sv => sv.Lop)).size;
    document.getElementById('totalClasses').innerText = uniqueClasses;
}

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

// Thêm sinh viên (Dành cho tất cả mọi người)
async function addStudent() {
    const btnSubmit = document.getElementById('btnSubmit');
    const hoTen = document.getElementById('hoTen').value.trim();
    const maSV = document.getElementById('maSV').value.trim();
    const lop = document.getElementById('lop').value.trim();
    const nganh = document.getElementById('nganh').value.trim();

    if (!hoTen || !maSV || !lop || !nganh) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...`;

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
                title: 'Nhập Thành Công!',
                text: 'Cảm ơn bạn! Thông tin đã được lưu vào hệ thống.',
                background: '#1e293b',
                color: '#fff',
                confirmButtonColor: '#6366f1'
            });
            document.getElementById('studentForm').reset();
            if (isAdmin) loadStudents();
        } else {
            throw new Error(result.message || 'Lỗi thêm dữ liệu');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Thất Bại',
            text: error.message,
            background: '#1e293b',
            color: '#fff'
        });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="btn-text">Lưu Dữ Liệu</span> <i class="fa-solid fa-paper-plane btn-icon"></i>`;
    }
}

// Xóa sinh viên (Chỉ Admin mới thao tác được)
async function deleteStudent(maSV) {
    if (!isAdmin) return;

    const confirm = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc muốn xóa sinh viên [${maSV}]?`,
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
            const response = await fetch(`${API_URL}/api/sinhvien/${maSV}`, { method: 'DELETE' });

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Đã xóa!', background: '#1e293b', color: '#fff' });
                loadStudents();
            } else {
                throw new Error('Không thể xóa dữ liệu');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: error.message, background: '#1e293b', color: '#fff' });
        }
    }
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}