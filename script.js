/* GIGANTIC WIT ENGINE v2.0
    Developer: Abdul Rahman
    Description: Core logic for Editor, OCR, and PDF generation.
*/

const editor = document.getElementById('editor');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const saveIndicator = document.getElementById('save-indicator');
let autoSaveTimer;

// --- 1. Basic Formatting ---
function format(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
}

// --- 2. App Logic Object ---
const app = {
    // Sidebar toggle for mobile
    toggleSidebar: () => {
        document.getElementById('sidebar').classList.toggle('open');
    },

    // Clear everything
    clearStorage: () => {
        if(confirm('Warning: This will delete all your work. Continue?')) {
            localStorage.removeItem('gigantic_wit_data');
            editor.innerHTML = '';
            showToast('Workspace reset!');
            updateStats();
        }
    },

    // New Document
    newDoc: () => {
        if(confirm('Start a new document? Unsaved changes might be lost.')) {
            editor.innerHTML = '';
            showToast('New Document Started');
            updateStats();
        }
    },

    // PDF Download
    downloadPdf: () => {
        showToast('Generating PDF... Please wait');
        const element = editor;
        const opt = {
            margin: 0.5,
            filename: 'Gigantic-Wit-Doc.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    }
};

// --- 3. Statistics & AutoSave ---
function updateStats() {
    const text = editor.innerText || '';
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCountEl.innerText = words;
    charCountEl.innerText = text.length;
}

editor.addEventListener('input', () => {
    updateStats();
    saveIndicator.innerText = 'Saving...';
    
    // Debounce Save (Performance ke liye)
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        localStorage.setItem('gigantic_wit_data', editor.innerHTML);
        saveIndicator.innerText = 'Saved to Local';
        saveIndicator.style.color = 'var(--primary)';
    }, 1000);
});

// Load Data on Startup
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('gigantic_wit_data');
    if(savedData) {
        editor.innerHTML = savedData;
        updateStats();
        showToast('Restored last session');
    }
});

// --- 4. OCR (Image to Text) Logic ---
const ocrInput = document.getElementById('ocr-file-input');
const dropZone = document.getElementById('drop-zone');
const progressBar = document.getElementById('ocr-bar');
const progressWrapper = document.getElementById('progress-wrapper');

// Click to upload
dropZone.addEventListener('click', () => ocrInput.click());

// File Selection Handler
ocrInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if(!file) return;

    // UI Update
    progressWrapper.classList.remove('hidden');
    dropZone.classList.add('hidden');
    
    try {
        const worker = await Tesseract.createWorker({
            logger: m => {
                if(m.status === 'recognizing text') {
                    progressBar.style.width = `${m.progress * 100}%`;
                }
            }
        });
        
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        
        const { data: { text } } = await worker.recognize(file);
        
        // Insert Text into Editor
        editor.focus();
        document.execCommand('insertHTML', false, `
            <div style="background:#f1f5f9; padding:15px; border-left:4px solid #6366f1; margin:10px 0;">
                <strong>[Scanned Text]:</strong><br>${text.replace(/\n/g, '<br>')}
            </div><br>
        `);
        
        showToast('Text Extracted Successfully!');
        toggleModal('ocr-modal');
        await worker.terminate();

    } catch (err) {
        console.error(err);
        showToast('Error reading image');
    } finally {
        // Reset UI
        progressWrapper.classList.add('hidden');
        dropZone.classList.remove('hidden');
        progressBar.style.width = '0%';
    }
});

// --- 5. Helper Functions ---
function toggleModal(id) {
    const modal = document.getElementById(id);
    modal.classList.toggle('hidden');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

console.log("Gigantic Wit by Abdul Rahman - Initialized");
  
