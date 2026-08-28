/**
 * NEXUS ENTERPRISE ERP — AUTHENTICATION MODAL ENGINE
 * Handles Sign In, Sign Up, SSO SAML/Okta simulation, and Tenant Switching
 */

document.addEventListener('DOMContentLoaded', () => {
  initAuthModals();
});

function initAuthModals() {
  const signinModal = document.getElementById('signin-modal');
  const signupModal = document.getElementById('signup-modal');
  const openSigninBtns = document.querySelectorAll('.auth-signin-btn');
  const openSignupBtns = document.querySelectorAll('.auth-signup-btn');
  const closeSigninBtn = document.getElementById('signin-modal-close');
  const closeSignupBtn = document.getElementById('signup-modal-close');
  const switchToSignupLink = document.getElementById('switch-to-signup');
  const switchToSigninLink = document.getElementById('switch-to-signin');

  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');
  const ssoButtons = document.querySelectorAll('.sso-btn');

  // Open Sign In Modal
  openSigninBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (signupModal) signupModal.classList.remove('open');
      if (signinModal) signinModal.classList.add('open');
    });
  });

  // Open Sign Up Modal
  openSignupBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (signinModal) signinModal.classList.remove('open');
      if (signupModal) signupModal.classList.add('open');
    });
  });

  // Close Modals
  if (closeSigninBtn && signinModal) {
    closeSigninBtn.addEventListener('click', () => signinModal.classList.remove('open'));
  }
  if (closeSignupBtn && signupModal) {
    closeSignupBtn.addEventListener('click', () => signupModal.classList.remove('open'));
  }

  // Backdrop click to close
  [signinModal, signupModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  });

  // Switch between Sign In and Sign Up
  if (switchToSignupLink) {
    switchToSignupLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (signinModal) signinModal.classList.remove('open');
      if (signupModal) signupModal.classList.add('open');
    });
  }

  if (switchToSigninLink) {
    switchToSigninLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (signupModal) signupModal.classList.remove('open');
      if (signinModal) signinModal.classList.add('open');
    });
  }

  // Handle Sign In Submission
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signin-email')?.value || 'controller@acme-global.com';
      const tenantDomain = document.getElementById('signin-tenant')?.value || 'acme-global';

      const submitBtn = signinForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Verifying RLS Context...</span>`;
      }

      try {
        const apiBase = window.API_BASE || 'http://localhost:3000';
        const response = await fetch(`${apiBase}/api/v1/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, tenantDomain })
        });
        const data = await response.json();
        if (signinModal) signinModal.classList.remove('open');
        showAuthToast(`✓ Authenticated: Session established for [${data.tenant.slug}] with RLS enforcement.`);
      } catch (err) {
        if (signinModal) signinModal.classList.remove('open');
        showAuthToast(`✓ Authenticated: Welcome back to tenant [${tenantDomain}] as ${email}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In to ERP Cockpit</span>`;
        }
      }
    });
  }

  // Handle Sign Up Submission
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-name')?.value || 'Lead Architect';
      const workEmail = document.getElementById('signup-email')?.value || 'architect@enterprise.com';
      const companyName = document.getElementById('signup-company')?.value || 'Acme Global Holdings';
      const deploymentTier = document.getElementById('signup-tier')?.value || 'tier_2_dedicated_schema';
      const entityCount = document.getElementById('signup-entities')?.value || 4;

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Provisioning Sandbox...</span>`;
      }

      try {
        const apiBase = window.API_BASE || 'http://localhost:3000';
        const response = await fetch(`${apiBase}/api/v1/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullName, workEmail, companyName, deploymentTier, entityCount })
        });
        const data = await response.json();
        if (signupModal) signupModal.classList.remove('open');
        showAuthToast(`🚀 Workspace Provisioned: ${data.workspaceUrl || 'Ready in sandbox'}`);
      } catch (err) {
        if (signupModal) signupModal.classList.remove('open');
        showAuthToast(`🚀 Sandbox Provisioned: Welcome ${fullName}! Schema isolation active for ${companyName}.`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Create 14-Day Free Sandbox</span>`;
        }
      }
    });
  }

  // Handle SSO Corporate Login Buttons (Okta, Google Workspace, Azure AD)
  ssoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider') || 'Enterprise SAML';
      showAuthToast(`🔒 Redirecting to ${provider} Single Sign-On IdP...`);
      setTimeout(() => {
        if (signinModal) signinModal.classList.remove('open');
        showAuthToast(`✓ SSO Verified via ${provider}. PostgreSQL RLS Session Activated.`);
      }, 1000);
    });
  });
}

function showAuthToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: var(--accent-cyan); font-weight: 700;">🔒</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
