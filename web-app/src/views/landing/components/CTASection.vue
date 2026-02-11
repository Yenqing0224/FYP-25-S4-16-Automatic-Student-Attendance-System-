<template>
  <section class="cta-section">
    <div class="cta-container">
      <div class="cta-content">
        <h2 class="cta-title">Ready to get started?</h2>
        <p class="cta-subtitle">Join thousands of schools already using Attendify</p>
        <div class="cta-actions">
          <router-link to="/login" class="btn-cta-primary" data-testid="cta-button">
            Get Started Free
          </router-link>
          <a href="#contact" class="btn-cta-secondary" data-testid="cta-button">
            Contact Sales
          </a>
        </div>
        <p class="cta-note">No credit card required · 14-day free trial</p>
      </div>
      <div class="cta-decoration">
        <div class="deco-circle yellow"></div>
        <div class="deco-circle green"></div>
        <div class="deco-circle blue"></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" name="CTASection">
</script>

<style lang="scss" scoped>
.cta-section {
  padding: 100px 24px;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
}

.cta-container {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.cta-content {
  text-align: center;
  color: white;
}

.cta-title {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;
}

.cta-subtitle {
  font-size: 18px;
  color: #888;
  margin-bottom: 40px;
}

.cta-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-cta-primary {
  background: #FFD93D;
  color: #1a1a1a;
  padding: 16px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(255, 217, 61, 0.3);
  }
}

.btn-cta-secondary {
  background: transparent;
  color: white;
  padding: 16px 32px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  border: 2px solid #444;
  transition: border-color 0.2s;

  &:hover {
    border-color: #666;
  }
}

.cta-note {
  font-size: 14px;
  color: #666;
}

.cta-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;

  &.yellow {
    width: 300px;
    height: 300px;
    background: #FFD93D;
    top: -100px;
    right: -50px;
  }

  &.green {
    width: 200px;
    height: 200px;
    background: #4ade80;
    bottom: -50px;
    left: 10%;
  }

  &.blue {
    width: 150px;
    height: 150px;
    background: #60a5fa;
    top: 50%;
    left: -30px;
  }
}

@media (max-width: 640px) {
  .cta-section {
    padding: 60px 24px;
  }

  .cta-title {
    font-size: 28px;
  }

  .cta-actions {
    flex-direction: column;
  }
}
</style>
