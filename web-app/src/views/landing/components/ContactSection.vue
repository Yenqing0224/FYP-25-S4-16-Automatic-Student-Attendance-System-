<template>
  <section id="contact" class="contact-section">
    <div class="contact-container">
      <div class="contact-header">
        <span class="contact-label">Contact</span>
        <h2 class="contact-title">Get in touch</h2>
        <p class="contact-subtitle">Have questions? We'd love to hear from you.</p>
      </div>
      <div class="contact-content">
        <div class="contact-info">
          <div class="info-card">
            <div class="info-icon yellow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <h4>Email</h4>
            <p>contact@attendify.com</p>
          </div>
          <div class="info-card">
            <div class="info-icon green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <h4>Phone</h4>
            <p>+65 1234 5678</p>
          </div>
          <div class="info-card">
            <div class="info-icon blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <h4>Location</h4>
            <p>Singapore</p>
          </div>
        </div>
        <form class="contact-form" @submit.prevent="handleSubmit">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Name *</label>
              <input 
                id="name" 
                v-model="form.name" 
                type="text" 
                placeholder="Your name"
                :class="{ 'has-error': errors.name }"
              />
              <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
            </div>
            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                id="email" 
                v-model="form.email" 
                type="email" 
                placeholder="your@email.com"
                :class="{ 'has-error': errors.email }"
              />
              <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
            </div>
          </div>
          <div class="form-group">
            <label for="school">School Name</label>
            <input 
              id="school" 
              v-model="form.school" 
              type="text" 
              placeholder="Your school (optional)"
            />
          </div>
          <div class="form-group">
            <label for="message">Message *</label>
            <textarea 
              id="message" 
              v-model="form.message" 
              rows="4" 
              placeholder="How can we help you?"
              :class="{ 'has-error': errors.message }"
            ></textarea>
            <span v-if="errors.message" class="error-message">{{ errors.message }}</span>
          </div>
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? 'Sending...' : 'Send Message' }}
          </button>
          <p v-if="submitSuccess" class="success-message">Thanks! We'll get back to you soon.</p>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts" name="ContactSection">
interface ContactForm {
  name: string;
  email: string;
  school: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

const form = ref<ContactForm>({
  name: '',
  email: '',
  school: '',
  message: ''
});

const errors = ref<FormErrors>({});
const submitting = ref(false);
const submitSuccess = ref(false);

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validate = (): boolean => {
  errors.value = {};
  
  if (!form.value.name.trim()) {
    errors.value.name = 'Please enter your name';
  }
  
  if (!form.value.email.trim()) {
    errors.value.email = 'Please enter your email';
  } else if (!validateEmail(form.value.email)) {
    errors.value.email = 'Please enter a valid email';
  }
  
  if (!form.value.message.trim()) {
    errors.value.message = 'Please enter a message';
  }
  
  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  submitting.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const submissions = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
  submissions.push({ ...form.value, timestamp: new Date().toISOString() });
  localStorage.setItem('contact_submissions', JSON.stringify(submissions));
  
  submitting.value = false;
  submitSuccess.value = true;
  form.value = { name: '', email: '', school: '', message: '' };
  
  setTimeout(() => { submitSuccess.value = false; }, 3000);
};
</script>

<style lang="scss" scoped>
.contact-section {
  padding: 100px 24px;
  background: #fafafa;
}

.contact-container {
  max-width: 1000px;
  margin: 0 auto;
}

.contact-header {
  text-align: center;
  margin-bottom: 60px;
}

.contact-label {
  display: inline-block;
  background: #FFD93D;
  color: #1a1a1a;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.contact-title {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.contact-subtitle {
  font-size: 16px;
  color: #666;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 48px;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #eee;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: #666;
  }
}

.info-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;

  &.yellow { background: #FFD93D; }
  &.green { background: #4ade80; }
  &.blue { background: #60a5fa; }

  svg {
    width: 22px;
    height: 22px;
    color: #1a1a1a;
  }
}

.contact-form {
  background: white;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid #eee;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  input,
  textarea {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #eee;
    border-radius: 10px;
    font-size: 14px;
    transition: border-color 0.2s;
    box-sizing: border-box;
    background: #fafafa;

    &:focus {
      outline: none;
      border-color: #FFD93D;
      background: white;
    }

    &.has-error {
      border-color: #ef4444;
    }

    &::placeholder {
      color: #999;
    }
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }
}

.error-message {
  display: block;
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background: #1a1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #333;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.success-message {
  text-align: center;
  color: #22c55e;
  font-weight: 500;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .contact-content {
    grid-template-columns: 1fr;
  }

  .contact-info {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .info-card {
    flex: 1;
    min-width: 150px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .contact-section {
    padding: 60px 24px;
  }

  .contact-title {
    font-size: 28px;
  }

  .contact-form {
    padding: 24px;
  }
}
</style>
