// =================== FIREBASE INIT ===================
const firebaseConfig = {
  apiKey: "AIzaSyB5DBP6zUWlfrbH1AHGE9TRpNewh2eUzD4",
  authDomain: "kutubxona-4b423.firebaseapp.com",
  projectId: "kutubxona-4b423",
  storageBucket: "kutubxona-4b423.firebasestorage.app",
  messagingSenderId: "819215312453",
  appId: "1:819215312453:web:0cc97ae4e273ad7aeae52c"
};
firebase.initializeApp(firebaseConfig);

// =================== SUPABASE STORAGE INIT ===================
const SUPABASE_URL = 'https://nnrhivhwswibdpnygkwp.supabase.co'; // o'zingiz URL qo'ying
const SUPABASE_ANON_KEY = 'sb_publishable_7xApUVAMQbxv9AhNfVm2NQ_ENrprB9n'; // hozirgi publishable key
const SUPABASE_BUCKET = 'books';
// O'zgaruvchi nomini _supabase yoki supabaseClient deb o'zgartiring
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================== ELEMENTS ===================
const html = document.documentElement;
const booksContainer = document.getElementById('booksContainer');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.querySelectorAll('.category-btn');
const categoriesRow = document.querySelector('.categories-row');
const toggleThemeBtn = document.getElementById('toggleTheme');
const toggleLangBtn = document.getElementById('toggleLang');
const uploadSection = document.getElementById('uploadSection');
const adminToggleBtn = document.getElementById('adminToggle');
const uploadForm = document.getElementById('uploadForm');
const progressWrap = document.getElementById('progressWrap');
const progressBar = document.getElementById('progressBar');

// Modal elements
const pdfModal = document.getElementById('pdfModal');
const openPDFBtn = document.getElementById('openPDFBtn');
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
const downloadNotice = document.getElementById('downloadNotice');
const openDownloaded = document.getElementById('openDownloaded');
const modalClose = document.querySelector('.modal-close');

// Category Overlay elements
const overlay = document.getElementById('categoryOverlay');
const overlayClose = document.getElementById('overlayClose');
const overlayBooks = document.getElementById('overlayBooks');
const overlayTitle = document.getElementById('overlayTitle');
const overlayContent = document.querySelector('.overlay-content');

// Splash elements
const splash = document.getElementById('splash');

// State
let activeCategory = "";
let allBooks = [];
let isAdmin = false;
let currentPDF = "";
let currentPDFTitle = "kitob"; // PDF yuklanish uchun fayl nomi
let currentBookId = null; // PDF modal-da kitob ID-ni saqlab turish
let currentBookFileURL = null; // PDF modal-da kitob file URL-ni saqlab turish
let currentBlobURL = null; // Blob URL for downloaded PDF
let isKirill = true; // language state
let booksUnsubscribe = null; // Firestore listener unsubscribe function

// =================== NOTIFICATION TOAST ===================
function showNotification(message, type = 'success', duration = 2500) {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? '#00C9A7' : '#ff6b6b';
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${bgColor};
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    z-index: 3000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 600;
    animation: slideDown 0.3s ease;
    max-width: 90%;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  `;
  
  notification.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// =================== CUSTOM CONFIRM DIALOG ===================
function showConfirm(title, message) {
  return new Promise((resolve) => {
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');
    
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOk.textContent = isKirill ? 'Ҳа' : 'Yes';
    confirmCancel.textContent = isKirill ? 'Йўқ' : 'No';
    confirmModal.hidden = false;
    confirmModal.classList.add('show');
    
    const handleOk = () => {
      confirmModal.classList.remove('show');
      setTimeout(() => confirmModal.hidden = true, 300);
      confirmOk.removeEventListener('click', handleOk);
      confirmCancel.removeEventListener('click', handleCancel);
      resolve(true);
    };
    
    const handleCancel = () => {
      confirmModal.classList.remove('show');
      setTimeout(() => confirmModal.hidden = true, 300);
      confirmOk.removeEventListener('click', handleOk);
      confirmCancel.removeEventListener('click', handleCancel);
      resolve(false);
    };
    
    confirmOk.addEventListener('click', handleOk);
    confirmCancel.addEventListener('click', handleCancel);
  });
}

// =================== ADMIN MODAL ELEMENTS ===================
const adminPasswordModal = document.getElementById('adminPasswordModal');
const adminPasswordInput = document.getElementById('adminPasswordInput');
const adminPasswordSubmit = document.getElementById('adminPasswordSubmit');
const adminPasswordCancel = document.getElementById('adminPasswordCancel');
const adminPasswordClose = document.getElementById('adminPasswordClose');
function setTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const themeText = {
    'light': '<i class="fas fa-moon"></i> Қоронғу режим',
    'dark': '<i class="fas fa-sun"></i> Ёруғ режим'
  };
  toggleThemeBtn.innerHTML = themeText[theme];
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(saved);
}

toggleThemeBtn.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.body.animate([{ filter:'brightness(1.0)' },{ filter:'brightness(1.06)' },{ filter:'brightness(1.0)'}], { duration: 320 });
  setTheme(next);
});

// =================== LANGUAGE ===================
const TRANSLATIONS = {
    'Кутубхонага': 'Kutubxonaga',
    'Хуш келибсиз!': 'Xush kelibsiz!',
    'Премиум Кутубхона': 'Premium Kutubxona',
    'Сизга китоб тавсия қиламиз!': 'Sizga kitob tavsiya qilamiz!',
    'Қайси китобни қидиряпсиз?': 'Qaysi kitobni qidiryapsiz?',
    'Қоронғу режим': 'Qorong\'u rejim',
    'Ёруғ режим': 'Yorug\' rejim',
    'Тил': 'Til',
    'Қуръони Карим': 'Qur\'oni Karim',
    'Тафсир китоблари': 'Tafsir kitoblari',
    'Ҳадис китоблари': 'Hadis kitoblari',
    'Фиқҳий китоблари': 'Fiqhiy kitoblari',
    'Ақида китоблари': 'Aqida kitoblari',
    'Тарих китоблари': 'Tarix kitoblari',
    'Сийрат китоблари': 'Siyrat kitoblari',
    'Саҳобалар ҳаёти': 'Sahobalar hayoti',
    'Ахлоқ ва тарбия': 'Axloq va tarbiya',
    'Дуо ва зикрлар': 'Duo va zikrlar',
    'Ал-Ваъй журнали': 'Al-Va\'y jurnali',
    'Ҳизб китоблари': 'Hizb kitoblari',
    'Admin Rejim': 'Admin Rejim',
    'Янги китоб қўшиш': 'Yangi kitob qoshish',
    'Китоб номи': 'Kitob nomi',
    'Тавсиф': 'Tavsif',
    'Категория танланг': 'Kategoriya tanlang',
    'Китоб қўшиш': 'Kitob qoshish',
    'PDF билан нима қилмоқчисиз?': 'PDF bilan nima qilmoqchisiz?',
    'Браузерда очиш': 'Brauzerda ochish',
    'Юклаб олиш': 'Yuklab olish',
    'PDF қурилмангизга муваффақиятли юкланди!': 'PDF qurilmangizga muvaffaqiyatli yuklandi!',
    'Юкланган PDF\'ни очиш': 'Yuklangan PDF\'ni ochish',
    'Ҳозирча бу ерда китоб йўқ...': 'Hozircha bu yerda kitob yo\'q...',
    'PDF': 'PDF',
    'Ўчириш': 'O\'chirish',
    'Китоб қўшиш ва ўчириш учун паролни киритинг:': 'Kitob qo\'shish va o\'chirish uchun parolni kiriting:',
    'Админ режимига муваффақиятли кирдингиз!': 'Admin rejimiga muvaffaqiyatli kirdingiz!',
    'Нотўғри парол!': 'Noto\'g\'ri parol!',
    'PDF файл танланмаган!': 'PDF fayl tanlanmagan!',
    'Юклашда хатолик: ': 'Yuklashda xatolik: ',
    'Китоб муваффақиятли қўшилди!': 'Kitob muvaffaqiyatli qo\'shildi!',
    'Хатолик: ': 'Xatolik: ',
    'Сизда ўчириш ҳуқуқи йўқ!': 'Sizda o\'chirish huquqi yo\'q!',
    'Ҳақиқатан ҳам бу китобни ўчирмоқчимисиз?': 'Haqiqatan ham bu kitobni o\'chirmoqchimisiz?',
    'Китоб муваффақиятли ўчирилди!': 'Kitob muvaffaqiyatli o\'chirildi!',
    'Ўчиришда хатолик: ': 'O\'chirishда хатолик: '
};

function setLanguage(isKirillParam) {
    isKirill = isKirillParam;
    localStorage.setItem('language', isKirill ? 'kirill' : 'lotin');
    
    // Matnli elementlarni yangilash (category-btnlarni keyin qayta o'rnatamiz, shu sababli ulardan avval ajratib olamiz)
    document.querySelectorAll('[data-original-text]:not(.category-btn)').forEach(el => {
        const key = el.getAttribute('data-original-text');
        el.textContent = isKirill ? key : (TRANSLATIONS[key] || key);
    });

    // Input placeholderlarini yangilash
    document.querySelectorAll('input[data-original-placeholder]').forEach(input => {
        const placeholderKey = input.getAttribute('data-original-placeholder');
        input.placeholder = isKirill ? placeholderKey : (TRANSLATIONS[placeholderKey] || placeholderKey);
    });

    // Select optionlarini yangilash
    document.querySelectorAll('select option').forEach(option => {
        const originalOptionText = option.getAttribute('data-original-text') || option.textContent.trim();
        if (!option.hasAttribute('data-original-text')) {
            option.setAttribute('data-original-text', originalOptionText);
        }
        const optionKey = option.getAttribute('data-original-text');
        option.textContent = isKirill ? optionKey : (TRANSLATIONS[optionKey] || optionKey);
    });
    
    // Maxsus tugmalarni yangilash (iconlari bor)
    const updateButtonText = (btn, textKey) => {
        const icon = btn.querySelector('i');
        const translatedText = isKirill ? textKey : TRANSLATIONS[textKey] || textKey;
        btn.innerHTML = `${icon ? icon.outerHTML : ''} ${translatedText}`;
    };

    updateButtonText(toggleLangBtn, 'Тил');
    updateButtonText(toggleThemeBtn, 'Қоронғу режим');
    updateButtonText(adminToggleBtn, 'Admin Rejim');
    const uploadBtn = document.querySelector('#uploadForm .btn-primary');
    if (uploadBtn) updateButtonText(uploadBtn, 'Китоб қўшиш');
    
    // Kategoriyalar matnini yangilash (iconlari bilan)
    document.querySelectorAll('.category-btn').forEach(btn => {
        const icon = btn.querySelector('i');
        const originalText = btn.getAttribute('data-original-text');
        const iconHTML = icon ? icon.outerHTML : '';
        btn.innerHTML = `${iconHTML} ${isKirill ? originalText : TRANSLATIONS[originalText] || originalText}`;
    });

    // overlay matnini yangilash
    if (activeCategory) {
        overlayTitle.textContent = isKirill ? activeCategory : (TRANSLATIONS[activeCategory] || activeCategory);
        // Overlay scrollni top ga qaytarish
        setTimeout(() => {
            overlayContent.scrollTop = 0;
        }, 10);
    }

    // Qidiruv maydoni yangilansin
    filterBooks();
}

function filterCategories(query) {
    const normalized = (query || '').toLowerCase();
    let visible = 0;

    categoryButtons.forEach(btn => {
        const original = btn.getAttribute('data-original-text') || btn.textContent.trim();
        const translated = isKirill ? original : (TRANSLATIONS[original] || original);
        const match = !normalized || translated.toLowerCase().includes(normalized);
        btn.style.display = match ? 'inline-flex' : 'none';
        if (match) visible += 1;
    });

    let noResult = document.getElementById('category-no-result');
    if (!normalized) {
        if (noResult) noResult.remove();
        return;
    }

    if (visible === 0) {
        if (!noResult) {
            noResult = document.createElement('p');
            noResult.id = 'category-no-result';
            noResult.className = 'no-books-message';
            noResult.style.textAlign = 'center';
            noResult.style.width = '100%';
            noResult.style.marginTop = '1rem';
            noResult.textContent = isKirill ? 'Hech qanday kategoriya topilmadi.' : 'No categories found.';
            categoriesRow.after(noResult);
        }
    } else if (noResult) {
        noResult.remove();
    }
}


function switchLanguage() {
    setLanguage(!isKirill);
}

function loadLanguage() {
    const saved = localStorage.getItem('language') || 'kirill';
    setLanguage(saved === 'kirill');
}

toggleLangBtn.addEventListener('click', switchLanguage);

// =================== SPLASH SEQUENCE ===================
function runSplash() {
  setTimeout(() => {
    splash.classList.add('splash-fade-out');
    setTimeout(() => {
      if (splash && splash.parentNode) splash.remove();
      revealAll();
    }, 800);
  }, 2800);
}

// =================== BOOK CARD TEMPLATE ===================
function bookCardTemplate(book) {
    const title = isKirill ? book.title : (TRANSLATIONS[book.title] || book.title);
    return `
        <article class="card reveal" data-id="${book.id}" data-link="${book.link}" data-category="${book.category}">
            <div class="book-title">${title || 'Номсиз китоб'}</div>
            ${isAdmin ? `
            <div class="card-actions">
                <button class="btn btn-danger" data-action="delete" data-id="${book.id}" data-link="${book.link}" type="button">
                    <i class="fas fa-trash"></i> ${isKirill ? 'Ўчириш' : 'Delete'}
                </button>
            </div>` : ''}
        </article>
    `;
}

function renderBooks(list, container) {
  const noBooksMessage = isKirill ? `Ҳозирча бу ерда китоб йўқ...` : `Hozircha bu yerda kitob yo'q...`;
  container.innerHTML = list.length 
    ? list.map(bookCardTemplate).join('') 
    : `<p class="no-books-message">${noBooksMessage}</p>`;
  revealAll();
}

// =================== FILTERING ===================
function filterBooks() {
  const q = (searchInput.value || '').toLowerCase();

  if (activeCategory) {
    // Overlay yopiq bo'lganda kategoriya ichidagi kitoblarni filtrlash
    const filtered = allBooks.filter(b => 
      b.category === activeCategory && 
      (!q || (b.title && b.title.toLowerCase().includes(q)) || 
             (b.description && b.description.toLowerCase().includes(q)))
    );
    renderBooks(filtered, overlayBooks);
  } else {
    // Bosh sahifada faqat qidirsh bo'yicha kitoblarni chiqarish
    if (q) {
      // Qidiruv qidirsa kitoblarni chiqar
      const filtered = allBooks.filter(b => 
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
      renderBooks(filtered, booksContainer);
    } else {
      // Qidiruv bo'sh bo'lsa bosh sahifani tozala
      booksContainer.innerHTML = '';
    }
  }
}

searchInput.addEventListener('input', () => {
    // Qidiruv qidirsa kitoblarni filtrlash (kategoriyalarni emas!)
    filterBooks();
});

// =================== CATEGORY OVERLAY (history + overlay background sync) ===================
function openOverlay(category, pushHistory = true) {
    activeCategory = category;
    overlayTitle.textContent = isKirill ? category : (TRANSLATIONS[category] || category);
    categoryButtons.forEach(b =>
      b.classList.toggle('active', b.dataset.category === activeCategory)
    );

    // faqat shu kategoriyadan kitoblarni chiqaramiz
    const filtered = allBooks.filter(b => b.category === activeCategory);
    renderBooks(filtered, overlayBooks);

    // overlay kartochkalar fonini tanlangan kategoriya tugmasiga moslab o'zgartirish
    const btn = document.querySelector(`.category-btn[data-category="${category}"]`);
    if (btn) {
      const computed = getComputedStyle(btn);
      // background could be gradient - copy as is
      const bg = computed.backgroundImage || computed.background;
      // set CSS var to overlay content and to root for usage
      overlayContent.style.setProperty('--active-cat-bg', bg);
      document.documentElement.style.setProperty('--active-cat-bg', bg);
    }

    revealAll();
    overlay.hidden = false;
    setTimeout(() => overlay.classList.add('show'), 10);

    if (pushHistory && window.location.protocol.startsWith('http')) {
      // push an entry to history so phone back button can close overlay
      const slug = category.replace(/\s+/g, '-').toLowerCase();
      history.pushState({ overlayOpen: true, category }, "", `#category-${slug}`);
    }
}

function closeOverlay(skipHistory = false) {
    overlay.classList.remove('show');
    setTimeout(() => { overlay.hidden = true; }, 400);
    // remove active class on categories
    categoryButtons.forEach(b => b.classList.remove('active'));
    activeCategory = "";
    booksContainer.innerHTML = ''; // Asosiy sahifani tozalash

    // If we didn't come from popstate, move history back so popstate handler won't be confused
    if (!skipHistory && history.state && history.state.overlayOpen) {
      // go back to previous state (this will trigger popstate)
      history.back();
    }
}

overlayClose.addEventListener('click', () => closeOverlay(false));

// category tugmalarini yangilash
categoryButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const cat = e.currentTarget.dataset.category;
    openOverlay(cat, true);
  });
});

// Listen to popstate to handle hardware back button / browser back
window.addEventListener('popstate', (e) => {
  // if the new state is overlayOpen, open it (useful if user used back/forward)
  if (e.state && e.state.overlayOpen) {
    openOverlay(e.state.category, false);
  } else {
    // no overlayOpen in state => close overlay (skipHistory true so we don't call history.back() again)
    if (!overlay.hidden) closeOverlay(true);
  }
});

// =================== PDF MODAL ===================
function showPDFOptions(pdfURL, bookTitle = "kitob", bookId = null, fileURL = null) {
  currentPDF = pdfURL;
  currentPDFTitle = bookTitle;
  currentBookId = bookId;
  currentBookFileURL = fileURL;
  currentBlobURL = null; // Reset blob URL
  downloadNotice.hidden = true;
  pdfModal.hidden = false;
  
  // Admin rejimda o'chirish tugmasini ko'rsatish
  const deletePDFBtn = document.getElementById('deletePDFBtn');
  if (deletePDFBtn) {
    // Eski onclick hodisalari o'chirib tashlash
    deletePDFBtn.onclick = null;
    
    if (isAdmin) {
      deletePDFBtn.style.display = 'inline-flex';
      // Yangi event listener o'rnatish
      deletePDFBtn.onclick = async () => {
        await deleteBook(bookId); // currentBookId emas, argumentdan kelgan bookId
      };
    } else {
      deletePDFBtn.style.display = 'none';
    }
  }
  
  setTimeout(() => pdfModal.classList.add('show'), 10);
}

openPDFBtn.addEventListener('click', () => { 
  if (currentPDF) window.open(currentPDF, '_blank'); 
});

downloadPDFBtn.addEventListener('click', async () => {
  if (!currentPDF) {
    showNotification('PDF URL mavjud emas!', 'error');
    return;
  }

  try {
    // PDF-ni fetch qilish
    const response = await fetch(currentPDF);
    if (!response.ok) throw new Error('PDF yuklanmadi');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Yuklab olish uchun link yaratish
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPDFTitle}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Blob URL-ni saqlash va ochish tugmasiga o'rnatish
    currentBlobURL = url;
    openDownloaded.href = url;

    // Muvaffaqiyat xabari
    showNotification('PDF qurilmangizga muvaffaqiyatli yuklandi!', 'success');
    downloadNotice.hidden = false;
  } catch (error) {
    showNotification('Yuklashda xatolik: ' + error.message, 'error');
  }
});

modalClose.addEventListener('click', () => {
  pdfModal.classList.remove('show');
  setTimeout(() => { 
    pdfModal.hidden = true; 
    // Blob URL-ni tozalash
    if (currentBlobURL) {
      URL.revokeObjectURL(currentBlobURL);
      currentBlobURL = null;
    }
  }, 300);
});

pdfModal.addEventListener('click', (e) => { 
  if (e.target === pdfModal) {
    pdfModal.classList.remove('show');
    setTimeout(() => { pdfModal.hidden = true; }, 300);
  }
});

// Delete button listener removed - now handled in showPDFOptions function

// =================== Delegate actions on main page cards ===================
// Asosiy sahifada kitoblar bo'lmaydi, shuning uchun bu funksiya o'chirib tashlandi.

// =================== CLICK HANDLERS ===================
overlayBooks.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('[data-action="delete"]');
  console.log('overlayBooks click', e.target, 'deleteBtn', deleteBtn);

  if (deleteBtn) {
    e.stopPropagation();
    e.preventDefault();

    if (!isAdmin) {
      showNotification(isKirill ? '❌ Admin rejимига кiring!' : '❌ Admin mode required!', 'error');
      return;
    }

    const bookId = deleteBtn.dataset.id || deleteBtn.closest('.card')?.dataset.id;
    if (!bookId) {
      showNotification(isKirill ? '❌ Китоб ID топилмади' : '❌ Book ID not found', 'error');
      console.error('deleteBtn missing bookId', deleteBtn);
      return;
    }

    console.log('DELETE BUTTON CLICK', { bookId });
    deleteBook(bookId);
    return;
  }
  
  const card = e.target.closest('.card');
  if (card && card.dataset.link) {
    const bookTitle = card.querySelector('.book-title')?.textContent || 'kitob';
    showPDFOptions(card.dataset.link, bookTitle, card.dataset.id, card.dataset.link);
  }
}, false);

// =================== ADMIN ===================
adminToggleBtn.addEventListener('click', () => {
  if (isAdmin) {
    setAdminMode(false);
  } else {
    adminPasswordModal.hidden = false;
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
    setTimeout(() => adminPasswordModal.classList.add('show'), 10);
  }
});

// =================== ADMIN MODE FUNCTION ===================
function setAdminMode(isAdminMode) {
  isAdmin = isAdminMode;
  document.body.classList.toggle('admin-mode', isAdminMode);
  uploadSection.hidden = !isAdminMode;
  
  const icon = adminToggleBtn.querySelector('i');
  const iconHTML = icon ? icon.outerHTML : '<i class="fas fa-key"></i>';
  const btnText = isAdminMode ? 'Admin rejimdan chiqish' : 'Admin Rejim';
  adminToggleBtn.innerHTML = `${iconHTML} ${btnText}`;
  adminToggleBtn.style.background = isAdminMode ? '#ff6b6b' : '#00C9A7';
  
  if (activeCategory) {
    const filtered = allBooks.filter(b => b.category === activeCategory);
    renderBooks(filtered, overlayBooks);
  }
  
  if (isAdminMode) {
    showNotification(isKirill ? '✅ Admin rejimiga kirgansiz!' : '✅ You entered admin mode!', 'success');
  } else {
    if (activeCategory) closeOverlay(true);
    showNotification(isKirill ? '✅ Admin rejimdan chiqtingiz!' : '✅ You exited admin mode!', 'success');
  }
}

// =================== ADMIN MODAL LISTENERS ===================
adminPasswordSubmit.addEventListener('click', () => {
  const password = adminPasswordInput.value.trim();
  const correctPassword = 'XoLiSaMaLqIlGuVcHiLaRdAnQiL.';
  
  if (!password) {
    showNotification(
      isKirill ? '❌ Parol kiriting!' : '❌ Enter password!',
      'error'
    );
    return;
  }
  
  if (password === correctPassword) {
    setAdminMode(true);
    adminPasswordModal.classList.remove('show');
    setTimeout(() => {
      adminPasswordModal.hidden = true;
    }, 300);
  } else {
    showNotification(
      isKirill ? '❌ Parol noto\'g\'ri!' : '❌ Wrong password!',
      'error'
    );
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
  }
});

adminPasswordCancel.addEventListener('click', () => {
  adminPasswordModal.classList.remove('show');
  setTimeout(() => {
    adminPasswordModal.hidden = true;
  }, 300);
  adminPasswordInput.value = '';
});

adminPasswordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    adminPasswordSubmit.click();
  }
});

// =================== UPLOAD ===================
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('bookTitle').value.trim();
  const description = document.getElementById('bookDescription').value.trim();
  const category = document.getElementById('bookCategory').value;
  const file = document.getElementById('bookFile').files[0];
  
  if (!file) { 
    showNotification(
      isKirill ? '❌ PDF файл танланмаган!' : '❌ PDF fayl tanlanmagan!',
      'error'
    );
    return; 
  }
  
  try {
    const clean = file.name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_\-.]/g,'');
    const unique = `${Date.now()}_${clean}`;
    const filePath = `${unique}`;

    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    
    // Simulate upload progress
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) progress += Math.random() * 30;
      progressBar.style.width = Math.min(progress, 90) + '%';
      progressBar.textContent = Math.floor(Math.min(progress, 90)) + '%';
    }, 300);

    const { data: uploadData, error: uploadError } = await _supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData, error: publicUrlError } = _supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(filePath);

    if (publicUrlError) {
      throw publicUrlError;
    }

    const url = publicUrlData.publicUrl;
    
    // Complete the progress bar
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';

    await firebase.firestore().collection('books').add({
      title,
      description,
      category,
      link: url,
      path: filePath,
      secret_code: 'XoLiSaMaLqIlGuVcHiLaRdAnQiL.',
      created: new Date()
    });

    progressWrap.hidden = true;
    
    // Show success using consistent notification function
    showNotification(
      isKirill ? '✅ Китоб муваффақиятли қўшилди!' : '✅ Book successfully added!',
      'success',
      3000
    );
    
    uploadForm.reset();
    // Admin rejimi saqlab turish
    // uploadSection.hidden = true;
  } catch(err) {
    console.error('Upload error:', err);
    if (typeof progressInterval !== 'undefined') clearInterval(progressInterval);
    progressWrap.hidden = true;
    showNotification(
      isKirill ? '❌ Хатолик: ' + err.message : '❌ Error: ' + err.message,
      'error'
    );
  }
});

// =================== DELETE BOOK ===================
async function deleteBook(bookId) {
  if (!isAdmin) {
    showNotification(isKirill ? '❌ Admin rejimida emas!' : '❌ Not in admin mode!', 'error');
    return;
  }

  if (!bookId) {
    showNotification(isKirill ? '❌ ID топилмади' : '❌ ID not found', 'error');
    return;
  }

  const db = firebase.firestore();
  const docRef = db.collection('books').doc(bookId);
  const doc = await docRef.get();

  if (!doc.exists) {
    showNotification(isKirill ? '❌ Китоб топилмади' : '❌ Book not found', 'error');
    return;
  }

  const bookTitle = doc.data()?.title || (isKirill ? 'kitob' : 'book');

  const confirmDelete = await showConfirm(
    isKirill ? '⚠️ Огохлантириш!' : '⚠️ Delete?',
    isKirill
      ? `Сиз ростдан ҳам "${bookTitle}" китобини ўчириб юбормоқчимисиз?`
      : `Are you sure you want to delete "${bookTitle}"?`
  );

  if (!confirmDelete) return;

  try {
    
    if (!doc.exists) {
      showNotification(isKirill ? '❌ Китоб топилмади' : '❌ Book not found', 'error');
      return;
    }

    const path = doc.data().path;
    
    // 1. Firestore-dan o'chirish
    await docRef.delete();
    
    // 2. Supabase Storage-dan o'chirish (agar path bo'lsa)
    if (path) {
      const { error: storageError } = await _supabase.storage
        .from(SUPABASE_BUCKET)
        .remove([path]);
      if (storageError) console.error("Storage delete error:", storageError);
    }

    // 3. UI yangilash
    allBooks = allBooks.filter(b => b.id !== bookId);
    filterBooks(); // Ro'yxatni qayta filtrlash

    // Modalni yopish
    pdfModal.classList.remove('show');
    setTimeout(() => { pdfModal.hidden = true; }, 300);
    
    showNotification(isKirill ? '✅ Ўчирилди!' : '✅ Deleted!', 'success');
  } catch (err) {
    console.error(err);
    showNotification(isKirill ? `❌ Хатолик: ${err.message}` : `❌ Error: ${err.message}`, 'error');
  }
}

// =================== FIRESTORE ===================
function loadBooks() {
  if (booksUnsubscribe) booksUnsubscribe();
  booksUnsubscribe = firebase.firestore().collection('books').onSnapshot(snap => {
    allBooks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    booksContainer.innerHTML = '';
  });
}

// =================== REVEAL ON SCROLL ===================
const io = new IntersectionObserver((entries) => {
  for (const e of entries) { 
    if (e.isIntersecting) { 
      e.target.classList.add('show'); 
      io.unobserve(e.target); 
    } 
  }
}, { threshold: 0.1 });

function revealAll() {
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// =================== INIT ===================
loadTheme();
loadLanguage();
filterCategories('');
runSplash();
loadBooks();
revealAll();
