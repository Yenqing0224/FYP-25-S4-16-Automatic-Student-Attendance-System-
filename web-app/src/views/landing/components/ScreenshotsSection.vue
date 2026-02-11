<template>
  <section id="screenshots" class="screenshots-section">
    <div class="screenshots-container">
      <div class="screenshots-header">
        <span class="screenshots-label">Preview</span>
        <h2 class="screenshots-title">See it in action</h2>
        <p class="screenshots-subtitle">Clean and intuitive interface designed for efficiency</p>
      </div>
      <div class="screenshots-showcase">
        <div class="screenshot-main">
          <div class="browser-frame">
            <div class="browser-header">
              <div class="browser-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
              <div class="browser-url">attendify.app/dashboard</div>
            </div>
            <div class="browser-content" data-testid="screenshot-image">
              <div class="mock-sidebar">
                <div class="sidebar-item active"></div>
                <div class="sidebar-item"></div>
                <div class="sidebar-item"></div>
                <div class="sidebar-item"></div>
              </div>
              <div class="mock-main">
                <div class="mock-header"></div>
                <div class="mock-stats">
                  <div class="stat-card yellow"></div>
                  <div class="stat-card green"></div>
                  <div class="stat-card blue"></div>
                  <div class="stat-card pink"></div>
                </div>
                <div class="mock-table">
                  <div class="table-header"></div>
                  <div class="table-row" v-for="n in 4" :key="n"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="screenshot-features">
          <div class="screenshot-feature">
            <div class="feature-number">01</div>
            <h4>Dashboard Overview</h4>
            <p>Get a complete view of attendance statistics at a glance</p>
          </div>
          <div class="screenshot-feature">
            <div class="feature-number">02</div>
            <h4>Student Records</h4>
            <p>Manage all student information in one centralized place</p>
          </div>
          <div class="screenshot-feature">
            <div class="feature-number">03</div>
            <h4>Quick Actions</h4>
            <p>Take attendance and generate reports with just a few clicks</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" name="ScreenshotsSection">
</script>

<style lang="scss" scoped>
.screenshots-section {
  padding: 100px 24px;
  background: white;
}

.screenshots-container {
  max-width: 1100px;
  margin: 0 auto;
}

.screenshots-header {
  text-align: center;
  margin-bottom: 60px;
}

.screenshots-label {
  display: inline-block;
  background: #f5f3ff;
  color: #7c3aed;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.screenshots-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.screenshots-subtitle {
  font-size: 16px;
  color: #666;
}

.screenshots-showcase {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 48px;
  align-items: center;
}

.screenshot-main {
  position: relative;
}

.browser-frame {
  background: #1a1a1a;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
}

.browser-header {
  background: #2d2d2d;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.browser-dots {
  display: flex;
  gap: 8px;

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #555;

    &:nth-child(1) { background: #ff5f57; }
    &:nth-child(2) { background: #febc2e; }
    &:nth-child(3) { background: #28c840; }
  }
}

.browser-url {
  flex: 1;
  background: #1a1a1a;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  color: #888;
}

.browser-content {
  display: flex;
  min-height: 350px;
}

.mock-sidebar {
  width: 60px;
  background: #252525;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar-item {
  height: 32px;
  background: #333;
  border-radius: 6px;

  &.active {
    background: #FFD93D;
  }
}

.mock-main {
  flex: 1;
  background: #f8f9fa;
  padding: 20px;
}

.mock-header {
  height: 24px;
  width: 40%;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 20px;
}

.mock-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  height: 70px;
  border-radius: 10px;

  &.yellow { background: #FFD93D; }
  &.green { background: #4ade80; }
  &.blue { background: #60a5fa; }
  &.pink { background: #f472b6; }
}

.mock-table {
  background: white;
  border-radius: 10px;
  padding: 16px;
}

.table-header {
  height: 16px;
  background: #e2e8f0;
  border-radius: 4px;
  margin-bottom: 12px;
}

.table-row {
  height: 32px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.screenshot-features {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.screenshot-feature {
  padding: 24px;
  background: #fafafa;
  border-radius: 12px;
  border-left: 4px solid #FFD93D;

  .feature-number {
    font-size: 12px;
    font-weight: 700;
    color: #FFD93D;
    margin-bottom: 8px;
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 6px;
  }

  p {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }
}

@media (max-width: 968px) {
  .screenshots-showcase {
    grid-template-columns: 1fr;
  }

  .screenshot-features {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .screenshot-feature {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 640px) {
  .screenshots-section {
    padding: 60px 24px;
  }

  .screenshots-title {
    font-size: 28px;
  }

  .mock-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .screenshot-features {
    flex-direction: column;
  }
}
</style>
