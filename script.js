// ---------- ЖАЛГЫЗ ПАРОЛЬ ----------
const MASTER_PASSWORD = "murac2025";   // 🔑 Өзүңүзгө ылайыктуу пароль коюңуз

let mediaItems = [];
let currentUser = null;

function loadData() {
    const stored = localStorage.getItem("murac_family_media");
    if (stored) {
        mediaItems = JSON.parse(stored);
    } else {
        mediaItems = [];
    }
}

function saveMedia() {
    localStorage.setItem("murac_family_media", JSON.stringify(mediaItems));
}

function attemptLogin() {
    const password = document.getElementById("accessCode").value.trim();
    const errorDiv = document.getElementById("loginError");

    if (!password) {
        errorDiv.innerText = "✨ Үй-бүлөлүк пароль керек!";
        return;
    }
    if (password !== MASTER_PASSWORD) {
        errorDiv.innerText = "🔒 Пароль туура эмес... Кайра аракет кылыңыз.";
        return;
    }

    let userName = prompt("💫 Салам! Өз атыңызды жазыңыз (мисалы: Ата, Эне, Айжан, Нурбек)");
    if (!userName || userName.trim() === "") {
        userName = "Жан үй-бүлө";
    }
    currentUser = userName.trim().substring(0, 25);
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("gallerySection").style.display = "block";
    document.getElementById("currentUserName").innerText = currentUser;
    document.getElementById("userAvatar").innerText = currentUser.charAt(0).toUpperCase();
    renderMediaGrid();
    updateWarning();
}

function logout() {
    currentUser = null;
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("gallerySection").style.display = "none";
    document.getElementById("accessCode").value = "";
    document.getElementById("loginError").innerText = "";
}

// Жүктөө
document.getElementById("fileUpload").addEventListener("change", function(e) {
    const files = Array.from(e.target.files);
    if (!currentUser) return;

    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const type = file.type.startsWith("image/") ? "image" : "video";
            const newMedia = {
                id: Date.now() + "_" + Math.random() + file.name,
                type: type,
                dataURL: ev.target.result,
                uploaderName: currentUser,
                timestamp: Date.now(),
                viewers: []
            };
            mediaItems.unshift(newMedia);
            saveMedia();
            renderMediaGrid();
            updateWarning();
        };
        reader.readAsDataURL(file);
    }
    e.target.value = "";
});

function canViewMedia(media) {
    if (media.viewers.includes(currentUser)) return true;
    return media.viewers.length < 10;
}

function registerView(mediaId) {
    const media = mediaItems.find(m => m.id === mediaId);
    if (!media) return false;
    if (media.viewers.includes(currentUser)) return true;
    if (media.viewers.length >= 10) {
        alert("Бул эскерүүнү 10 адам көрүп бүткөн. Сиз көрө албайсыз 😔");
        return false;
    }
    media.viewers.push(currentUser);
    saveMedia();
    renderMediaGrid();
    updateWarning();
    return true;
}

function viewMediaHandler(mediaId) {
    const media = mediaItems.find(m => m.id === mediaId);
    if (!media) return;
    if (canViewMedia(media)) {
        registerView(mediaId);
    } else {
        alert("Кечиресиз, бул медианы көрүү чеги 10 адамга жеткен. 🤍");
        renderMediaGrid();
    }
}

function deleteMediaItem(mediaId) {
    const media = mediaItems.find(m => m.id === mediaId);
    if (!media) return;
    if (media.uploaderName === currentUser) {
        if (confirm("Бул жандуу эскерүүнү өчүрүү керекпи?")) {
            mediaItems = mediaItems.filter(m => m.id !== mediaId);
            saveMedia();
            renderMediaGrid();
            updateWarning();
        }
    } else {
        alert("🎈 Тек өзүңүз жүктөгөн медианы өчүрө аласыз.");
    }
}

function renderMediaGrid() {
    const grid = document.getElementById("mediaGrid");
    if (!grid) return;
    if (mediaItems.length === 0) {
        grid.innerHTML = `<div class="empty-state">
            🕊️ Азырынча эч нерсе жок. Биринчи сүрөт же видео менен үй-бүлөңүздүн жылуулугун кошуңуз.
        </div>`;
        return;
    }

    let html = '<div class="media-grid">';
    for (let media of mediaItems) {
        const canView = canViewMedia(media);
        const viewCountText = `${media.viewers.length}/10 👁️`;
        const isBlocked = !canView && !media.viewers.includes(currentUser);
        
        html += `<div class="media-card">`;
        html += `<div class="view-counter">${viewCountText}</div>`;
        html += `<div class="media-preview" onclick="viewMediaHandler('${media.id}')">`;
        
        if (media.type === "image") {
            if (!isBlocked) {
                html += `<img src="${media.dataURL}" alt="үй-бүлө сүрөтү" loading="lazy">`;
            } else {
                html += `<img src="${media.dataURL}" alt="блок" style="filter: blur(12px);">`;
                html += `<div class="blocked-overlay">🔒 10 адам көргөн<br>🌙 Мүмкүн эмес</div>`;
            }
        } else {
            if (!isBlocked) {
                html += `<video controls><source src="${media.dataURL}" type="video/mp4"></video>`;
            } else {
                html += `<video style="filter: blur(14px);" controls><source src="${media.dataURL}" type="video/mp4"></video>`;
                html += `<div class="blocked-overlay">🎞️ Көрүү лимити толду</div>`;
            }
        }
        
        html += `</div>`;
        html += `<div class="media-info">`;
        html += `<div class="uploader-details">
                    <span class="uploader-name">📎 ${escapeHtml(media.uploaderName)}</span>
                    <span style="font-size:0.7rem;">${new Date(media.timestamp).toLocaleDateString('ky-KG')}</span>
                 </div>`;
        html += `<button class="delete-btn" onclick="deleteMediaItem('${media.id}')">🗑️</button>`;
        html += `</div></div>`;
    }
    html += '</div>';
    grid.innerHTML = html;
    
    // видеолорду иштетүү (кошумча)
    document.querySelectorAll('.media-preview video').forEach(vid => {
        vid.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

function updateWarning() {
    const warn = document.getElementById("accessLimitWarning");
    if (!warn) return;
    const hasAlmost = mediaItems.some(m => m.viewers.length >= 9 && m.viewers.length < 10);
    warn.style.display = hasAlmost ? "flex" : "none";
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Башка өзгөрүүлөрдү синхрондоштуруу
setInterval(() => {
    if (currentUser) {
        const old = JSON.stringify(mediaItems);
        loadData();
        if (JSON.stringify(mediaItems) !== old) {
            renderMediaGrid();
            updateWarning();
        }
    }
}, 2200);

document.getElementById("accessCode").addEventListener("keypress", (e) => {
    if (e.key === "Enter") attemptLogin();
});

loadData();