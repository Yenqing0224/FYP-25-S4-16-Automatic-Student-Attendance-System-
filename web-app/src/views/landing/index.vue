<template>
  <div class="landing-page">
    <LandingNavbar />
    <HeroSection />
    <FeaturesSection />
    <ScreenshotsSection />
    <CTASection />
    <ContactSection />
    <FooterSection />
  </div>
</template>

<script setup lang="ts" name="LandingPage">
import LandingNavbar from './components/LandingNavbar.vue';
import HeroSection from './components/HeroSection.vue';
import FeaturesSection from './components/FeaturesSection.vue';
import ScreenshotsSection from './components/ScreenshotsSection.vue';
import CTASection from './components/CTASection.vue';
import ContactSection from './components/ContactSection.vue';
import FooterSection from './components/FooterSection.vue';

// 平滑滚动
onMounted(() => {
  document.documentElement.style.scrollBehavior = 'smooth';
});

onUnmounted(() => {
  document.documentElement.style.scrollBehavior = '';
});
</script>

<style lang="scss" scoped>
.landing-page {
  min-height: 100vh;
  background: #fafafa;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>

<style lang="scss">
/* 全局样式重置 - 仅在落地页生效 */
.landing-page {
  * {
    box-sizing: border-box;
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
  }

  a {
    text-decoration: none;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
}
</style>
