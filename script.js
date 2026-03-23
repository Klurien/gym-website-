/* ==========================================
   DARK FORGE: THE BRUTALIST ENGINE
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    const glow = document.getElementById('glow');
    const reveals = document.querySelectorAll('.reveal');

    // ===== MOUSE PULSE (RED GLOW) =====
    window.addEventListener('mousemove', (e) => {
        glow.style.left = `${e.clientX - 300}px`;
        glow.style.top = `${e.clientY - 300}px`;
    }, { passive: true });

    // ===== REVEAL OBSERVER (SNAPPY) =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    reveals.forEach(el => observer.observe(el));

    // ===== MOBILE DRAWER TOGGLE =====
    const menuToggle = document.getElementById('menuToggle');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    if (menuToggle && mobileDrawer) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileDrawer.classList.toggle('active');
            document.body.style.overflow = mobileDrawer.classList.contains('active') ? 'hidden' : '';
        });

        // Close drawer on link click
        drawerLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileDrawer.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // ===== PARALLAX FOR IMPACT =====
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;

        // Massive Hero Title Parallax
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            heroTitle.style.transform = `translateY(${scrolled * 0.4}px) rotate(${scrolled * 0.01}deg)`;
        }

        // Section Title Parallaxes
        const sectionTitles = document.querySelectorAll('.section-title');
        sectionTitles.forEach(title => {
            const rect = title.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                title.style.transform = `translateX(${(window.innerHeight - rect.top) * 0.1}px)`;
            }
        });
    }, { passive: true });

    // Console brutality
    console.log('%c DARK FORGE: BRUTALIST EDITION %c NO EXCUSES ', 'background: #ff0000; color: black; font-weight: 900; padding: 4px 8px;', '');

});
