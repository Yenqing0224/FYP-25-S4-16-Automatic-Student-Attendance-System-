<template>
  <section id="features" class="features-section">
    <div class="features-container">
      <div class="features-header">
        <span class="features-label">Features</span>
        <h2 class="features-title">Everything you need to manage attendance</h2>
        <p class="features-subtitle">Powerful tools designed for modern schools</p>
      </div>
      <div class="features-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card" data-testid="feature-card">
          <div class="feature-icon" :style="{ background: feature.color }" data-testid="feature-icon">
            <component :is="feature.iconComponent" />
          </div>
          <h3 class="feature-title" data-testid="feature-title">{{ feature.title }}</h3>
          <p class="feature-description" data-testid="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" name="FeaturesSection">
import { h } from 'vue';

const ChartIcon = () => h('svg', { 
  viewBox: '0 0 24 24', 
  fill: 'none', 
  stroke: 'currentColor', 
  'stroke-width': '2' 
}, [
  h('path', { d: 'M18 20V10' }),
  h('path', { d: 'M12 20V4' }),
  h('path', { d: 'M6 20v-6' })
]);

const UsersIcon = () => h('svg', { 
  viewBox: '0 0 24 24', 
  fill: 'none', 
  stroke: 'currentColor', 
  'stroke-width': '2' 
}, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '9', cy: '7', r: '4' }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
]);

const FileIcon = () => h('svg', { 
  viewBox: '0 0 24 24', 
  fill: 'none', 
  stroke: 'currentColor', 
  'stroke-width': '2' 
}, [
  h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
  h('polyline', { points: '14 2 14 8 20 8' }),
  h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
  h('line', { x1: '16', y1: '17', x2: '8', y2: '17' })
]);

const BellIcon = () => h('svg', { 
  viewBox: '0 0 24 24', 
  fill: 'none', 
  stroke: 'currentColor', 
  'stroke-width': '2' 
}, [
  h('path', { d: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' }),
  h('path', { d: 'M13.73 21a2 2 0 0 1-3.46 0' })
]);

const features = [
  {
    iconComponent: ChartIcon,
    title: 'Real-time Analytics',
    description: 'Track attendance rates instantly with beautiful dashboards and automated reports.',
    color: '#FFD93D'
  },
  {
    iconComponent: UsersIcon,
    title: 'Student Management',
    description: 'Easily manage student profiles, classes, and enrollment with bulk import support.',
    color: '#4ade80'
  },
  {
    iconComponent: FileIcon,
    title: 'Smart Reports',
    description: 'Generate daily, weekly, and monthly reports automatically. Export to Excel anytime.',
    color: '#60a5fa'
  },
  {
    iconComponent: BellIcon,
    title: 'Instant Notifications',
    description: 'Automatically notify teachers and parents when students are absent.',
    color: '#f472b6'
  }
];
</script>

<style lang="scss" scoped>
.features-section {
  padding: 100px 24px;
  background: #fafafa;
}

.features-container {
  max-width: 1000px;
  margin: 0 auto;
}

.features-header {
  text-align: center;
  margin-bottom: 60px;
}

.features-label {
  display: inline-block;
  background: #FFD93D;
  color: #1a1a1a;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.features-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.features-subtitle {
  font-size: 16px;
  color: #666;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-card {
  background: white;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #eee;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
  }
}

.feature-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;

  svg {
    width: 28px;
    height: 28px;
    color: #1a1a1a;
  }
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 10px;
}

.feature-description {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }

  .features-title {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .features-section {
    padding: 60px 24px;
  }

  .feature-card {
    padding: 24px;
  }
}
</style>
