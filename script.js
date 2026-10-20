const API_URL = 'https://quanlysinhvien-semm.onrender.com';
const ADMIN_PASSWORD = "15102006";

let isAdmin = false;
let allStudents = [];
let currentModalMode = 'add'; // 'add' hoặc 'edit'

// Đăng nhập / Đăng xuất Admin
async function toggleAdminAuth() {
    if (isAdmin) {
        // Đăng xuất
        isAdmin = false;
        document.getElementById('guestFormSection').style.display = 'block';
        document.getElementById('adminDashboardSection').style.display = 'none';
        document.getElementById('adminBtnText').innerText = 'Đăng nhập Admin';
        document.getElementById('btnAdminLogin').classList.remove('logged-in');
        document.getElementById('portalSubtitle').innerText = 'Cổng Tiếp Nhận Thông Tin Sinh Viên Cloud';

        Swal.fire({
            icon: 'info',
            title: 'Đã đăng xuất',
            background: '#0d1322', color: '#fff', timer: 1400, showConfirmButton: false
        });
    } else {
        // Popup nhập mật khẩu
        const { value: password } = await Swal.fire({
            title: 'Đăng Nhập Admin',
            input: 'password',
            inputLabel: 'Nhập mật khẩu quản trị viên:',
            inputPlaceholder: 'Nhập mật khẩu...',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Hủy',
            background: '#0d1322', color: '#fff', confirmButtonColor: '#10b981'
        });

        if (password === ADMIN_PASSWORD) {
            isAdmin = true;
            document.getElementById('guestFormSection').style.display = 'none';
            document.getElementById('adminDashboardSection').style.display = 'block';
            document.getElementById('adminBtnText').innerText = 'Thoát Admin';
            document.getElementById('btnAdminLogin').classList.add('logged-in');
            document.getElementById('portalSubtitle').innerText = 'Hệ Thống Quản Lý Dữ Liệu Sinh Viên Cloud';

            Swal.fire({
                icon: 'success',
                title: 'Xin chào Admin!',
                text: 'Đang tải danh sách sinh viên...',
                background: '#0d1322', color: '#fff', timer: 1400, showConfirmButton: false
            });

            loadStudents();
        } else if (password) {
            Swal.fire({
                icon: 'error',
                title: 'Thất Bại',
                text: 'Mật khẩu Admin không chính xác!',
                background: '#0d1322', color: '#fff'
            });
        }
    }
}

// Tải danh sách sinh viên từ Server Render
async function loadStudents() {
    if (!isAdmin) return;

    const tableBody = document.getElementById('studentTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('fa-spin');

    try {
        const response = await fetch(`${API_URL}/api/sinhvien`);
        if (!response.ok) throw new Error("Lỗi kết nối CSDL");

        allStudents = await response.json();
        renderTable(allStudents);
        updateStats(allStudents);
    } catch (error) {
        console.error('Lỗi tải sinh viên:', error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#f87171;">Không thể tải dữ liệu từ máy chủ.</td></tr>`;
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

// Render dữ liệu ra bảng
function renderTable(data) {
    const tableBody = document.getElementById('studentTableBody');

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Chưa có dữ liệu sinh viên nào.</td></tr>`;
        return;
    }

    tableBody.innerHTML = data.map(sv => `
        <tr>
            <td><strong>${escapeHtml(sv.MaSV || '')}</strong></td>
            <td>${escapeHtml(sv.HoTen || '')}</td>
            <td>${escapeHtml(sv.Lop || '')}</td>
            <td>${escapeHtml(sv.Nganh || '')}</td>
            <td>
                <div class="action-cell">
                    <button class="btn-edit" onclick="openStudentModal('edit', '${sv.MaSV}', '${escapeHtml(sv.HoTen)}', '${escapeHtml(sv.Lop)}', '${escapeHtml(sv.Nganh)}')" title="Sửa">
                        <i class="fa-solid fa-pen-to-square"></i> Sửa
                    </button>
                    <button class="btn-delete" onclick="deleteStudent('${sv.MaSV}')" title="Xóa">
                        <i class="fa-solid fa-trash-can"></i> Xóa
                    </button>
                </div>
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

// 1. Gửi dữ liệu từ Form Khách (Có chống spam + Xóa dữ liệu tự động)
async function addStudentPublic() {
    const btnSubmit = document.getElementById('btnSubmitPub');
    const hoTenInput = document.getElementById('hoTenPub');
    const maSVInput = document.getElementById('maSVPub');
    const lopInput = document.getElementById('lopPub');
    const nganhInput = document.getElementById('nganhPub');

    const hoTen = hoTenInput.value.trim();
    const maSV = maSVInput.value.trim();
    const lop = lopInput.value.trim();
    const nganh = nganhInput.value.trim();

    if (!hoTen || !maSV || !lop || !nganh) return;

    // Vô hiệu hóa nút gửi để tránh bấm liên tục
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang lưu...</span>`;

    try {
        const response = await fetch(`${API_URL}/api/sinhvien`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ HoTen: hoTen, MaSV: maSV, Lop: lop, Nganh: nganh })
        });

        if (response.ok) {
            // TỰ ĐỘNG XÓA DỮ LIỆU CỦ ĐỂ TRÁNH TRÙNG LẶP
            document.getElementById('studentFormPublic').reset();

            Swal.fire({
                icon: 'success',
                title: 'Thành Công!',
                text: 'Thông tin sinh viên đã được lưu.',
                background: '#0d1322', color: '#fff', confirmButtonColor: '#10b981'
            });
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi thêm dữ liệu');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error', title: 'Thất Bại', text: error.message,
            background: '#0d1322', color: '#fff'
        });
    } finally {
        // Mở lại nút gửi
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Lưu Dữ Liệu</span> <i class="fa-solid fa-paper-plane"></i>`;
    }
}

// 2. Mở Popup Modal Thêm / Sửa Sinh Viên
function openStudentModal(mode, maSV = '', hoTen = '', lop = '', nganh = '') {
    currentModalMode = mode;
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('modalTitle');

    if (mode === 'add') {
        title.innerHTML = `<i class="fa-solid fa-user-plus"></i> Thêm Sinh Viên Mới`;
        document.getElementById('modalEditOriginalMaSV').value = '';
        document.getElementById('modalHoTen').value = '';
        document.getElementById('modalMaSV').value = '';
        document.getElementById('modalLop').value = '';
        document.getElementById('modalNganh').value = '';
    } else {
        title.innerHTML = `<i class="fa-solid fa-user-pen"></i> Chỉnh Sửa Sinh Viên`;
        document.getElementById('modalEditOriginalMaSV').value = maSV;
        document.getElementById('modalHoTen').value = hoTen;
        document.getElementById('modalMaSV').value = maSV;
        document.getElementById('modalLop').value = lop;
        document.getElementById('modalNganh').value = nganh;
    }

    modal.classList.add('active');
}

function closeStudentModal() {
    document.getElementById('studentModal').classList.remove('active');
    document.getElementById('modalForm').reset(); // Xóa sạch dữ liệu trên form modal khi đóng
}

// 3. Lưu dữ liệu từ Modal Popup (Cho Admin - Có chống spam + Reset Form)
async function saveStudentFromModal() {
    const btnSave = document.getElementById('btnModalSave');
    const hoTen = document.getElementById('modalHoTen').value.trim();
    const maSV = document.getElementById('modalMaSV').value.trim();
    const lop = document.getElementById('modalLop').value.trim();
    const nganh = document.getElementById('modalNganh').value.trim();
    const originalMaSV = document.getElementById('modalEditOriginalMaSV').value;

    if (!hoTen || !maSV || !lop || !nganh) return;

    // Vô hiệu hóa nút Lưu để chặn bấm nhiều lần
    btnSave.disabled = true;
    const originalBtnText = btnSave.innerHTML;
    btnSave.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`;

    try {
        if (currentModalMode === 'edit' && originalMaSV && originalMaSV !== maSV) {
            await fetch(`${API_URL}/api/sinhvien/${originalMaSV}`, { method: 'DELETE' });
        }

        const response = await fetch(`${API_URL}/api/sinhvien`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ HoTen: hoTen, MaSV: maSV, Lop: lop, Nganh: nganh })
        });

        if (response.ok) {
            // Đóng Modal và xóa sạch các ô nhập
            closeStudentModal();

            Swal.fire({
                icon: 'success',
                title: currentModalMode === 'add' ? 'Thêm thành công!' : 'Cập nhật thành công!',
                background: '#0d1322', color: '#fff', timer: 1400, showConfirmButton: false
            });

            loadStudents();
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi lưu thông tin');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error', title: 'Lỗi', text: error.message,
            background: '#0d1322', color: '#fff'
        });
    } finally {
        // Khôi phục trạng thái nút Lưu
        btnSave.disabled = false;
        btnSave.innerHTML = originalBtnText;
    }
}

// 4. Xóa Sinh Viên
async function deleteStudent(maSV) {
    const confirm = await Swal.fire({
        title: 'Xác Nhận Xóa?',
        text: `Bạn có chắc muốn xóa sinh viên mã [${maSV}]?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy',
        background: '#0d1322', color: '#fff'
    });

    if (confirm.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/api/sinhvien/${maSV}`, { method: 'DELETE' });

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Đã xóa!', background: '#0d1322', color: '#fff', timer: 1200, showConfirmButton: false });
                loadStudents();
            } else {
                throw new Error('Không thể xóa sinh viên này');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: error.message, background: '#0d1322', color: '#fff' });
        }
    }
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}