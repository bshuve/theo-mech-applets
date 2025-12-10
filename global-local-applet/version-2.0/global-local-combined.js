const STORAGE_KEY = 'action-minimization-progress';
const sections = [
    { id: 'page-1', link: document.getElementById('link-1'), number: 1 },
    { id: 'page-2', link: document.getElementById('link-2'), number: 2 },
    { id: 'page-3', link: document.getElementById('link-3'), number: 3 },
    { id: 'page-4', link: document.getElementById('link-4'), number: 4 },
];

let currentSection = 1;
let completedSections = new Set();
let tourActive = false;
let tourStep = 0;



// Smooth scroll for sidebar links
sections.forEach(s => {
    s.link.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToSection(s.id);
        currentSection = s.number;
    });
});

function scrollToSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + sectionId);
        updateActiveSection(sectionId);
    }
}

function updateActiveSection(activeId) {
    sections.forEach(s => {
        if (s.id === activeId) {
            const sectionEl = document.getElementById(s.id);
            if (sectionEl) sectionEl.classList.add('highlighted');
            currentSection = s.number;
        } else {
            const sectionEl = document.getElementById(s.id);
            if (sectionEl) sectionEl.classList.remove('highlighted');
        }
    });
}

// Intersection Observer for active section tracking
const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            updateActiveSection(entry.target.id);
            currentSection = parseInt(entry.target.dataset.section) || 1;
        }
    });
}, { root: null, rootMargin: '0px', threshold: 0.5 });

sections.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) io.observe(el);
});

// Welcome overlay
function showWelcome() {
    const overlay = document.getElementById('welcome-overlay');
    const hasSeenWelcome = localStorage.getItem('has-seen-welcome');
    if (!hasSeenWelcome) {
        setTimeout(() => overlay.classList.add('show'), 100);
    }
}

function skipWelcome() {
    document.getElementById('welcome-overlay').classList.remove('show');
    localStorage.setItem('has-seen-welcome', 'true');
}

function startGuidedTour() {
    skipWelcome();
    tourActive = true;
    tourStep = 0;
    nextTourStep();
}

function nextTourStep() {
    if (!tourActive || tourStep >= sections.length) {
        tourActive = false;
        return;
    }

    const section = sections[tourStep];
    scrollToSection(section.id);

    // Highlight section
    const sectionEl = document.getElementById(section.id);
    if (sectionEl) {
        sectionEl.classList.add('highlighted');

        // Add tour indicator
        let indicator = sectionEl.querySelector('.tour-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'tour-indicator';
            indicator.textContent = `Section ${section.number} of ${sections.length}`;
            sectionEl.appendChild(indicator);
        }
    }

    tourStep++;

    // Auto-advance after 15 seconds, or wait for user
    setTimeout(() => {
        if (tourActive && tourStep < sections.length) {
            const prevSection = sections[tourStep - 1];
            const prevEl = document.getElementById(prevSection.id);
            if (prevEl) {
                const indicator = prevEl.querySelector('.tour-indicator');
                if (indicator) indicator.remove();
                prevEl.classList.remove('highlighted');
            }
            nextTourStep();
        }
    }, 15000);
}

// Handle hash on load
window.addEventListener('load', () => {
    if (location.hash) {
        const el = document.querySelector(location.hash);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView();
                updateActiveSection(el.id);
            }, 100);
        }
    } else {
        showWelcome();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && e.ctrlKey) {
        e.preventDefault();
        const nextIndex = Math.min(sections.length - 1, currentSection);
        if (sections[nextIndex]) {
            scrollToSection(sections[nextIndex].id);
        }
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
        e.preventDefault();
        const prevIndex = Math.max(0, currentSection - 2);
        if (sections[prevIndex]) {
            scrollToSection(sections[prevIndex].id);
        }
    }
});
