// script.js

document.addEventListener('DOMContentLoaded', () => {

    // Auth Integration
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            profileLink.href = user.role === 'admin' ? 'admin.html' : 'dashboard.html';
            profileLink.title = `Dashboard (${user.username})`;
            profileLink.classList.add('logged-in');

            // Show Messages nav link for logged-in users
            const msgLink = document.getElementById('messagesNavLink');
            if (msgLink) msgLink.style.display = 'flex';

            // Fetch unread message count for nav badge
            fetch('/api/messages?action=conversations', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(data => {
                const count = data.total_unread || 0;
                const badge = document.getElementById('navUnreadBadge');
                if (badge && count > 0) {
                    badge.style.display = 'inline-block';
                    badge.textContent = count > 9 ? '9+' : count;
                }
            }).catch(() => {});
        }
    }


    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeMenuBtn = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-links a');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active Link Scroll Spy
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    });

    // Simple Reveal Animation on Scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply reveal to elements that need it
    const revealElements = document.querySelectorAll('.about-text, .about-image-wrapper, .class-card, .benefit-item');

    revealElements.forEach(el => {
        el.style.opacity = 0;
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
        observer.observe(el);
    });

});
