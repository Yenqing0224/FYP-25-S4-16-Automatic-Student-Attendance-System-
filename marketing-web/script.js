// Mobile menu toggle
function toggleMenu() {
  const links = document.querySelector('.navbar-links');
  const btn = document.querySelector('.mobile-menu-btn');
  const isExpanded = links.classList.toggle('mobile-active');
  btn.setAttribute('aria-expanded', isExpanded);
}

// Lightbox functionality
function openLightbox(imgSrc, caption) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  
  lightbox.classList.add('active');
  lightboxImg.src = imgSrc;
  lightboxCaption.textContent = caption;
  document.body.style.overflow = 'hidden';
  
  // Focus trap for accessibility
  lightbox.focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

// Initialize screenshot click handlers
document.addEventListener('DOMContentLoaded', function() {
  // Web screenshots
  document.querySelectorAll('.screenshot-frame img').forEach(img => {
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      const caption = this.closest('.web-screenshot-item')?.querySelector('.screenshot-caption')?.textContent || '';
      openLightbox(this.src, caption);
    });
    
    // Keyboard accessibility
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Click to enlarge image');
    img.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const caption = this.closest('.web-screenshot-item')?.querySelector('.screenshot-caption')?.textContent || '';
        openLightbox(this.src, caption);
      }
    });
  });
  
  // Mobile screenshots
  document.querySelectorAll('.phone-frame img').forEach(img => {
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      const caption = this.closest('.mobile-screenshot-item')?.querySelector('.screenshot-caption')?.textContent || '';
      openLightbox(this.src, caption);
    });
    
    // Keyboard accessibility
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Click to enlarge image');
    img.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const caption = this.closest('.mobile-screenshot-item')?.querySelector('.screenshot-caption')?.textContent || '';
        openLightbox(this.src, caption);
      }
    });
  });
  
  // Add aria-labels to navigation links
  document.querySelectorAll('.navbar-link').forEach(link => {
    const text = link.textContent.trim();
    link.setAttribute('aria-label', `Navigate to ${text}`);
  });
});

// Contact form handling
const contactForm = document.getElementById('contactForm');
const requiredFields = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'message', label: 'Message' }
];

function getValidationMessage(field, label) {
  if (field.validity.valueMissing) {
    return `${label} is required.`;
  }
  if (field.type === 'email' && field.validity.typeMismatch) {
    return 'Please enter a valid email address.';
  }
  return '';
}

function validateField(field, label) {
  const message = getValidationMessage(field, label);
  field.setCustomValidity(message);
  return message === '';
}

requiredFields.forEach(({ id, label }) => {
  const field = document.getElementById(id);
  if (!field) return;

  field.addEventListener('input', () => {
    validateField(field, label);
  });

  field.addEventListener('blur', () => {
    validateField(field, label);
  });
});

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  let isValid = true;
  requiredFields.forEach(({ id, label }) => {
    const field = document.getElementById(id);
    if (!field) return;
    if (!validateField(field, label)) {
      isValid = false;
    }
  });

  if (!isValid) {
    contactForm.reportValidity();
    return;
  }
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const school = document.getElementById('school').value;
  const message = document.getElementById('message').value;
  
  // Store in localStorage (for demo)
  const submissions = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
  submissions.push({
    name,
    email,
    school,
    message,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('contact_submissions', JSON.stringify(submissions));
  
  // Show success message
  document.getElementById('successMessage').style.display = 'block';
  
  // Reset form
  this.reset();
  
  // Hide success message after 3 seconds
  setTimeout(() => {
    document.getElementById('successMessage').style.display = 'none';
  }, 3000);
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Update copyright year
document.querySelector('.copyright').textContent = 
  `© ${new Date().getFullYear()} Attendify. All rights reserved.`;

// Add mobile menu styles dynamically
const style = document.createElement('style');
style.textContent = `
  .navbar-links.mobile-active {
    display: flex !important;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fafafa;
    flex-direction: column;
    padding: 16px 24px;
    gap: 16px;
    border-bottom: 1px solid #eee;
  }
`;
document.head.appendChild(style);


// FAQ Toggle
function toggleFaq(button) {
  const faqItem = button.parentElement;
  const isActive = faqItem.classList.contains('active');
  const answer = faqItem.querySelector('.faq-answer');
  
  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
    item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
  });
  
  // Open clicked item if it wasn't active
  if (!isActive) {
    faqItem.classList.add('active');
    button.setAttribute('aria-expanded', 'true');
  }
}

// Counter Animation
function animateCounters() {
  const counters = document.querySelectorAll('.trust-number');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
      current += step;
      if (current < target) {
        counter.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString();
      }
    };
    
    updateCounter();
  });
}

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      
      // Trigger counter animation when trust section is visible
      if (entry.target.classList.contains('trust-section')) {
        animateCounters();
      }
      
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
  // Add animation classes to sections
  const sections = document.querySelectorAll('.demo-section, .trust-section, .testimonials-section, .faq-section');
  sections.forEach(section => {
    section.classList.add('animate-on-scroll');
    observer.observe(section);
  });
  
  // Observe trust section specifically for counter animation
  const trustSection = document.querySelector('.trust-section');
  if (trustSection) {
    observer.observe(trustSection);
  }
  
  // Add aria-expanded to FAQ buttons
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false');
  });
  
  // Add aria-label to mobile menu button
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  if (mobileMenuBtn) {
    mobileMenuBtn.setAttribute('aria-label', 'Toggle navigation menu');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }
});

// Smooth reveal for cards
document.querySelectorAll('.testimonial-card, .role-section, .feature-item').forEach((card, index) => {
  card.style.animationDelay = `${index * 0.1}s`;
});

// Lazy load images for better performance
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}
