import { Component, OnDestroy, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import type { Order, OrderStatus, LoginResponse } from '@concierge/types';

function resolveApi(): string {
  const params = new URLSearchParams(window.location.search);
  const queryApi = params.get('api');
  if (queryApi) sessionStorage.setItem('concierge_api', queryApi);
  return queryApi || sessionStorage.getItem('concierge_api') || (window as any).__API__ || 'http://localhost:4000';
}
const API = resolveApi();

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reception" *ngIf="loggedIn(); else loginTpl">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar__left">
          <div class="brand">
            <div class="brand__icon">C</div>
            <div>
              <div class="brand__name font-display">Réception</div>
              <div class="brand__sub">{{ tenantName() || 'Live' }}</div>
            </div>
          </div>
          <div class="status-badge" [class.status-badge--live]="connected()">
            <span class="status-dot"></span>
            {{ connected() ? 'Temps réel' : 'Reconnexion…' }}
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-mini" *ngFor="let c of counters()">
            <span class="kpi-mini__num">{{ c.count }}</span>
            <span class="kpi-mini__label">{{ c.label }}</span>
          </div>
          <div class="kpi-mini kpi-mini--accent">
            <span class="kpi-mini__num">{{ todayRevenue().toFixed(0) }}€</span>
            <span class="kpi-mini__label">CA jour</span>
          </div>
        </div>

        <div class="topbar__right">
          <button class="topbar-btn" (click)="soundEnabled.set(!soundEnabled())" [class.on]="soundEnabled()" aria-label="Son">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M3 10v4a1 1 0 0 0 1 1h3l4 4V5L7 9H4a1 1 0 0 0-1 1zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>
            </svg>
          </button>
          <div class="user-chip">
            <div class="avatar">{{ userInitial() }}</div>
            <span>{{ user()?.firstName }}</span>
          </div>
          <button class="topbar-btn" (click)="logout()" aria-label="Déconnexion">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Kanban -->
      <main class="kanban">
        <div class="kanban__col" *ngFor="let col of columns" [class.kanban__col--urgent]="col.status === 'pending' && counters()[0].count > 0">
          <div class="col-head" [attr.data-status]="col.status">
            <span class="col-head__icon">{{ col.icon }}</span>
            <span class="col-head__label">{{ col.label }}</span>
            <span class="col-head__count">{{ filteredOrders(col.status).length }}</span>
          </div>

          <div class="col-cards">
            <article
              *ngFor="let order of filteredOrders(col.status); trackBy: trackOrder"
              class="card"
              [class.card--new]="newOrderIds().has(order.id)"
              [class.card--urgent]="isUrgent(order)"
            >
              <header class="card__head">
                <span class="card__id">#{{ order.id.slice(-4).toUpperCase() }}</span>
                <span class="card__time" [class.card__time--late]="isUrgent(order)">
                  {{ minutesAgo(order.createdAt) }}'
                </span>
              </header>

              <div class="card__room">
                <span>🚪</span>
                <span class="card__room-num">{{ order.room }}</span>
                <span class="card__guest" *ngIf="order.guestName">· {{ order.guestName }}</span>
              </div>

              <ul class="card__items">
                <li *ngFor="let it of order.items">
                  <span class="card__item-qty">{{ it.quantity }}×</span>
                  <span class="card__item-name">{{ it.name }}</span>
                </li>
              </ul>

              <footer class="card__foot">
                <span class="card__total">{{ order.total.toFixed(2) }} €</span>
                <span class="card__source">{{ sourceIcon(order.source) }}</span>
              </footer>

              <div class="card__actions" *ngIf="col.next">
                <button class="action action--primary" (click)="updateStatus(order, col.next)">
                  {{ col.actionLabel }} →
                </button>
                <button class="action action--ghost" (click)="updateStatus(order, 'cancelled')" *ngIf="col.status !== 'delivered'" aria-label="Annuler">
                  ✕
                </button>
              </div>
            </article>

            <div *ngIf="filteredOrders(col.status).length === 0" class="col-empty">
              <span>{{ col.icon }}</span>
              <p>{{ col.empty }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <ng-template #loginTpl>
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand">
            <div class="brand__icon brand__icon--big">C</div>
            <h1 class="font-display">Réception</h1>
            <p>Tableau de bord temps réel</p>
          </div>
          <form (submit)="login(); $event.preventDefault()" class="login-form">
            <label>
              <span>Email</span>
              <input type="email" [(ngModel)]="email" name="email" required />
            </label>
            <label>
              <span>Mot de passe</span>
              <input type="password" [(ngModel)]="password" name="pwd" required />
            </label>
            <button type="submit">Se connecter →</button>
            <p class="login-error" *ngIf="loginError()">{{ loginError() }}</p>
          </form>
          <div class="login-hint">
            <strong>Compte de démo</strong>
            <code>staff&#64;royal-lyon.fr</code>
            <code>Demo2026!</code>
          </div>
        </div>
        <div class="login-bg"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap');

    :host {
      --c-primary: #1a4d8c;
      --c-primary-dark: #143a6a;
      --c-accent: #d4a85a;
      --c-bg: #f3f1ea;
      --c-bg-card: #ffffff;
      --c-text: #1a1d24;
      --c-text-muted: #5e6470;
      --c-border: rgba(26,29,36,0.08);
      --c-success: #2d7a4b;
      --c-warning: #c4861d;
      --c-danger: #c44b3f;
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
    }
    .font-display { font-family: 'Playfair Display', serif; }

    .reception { display: flex; flex-direction: column; height: 100vh; background: var(--c-bg); overflow: hidden; }

    /* Topbar */
    .topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 24px; padding: 16px 24px; background: var(--c-bg-card); border-bottom: 1px solid var(--c-border); box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .topbar__left { display: flex; align-items: center; gap: 24px; }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand__icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
      color: white; border-radius: 12px;
      display: grid; place-items: center;
      font-family: 'Playfair Display'; font-size: 24px; font-weight: 700;
      box-shadow: 0 4px 12px rgba(26,77,140,0.25);
    }
    .brand__icon--big { width: 64px; height: 64px; font-size: 32px; }
    .brand__name { font-size: 22px; }
    .brand__sub { font-size: 12px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 12px;
      background: rgba(196,134,29,0.1); color: var(--c-warning);
      border-radius: 999px;
      font-size: 13px; font-weight: 600;
    }
    .status-badge--live { background: rgba(45,122,75,0.12); color: var(--c-success); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 0 0 currentColor; }
    .status-badge--live .status-dot { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(45,122,75,0.6); }
      70% { box-shadow: 0 0 0 8px rgba(45,122,75,0); }
      100% { box-shadow: 0 0 0 0 rgba(45,122,75,0); }
    }

    /* KPI row in center */
    .kpi-row { display: flex; gap: 12px; justify-content: center; }
    .kpi-mini {
      display: flex; flex-direction: column; align-items: center;
      padding: 6px 16px; background: var(--c-bg); border-radius: 10px;
      min-width: 80px;
    }
    .kpi-mini--accent { background: var(--c-primary); color: white; }
    .kpi-mini__num { font-family: 'Playfair Display'; font-size: 22px; font-weight: 700; line-height: 1; }
    .kpi-mini__label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; margin-top: 2px; }

    .topbar__right { display: flex; align-items: center; gap: 8px; }
    .topbar-btn { width: 40px; height: 40px; background: var(--c-bg); border: none; border-radius: 10px; color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; }
    .topbar-btn.on { background: var(--c-accent); color: white; }
    .topbar-btn:hover { background: var(--c-text-muted); color: white; }

    .user-chip { display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; background: var(--c-bg); border-radius: 999px; font-size: 14px; font-weight: 600; }
    .avatar { width: 32px; height: 32px; background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark)); color: white; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; }

    /* Kanban */
    .kanban { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; overflow: hidden; }
    .kanban__col { background: rgba(0,0,0,0.03); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; min-height: 0; transition: background 0.2s; }
    .kanban__col--urgent { background: rgba(196,134,29,0.08); }

    .col-head { display: flex; align-items: center; gap: 8px; padding: 4px 8px 12px; }
    .col-head__icon { font-size: 18px; }
    .col-head__label { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-muted); flex: 1; }
    .col-head__count { background: var(--c-bg-card); padding: 4px 12px; border-radius: 999px; font-weight: 700; font-size: 13px; min-width: 32px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .col-head[data-status="pending"] .col-head__count { background: var(--c-warning); color: white; }
    .col-head[data-status="accepted"] .col-head__count { background: #5b8fc7; color: white; }
    .col-head[data-status="preparing"] .col-head__count { background: #7572ff; color: white; }
    .col-head[data-status="delivered"] .col-head__count { background: var(--c-success); color: white; }

    .col-cards { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px; }

    /* Card */
    .card { background: var(--c-bg-card); border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); border: 1px solid var(--c-border); transition: all 0.2s; position: relative; overflow: hidden; }
    .card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }
    .card--new { animation: slideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), highlight 2s; }
    .card--urgent { border-color: var(--c-danger); }
    .card--urgent::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--c-danger); }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes highlight {
      0% { box-shadow: 0 0 0 0 rgba(212,168,90,0.6); border-color: var(--c-accent); }
      100% { box-shadow: 0 0 0 8px rgba(212,168,90,0); border-color: var(--c-border); }
    }

    .card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .card__id { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; color: var(--c-text-muted); letter-spacing: 0.05em; }
    .card__time { font-size: 11px; color: var(--c-text-muted); padding: 2px 8px; background: var(--c-bg); border-radius: 999px; font-weight: 600; }
    .card__time--late { background: rgba(196,75,63,0.12); color: var(--c-danger); }

    .card__room { display: flex; align-items: center; gap: 4px; font-weight: 700; color: var(--c-primary); margin-bottom: 8px; }
    .card__room-num { font-size: 16px; }
    .card__guest { color: var(--c-text-muted); font-weight: 400; font-size: 13px; }

    .card__items { list-style: none; padding: 0; margin: 0 0 10px; font-size: 13px; }
    .card__items li { padding: 2px 0; display: flex; gap: 6px; line-height: 1.3; }
    .card__item-qty { color: var(--c-primary); font-weight: 700; min-width: 24px; }
    .card__item-name { color: var(--c-text); }

    .card__foot { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--c-border); }
    .card__total { font-family: 'Playfair Display'; font-size: 18px; font-weight: 700; color: var(--c-primary); }
    .card__source { font-size: 18px; opacity: 0.6; }

    .card__actions { display: flex; gap: 4px; margin-top: 10px; }
    .action { padding: 8px 12px; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .action--primary { flex: 1; background: var(--c-primary); color: white; }
    .action--primary:hover { background: var(--c-primary-dark); }
    .action--primary:active { transform: scale(0.97); }
    .action--ghost { background: transparent; color: var(--c-text-muted); border: 1px solid var(--c-border); width: 36px; }
    .action--ghost:hover { background: var(--c-danger); color: white; border-color: var(--c-danger); }

    .col-empty { text-align: center; color: var(--c-text-muted); padding: 32px 8px; opacity: 0.5; display: flex; flex-direction: column; gap: 8px; align-items: center; }
    .col-empty span { font-size: 32px; opacity: 0.5; }
    .col-empty p { font-size: 13px; margin: 0; }

    /* Login (same as admin but compact) */
    .login-page { min-height: 100vh; display: grid; grid-template-columns: 480px 1fr; background: var(--c-bg); }
    .login-card { padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; background: var(--c-bg-card); }
    .login-brand { text-align: center; margin-bottom: 40px; }
    .login-brand h1 { font-size: 32px; margin: 16px 0 4px; color: var(--c-text); }
    .login-brand p { color: var(--c-text-muted); margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 16px; }
    .login-form label { display: flex; flex-direction: column; gap: 6px; }
    .login-form label span { font-size: 13px; font-weight: 600; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .login-form input { padding: 14px 16px; font-size: 16px; border: 2px solid var(--c-border); border-radius: 10px; background: var(--c-bg); transition: border-color 0.15s; font-family: inherit; }
    .login-form input:focus { outline: none; border-color: var(--c-primary); }
    .login-form button { padding: 16px; background: var(--c-primary); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; margin-top: 8px; cursor: pointer; }
    .login-form button:hover { background: var(--c-primary-dark); }
    .login-error { color: var(--c-danger); font-size: 13px; margin: 0; padding: 8px 12px; background: rgba(196,75,63,0.08); border-radius: 8px; }
    .login-hint { margin-top: 32px; padding: 16px; background: var(--c-bg); border: 1px dashed var(--c-border); border-radius: 10px; display: flex; flex-direction: column; gap: 6px; align-items: center; font-size: 13px; }
    .login-hint strong { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-muted); }
    .login-hint code { font-family: 'JetBrains Mono', monospace; background: var(--c-bg-card); padding: 4px 10px; border-radius: 6px; font-size: 13px; color: var(--c-text); }

    .login-bg {
      background-image: url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=80');
      background-size: cover; background-position: center;
      position: relative;
    }
    .login-bg::after {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(135deg, rgba(26,77,140,0.6) 0%, rgba(13,39,72,0.85) 100%);
    }

    @media (max-width: 1100px) {
      .kanban { grid-template-columns: repeat(2, 1fr); }
      .kpi-row { display: none; }
      .login-page { grid-template-columns: 1fr; }
      .login-bg { display: none; }
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  email = 'staff@royal-lyon.fr';
  password = 'Demo2026!';
  loggedIn = signal(false);
  loginError = signal<string | null>(null);
  user = signal<any>(null);
  tenantName = signal('');
  connected = signal(false);
  orders = signal<Order[]>([]);
  newOrderIds = signal<Set<string>>(new Set());
  soundEnabled = signal(true);

  private socket: Socket | null = null;
  private token = '';

  columns: { label: string; icon: string; status: OrderStatus; next?: OrderStatus; actionLabel?: string; empty: string }[] = [
    { label: 'Reçues', icon: '🔔', status: 'pending', next: 'accepted', actionLabel: 'Accepter', empty: 'Aucune commande en attente' },
    { label: 'Acceptées', icon: '✅', status: 'accepted', next: 'preparing', actionLabel: 'Préparer', empty: 'Aucune commande acceptée' },
    { label: 'En préparation', icon: '👨‍🍳', status: 'preparing', next: 'delivered', actionLabel: 'Marquer livrée', empty: 'Aucune préparation en cours' },
    { label: 'Livrées', icon: '🎉', status: 'delivered', empty: 'Aucune commande livrée' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const stored = localStorage.getItem('reception_auth');
    if (stored) {
      const data = JSON.parse(stored);
      this.token = data.token;
      this.user.set(data.user);
      this.tenantName.set(data.tenantName ?? '');
      this.loggedIn.set(true);
      this.connectSocket();
      this.loadOrders();
    }
  }

  ngOnDestroy() { this.socket?.disconnect(); }

  counters = computed(() => this.columns.map((c) => ({ label: c.label, count: this.orders().filter((o) => o.status === c.status).length })));
  todayRevenue = computed(() =>
    this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000 && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  );
  userInitial = computed(() => (this.user()?.firstName?.charAt(0) || 'U').toUpperCase());

  filteredOrders(status: OrderStatus): Order[] {
    return this.orders()
      .filter((o) => o.status === status)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  trackOrder = (_: number, o: Order) => o.id;

  isUrgent(o: Order): boolean { return this.minutesAgo(o.createdAt) > 15 && o.status !== 'delivered' && o.status !== 'cancelled'; }
  minutesAgo(iso: string): number { return Math.floor((Date.now() - new Date(iso).getTime()) / 60000); }
  sourceIcon(s: string): string { return ({ kiosk: '🖥️', tablet: '📱', reception: '🛎️' } as any)[s] || '·'; }

  login() {
    this.loginError.set(null);
    this.http.post<LoginResponse>(`${API}/auth/login`, { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.token = res.accessToken;
        this.user.set(res.user);
        this.tenantName.set('Le Royal Lyon');
        localStorage.setItem('reception_auth', JSON.stringify({ token: res.accessToken, user: res.user, tenantName: 'Le Royal Lyon' }));
        this.loggedIn.set(true);
        this.connectSocket();
        this.loadOrders();
      },
      error: () => this.loginError.set('Identifiants invalides'),
    });
  }

  logout() {
    localStorage.removeItem('reception_auth');
    this.socket?.disconnect();
    this.loggedIn.set(false);
    this.user.set(null);
    this.orders.set([]);
  }

  private loadOrders() {
    this.http.get<Order[]>(`${API}/orders`, { headers: { Authorization: `Bearer ${this.token}` } })
      .subscribe((data) => this.orders.set(data));
  }

  private connectSocket() {
    this.socket = io(`${API}/concierge`, { auth: { token: this.token }, transports: ['websocket'] });
    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('order:new', (o: Order) => {
      this.orders.update((list) => [o, ...list]);
      this.markNew(o.id);
      if (this.soundEnabled()) this.playSound();
    });
    this.socket.on('order:updated', (o: Order) => this.orders.update((list) => list.map((x) => (x.id === o.id ? o : x))));
  }

  private markNew(id: string) {
    this.newOrderIds.update((set) => new Set([...set, id]));
    setTimeout(() => this.newOrderIds.update((set) => { const ns = new Set(set); ns.delete(id); return ns; }), 2200);
  }

  updateStatus(order: Order, status: OrderStatus) {
    this.http.patch<Order>(`${API}/orders/${order.id}/status`, { status }, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe();
  }

  private playSound() {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(880, ctx.currentTime);
      o.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(); o.stop(ctx.currentTime + 0.3);
    } catch {}
  }
}
