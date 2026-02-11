<template>
  <nav class="landing-navbar">
    <div class="navbar-container">
      <div class="navbar-brand">
        <div class="navbar-logo">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="navbar-brand-text">
          <span class="navbar-title">Attendify</span>
          <span class="navbar-tagline">Smart Attendance System</span>
        </div>
      </div>
      <div class="navbar-links" :class="{ 'is-active': mobileMenuOpen }">
        <a href="#" class="navbar-link active">Home</a>
        <a href="#features" class="navbar-link" @click="closeMobileMenu">Product</a>
        <a href="#screenshots" class="navbar-link" @click="closeMobileMenu">Screenshots</a>
        <a href="#contact" class="navbar-link" @click="closeMobileMenu">Contact</a>
      </div>
      <div class="navbar-actions">
        <router-link to="/login" class="btn-get-started">Get Started</router-link>
      </div>
      <button class="mobile-menu-btn" @click="toggleMobileMenu">
        <span class="menu-icon"></span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts" name="LandingNavbar">
const mobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};
</script>

<style lang="scss" scoped>
.landing-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fafafa;
  z-index: 1000;
  border-bottom: 1px solid #eee;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.navbar-logo {
  width: 36px;
  height: 36px;
  background: #FFD93D;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 22px;
    height: 22px;
    color: #1a1a1a;
  }
}

.navbar-brand-text {
  display: flex;
  flex-direction: column;
}

.navbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.navbar-tagline {
  font-size: 11px;
  color: #666;
}

.navbar-links {
  display: flex;
  gap: 32px;
}

.navbar-link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;

  &:hover,
  &.active {
    color: #1a1a1a;
  }

  &.active::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    right: 0;
    height: 2px;
    background: #FFD93D;
    border-radius: 1px;
  }
}

.navbar-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-get-started {
  background: #1a1a1a;
  color: white;
  text-decoration: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: background 0.2s;

  &:hover {
    background: #333;
  }
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
}

.menu-icon {
  display: block;
  width: 24px;
  height: 2px;
  background: #1a1a1a;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 2px;
    background: #1a1a1a;
    left: 0;
  }

  &::before { top: -8px; }
  &::after { top: 8px; }
}

@media (max-width: 768px) {
  .navbar-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #fafafa;
    flex-direction: column;
    padding: 16px 24px;
    gap: 16px;
    border-bottom: 1px solid #eee;

    &.is-active {
      display: flex;
    }
  }

  .navbar-actions {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }
}
</style>
