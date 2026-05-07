import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

// Warm-up Render gateway as soon as the page loads — pays the cold-start before login
(() => {
  const params = new URLSearchParams(window.location.search);
  const api = params.get('api')
    || sessionStorage.getItem('concierge_api')
    || (window as any).__API__
    || (location.hostname.includes('vercel.app') ? 'https://concierge-gateway.onrender.com' : null);
  if (api) {
    setTimeout(() => { fetch(`${api}/healthz`, { cache: 'no-store' }).catch(() => undefined); }, 100);
  }
})();

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient()],
}).catch((err) => console.error(err));
