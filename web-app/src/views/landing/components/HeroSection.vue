<template>
  <section class="hero-section">
    <div class="hero-container">
      <div class="hero-content">
        <h1 class="hero-headline">
          Track.<br/>
          Manage.<br/>
          Succeed.
        </h1>
        <p class="hero-subtitle">
          Attendify provides an effective and powerful<br/>
          way to manage your school attendance.
        </p>
        <router-link to="/login" class="btn-get-started">Get Started</router-link>
        
        <div class="hero-features">
          <div class="hero-feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">Speed &</span>
              <span class="feature-desc">Efficiency</span>
            </div>
          </div>
          <div class="hero-feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">Flexibility &</span>
              <span class="feature-desc">Scalability</span>
            </div>
          </div>
          <div class="hero-feature">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="feature-text">
              <span class="feature-title">Better</span>
              <span class="feature-desc">Collaboration</span>
            </div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="illustration-container">
          <!-- 简化的插图风格 -->
          <div class="illustration-bg"></div>
          <div class="illustration-window">
            <div class="window-header">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="window-content">
              <div class="content-row">
                <div class="content-block green"></div>
                <div class="content-block yellow"></div>
              </div>
              <div class="content-row">
                <div class="content-block blue"></div>
                <div class="content-block pink"></div>
              </div>
            </div>
          </div>
          <div class="decoration plant-1"></div>
          <div class="decoration plant-2"></div>
          <div class="decoration leaf"></div>
        </div>
      </div>
    </div>
    <div class="hero-bottom-bar"></div>
  </section>
</template>

<script setup lang="ts" name="HeroSection">
</script>

<style lang="scss" scoped>
.hero-section {
  min-height: 100vh;
  background: #f5f3ff;
  padding-top: 70px;
  position: relative;
  overflow: hidden;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  min-height: calc(100vh - 70px);
}

.hero-content {
  z-index: 2;
}

.hero-headline {
  font-size: 64px;
  font-weight: 700;
  line-height: 1.1;
  color: #1a1a1a;
  margin-bottom: 24px;
  font-family: Georgia, serif;
  font-style: italic;
}

.hero-subtitle {
  font-size: 16px;
  line-height: 1.7;
  color: #666;
  margin-bottom: 32px;
}

.btn-get-started {
  display: inline-block;
  background: #1a1a1a;
  color: white;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.2s;
  margin-bottom: 48px;

  &:hover {
    background: #333;
  }
}

.hero-features {
  display: flex;
  gap: 32px;
}

.hero-feature {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  svg {
    width: 20px;
    height: 20px;
    color: #1a1a1a;
  }
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
}

.feature-desc {
  font-size: 12px;
  color: #888;
}

.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.illustration-container {
  position: relative;
  width: 100%;
  height: 400px;
}

.illustration-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #e8e4ff 0%, #d4e4ff 100%);
  border-radius: 50%;
  opacity: 0.5;
}

.illustration-window {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.window-header {
  background: #f5f5f5;
  padding: 12px 16px;
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;

  &.red { background: #ff5f57; }
  &.yellow { background: #febc2e; }
  &.green { background: #28c840; }
}

.window-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-row {
  display: flex;
  gap: 12px;
}

.content-block {
  flex: 1;
  height: 60px;
  border-radius: 8px;

  &.green { background: #4ade80; }
  &.yellow { background: #FFD93D; }
  &.blue { background: #60a5fa; }
  &.pink { background: #f472b6; }
}

.decoration {
  position: absolute;
  border-radius: 50%;

  &.plant-1 {
    bottom: 20px;
    left: 20%;
    width: 60px;
    height: 80px;
    background: #22c55e;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  }

  &.plant-2 {
    bottom: 10px;
    right: 25%;
    width: 40px;
    height: 60px;
    background: #f97316;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  }

  &.leaf {
    top: 30%;
    right: 15%;
    width: 30px;
    height: 50px;
    background: #86efac;
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    transform: rotate(-30deg);
  }
}

.hero-bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #FFD93D;
}

@media (max-width: 968px) {
  .hero-container {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 40px 24px;
  }

  .hero-headline {
    font-size: 48px;
  }

  .hero-subtitle br {
    display: none;
  }

  .hero-features {
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-visual {
    display: none;
  }
}

@media (max-width: 480px) {
  .hero-headline {
    font-size: 36px;
  }

  .hero-features {
    flex-direction: column;
    align-items: center;
  }
}
</style>
