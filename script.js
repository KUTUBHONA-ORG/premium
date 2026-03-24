// Splash skrinni har qanday holatda ham o'chirishni kafolatlash
window.addEventListener('load', () => {
  setTimeout(() => {
    const splashElement = document.getElementById('splash');
    if (splashElement) {
      splashElement.classList.add('splash-fade-out');
      setTimeout(() => {
        splashElement.remove();
        // Agar animatsiyalar bo'lsa ularni ishga tushirish
        if (typeof revealAll === "function") revealAll();
      }, 800);
    }
  }, 2800); 
});

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
let isKirill = true; // language state

// =================== THEME ===================
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
    'Қоронғу режим': 'Qorong‘u rejim',
    'Ёруғ режим': 'Yorug‘ rejim',
    'Тил': 'Til',
    'Қуръони Карим': 'Qur’oni Karim',
    'Тафсир китоблари': 'Tafsir kitoblari',
    'Ҳадис китоблари': 'Hadis kitoblari',
    'Фиқҳий китоблари': 'Fiqhiy kitoblari',
    'Ақида китоблари': 'Aqida kitoblari',
    'Тарих китоблари': 'Tarix kitoblari',
    'Сийрат китоблари': 'Siyrat kitoblari',
    'Саҳобалар ҳаёти': 'Sahobalar hayoti',
    'Ахлоқ ва тарбия': 'Axloq va tarbiya',
    'Дуо ва зикрлар': 'Duo va zikrlar',
    'Ал-Ваъй журнали': 'Al-Va’y jurnali',
    'Ҳизб китоблари': 'Hizb kitoblari',
    'Admin Rejim': 'Admin Rejim',
    'Янги китоб қўшиш': 'Yangi kitob qo‘shish',
    'Китоб номи': 'Kitob nomi',
    'Тавсиф': 'Tavsif',
    'Категория танланг': 'Kategoriya tanlang',
    'Китоб қўшиш': 'Kitob qo‘shish',
    'PDF билан нима қилмоқчисиз?': 'PDF bilan nima qilmoqchisiz?',
    'Браузерда очиш': 'Brauzerda ochish',
    'Юклаб олиш': 'Yuklab olish',
    'PDF қурилмангизга муваффақиятли юкланди!': 'PDF qurilmangizga muvaffaqiyatli yuklandi!',
    'Юкланган PDF\'ни очиш': 'Yuklangan PDF\'ni ochish',
    'Ҳозирча бу ерда китоб йўқ...': 'Hozircha bu yerda kitob yo‘q...',
    'PDF': 'PDF',
    'Ўчириш': 'O‘chirish',
    'Китоб қўшиш ва ўчириш учун паролни киритинг:': 'Kitob qo‘shish va o‘chirish uchun parolni kiriting:',
    'Админ режимига муваффақиятли кирдингиз!': 'Admin rejimiga muvaffaqiyatli kirdingiz!',
    'Нотўғри парол!': 'Noto‘g‘ri parol!',
    'PDF файл танланмаган!': 'PDF fayl tanlanmagan!',
    'Юклашда хатолик: ': 'Yuklashda xatolik: ',
    'Китоб муваффақиятли қўшилди!': 'Kitob muvaffaqiyatli qo‘shildi!',
    'Хатолик: ': 'Xatolik: ',
    'Сизда ўчириш ҳуқуқи йўқ!': 'Sizda o‘chirish huquqi yo‘q!',
    'Ҳақиқатан ҳам бу китобни ўчирмоқчимисиз?': 'Haqiqatan ham bu kitobni o‘chirmoqchimisiz?',
    'Китоб муваффақиятли ўчирилди!': 'Kitob muvaffaqiyatli o‘chirildi!',
    'Ўчиришда хатолик: ': 'O‘chirishда хатолик: '
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
    }

    if (!activeCategory) {
      filterCategories(searchInput.value.trim());
    }
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
    const description = isKirill ? book.description : (TRANSLATIONS[book.description] || book.description);
    const category = isKirill ? book.category : (TRANSLATIONS[book.category] || book.category);

    return `
        <article class="card reveal" data-id="${book.id}" data-link="${book.link}" data-category="${book.category}">
            <div class="book-title">${title || 'Номсиз китоб'}</div>
            
            ${isAdmin ? `
            <div class="card-actions">
                <button class="btn btn-danger" data-action="delete" data-id="${book.id}" data-link="${book.link}">
                    <i class="fas fa-trash"></i> ${isKirill ? 'Ўчириш' : 'Delete'}
                </button>
            </div>` : ''}
        </article>
    `;
}

function renderBooks(list, container) {
  const noBooksMessage = isKirill ? `Ҳозирча бу ерда китоб йўқ...` : `Hozircha bu yerda kitob yo‘q...`;
  container.innerHTML = list.length 
    ? list.map(bookCardTemplate).join('') 
    : `<p class="no-books-message">${noBooksMessage}</p>`;
  revealAll();
}

// =================== FILTERING ===================
function filterBooks() {
  const q = (searchInput.value || '').toLowerCase();

  if (activeCategory) {
    const filtered = allBooks.filter(b => 
      b.category === activeCategory && 
      (!q || (b.title && b.title.toLowerCase().includes(q)) || 
             (b.description && b.description.toLowerCase().includes(q)))
    );
    renderBooks(filtered, overlayBooks);
  } else {
    const filtered = allBooks.filter(b => 
      !q ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.description && b.description.toLowerCase().includes(q))
    );
    renderBooks(filtered, booksContainer);
  }
}

searchInput.addEventListener('input', () => {
    // Agar overlay ochiq bo'lsa, faqat overlay ichini filtrlash
    if (activeCategory) {
        filterBooks();
    } else {
        filterCategories(searchInput.value.trim());
    }
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

    if (pushHistory) {
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
function showPDFOptions(pdfURL) {
  currentPDF = pdfURL; 
  downloadNotice.hidden = true;
  pdfModal.hidden = false;
  setTimeout(() => pdfModal.classList.add('show'), 10);
}

openPDFBtn.addEventListener('click', () => { 
  if (currentPDF) window.open(currentPDF, '_blank'); 
});

downloadPDFBtn.addEventListener('click', () => {
  if (!currentPDF) return; 
  const a = document.createElement('a'); 
  a.href = currentPDF; 
  a.download = 'kitob.pdf'; 
  document.body.appendChild(a); 
  a.click(); 
  a.remove();
  openDownloaded.href = currentPDF; 
  downloadNotice.hidden = false;
});

modalClose.addEventListener('click', () => {
  pdfModal.classList.remove('show');
  setTimeout(() => { pdfModal.hidden = true; }, 300);
});

pdfModal.addEventListener('click', (e) => { 
  if (e.target === pdfModal) {
    pdfModal.classList.remove('show');
    setTimeout(() => { pdfModal.hidden = true; }, 300);
  }
});

// =================== Delegate actions on main page cards ===================
// Asosiy sahifada kitoblar bo'lmaydi, shuning uchun bu funksiya o'chirib tashlandi.

// same for overlayBooks (cards inside overlay)
overlayBooks.addEventListener('click', (e) => {
  const delBtn = e.target.closest('[data-action="delete"]');
  if (delBtn) {
    deleteBook(delBtn.dataset.id, delBtn.dataset.link);
    return;
  }
  const card = e.target.closest('.card');
  if (card && card.dataset.link) {
    showPDFOptions(card.dataset.link);
  }
});

// =================== ADMIN ===================
adminToggleBtn.addEventListener('click', () => {
  const password = prompt(isKirill 
    ? "Китоб қўшиш ва ўчириш учун паролни киритинг:" 
    : "Kitob qo‘shish va o‘chirish uchun parolni kiriting:");
  
  if (password === "XoLiSaMaLqIlGuVcHiLaRdAnQiL.") {
    isAdmin = true;
    document.body.classList.add("admin-mode"); // 🔥 qo‘shildi
    uploadSection.hidden = false;
    uploadSection.classList.add('reveal');
    setTimeout(() => uploadSection.classList.add('show'), 10);

    // admin rejimida asosiy sahifadagi barcha kitoblarni ko'rsatmaymiz
    booksContainer.innerHTML = '';
    if (activeCategory) filterBooks();

    alert(isKirill ? "✅ Админ режимига муваффақиятли кирдингиз!" 
                   : "✅ Admin rejimiga muvaffaqiyatli kirdingiz!");
  } else {
    alert(isKirill ? "❌ Нотўғри парол!" : "❌ Noto‘g‘ri parol!");
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
    alert(isKirill ? '❌ PDF файл танланмаган!' : '❌ PDF fayl tanlanmagan!'); 
    return; 
  }
  
  try {
    const clean = file.name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_\-.]/g,'');
    const unique = `${Date.now()}_${clean}`;
    const filePath = `${unique}`;

    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';

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

    await firebase.firestore().collection('books').add({
      title,
      description,
      category,
      link: url,
      path: filePath,
      secret_code: 'XoLiSaMaLqIlGuVcHiLaRdAnQiL.',
      created: new Date()
    });

    alert(isKirill ? '✅ Китоб муваффақиятли қўшилди!' : '✅ Kitob muvaffaqiyatli qo‘shildi!');
    progressWrap.hidden = true;
    uploadForm.reset();
    uploadSection.hidden = true;
  } catch(err) {
    console.error('❌ Xatolik:', err);
    alert(isKirill ? '❌ Хатолик: ' + err.message : '❌ Xatolik: ' + err.message);
    progressWrap.hidden = true;
  }
});

// =================== DELETE ===================
async function deleteBook(bookId, fileURL) {
    // 1. Eng muhim tekshiruv - admin rejimida bo'lmasa, hech narsa qilmaydi
    if (!isAdmin) {
        alert(isKirill 
            ? "❌ Sizda o‘chirish huquqi yo‘q! Faqat admin o‘chira oladi." 
            : "❌ You don't have permission to delete! Only admin can delete.");
        return;
    }

    // 2. Ikki marta tasdiqlash (xato bosib qo‘ymaslik uchun)
    const confirmText = isKirill 
        ? "Haqiqatan ham bu kitobni butunlay o‘chirmoqchimisiz?" 
        : "Are you sure you want to permanently delete this book?";

    if (!confirm(confirmText)) return;

    try {
        const bookDoc = firebase.firestore().collection('books').doc(bookId);
        const doc = await bookDoc.get();
        const bookData = doc.data();
        const path = bookData ? bookData.path : null;

        // Firestore dan o‘chirish
        await bookDoc.delete();

        // Supabase Storage dan ham o‘chirish
        if (path) {
            const { error: deleteError } = await _supabase.storage
                .from(SUPABASE_BUCKET)
                .remove([path]);

            if (deleteError) {
                console.warn('Storage o‘chirishda xatolik:', deleteError);
            }
        }

        alert(isKirill ? '✅ Kitob muvaffaqiyatli o‘chirildi!' : '✅ Book deleted successfully!');
        
        // Sahifani yangilash
        loadBooks();   // yoki filterBooks() agar overlay ochiq bo‘lsa

    } catch (err) {
        console.error('Delete xatolik:', err);
        alert(isKirill ? '❌ O‘chirishda xatolik yuz berdi' : '❌ Error while deleting');
    }
}

// =================== FIRESTORE SYNC ===================
function loadBooks() {
  firebase.firestore().collection('books').onSnapshot(snap => {
    allBooks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    booksContainer.innerHTML = ""; // Asosiy sahifadagi kitoblarni doimiy bo'sh qoldirish
  }, err => console.error('❌ Firestore xatolik:', err));
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
