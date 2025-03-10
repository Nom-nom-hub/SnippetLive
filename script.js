// Add this at the top of your script.js file
document.addEventListener('DOMContentLoaded', () => {
    // Header buttons
    const headerButtons = {
        'toggleSidebar': () => {
            document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
        },
        'toggleTheme': () => {
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        },
        'formatCode': () => {
            const editor = document.getElementById('snippetCode');
            if (editor) {
                try {
                    // Implement your code formatting logic here
                    showNotification('Code formatted successfully', 'success');
                } catch (error) {
                    showNotification('Failed to format code', 'error');
                }
            }
        },
        'undoChange': () => {
            document.execCommand('undo', false, null);
        },
        'redoChange': () => {
            document.execCommand('redo', false, null);
        }
    };

    // Attach event listeners to all header buttons
    Object.entries(headerButtons).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', handler);
            console.log(`Attached listener to ${id}`); // Debug log
        } else {
            console.log(`Button ${id} not found`); // Debug log
        }
    });

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);

    // Initialize sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed');
    }

    // Add event listener for the "New Snippet" button
    const newSnippetBtn = document.querySelector('.btn-primary');
    if (newSnippetBtn) {
        newSnippetBtn.addEventListener('click', () => {
            const modal = document.getElementById('fullScreenEditor');
            if (modal) modal.style.display = 'block';
        });
    }

    // Initialize settings dropdowns
    const settingsInputs = {
        'autoSave': (checked) => localStorage.setItem('autoSave', checked),
        'lineNumbers': (checked) => localStorage.setItem('lineNumbers', checked),
        'wordWrap': (checked) => localStorage.setItem('wordWrap', checked),
        'fontSize': (value) => {
            localStorage.setItem('fontSize', value);
            const editor = document.getElementById('snippetCode');
            if (editor) editor.style.fontSize = `${value}px`;
        }
    };

    Object.entries(settingsInputs).forEach(([id, handler]) => {
        const input = document.getElementById(id);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = localStorage.getItem(id) === 'true';
                input.addEventListener('change', (e) => handler(e.target.checked));
            } else if (input.type === 'range') {
                input.value = localStorage.getItem(id) || '14';
                input.addEventListener('input', (e) => handler(e.target.value));
            }
        }
    });
});

// New global settings object
const settings = {
    theme: localStorage.getItem('theme') || 'dark',
    fontSize: localStorage.getItem('fontSize') || '14',
    autoSave: localStorage.getItem('autoSave') === 'true',
    lineNumbers: localStorage.getItem('lineNumbers') === 'true',
    wordWrap: localStorage.getItem('wordWrap') === 'true',
    sidebarVisible: localStorage.getItem('sidebarVisible') !== 'false',
};

// Enhanced snippet structure
class Snippet {
    constructor(data) {
        this.id = Date.now();
        this.title = data.title;
        this.code = data.code;
        this.language = data.language;
        this.category = data.category || '';
        this.tags = data.tags || [];
        this.favorite = false;
        this.created = new Date();
        this.modified = new Date();
        this.version = 1;
        this.versions = [{
            code: data.code,
            timestamp: new Date(),
            version: 1
        }];
    }

    update(newCode) {
        this.code = newCode;
        this.modified = new Date();
        this.version++;
        this.versions.push({
            code: newCode,
            timestamp: new Date(),
            version: this.version
        });
    }
}

// Initialize snippets array from localStorage or empty array
let snippets = JSON.parse(localStorage.getItem('codeSnippets')) || [];

// Function to add new snippet
function addSnippet() {
    const title = document.getElementById('snippetTitle').value;
    const language = document.getElementById('snippetLanguage').value;
    const code = document.getElementById('snippetCode').value;
    const tags = document.getElementById('snippetTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    if (!title || !code) {
        alert('Please fill in all fields');
        return;
    }

    const snippet = {
        id: Date.now(),
        title,
        language,
        code,
        tags,
        favorite: false
    };

    snippets.push(snippet);
    saveSnippets();
    displaySnippets();
    clearForm();
}

// Function to save snippets to localStorage
function saveSnippets() {
    localStorage.setItem('codeSnippets', JSON.stringify(snippets));
}

// Function to display snippets
function displaySnippets() {
    const snippetsList = document.getElementById('snippetsList');
    const languageFilter = document.getElementById('languageFilter').value;
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const currentView = document.querySelector('.tab.active').dataset.view;

    let filteredSnippets = snippets;

    // Handle different views
    switch(currentView) {
        case 'favorites':
            filteredSnippets = filteredSnippets.filter(snippet => snippet.favorite);
            break;
        case 'recent':
            // Show snippets from last 24 hours
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            filteredSnippets = filteredSnippets.filter(snippet => 
                new Date(snippet.modified) > oneDayAgo
            ).sort((a, b) => new Date(b.modified) - new Date(a.modified));
            break;
        case 'shared':
            filteredSnippets = filteredSnippets.filter(snippet => snippet.shared);
            break;
        case 'archived':
            filteredSnippets = filteredSnippets.filter(snippet => snippet.archived);
            break;
    }

    // Apply existing filters
    if (languageFilter !== 'all') {
        filteredSnippets = filteredSnippets.filter(snippet => 
            snippet.language === languageFilter
        );
    }

    if (searchText) {
        filteredSnippets = filteredSnippets.filter(snippet =>
            snippet.title.toLowerCase().includes(searchText) ||
            snippet.code.toLowerCase().includes(searchText) ||
            snippet.tags.some(tag => tag.toLowerCase().includes(searchText))
        );
    }

    snippetsList.innerHTML = filteredSnippets.map(snippet => `
        <div class="snippet-card" data-id="${snippet.id}">
            <div class="snippet-header">
                <h3>${snippet.title}</h3>
                <div class="snippet-actions">
                    <button onclick="editSnippet(${snippet.id})" class="btn btn-small">Edit</button>
                    <button onclick="showVersionHistory(${snippet.id})" class="btn btn-small">History</button>
                    <button onclick="copySnippet(${snippet.id})" class="btn btn-small">Copy</button>
                    <button onclick="deleteSnippet(${snippet.id})" class="btn btn-small">Delete</button>
                </div>
            </div>
            <div class="snippet-meta">
                <span class="language">${snippet.language}</span>
                <span class="version">v${snippet.version || 1}</span>
                <span class="modified">Modified: ${new Date(snippet.modified || snippet.created).toLocaleDateString()}</span>
            </div>
            <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
            ${snippet.tags ? `
                <div class="snippet-tags">
                    ${snippet.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');

    Prism.highlightAll();
}

// Function to clear the form
function clearForm() {
    document.getElementById('snippetTitle').value = '';
    document.getElementById('snippetCode').value = '';
}

// Function to delete snippet
function deleteSnippet(id) {
    if (confirm('Are you sure you want to delete this snippet?')) {
        snippets = snippets.filter(snippet => snippet.id !== id);
        saveSnippets();
        displaySnippets();
    }
}

// Function to copy snippet to clipboard
function copySnippet(id) {
    const snippet = snippets.find(s => s.id === id);
    if (snippet) {
        navigator.clipboard.writeText(snippet.code)
            .then(() => showNotification('Snippet copied to clipboard!', 'success'))
            .catch(err => showNotification('Failed to copy snippet', 'error'));
    }
}

// Function to filter snippets
function filterSnippets() {
    displaySnippets();
}

// Add toggle favorite function
function toggleFavorite(id) {
    const snippet = snippets.find(s => s.id === id);
    if (snippet) {
        snippet.favorite = !snippet.favorite;
        saveSnippets();
        displaySnippets();
        updateStats();
    }
}

// Add stats update function
function updateStats() {
    document.getElementById('statsTotal').textContent = snippets.length;
    document.getElementById('statsFavorites').textContent = 
        snippets.filter(s => s.favorite).length;
}

// Add view switching function
function switchView(view) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === view);
    });
    displaySnippets();
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Add keyboard shortcut handling
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+N for new snippet
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            document.getElementById('snippetTitle').focus();
        }
        
        // Ctrl+K for search
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Ctrl+S to save current snippet
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (document.activeElement.id === 'snippetCode') {
                addSnippet();
            }
        }

        // Ctrl+F for search in code
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Escape to clear form
        if (e.key === 'Escape') {
            clearForm();
        }
    });
}

// Add import/export functions
function exportSnippets() {
    const dataStr = JSON.stringify(snippets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-snippets-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importSnippets(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedSnippets = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!Array.isArray(importedSnippets)) {
                throw new Error('Invalid format: Expected an array');
            }

            const validSnippets = importedSnippets.filter(snippet => {
                return snippet.title && 
                       snippet.code && 
                       snippet.language && 
                       Array.isArray(snippet.tags);
            });

            // Add new IDs to avoid conflicts
            validSnippets.forEach(snippet => {
                snippet.id = Date.now() + Math.random();
            });

            // Merge with existing snippets
            snippets = [...snippets, ...validSnippets];
            saveSnippets();
            displaySnippets();
            
            alert(`Successfully imported ${validSnippets.length} snippets`);
        } catch (error) {
            alert('Error importing snippets: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Add notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initial display of snippets
displaySnippets();

// Initial stats update
updateStats();

// Advanced search with filters
function advancedSearch(query) {
    const searchParams = {
        text: query.toLowerCase(),
        language: document.getElementById('languageFilter').value,
        tags: document.getElementById('tagFilter').value.split(',').map(t => t.trim()),
        dateRange: document.getElementById('dateFilter').value
    };

    return snippets.filter(snippet => {
        const matchesText = !searchParams.text || 
            snippet.title.toLowerCase().includes(searchParams.text) ||
            snippet.code.toLowerCase().includes(searchParams.text) ||
            snippet.description.toLowerCase().includes(searchParams.text);

        const matchesLanguage = searchParams.language === 'all' || 
            snippet.language === searchParams.language;

        const matchesTags = searchParams.tags.length === 0 ||
            searchParams.tags.every(tag => snippet.tags.includes(tag));

        const matchesDate = !searchParams.dateRange ||
            isInDateRange(snippet.created, searchParams.dateRange);

        return matchesText && matchesLanguage && matchesTags;
    });
}

// Auto-save functionality
let autoSaveTimer;
function setupAutoSave() {
    const autoSaveCheckbox = document.getElementById('autoSave');
    const codeEditor = document.getElementById('snippetCode');
    let autoSaveTimer;

    // Load saved preference
    autoSaveCheckbox.checked = settings.autoSave;

    // Update settings when changed
    autoSaveCheckbox.addEventListener('change', (e) => {
        settings.autoSave = e.target.checked;
        localStorage.setItem('autoSave', e.target.checked);
    });

    // Setup auto-save functionality
    codeEditor.addEventListener('input', () => {
        if (!settings.autoSave) return;
        
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            const title = document.getElementById('snippetTitle').value;
            if (title && codeEditor.value) {
                addSnippet();
                showNotification('Auto-saved!', 'success');
            }
        }, 2000);
    });
}

// Version control
function createVersion(snippetId) {
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
        snippet.update(document.getElementById('snippetCode').value);
        saveSnippets();
        showNotification('New version created!', 'success');
    }
}

function restoreVersion(snippetId, version) {
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
        const targetVersion = snippet.versions.find(v => v.version === version);
        if (targetVersion) {
            snippet.code = targetVersion.code;
            displaySnippets();
            showNotification('Version restored!', 'success');
        }
    }
}

// Cloud sync functionality
async function syncWithCloud() {
    const backupBtn = document.getElementById('backupToCloud');
    const autoBackupCheckbox = document.getElementById('autoBackup');
    
    // Handle manual backup
    backupBtn.addEventListener('click', async () => {
        try {
            const backup = {
                snippets,
                settings,
                timestamp: new Date()
            };
            
            // Save to localStorage as backup
            localStorage.setItem('snippetsBackup', JSON.stringify(backup));
            
            // Here you would typically add API call to your cloud service
            // await fetch('your-cloud-api/backup', {
            //     method: 'POST',
            //     body: JSON.stringify(backup)
            // });
            
            showNotification('Backup created successfully!', 'success');
        } catch (error) {
            showNotification('Backup failed: ' + error.message, 'error');
        }
    });
    
    // Handle auto-backup
    if (autoBackupCheckbox.checked) {
        setInterval(() => {
            backupBtn.click();
        }, 60 * 60 * 1000); // Every hour
    }
}

// GitHub Gist sync
async function syncWithGitHub() {
    // Implementation would require GitHub OAuth
    const GITHUB_TOKEN = localStorage.getItem('github_token');
    if (!GITHUB_TOKEN) {
        showNotification('Please configure GitHub integration first', 'info');
        return;
    }
    // ... GitHub API implementation
}

// Snippet sharing
function shareSnippet(snippetId) {
    const snippet = snippets.find(s => s.id === snippetId);
    if (snippet) {
        // Generate shareable link
        const shareableData = btoa(JSON.stringify({
            code: snippet.code,
            language: snippet.language,
            title: snippet.title
        }));
        const shareableLink = `${window.location.origin}/share/${shareableData}`;
        
        navigator.clipboard.writeText(shareableLink);
        showNotification('Share link copied to clipboard!', 'success');
        snippet.shared = true;
        saveSnippets();
    }
}

// Statistics and Analytics
function generateStats() {
    const stats = {
        total: snippets.length,
        byLanguage: {},
        byTags: {},
        favorited: snippets.filter(s => s.favorite).length,
        archived: snippets.filter(s => s.archived).length,
        averageLength: snippets.reduce((acc, s) => acc + s.code.length, 0) / snippets.length,
        mostUsedLanguage: null,
        mostUsedTags: []
    };

    // Calculate language stats
    snippets.forEach(snippet => {
        stats.byLanguage[snippet.language] = (stats.byLanguage[snippet.language] || 0) + 1;
        snippet.tags.forEach(tag => {
            stats.byTags[tag] = (stats.byTags[tag] || 0) + 1;
        });
    });

    return stats;
}

// Code formatting
function formatCode(code, language) {
    // Integration with prettier or other formatters
    try {
        // Basic indentation if no formatter available
        return code.split('\n').map(line => line.trim()).join('\n');
    } catch (error) {
        showNotification('Formatting failed', 'error');
        return code;
    }
}

// Keyboard shortcuts enhancement
const shortcuts = {
    'ctrl+n': () => document.getElementById('snippetTitle').focus(),
    'ctrl+k': () => document.getElementById('searchInput').focus(),
    'ctrl+s': (e) => {
        e.preventDefault();
        addSnippet();
    },
    'ctrl+f': (e) => {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    },
    'ctrl+b': (e) => {
        e.preventDefault();
        syncWithCloud();
    },
    'esc': () => clearForm()
};

// Initialize features
function initializeFeatures() {
    setupAutoSave();
    setupShortcuts();
    loadSettings();
    setupTheme();
    setupCodeEditor();
    initializeStats();
}

// Call initialization
document.addEventListener('DOMContentLoaded', initializeFeatures);

function setupTheme() {
    const toggleBtn = document.getElementById('toggleTheme');
    toggleBtn.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
}

// Add to initializeFeatures
function initializeFeatures() {
    setupAutoSave();
    setupShortcuts();
    loadSettings();
    setupTheme();  // Add this line
    setupCodeEditor();
    initializeStats();
}

// Theme handling
function initializeTheme() {
    // Get saved theme or use system preference as fallback
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    // Apply the theme
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('toggleTheme');
    if (themeToggle) {
        // Update button text based on current theme
        updateThemeButtonText(savedTheme);
        
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            // Apply new theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update button text
            updateThemeButtonText(newTheme);
        });
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {  // Only if user hasn't manually set theme
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeButtonText(newTheme);
        }
    });
}

function updateThemeButtonText(theme) {
    const themeToggle = document.getElementById('toggleTheme');
    if (themeToggle) {
        themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
}

// Add to your initialization code
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    // ... other initialization code
});

// Code templates organized by language
const codeTemplates = {
    javascript: [
        {
            name: "Async Function",
            code: `async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}`
        },
        {
            name: "Event Listener",
            code: `element.addEventListener('event', (e) => {
    e.preventDefault();
    // Handle event here
});`
        },
        {
            name: "Class with Constructor",
            code: `class MyClass {
    constructor(param) {
        this.param = param;
    }

    method() {
        return this.param;
    }
}`
        }
    ],
    python: [
        {
            name: "Class Template",
            code: `class MyClass:
    def __init__(self, param):
        self.param = param
    
    def method(self):
        return self.param`
        },
        {
            name: "Exception Handler",
            code: `try:
    # Your code here
    result = some_function()
except Exception as e:
    print(f"An error occurred: {e}")
    raise`
        }
    ],
    html: [
        {
            name: "Basic Form",
            code: `<form action="/submit" method="POST">
    <div class="form-group">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required>
    </div>
    <button type="submit">Submit</button>
</form>`
        }
    ],
    css: [
        {
            name: "Flexbox Container",
            code: `.flex-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
}`
        }
    ]
};

// Function to load templates based on selected language
function loadTemplates() {
    const templateList = document.getElementById('templateList');
    const languageSelect = document.getElementById('snippetLanguage');
    
    if (!templateList || !languageSelect) return;
    
    const currentLanguage = languageSelect.value;
    const templates = codeTemplates[currentLanguage] || [];
    
    templateList.innerHTML = templates.length === 0 
        ? '<div class="template-item">No templates available for this language</div>'
        : templates.map(template => `
            <div class="template-item" onclick="useTemplate('${template.name}')">
                ${template.name}
            </div>
        `).join('');
}

// Function to use a template
function useTemplate(templateName) {
    const currentLanguage = document.getElementById('snippetLanguage').value;
    const template = codeTemplates[currentLanguage].find(t => t.name === templateName);
    
    if (template) {
        const codeEditor = document.getElementById('snippetCode');
        codeEditor.value = template.code;
        
        // If title is empty, suggest a title based on template name
        const titleInput = document.getElementById('snippetTitle');
        if (!titleInput.value) {
            titleInput.value = template.name;
        }
        
        // Show a notification
        showNotification('Template applied!', 'success');
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial load of templates
    loadTemplates();
    
    // Update templates when language changes
    const languageSelect = document.getElementById('snippetLanguage');
    if (languageSelect) {
        languageSelect.addEventListener('change', loadTemplates);
    }
});

// Code Editor Enhancements
function setupCodeEditor() {
    const editor = document.getElementById('snippetCode');
    const lineNumbers = document.querySelector('.line-numbers');
    
    if (!editor) return; // Exit if editor doesn't exist
    
    // Line numbers
    function updateLineNumbers() {
        if (!lineNumbers) return;
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0)
            .map((_, i) => `<div>${i + 1}</div>`).join('');
    }
    
    editor.addEventListener('input', updateLineNumbers);
    editor.addEventListener('scroll', () => {
        if (lineNumbers) {
            lineNumbers.scrollTop = editor.scrollTop;
        }
    });
    
    // Auto-closing brackets
    const pairs = {'(': ')', '[': ']', '{': '}', '"': '"', "'": "'"};
    editor.addEventListener('keypress', (e) => {
        if (pairs[e.key]) {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.slice(0, start) + 
                          e.key + pairs[e.key] + 
                          editor.value.slice(end);
            editor.selectionStart = editor.selectionEnd = start + 1;
        }
    });
    
    // Tab handling
    editor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.slice(0, start) + '    ' + 
                          editor.value.slice(end);
            editor.selectionStart = editor.selectionEnd = start + 4;
        }
    });
}

// Tag System
function setupTagSystem() {
    const tagInput = document.getElementById('snippetTags');
    const tagSuggestions = document.querySelector('.tag-suggestions');
    const activeTags = document.querySelector('.active-tags');
    let currentTags = new Set();
    
    function getAllTags() {
        return [...new Set(snippets.flatMap(s => s.tags))];
    }
    
    function addTag(tag) {
        if (tag && !currentTags.has(tag)) {
            currentTags.add(tag);
            updateActiveTags();
        }
        tagInput.value = '';
        tagSuggestions.style.display = 'none';
    }
    
    function updateActiveTags() {
        activeTags.innerHTML = [...currentTags].map(tag => `
            <span class="active-tag">
                ${tag}
                <button onclick="removeTag('${tag}')">&times;</button>
            </span>
        `).join('');
    }
    
    tagInput.addEventListener('input', () => {
        const currentTag = tagInput.value.trim().toLowerCase();
        if (currentTag) {
            const suggestions = getAllTags()
                .filter(tag => tag.toLowerCase().includes(currentTag))
                .slice(0, 5);
            
            tagSuggestions.innerHTML = suggestions
                .map(tag => `<div class="tag-suggestion" 
                    onclick="addTag('${tag}')">${tag}</div>`)
                .join('');
            tagSuggestions.style.display = 'block';
        } else {
            tagSuggestions.style.display = 'none';
        }
    });
    
    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(tagInput.value.trim());
        }
    });
    
    window.removeTag = (tag) => {
        currentTags.delete(tag);
        updateActiveTags();
    };
    
    window.addTag = addTag;
}

// Version Control
function setupVersionControl() {
    function showVersionHistory(snippetId) {
        const snippet = snippets.find(s => s.id === snippetId);
        const versionList = document.querySelector('.version-list');
        
        if (snippet && snippet.versions) {
            versionList.innerHTML = snippet.versions
                .map(v => `
                    <div class="version-item">
                        <span>Version ${v.version}</span>
                        <span>${new Date(v.timestamp).toLocaleString()}</span>
                        <button onclick="restoreVersion(${snippetId}, ${v.version})">
                            Restore
                        </button>
                    </div>
                `).join('');
        }
    }
    
    window.restoreVersion = (snippetId, version) => {
        const snippet = snippets.find(s => s.id === snippetId);
        if (snippet) {
            const targetVersion = snippet.versions.find(v => v.version === version);
            if (targetVersion) {
                snippet.code = targetVersion.code;
                displaySnippets();
                showNotification('Version restored!', 'success');
            }
        }
    };
}

// Enhanced Export/Import
function setupExportImport() {
    function exportSnippets(format = 'json') {
        const data = snippets.map(snippet => {
            switch(format) {
                case 'md':
                    return `# ${snippet.title}\n\`\`\`${snippet.language}\n${snippet.code}\n\`\`\``;
                case 'html':
                    return `<h2>${snippet.title}</h2>
                           <pre><code class="language-${snippet.language}">
                           ${snippet.code}</code></pre>`;
                default:
                    return snippet;
            }
        });
        
        const content = format === 'json' ? 
            JSON.stringify(data, null, 2) : data.join('\n\n');
        
        const blob = new Blob([content], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snippets.${format}`;
        a.click();
    }
    
    function importSnippets(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let importedSnippets;
                
                if (file.name.endsWith('.json')) {
                    importedSnippets = JSON.parse(content);
                } else if (file.name.endsWith('.md')) {
                    importedSnippets = parseMdSnippets(content);
                } else if (file.name.endsWith('.html')) {
                    importedSnippets = parseHtmlSnippets(content);
                }
                
                snippets = [...snippets, ...importedSnippets];
                saveSnippets();
                displaySnippets();
                showNotification('Snippets imported successfully!', 'success');
            } catch (error) {
                showNotification('Error importing snippets', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    window.exportSnippets = exportSnippets;
    window.importSnippets = importSnippets;
}

// Code Editor Actions
function setupEditorActions() {
    const codeEditor = document.getElementById('snippetCode');
    if (!codeEditor) return; // Exit if editor doesn't exist

    // Format Code
    const formatButton = document.getElementById('formatCode');
    if (formatButton) {
        formatButton.addEventListener('click', () => {
            try {
                const code = codeEditor.value;
                const languageSelect = document.getElementById('snippetLanguage');
                const language = languageSelect ? languageSelect.value : 'javascript';
                codeEditor.value = formatCode(code, language);
                showNotification('Code formatted successfully', 'success');
            } catch (error) {
                showNotification('Failed to format code', 'error');
            }
        });
    }

    // Setup undo/redo functionality
    let undoStack = [];
    let redoStack = [];

    codeEditor.addEventListener('input', () => {
        undoStack.push(codeEditor.value);
        redoStack = []; // Clear redo stack on new changes
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target === codeEditor) {
            // Undo: Ctrl+Z
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                const undoButton = document.getElementById('undoChange');
                if (undoButton) undoButton.click();
            }
            // Redo: Ctrl+Y or Ctrl+Shift+Z
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                const redoButton = document.getElementById('redoChange');
                if (redoButton) redoButton.click();
            }
        }
    });
}

// Initialize all features
function initializeFeatures() {
    try {
        setupCodeEditor();
        setupEditorActions();
        setupShortcuts();
        loadSettings();
        setupTheme();
        initializeStats();
    } catch (error) {
        console.error('Error initializing features:', error);
    }
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize main features
        initializeFeatures();

        // Safely initialize language select
        const languageSelect = document.getElementById('snippetLanguage');
        if (languageSelect) {
            loadTemplates();
            languageSelect.addEventListener('change', loadTemplates);
        }

        // Safely initialize add snippet form
        const addSnippetForm = document.querySelector('.add-snippet-form');
        if (addSnippetForm) {
            const addButton = addSnippetForm.querySelector('button');
            if (addButton) {
                addButton.addEventListener('click', openFullScreenEditor);
            }
        }

        // Initialize other event listeners
        initializeEventListeners();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Add this new function if it doesn't exist
function initializeEventListeners() {
    // Add event listeners for buttons and controls
    const elements = {
        'toggleSidebar': () => document.body.classList.toggle('sidebar-collapsed'),
        'toggleTheme': toggleTheme,
        'formatCode': formatCode,
        'undoChange': () => document.execCommand('undo'),
        'redoChange': () => document.execCommand('redo')
    };

    // Attach event listeners only if elements exist
    Object.entries(elements).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    });
}

// Helper function for theme toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Helper function for code formatting
function formatCode() {
    const editor = document.getElementById('snippetCode');
    if (!editor) return;

    try {
        // Add your code formatting logic here
        showNotification('Code formatted successfully', 'success');
    } catch (error) {
        showNotification('Failed to format code', 'error');
    }
}

// Helper function for notifications
function showNotification(message, type = 'info') {
    // Add notification implementation if not already present
    console.log(`${type}: ${message}`);
}

// Add these new functions for editing and version history
function editSnippet(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    // Fill the form with snippet data
    document.getElementById('snippetTitle').value = snippet.title;
    document.getElementById('snippetLanguage').value = snippet.language;
    document.getElementById('snippetCode').value = snippet.code;
    document.getElementById('snippetTags').value = snippet.tags.join(', ');
    
    // Store the ID of snippet being edited
    document.getElementById('snippetCode').dataset.editingId = id;
    
    // Scroll to editor
    document.querySelector('.add-snippet-form').scrollIntoView({ behavior: 'smooth' });
    
    // Update save button text
    const saveButton = document.querySelector('.add-snippet-form button');
    saveButton.textContent = 'Update Snippet';
    saveButton.onclick = () => updateSnippet(id);
}

function updateSnippet(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet) return;

    const newCode = document.getElementById('snippetCode').value;
    const newTitle = document.getElementById('snippetTitle').value;
    const newLanguage = document.getElementById('snippetLanguage').value;
    const newTags = document.getElementById('snippetTags').value
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    // Create new version if code changed
    if (newCode !== snippet.code) {
        snippet.version = (snippet.version || 1) + 1;
        snippet.versions = snippet.versions || [];
        snippet.versions.push({
            code: snippet.code,
            timestamp: new Date(),
            version: snippet.version - 1
        });
    }

    // Update snippet
    snippet.title = newTitle;
    snippet.language = newLanguage;
    snippet.code = newCode;
    snippet.tags = newTags;
    snippet.modified = new Date();

    saveSnippets();
    displaySnippets();
    clearForm();

    // Reset save button
    const saveButton = document.querySelector('.add-snippet-form button');
    saveButton.textContent = 'Save Snippet';
    saveButton.onclick = addSnippet;

    showNotification('Snippet updated successfully!', 'success');
}

function showVersionHistory(id) {
    const snippet = snippets.find(s => s.id === id);
    if (!snippet || !snippet.versions) return;

    const sortedVersions = [...snippet.versions].sort((a, b) => b.version - a.version);
    
    const modal = document.createElement('div');
    modal.className = 'modal version-history-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Version History - ${snippet.title}</h2>
                <div class="version-controls">
                    <label class="diff-toggle">
                        <input type="checkbox" id="showDiff" checked> 
                        Show differences
                    </label>
                    <button class="btn btn-small close-modal" onclick="this.closest('.modal').remove()">
                        <span>✕</span>
                    </button>
                </div>
            </div>

            <div class="versions-container">
                <div class="version-details current">
                    <div class="version-header">
                        <div class="version-info">
                            <h3>Current Version (v${snippet.version || 1})</h3>
                            <span class="timestamp">
                                Modified: ${new Date(snippet.modified || snippet.created).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div class="code-preview">
                        <pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>
                    </div>
                </div>

                ${sortedVersions.map((v, index) => {
                    const nextVersion = index < sortedVersions.length - 1 ? 
                        sortedVersions[index + 1] : null;
                    const diff = nextVersion ? 
                        calculateDiff(nextVersion.code, v.code) : [];
                    
                    return `
                        <div class="version-details" data-version="${v.version}">
                            <div class="version-header">
                                <div class="version-info">
                                    <h3>Version ${v.version}</h3>
                                    <span class="timestamp">
                                        ${new Date(v.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div class="version-actions">
                                    <button onclick="restoreVersion(${id}, ${v.version})" 
                                            class="btn btn-small btn-primary">
                                        Restore this version
                                    </button>
                                </div>
                            </div>
                            <div class="code-preview">
                                <pre><code class="language-${snippet.language}">${escapeHtml(v.code)}</code></pre>
                            </div>
                            ${diff.length > 0 ? 
                                `<div class="version-diff">${formatDiff(diff, snippet.language)}</div>` 
                                : '<div class="no-changes">No changes from previous version</div>'}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Highlight all code blocks
    modal.querySelectorAll('pre code').forEach(block => {
        Prism.highlightElement(block);
    });

    // Initialize diff toggle
    const showDiffCheckbox = modal.querySelector('#showDiff');
    const diffContainers = modal.querySelectorAll('.version-diff');
    
    showDiffCheckbox.addEventListener('change', (e) => {
        diffContainers.forEach(container => {
            container.style.display = e.target.checked ? 'block' : 'none';
        });
    });
}

function calculateDiff(oldCode, newCode) {
    const dmp = new diff_match_patch();
    const diffs = dmp.diff_main(oldCode, newCode);
    dmp.diff_cleanupSemantic(diffs);
    
    // Convert to line-based diff for better readability
    const lines = [];
    let currentLine = '';
    
    diffs.forEach(([type, text]) => {
        const textLines = text.split('\n');
        textLines.forEach((line, index) => {
            if (index > 0) {
                // Add the current line to results with its type
                if (currentLine) {
                    lines.push({
                        type: type === 0 ? 'unchanged' : type === 1 ? 'addition' : 'deletion',
                        line: currentLine
                    });
                }
                currentLine = line;
            } else {
                currentLine += line;
            }
        });
    });
    
    // Add the last line
    if (currentLine) {
        lines.push({
            type: diffs[diffs.length - 1][0] === 0 ? 'unchanged' : 
                  diffs[diffs.length - 1][0] === 1 ? 'addition' : 'deletion',
            line: currentLine
        });
    }
    
    return lines;
}

function formatDiff(diff, language) {
    const lines = diff.map(d => {
        const prefix = d.type === 'addition' ? '+' : 
                      d.type === 'deletion' ? '-' : ' ';
        const className = `diff-line ${d.type}`;
        return `<div class="${className}"><code class="language-${language}">${prefix} ${escapeHtml(d.line)}</code></div>`;
    }).join('\n');

    return `
        <div class="diff-container">
            <h4>Changes:</h4>
            <pre class="diff-content">${lines}</pre>
        </div>
    `;
}

function loadSettings() {
    // Load all settings from localStorage with default values
    const settings = {
        theme: localStorage.getItem('theme') || 'dark',
        fontSize: localStorage.getItem('fontSize') || '14',
        autoSave: localStorage.getItem('autoSave') === 'true',
        lineNumbers: localStorage.getItem('lineNumbers') !== 'false',
        wordWrap: localStorage.getItem('wordWrap') === 'true',
        sidebarVisible: localStorage.getItem('sidebarVisible') !== 'false'
    };

    // Apply settings to UI elements
    document.body.setAttribute('data-theme', settings.theme);
    
    // Font size
    const editor = document.getElementById('snippetCode');
    if (editor) {
        editor.style.fontSize = `${settings.fontSize}px`;
    }
    
    // Font size slider
    const fontSizeSlider = document.getElementById('fontSize');
    if (fontSizeSlider) {
        fontSizeSlider.value = settings.fontSize;
        fontSizeSlider.addEventListener('input', (e) => {
            const newSize = e.target.value;
            editor.style.fontSize = `${newSize}px`;
            localStorage.setItem('fontSize', newSize);
        });
    }

    // Auto-save
    const autoSaveCheckbox = document.getElementById('autoSave');
    if (autoSaveCheckbox) {
        autoSaveCheckbox.checked = settings.autoSave;
        autoSaveCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('autoSave', e.target.checked);
        });
    }

    // Line numbers
    const lineNumbersCheckbox = document.getElementById('lineNumbers');
    const lineNumbersContainer = document.querySelector('.line-numbers');
    if (lineNumbersCheckbox && lineNumbersContainer) {
        lineNumbersCheckbox.checked = settings.lineNumbers;
        lineNumbersContainer.style.display = settings.lineNumbers ? 'block' : 'none';
        lineNumbersCheckbox.addEventListener('change', (e) => {
            lineNumbersContainer.style.display = e.target.checked ? 'block' : 'none';
            localStorage.setItem('lineNumbers', e.target.checked);
        });
    }

    // Word wrap
    const wordWrapCheckbox = document.getElementById('wordWrap');
    if (wordWrapCheckbox && editor) {
        wordWrapCheckbox.checked = settings.wordWrap;
        editor.style.whiteSpace = settings.wordWrap ? 'pre-wrap' : 'pre';
        wordWrapCheckbox.addEventListener('change', (e) => {
            editor.style.whiteSpace = e.target.checked ? 'pre-wrap' : 'pre';
            localStorage.setItem('wordWrap', e.target.checked);
        });
    }

    // Sidebar visibility
    const sidebar = document.querySelector('.sidebar');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (sidebar && toggleSidebarBtn) {
        sidebar.style.display = settings.sidebarVisible ? 'block' : 'none';
        toggleSidebarBtn.addEventListener('click', () => {
            const isVisible = sidebar.style.display !== 'none';
            sidebar.style.display = isVisible ? 'none' : 'block';
            localStorage.setItem('sidebarVisible', !isVisible);
        });
    }

    return settings;
}

function initializeStats() {
    // Initialize stats display
    updateStats();

    // Set up stats refresh interval (every 30 seconds)
    setInterval(updateStats, 30000);

    // Create stats dashboard
    const statsData = generateStats();
    
    // Update language distribution chart
    updateLanguageChart(statsData);

    // Initialize detailed stats panel
    initializeStatsPanel(statsData);
}

function updateLanguageChart(statsData) {
    const languageStats = document.getElementById('languageStats');
    if (!languageStats) return;

    // Create language distribution bars
    const total = Object.values(statsData.byLanguage).reduce((a, b) => a + b, 0);
    const html = Object.entries(statsData.byLanguage)
        .sort(([, a], [, b]) => b - a)
        .map(([language, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
                <div class="language-stat">
                    <div class="language-label">${language}</div>
                    <div class="language-bar-container">
                        <div class="language-bar" style="width: ${percentage}%"></div>
                        <span class="language-count">${count}</span>
                    </div>
                </div>
            `;
        })
        .join('');

    languageStats.innerHTML = html;
}

function initializeStatsPanel(statsData) {
    const statsPanel = document.createElement('div');
    statsPanel.className = 'stats-panel';
    statsPanel.innerHTML = `
        <div class="stats-summary">
            <div class="stat-item">
                <h3>Total Snippets</h3>
                <p>${statsData.total}</p>
            </div>
            <div class="stat-item">
                <h3>Favorites</h3>
                <p>${statsData.favorited}</p>
            </div>
            <div class="stat-item">
                <h3>Languages</h3>
                <p>${Object.keys(statsData.byLanguage).length}</p>
            </div>
            <div class="stat-item">
                <h3>Tags</h3>
                <p>${Object.keys(statsData.byTags).length}</p>
            </div>
        </div>
        <div class="stats-details">
            <div class="most-used">
                <h3>Most Used Language</h3>
                <p>${getMostUsed(statsData.byLanguage)}</p>
            </div>
            <div class="most-used">
                <h3>Most Used Tag</h3>
                <p>${getMostUsed(statsData.byTags)}</p>
            </div>
        </div>
    `;

    // Add stats panel to the DOM if it doesn't exist
    const existingPanel = document.querySelector('.stats-panel');
    if (existingPanel) {
        existingPanel.replaceWith(statsPanel);
    } else {
        const container = document.querySelector('.container');
        if (container) {
            container.appendChild(statsPanel);
        }
    }
}

function getMostUsed(obj) {
    return Object.entries(obj)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';
}

// Add some CSS for the stats
const style = document.createElement('style');
style.textContent = `
    .stats-panel {
        background: var(--bg-color-secondary);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
    }

    .stats-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .stat-item {
        background: var(--bg-color);
        padding: 1rem;
        border-radius: 6px;
        text-align: center;
    }

    .stat-item h3 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .stat-item p {
        margin: 0.5rem 0 0;
        font-size: 1.5rem;
        font-weight: bold;
    }

    .stats-details {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .most-used {
        background: var(--bg-color);
        padding: 1rem;
        border-radius: 6px;
    }

    .most-used h3 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-muted);
    }

    .most-used p {
        margin: 0.5rem 0 0;
        font-weight: 500;
    }

    .language-stat {
        margin: 0.5rem 0;
    }

    .language-label {
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }

    .language-bar-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .language-bar {
        height: 8px;
        background: var(--primary-color);
        border-radius: 4px;
        transition: width 0.3s ease;
    }

    .language-count {
        font-size: 0.8rem;
        color: var(--text-muted);
    }
`;
document.head.appendChild(style);

// Add these new functions
function openFullScreenEditor() {
    const modal = document.getElementById('fullScreenEditor');
    if (!modal) return;
    
    modal.style.display = 'block';
    
    // Get references to all form elements
    const modalTitle = document.getElementById('modalSnippetTitle');
    const modalLanguage = document.getElementById('modalSnippetLanguage');
    const modalCode = document.getElementById('modalSnippetCode');
    const modalTags = document.getElementById('modalSnippetTags');
    
    // Get references to the main form elements
    const mainTitle = document.getElementById('snippetTitle');
    const mainLanguage = document.getElementById('snippetLanguage');
    const mainCode = document.getElementById('snippetCode');
    const mainTags = document.getElementById('snippetTags');
    
    // Transfer values only if both elements exist
    if (modalTitle && mainTitle) {
        modalTitle.value = mainTitle.value || '';
    }
    
    if (modalLanguage && mainLanguage) {
        modalLanguage.value = mainLanguage.value || '';
    }
    
    if (modalCode && mainCode) {
        modalCode.value = mainCode.value || '';
    }
    
    if (modalTags && mainTags) {
        modalTags.value = mainTags.value || '';
    }
    
    // Setup the modal editor
    setupModalEditor();
}

function closeFullScreenEditor() {
    const modal = document.getElementById('fullScreenEditor');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupModalEditor() {
    const editor = document.getElementById('modalSnippetCode');
    const lineNumbers = document.getElementById('modalLineNumbers');
    
    if (!editor || !lineNumbers) return;
    
    function updateLineNumbers() {
        const lines = editor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0)
            .map((_, i) => `<div>${i + 1}</div>`).join('');
    }
    
    // Add event listeners
    editor.addEventListener('input', updateLineNumbers);
    editor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = editor.scrollTop;
    });
    
    // Initial line numbers
    updateLineNumbers();
    
    // Focus editor
    editor.focus();
}

function saveSnippetFromModal() {
    const title = document.getElementById('modalSnippetTitle')?.value?.trim();
    const language = document.getElementById('modalSnippetLanguage')?.value;
    const code = document.getElementById('modalSnippetCode')?.value?.trim();
    const tags = document.getElementById('modalSnippetTags')?.value
        ?.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0) || [];

    if (!title || !code) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    const snippet = {
        id: Date.now(),
        title,
        language,
        code,
        tags,
        created: new Date().toISOString()
    };

    // Add to snippets array
    snippets.push(snippet);
    saveSnippets();
    displaySnippets();
    closeFullScreenEditor();
    showNotification('Snippet saved successfully!', 'success');
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to open new snippet editor
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openFullScreenEditor();
    }
    
    // Esc to close modal
    if (e.key === 'Escape') {
        closeFullScreenEditor();
    }
});

// Add format code handler for modal
const modalFormatCodeBtn = document.getElementById('modalFormatCode');
if (modalFormatCodeBtn) {
    modalFormatCodeBtn.addEventListener('click', () => {
        const editor = document.getElementById('modalSnippetCode');
        const language = document.getElementById('modalSnippetLanguage')?.value;
        if (editor) {
            try {
                editor.value = formatCode(editor.value, language);
                showNotification('Code formatted successfully', 'success');
            } catch (error) {
                showNotification('Failed to format code', 'error');
            }
        }
    });
}

// Initialize all button event listeners
function initializeButtons() {
    // View Controls
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        document.body.classList.toggle('sidebar-collapsed');
    });

    document.getElementById('toggleTheme').addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        // Save theme preference
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDarkTheme);
    });

    // Editor Controls
    document.getElementById('formatCode').addEventListener('click', () => {
        // Add your code formatting logic here
        const editor = document.getElementById('snippetCode');
        if (editor) {
            // Example: You might want to use a library like prettier here
            try {
                // Format the code
                showNotification('Code formatted successfully!', 'success');
            } catch (error) {
                showNotification('Failed to format code', 'error');
            }
        }
    });

    document.getElementById('undoChange').addEventListener('click', () => {
        document.execCommand('undo', false, null);
    });

    document.getElementById('redoChange').addEventListener('click', () => {
        document.execCommand('redo', false, null);
    });

    // Settings
    document.getElementById('autoSave').addEventListener('change', (e) => {
        localStorage.setItem('autoSave', e.target.checked);
        setupAutoSave();
    });

    document.getElementById('lineNumbers').addEventListener('change', (e) => {
        localStorage.setItem('lineNumbers', e.target.checked);
        toggleLineNumbers(e.target.checked);
    });

    document.getElementById('wordWrap').addEventListener('change', (e) => {
        localStorage.setItem('wordWrap', e.target.checked);
        toggleWordWrap(e.target.checked);
    });

    document.getElementById('fontSize').addEventListener('input', (e) => {
        const size = e.target.value + 'px';
        document.getElementById('snippetCode').style.fontSize = size;
        localStorage.setItem('fontSize', size);
    });
}

// Helper functions for the buttons
function toggleLineNumbers(show) {
    const editor = document.getElementById('snippetCode');
    if (editor) {
        editor.classList.toggle('show-line-numbers', show);
    }
}

function toggleWordWrap(enabled) {
    const editor = document.getElementById('snippetCode');
    if (editor) {
        editor.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
    }
}

function setupAutoSave() {
    const autoSaveEnabled = localStorage.getItem('autoSave') === 'true';
    if (autoSaveEnabled) {
        // Set up auto-save functionality
        const editor = document.getElementById('snippetCode');
        if (editor) {
            editor.addEventListener('input', debounce(() => {
                saveSnippets();
            }, 1000));
        }
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load saved settings
function loadSavedSettings() {
    // Load theme
    const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
    if (isDarkTheme) {
        document.body.classList.add('dark-theme');
    }

    // Load other settings
    const autoSaveCheckbox = document.getElementById('autoSave');
    if (autoSaveCheckbox) {
        autoSaveCheckbox.checked = localStorage.getItem('autoSave') === 'true';
    }

    const lineNumbersCheckbox = document.getElementById('lineNumbers');
    if (lineNumbersCheckbox) {
        lineNumbersCheckbox.checked = localStorage.getItem('lineNumbers') === 'true';
    }

    const wordWrapCheckbox = document.getElementById('wordWrap');
    if (wordWrapCheckbox) {
        wordWrapCheckbox.checked = localStorage.getItem('wordWrap') === 'true';
    }
    
    const fontSizeInput = document.getElementById('fontSize');
    const snippetCode = document.getElementById('snippetCode');
    
    if (fontSizeInput && snippetCode) {
        const fontSize = localStorage.getItem('fontSize') || '14px';
        fontSizeInput.value = parseInt(fontSize);
        snippetCode.style.fontSize = fontSize;
    }
}

// Call these functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeButtons();
        loadSavedSettings();
        setupAutoSave();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
