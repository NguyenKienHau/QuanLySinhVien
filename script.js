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
            background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false
        });
    } else {
        // Hiện popup nhập mật khẩu
        const { value: password } = await Swal.fire({
            title: 'Đăng Nhập Quản Trị Viên',
            input: 'password',
            inputLabel: 'Nhập mật khẩu Admin để truy cập hệ thống:',
            inputPlaceholder: 'Nhập mật khẩu...',
            showCancelButton: true,
            confirmButtonText: 'Đăng nhập',
            cancelButtonText: 'Hủy',
            background: '#0f172a', color: '#fff', confirmButtonColor: '#10b981'
        });

        if (password === ADMIN_PASSWORD) {
            isAdmin = true;
            // Ẩn form khách, Hiện bảng Admin
            document.getElementById('guestFormSection').style.display = 'none';
            document.getElementById('adminDashboardSection').style.display = 'block';
            document.getElementById('adminBtnText').innerText = 'Thoát Admin';
            document.getElementById('btnAdminLogin').classList.add('logged-in');
            document.getElementById('portalSubtitle').innerText = 'Hệ Thống Quản Lý Dữ Liệu Sinh Viên';

            Swal.fire({
                icon: 'success',
                title: 'Xin chào Admin!',
                text: 'Form khách đã được ẩn. Đang tải dữ liệu quản trị...',
                background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false
            });

            loadStudents();
        } else if (password) {
            Swal.fire({
                icon: 'error',
                title: 'Sai mật khẩu!',
                text: 'Mật khẩu Admin không chính xác.',
                background: '#0f172a', color: '#fff'
            });
        }
    }
}

// Tải danh sách sinh viên
async function loadStudents() {
    if (!isAdmin) return;

    const tableBody = document.getElementById('studentTableBody');
    const refreshIcon = document.getElementById('refreshIcon');
    refreshIcon.classList.add('fa-spin');

    try {
        const response = await fetch(`${API_URL}/api/sinhvien`);
        if (!response.ok) throw new Error("Không thể kết nối máy chủ");

        allStudents = await response.json();
        renderTable(allStudents);
        updateStats(allStudents);
    } catch (error) {
        console.error('Lỗi khi tải danh sách:', error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#f87171;">Lỗi tải dữ liệu dữ liệu từ Render</td></tr>`;
    } finally {
        refreshIcon.classList.remove('fa-spin');
    }
}

// Hiển thị ra bảng kèm nút Sửa & Xóa
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
                <div class="action-cell">
                    <button class="btn-edit" onclick="openStudentModal('edit', '${sv.MaSV}', '${escapeHtml(sv.HoTen)}', '${escapeHtml(sv.Lop)}', '${escapeHtml(sv.Nganh)}')" title="Sửa thông tin">
                        <i class="fa-solid fa-pen-to-square"></i> Sửa
                    </button>
                    <button class="btn-delete" onclick="deleteStudent('${sv.MaSV}')" title="Xóa sinh viên">
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

// 1. Thêm Sinh Viên cho Khách (Form công khai)
async function addStudentPublic() {
    const btnSubmit = document.getElementById('btnSubmitPub');
    const hoTen = document.getElementById('hoTenPub').value.trim();
    const maSV = document.getElementById('maSVPub').value.trim();
    const lop = document.getElementById('lopPub').value.trim();
    const nganh = document.getElementById('nganhPub').value.trim();

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
                title: 'Gửi Thành Công!',
                text: 'Thông tin của bạn đã được lưu vào hệ thống.',
                background: '#0f172a', color: '#fff', confirmButtonColor: '#10b981'
            });
            document.getElementById('studentFormPublic').reset();
        } else {
            throw new Error(result.message || 'Lỗi thêm dữ liệu');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error', title: 'Thất Bại', text: error.message,
            background: '#0f172a', color: '#fff'
        });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span class="btn-text">Lưu Dữ Liệu</span> <i class="fa-solid fa-paper-plane btn-icon"></i>`;
    }
}

// 2. Mở Modal POPUP (Thêm hoặc Sửa Sinh Viên cho Admin)
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

    modal.style.display = 'flex';
}

function closeStudentModal() {
    document.getElementById('studentModal').style.display = 'none';
}

// 3. Lưu thông tin từ Modal Popup (Admin)
async function saveStudentFromModal() {
    const hoTen = document.getElementById('modalHoTen').value.trim();
    const maSV = document.getElementById('modalMaSV').value.trim();
    const lop = document.getElementById('modalLop').value.trim();
    const nganh = document.getElementById('modalNganh').value.trim();
    const originalMaSV = document.getElementById('modalEditOriginalMaSV').value;

    if (!hoTen || !maSV || !lop || !nganh) return;

    try {
        if (currentModalMode === 'edit' && originalMaSV && originalMaSV !== maSV) {
            // Nếu đổi Mã SV khác: Xóa mã cũ
            await fetch(`${API_URL}/api/sinhvien/${originalMaSV}`, { method: 'DELETE' });
        }

        // Gọi API thêm/chèn mới (Upsert)
        const response = await fetch(`${API_URL}/api/sinhvien`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ HoTen: hoTen, MaSV: maSV, Lop: lop, Nganh: nganh })
        });

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: currentModalMode === 'add' ? 'Thêm thành công!' : 'Cập nhật thành công!',
                background: '#0f172a', color: '#fff', timer: 1500, showConfirmButton: false
            });
            closeStudentModal();
            loadStudents();
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Lỗi lưu thông tin');
        }
    } catch (error) {
        Swal.fire({
            icon: 'error', title: 'Lỗi', text: error.message,
            background: '#0f172a', color: '#fff'
        });
    }
}

// 4. Xóa Sinh Viên (Admin)
async function deleteStudent(maSV) {
    const confirm = await Swal.fire({
        title: 'Xác nhận xóa?',
        text: `Bạn có chắc muốn xóa sinh viên [${maSV}]?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Đồng ý xóa',
        cancelButtonText: 'Hủy',
        background: '#0f172a', color: '#fff'
    });

    if (confirm.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/api/sinhvien/${maSV}`, { method: 'DELETE' });

            if (response.ok) {
                Swal.fire({ icon: 'success', title: 'Đã xóa!', background: '#0f172a', color: '#fff', timer: 1200, showConfirmButton: false });
                loadStudents();
            } else {
                throw new Error('Không thể xóa dữ liệu');
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: error.message, background: '#0f172a', color: '#fff' });
        }
    }
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
}