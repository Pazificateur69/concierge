import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { LoginResponse, Order, Survey, SurveyStats } from '@concierge/types';

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
    <ng-container *ngIf="loggedIn(); else loginTpl">
      <div class="app">
        <aside class="sidebar">
          <div class="brand">
            <div class="brand__mark">C</div>
            <div class="brand__text">
              <span class="eyebrow">Concierge</span>
              <span class="brand__name serif">Administration</span>
            </div>
          </div>

          <nav class="nav">
            <button class="nav-item" [class.active]="tab() === 'dashboard'" (click)="tab.set('dashboard'); refresh()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
                <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
              </svg>
              <span>Tableau de bord</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'orders'" (click)="tab.set('orders'); loadOrders()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 17h18M5 17a7 7 0 0 1 14 0M12 4v3M10 4h4"/>
              </svg>
              <span>Commandes</span>
              <span class="nav-item__badge" *ngIf="ordersInProgress() > 0">{{ ordersInProgress() }}</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'surveys'" (click)="tab.set('surveys'); loadSurveys()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h6M9 12h6M9 16h3"/>
              </svg>
              <span>Enquêtes</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'pois'" (click)="tab.set('pois')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Adresses</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'menu'" (click)="tab.set('menu')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M7 2v20M3 2v6a4 4 0 0 0 4 4M21 2l-4 6v14M17 8h4"/>
              </svg>
              <span>Carte</span>
            </button>
          </nav>

          <div class="sidebar__user">
            <div class="user-avatar">{{ userInitial() }}</div>
            <div class="user-info">
              <span class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</span>
              <span class="user-role">{{ user()?.role }}</span>
            </div>
            <button class="logout-btn" (click)="logout()" aria-label="Déconnexion">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5z"/>
                <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </aside>

        <main class="main">
          <header class="topbar">
            <div>
              <span class="eyebrow">{{ pageEyebrow() }}</span>
              <h1 class="topbar__title serif">{{ pageTitle() }}</h1>
            </div>
            <div class="topbar__actions">
              <button class="btn-secondary" (click)="refresh()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Actualiser
              </button>
            </div>
          </header>

          <hr class="rule" />

          <!-- DASHBOARD -->
          <section *ngIf="tab() === 'dashboard'" class="content">
            <div class="kpis">
              <div class="kpi">
                <span class="eyebrow">Commandes (24h)</span>
                <div class="kpi__main">
                  <span class="kpi__num serif">{{ ordersToday() }}</span>
                  <span class="kpi__delta kpi__delta--up">+12%</span>
                </div>
                <span class="kpi__sub">CA estimé · {{ revenueToday().toFixed(0) }} €</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">Satisfaction</span>
                <div class="kpi__main">
                  <span class="kpi__num serif">{{ stats()?.averageScore?.toFixed(1) || '—' }}</span>
                  <span class="kpi__unit">/4</span>
                </div>
                <span class="kpi__sub">{{ stats()?.total || 0 }} avis</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">En cours</span>
                <div class="kpi__main">
                  <span class="kpi__num serif">{{ ordersInProgress() }}</span>
                </div>
                <span class="kpi__sub">à traiter</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">Hôtels</span>
                <div class="kpi__main">
                  <span class="kpi__num serif">2</span>
                </div>
                <span class="kpi__sub">multi-tenant</span>
              </div>
            </div>

            <div class="charts">
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Distribution satisfaction</h3>
                  <span class="card__hint">{{ stats()?.total || 0 }} réponses</span>
                </header>
                <div class="bars" *ngIf="stats()?.bySmiley?.length">
                  <div *ngFor="let s of stats()?.bySmiley" class="bar-row">
                    <span class="bar-row__label serif">{{ smileyLabel(s.value) }}</span>
                    <div class="bar-track"><div class="bar-fill" [style.width.%]="s.percentage"></div></div>
                    <span class="bar-row__pct">{{ s.percentage }}%</span>
                  </div>
                </div>
                <div class="empty" *ngIf="!stats()?.bySmiley?.length">
                  <span class="eyebrow">Aucune donnée</span>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Activité 7 jours</h3>
                  <span class="card__hint">commandes / jour</span>
                </header>
                <svg class="sparkline" viewBox="0 0 320 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#14202e" stop-opacity="0.10"/>
                      <stop offset="100%" stop-color="#14202e" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklinePath()" fill="url(#sg)" stroke="none"/>
                  <path [attr.d]="sparklineLine()" fill="none" stroke="#14202e" stroke-width="1.5"/>
                  <g *ngFor="let p of sparklinePoints()">
                    <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#fff" stroke="#14202e" stroke-width="1.5"/>
                  </g>
                </svg>
                <div class="sparkline-axis">
                  <span *ngFor="let d of sparklineDays()">{{ d }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <header class="card__head">
                <h3 class="serif">Dernières commandes</h3>
                <button class="link-btn" (click)="tab.set('orders'); loadOrders()">Voir tout →</button>
              </header>
              <table class="data-table">
                <thead>
                  <tr><th>Réf</th><th>Chambre</th><th>Articles</th><th class="ta-right">Montant</th><th>État</th><th>Heure</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of recentOrders()">
                    <td><span class="mono">{{ o.id.slice(-6).toUpperCase() }}</span></td>
                    <td><strong>{{ o.room }}</strong></td>
                    <td class="text-muted">{{ o.items.length }} articles</td>
                    <td class="ta-right serif">{{ o.total.toFixed(2) }} €</td>
                    <td><span class="tag tag--{{ o.status }}">{{ statusLabel(o.status) }}</span></td>
                    <td class="text-muted small">{{ formatTime(o.createdAt) }}</td>
                  </tr>
                  <tr *ngIf="!recentOrders().length"><td colspan="6" class="empty">Aucune commande</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- ORDERS -->
          <section *ngIf="tab() === 'orders'" class="content">
            <div class="orders-toolbar">
              <input type="search" [(ngModel)]="searchQuery" placeholder="Rechercher une commande, une chambre, un article…" class="search" (input)="searchSig.set(searchQuery)" />
              <div class="filter-group">
                <button class="filter" *ngFor="let f of statusFilters" [class.active]="statusFilter() === f.value" (click)="statusFilter.set(f.value)">
                  {{ f.label }}<span class="filter__count" *ngIf="countByStatus(f.value) as c">{{ c }}</span>
                </button>
              </div>
            </div>
            <div class="card">
              <header class="card__head">
                <h3 class="serif">{{ filteredOrdersList().length }} commande{{ filteredOrdersList().length > 1 ? 's' : '' }}</h3>
                <span class="card__hint">{{ orders().length }} au total · CA total {{ totalRevenue().toFixed(2) }} €</span>
              </header>
              <table class="data-table data-table--clickable">
                <thead>
                  <tr><th>Réf</th><th>Chambre</th><th>Détail</th><th class="ta-right">Montant</th><th>État</th><th>Source</th><th>Date</th></tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of filteredOrdersList()" (click)="detailOrder.set(o)">
                    <td><span class="mono">{{ o.id.slice(-6).toUpperCase() }}</span></td>
                    <td><strong>{{ o.room }}</strong></td>
                    <td class="small">
                      <div *ngFor="let it of o.items.slice(0, 2)" class="text-muted">{{ it.quantity }} × {{ it.name }}</div>
                      <div *ngIf="o.items.length > 2" class="text-faint">+ {{ o.items.length - 2 }} autres</div>
                    </td>
                    <td class="ta-right serif">{{ o.total.toFixed(2) }} €</td>
                    <td><span class="tag tag--{{ o.status }}">{{ statusLabel(o.status) }}</span></td>
                    <td class="text-muted small">{{ o.source }}</td>
                    <td class="text-muted small">{{ formatDate(o.createdAt) }}</td>
                  </tr>
                  <tr *ngIf="!filteredOrdersList().length"><td colspan="7" class="empty">Aucune commande ne correspond aux filtres.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <!-- SURVEYS -->
          <section *ngIf="tab() === 'surveys'" class="content">
            <div class="surveys-grid">
              <article *ngFor="let s of surveys()" class="survey">
                <header>
                  <span class="eyebrow">{{ s.publishedAt ? 'Publiée' : 'Brouillon' }}</span>
                  <span class="survey__num serif">{{ s.questions.length }}</span>
                </header>
                <h4 class="serif">{{ getTitle(s) }}</h4>
                <p>{{ s.questions.length }} questions · {{ s.locales.length }} langues</p>
                <div class="survey__locales">
                  <span *ngFor="let l of s.locales" class="locale-pill">{{ l.toUpperCase() }}</span>
                </div>
              </article>
            </div>
          </section>

          <!-- PLACEHOLDER -->
          <section *ngIf="tab() === 'pois' || tab() === 'menu'" class="content">
            <div class="card placeholder">
              <span class="eyebrow">À venir</span>
              <h3 class="serif">Éditeur visuel — V2</h3>
              <p>L'API expose déjà les opérations CRUD complètes. Documentation Swagger disponible.</p>
              <a [href]="apiDocsUrl" target="_blank" class="btn-secondary">Ouvrir Swagger →</a>
            </div>
          </section>
        </main>
      </div>

      <!-- ORDER DETAIL DRAWER -->
      <div class="drawer-overlay" *ngIf="!!detailOrder()" (click)="detailOrder.set(null)"></div>
      <aside class="drawer" [class.open]="!!detailOrder()" *ngIf="detailOrder() as o">
        <header class="drawer__head">
          <div>
            <span class="eyebrow">Commande</span>
            <h2 class="serif">#{{ o.id.slice(-6).toUpperCase() }}</h2>
          </div>
          <button class="drawer__close" (click)="detailOrder.set(null)" aria-label="Fermer">×</button>
        </header>
        <div class="drawer__body">
          <div class="dr-row"><span class="eyebrow">Statut</span><span class="tag tag--{{ o.status }}">{{ statusLabel(o.status) }}</span></div>
          <div class="dr-row"><span class="eyebrow">Chambre</span><span class="serif" style="font-size: 22px;">{{ o.room }}</span></div>
          <div class="dr-row" *ngIf="o.guestName"><span class="eyebrow">Client</span><span>{{ o.guestName }}</span></div>
          <div class="dr-row"><span class="eyebrow">Source</span><span>{{ o.source }}</span></div>
          <div class="dr-row"><span class="eyebrow">Date</span><span class="mono">{{ formatDate(o.createdAt) }}</span></div>

          <hr class="rule" style="margin: 24px 0;" />
          <span class="eyebrow">Articles ({{ o.items.length }})</span>
          <ul class="dr-items">
            <li *ngFor="let it of o.items">
              <span class="serif" style="color: var(--c-accent-deep); font-feature-settings: 'tnum';">{{ it.quantity }}×</span>
              <div>
                <span style="display:block; font-weight: 500;">{{ it.name }}</span>
                <span *ngIf="it.options?.length" style="font-size: 11px; color: var(--c-text-soft);">{{ it.options?.join(' · ') }}</span>
              </div>
              <span class="serif" style="font-feature-settings: 'tnum';">{{ (it.unitPrice * it.quantity).toFixed(2) }} €</span>
            </li>
          </ul>
          <hr class="rule" style="margin: 16px 0;" />
          <div class="dr-row"><span class="eyebrow">Total</span><span class="serif" style="font-size: 28px; letter-spacing: -0.02em; font-feature-settings: 'tnum';">{{ o.total.toFixed(2) }} €</span></div>
        </div>
      </aside>
    </ng-container>

    <ng-template #loginTpl>
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand">
            <div class="brand__mark brand__mark--big">C</div>
            <span class="eyebrow">Administration</span>
            <h1 class="serif">Concierge</h1>
            <p>Backoffice multi-hôtel</p>
          </div>
          <form (submit)="login(); $event.preventDefault()" class="login-form">
            <label>
              <span class="eyebrow">Email</span>
              <input type="email" [(ngModel)]="email" name="email" required />
            </label>
            <label>
              <span class="eyebrow">Mot de passe</span>
              <input type="password" [(ngModel)]="password" name="pwd" required />
            </label>
            <button type="submit" class="login-submit">Connexion</button>
            <p class="login-error" *ngIf="loginError()">{{ loginError() }}</p>
          </form>
          <hr class="rule" />
          <div class="login-hint">
            <span class="eyebrow">Compte de démonstration</span>
            <code>admin&#64;royal-lyon.fr</code>
            <code>Demo2026!</code>
          </div>
        </div>
        <div class="login-bg"></div>
      </div>
    </ng-template>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    :host {
      --c-primary: #14202e;
      --c-accent: #b8985a;
      --c-accent-deep: #8e7138;
      --c-accent-soft: #d6bd87;
      --c-paper: #f5f0e8;
      --c-paper-soft: #ede5d6;
      --c-bg: #faf7f2;
      --c-bg-card: #ffffff;
      --c-ink: #14202e;
      --c-text: #14202e;
      --c-text-muted: #5a6675;
      --c-text-soft: #97a0ad;
      --c-text-faint: #b9c0c9;
      --c-border: rgba(20,32,46,0.08);
      --c-border-strong: rgba(20,32,46,0.18);
      --c-rule: #d8cfbe;
      --c-success: #36644a;
      --c-warning: #95701a;
      --c-danger: #913528;
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      font-feature-settings: 'ss01';
      color: var(--c-text);
    }
    .serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; letter-spacing: 0.04em; }
    .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent-deep); }
    .text-muted { color: var(--c-text-muted); }
    .text-faint { color: var(--c-text-soft); font-size: 11px; }
    .small { font-size: 12px; }
    .ta-right { text-align: right; }
    .rule { border: 0; height: 1px; background: var(--c-border); margin: 0; }

    .app { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; background: var(--c-bg); }

    /* SIDEBAR */
    .sidebar { background: var(--c-bg-card); border-right: 1px solid var(--c-border); display: flex; flex-direction: column; padding: 32px 20px; }
    .brand { display: flex; align-items: center; gap: 14px; padding: 0 8px 32px; border-bottom: 1px solid var(--c-border); }
    .brand__mark { width: 48px; height: 48px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; flex-shrink: 0; }
    .brand__mark--big { width: 64px; height: 64px; font-size: 32px; }
    .brand__text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand__name { font-size: 19px; color: var(--c-ink); margin-top: 4px; }

    .nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding-top: 24px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px;
      background: transparent; border: none;
      font-size: 14px; font-weight: 500; color: var(--c-text-muted);
      transition: all 0.2s; text-align: left; cursor: pointer; width: 100%;
    }
    .nav-item:hover { background: var(--c-paper); color: var(--c-ink); }
    .nav-item.active { background: var(--c-ink); color: white; }
    .nav-item__badge { margin-left: auto; background: var(--c-accent); color: white; padding: 1px 8px; font-size: 11px; font-weight: 600; font-feature-settings: 'tnum'; }
    .nav-item.active .nav-item__badge { background: rgba(255,255,255,0.2); }

    .sidebar__user { display: flex; align-items: center; gap: 12px; padding: 14px 12px; background: var(--c-paper); margin-top: 24px; }
    .user-avatar { width: 36px; height: 36px; background: var(--c-ink); color: white; display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-weight: 600; font-size: 16px; }
    .user-info { flex: 1; min-width: 0; }
    .user-name { display: block; font-size: 13px; font-weight: 600; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { display: block; font-size: 11px; color: var(--c-text-muted); text-transform: capitalize; }
    .logout-btn { width: 32px; height: 32px; background: transparent; border: 1px solid var(--c-border-strong); color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; transition: all 0.2s; }
    .logout-btn:hover { background: var(--c-danger); color: white; border-color: var(--c-danger); }

    /* MAIN */
    .main { padding: 40px 48px; overflow-y: auto; }
    .topbar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .topbar__title { font-size: 36px; margin: 6px 0 0; color: var(--c-ink); font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; }

    .btn-secondary {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong);
      font-size: 12px; font-weight: 600; letter-spacing: 0.04em; color: var(--c-ink);
      cursor: pointer; transition: all 0.2s; text-decoration: none;
    }
    .btn-secondary:hover { background: var(--c-ink); color: white; border-color: var(--c-ink); }

    /* RULE */
    .rule + .content { margin-top: 32px; }

    /* ORDERS TOOLBAR */
    .orders-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search { padding: 10px 14px; min-width: 320px; flex: 1; max-width: 460px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); font-size: 14px; color: var(--c-ink); font-family: inherit; transition: all 0.2s; }
    .search:focus { outline: none; border-color: var(--c-ink); }
    .search::placeholder { color: var(--c-text-soft); }

    .filter-group { display: flex; gap: 0; border: 1px solid var(--c-border); }
    .filter { padding: 8px 14px; background: var(--c-bg-card); border: none; border-right: 1px solid var(--c-border); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-text-muted); cursor: pointer; transition: all 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .filter:last-child { border-right: none; }
    .filter:hover { background: var(--c-paper); color: var(--c-ink); }
    .filter.active { background: var(--c-ink); color: white; }
    .filter__count { background: rgba(0,0,0,0.10); padding: 1px 6px; font-size: 10px; font-feature-settings: 'tnum'; }
    .filter.active .filter__count { background: rgba(255,255,255,0.18); }

    /* CLICKABLE TABLE */
    .data-table--clickable tbody tr { cursor: pointer; transition: background 0.15s; }
    .data-table--clickable tbody tr:hover { background: var(--c-paper-soft); }

    /* DRAWER */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(20,32,46,0.4); backdrop-filter: blur(4px); z-index: 50; animation: fadeIn 0.3s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .drawer {
      position: fixed; right: 0; top: 0; bottom: 0;
      width: 480px; max-width: 90vw;
      background: var(--c-bg-card); border-left: 1px solid var(--c-border);
      display: flex; flex-direction: column;
      z-index: 51;
      transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.32,0.72,0,1);
      box-shadow: -32px 0 64px rgba(20,32,46,0.18);
    }
    .drawer.open { transform: translateX(0); }
    .drawer__head { padding: 24px; border-bottom: 1px solid var(--c-border); display: flex; justify-content: space-between; align-items: flex-start; }
    .drawer__head h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; margin: 4px 0 0; color: var(--c-ink); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }
    .drawer__close { width: 36px; height: 36px; background: var(--c-paper); border: none; font-size: 24px; color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; line-height: 1; }
    .drawer__close:hover { background: var(--c-ink); color: white; }
    .drawer__body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .dr-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--c-border); }
    .dr-row:last-child { border-bottom: none; }
    .dr-items { list-style: none; padding: 0; margin: 12px 0; display: flex; flex-direction: column; gap: 12px; }
    .dr-items li { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; padding: 8px 0; }

    /* KPIs */
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--c-border); margin-bottom: 32px; }
    .kpi { padding: 24px 28px; border-right: 1px solid var(--c-border); background: var(--c-bg-card); display: flex; flex-direction: column; gap: 8px; }
    .kpi:last-child { border-right: none; }
    .kpi__main { display: flex; align-items: baseline; gap: 6px; }
    .kpi__num { font-size: 48px; font-weight: 500; line-height: 1; color: var(--c-ink); letter-spacing: -0.025em; font-feature-settings: 'tnum'; }
    .kpi__unit { font-family: 'Cormorant Garamond', serif; font-size: 18px; color: var(--c-text-soft); }
    .kpi__delta { font-size: 11px; font-weight: 600; padding: 2px 6px; letter-spacing: 0.04em; }
    .kpi__delta--up { color: var(--c-success); background: rgba(54,100,74,0.08); }
    .kpi__sub { font-size: 12px; color: var(--c-text-muted); }

    /* CHARTS */
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

    /* CARD */
    .card { background: var(--c-bg-card); border: 1px solid var(--c-border); padding: 24px 28px; margin-bottom: 24px; }
    .card__head { display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 16px; border-bottom: 1px solid var(--c-border); margin-bottom: 20px; }
    .card__head h3 { font-size: 22px; margin: 0; color: var(--c-ink); font-weight: 500; }
    .card__hint { font-size: 11px; color: var(--c-text-soft); letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500; }

    .link-btn { background: transparent; border: none; color: var(--c-ink); font-weight: 600; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
    .link-btn:hover { color: var(--c-accent-deep); }

    /* BARS */
    .bars { display: flex; flex-direction: column; gap: 14px; }
    .bar-row { display: grid; grid-template-columns: 100px 1fr 50px; gap: 16px; align-items: center; }
    .bar-row__label { font-size: 14px; color: var(--c-ink); font-style: italic; }
    .bar-track { height: 8px; background: var(--c-paper-soft); }
    .bar-fill { height: 100%; background: var(--c-ink); transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
    .bar-row__pct { font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 500; color: var(--c-ink); text-align: right; font-feature-settings: 'tnum'; }

    /* SPARKLINE */
    .sparkline { width: 100%; height: 120px; }
    .sparkline-axis { display: flex; justify-content: space-between; padding: 8px 4px 0; font-size: 10px; color: var(--c-text-soft); letter-spacing: 0.06em; text-transform: uppercase; }

    /* TABLE */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; padding: 10px 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--c-text-soft); border-bottom: 1px solid var(--c-border); }
    .data-table td { padding: 14px 12px; border-bottom: 1px solid var(--c-border); font-size: 13px; vertical-align: top; }
    .data-table tr:last-child td { border-bottom: none; }

    .tag { display: inline-block; padding: 2px 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid currentColor; }
    .tag--pending { color: var(--c-warning); }
    .tag--accepted { color: #1e40af; }
    .tag--preparing { color: #4338ca; }
    .tag--delivered { color: var(--c-success); }
    .tag--cancelled { color: var(--c-danger); }

    /* SURVEYS */
    .surveys-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0; border: 1px solid var(--c-border); }
    .survey { background: var(--c-bg-card); padding: 28px; border-right: 1px solid var(--c-border); border-bottom: 1px solid var(--c-border); }
    .survey header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
    .survey__num { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 500; color: var(--c-ink); line-height: 1; letter-spacing: -0.02em; font-feature-settings: 'tnum'; }
    .survey h4 { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; margin: 0 0 8px; line-height: 1.2; }
    .survey p { color: var(--c-text-muted); font-size: 13px; margin: 0 0 16px; }
    .survey__locales { display: flex; gap: 4px; flex-wrap: wrap; }
    .locale-pill { padding: 2px 8px; font-size: 10px; font-weight: 600; color: var(--c-text-muted); border: 1px solid var(--c-border-strong); letter-spacing: 0.06em; }

    .empty { text-align: center; color: var(--c-text-soft); padding: 32px; }
    .placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 80px 24px; text-align: center; max-width: 520px; margin: 0 auto; }
    .placeholder h3 { font-size: 28px; margin: 12px 0 4px; }
    .placeholder p { color: var(--c-text-muted); margin: 0 0 16px; }

    /* LOGIN */
    .login-page { min-height: 100vh; display: grid; grid-template-columns: 480px 1fr; background: var(--c-paper); }
    .login-card { padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; background: var(--c-bg-card); }
    .login-brand { text-align: center; margin-bottom: 48px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .login-brand h1 { font-size: 40px; margin: 4px 0 6px; color: var(--c-ink); font-weight: 500; line-height: 1; }
    .login-brand p { color: var(--c-text-muted); margin: 0; font-size: 14px; }
    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .login-form label { display: flex; flex-direction: column; gap: 6px; }
    .login-form input { padding: 14px 16px; font-size: 15px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color 0.2s; font-family: inherit; }
    .login-form input:focus { outline: none; border-color: var(--c-ink); }
    .login-submit { padding: 16px; background: var(--c-ink); color: white; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; margin-top: 8px; cursor: pointer; transition: background 0.2s; }
    .login-submit:hover { background: var(--c-accent); }
    .login-error { color: var(--c-danger); font-size: 13px; margin: 0; padding: 8px 12px; background: rgba(145,53,40,0.08); }
    .login-hint { padding: 16px; background: var(--c-paper); display: flex; flex-direction: column; gap: 8px; align-items: center; font-size: 12px; }
    .login-hint code { font-family: 'JetBrains Mono', monospace; background: var(--c-bg-card); padding: 4px 10px; font-size: 12px; color: var(--c-ink); }

    .login-bg { background-image: url('https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=85'); background-size: cover; background-position: center; position: relative; }
    .login-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(20,32,46,0.4) 0%, rgba(20,32,46,0.85) 100%); }

    @media (max-width: 1100px) {
      .app { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .charts { grid-template-columns: 1fr; }
      .kpis { grid-template-columns: repeat(2, 1fr); }
      .login-page { grid-template-columns: 1fr; }
      .login-bg { display: none; }
    }
  `],
})
export class AppComponent implements OnInit {
  email = 'admin@royal-lyon.fr';
  password = 'Demo2026!';
  loggedIn = signal(false);
  loginError = signal<string | null>(null);
  user = signal<any>(null);
  tab = signal<'dashboard' | 'orders' | 'surveys' | 'pois' | 'menu'>('dashboard');
  orders = signal<Order[]>([]);
  surveys = signal<Survey[]>([]);
  stats = signal<SurveyStats | null>(null);
  searchQuery = '';
  searchSig = signal('');
  statusFilter = signal<'all' | 'pending' | 'accepted' | 'preparing' | 'delivered' | 'cancelled'>('all');
  detailOrder = signal<Order | null>(null);
  statusFilters = [
    { label: 'Toutes', value: 'all' as const },
    { label: 'Reçues', value: 'pending' as const },
    { label: 'Acceptées', value: 'accepted' as const },
    { label: 'En préparation', value: 'preparing' as const },
    { label: 'Livrées', value: 'delivered' as const },
    { label: 'Annulées', value: 'cancelled' as const },
  ];
  apiDocsUrl = `${API}/api/docs`;
  private token = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    try {
      const stored = localStorage.getItem('admin_auth');
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.token && data?.user) {
          this.token = data.token; this.user.set(data.user); this.loggedIn.set(true); this.refresh();
        } else {
          localStorage.removeItem('admin_auth');
        }
      }
    } catch {
      localStorage.removeItem('admin_auth');
    }
  }

  pageEyebrow = computed(() => ({
    dashboard: 'Vue d\'ensemble',
    orders: 'Suivi opérationnel',
    surveys: 'Mesure de la satisfaction',
    pois: 'Adresses recommandées',
    menu: 'Carte du restaurant',
  } as Record<string, string>)[this.tab()] || '');

  pageTitle = computed(() => ({
    dashboard: `Bonjour, ${this.user()?.firstName || ''}`,
    orders: 'Commandes',
    surveys: 'Enquêtes de satisfaction',
    pois: 'Points d\'intérêt',
    menu: 'Restaurant & Room service',
  } as Record<string, string>)[this.tab()] || '');

  ordersToday = computed(() => this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length);
  revenueToday = computed(() =>
    this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000 && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  );
  ordersInProgress = computed(() => this.orders().filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length);
  recentOrders = computed(() => [...this.orders()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6));
  userInitial = computed(() => (this.user()?.firstName?.charAt(0) || 'A').toUpperCase());
  totalRevenue = computed(() => this.orders().filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0));

  filteredOrdersList = computed(() => {
    const q = this.searchSig().trim().toLowerCase();
    const sf = this.statusFilter();
    return [...this.orders()]
      .filter((o) => sf === 'all' || o.status === sf)
      .filter((o) => {
        if (!q) return true;
        return (
          o.id.toLowerCase().includes(q) ||
          o.room.toLowerCase().includes(q) ||
          (o.guestName ?? '').toLowerCase().includes(q) ||
          o.items.some((it) => it.name.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  });

  countByStatus(s: string): number {
    if (s === 'all') return this.orders().length;
    return this.orders().filter((o) => o.status === s).length;
  }

  sparklineDays = computed(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date().getDay();
    return Array.from({ length: 7 }, (_, i) => days[(today - 6 + i + 7) % 7]);
  });

  sparklinePoints = computed(() => {
    const buckets = new Array(7).fill(0);
    const now = Date.now();
    for (const o of this.orders()) {
      const age = Math.floor((now - new Date(o.createdAt).getTime()) / 86400000);
      if (age >= 0 && age < 7) buckets[6 - age]++;
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((v, i) => ({ x: 24 + (i * 280 / 6), y: 110 - (v / max) * 84, v }));
  });

  sparklineLine = computed(() => this.sparklinePoints().map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '));
  sparklinePath = computed(() => `${this.sparklinePoints().map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L 304 120 L 24 120 Z`);

  smileyLabel(v: number) {
    return ['Très décevant', 'Décevant', 'Bien', 'Excellent'][v - 1] ?? '—';
  }
  statusLabel(s: string) {
    return ({ pending: 'Reçue', accepted: 'Acceptée', preparing: 'Préparation', delivered: 'Livrée', cancelled: 'Annulée' } as Record<string,string>)[s] || s;
  }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  formatDate(iso: string) { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  getTitle(s: Survey) { return (s.title as any).fr || Object.values(s.title)[0]; }

  refresh() { this.loadOrders(); this.loadSurveys(); }

  login() {
    this.loginError.set(null);
    this.http.post<LoginResponse>(`${API}/auth/login`, { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.token = res.accessToken; this.user.set(res.user);
        localStorage.setItem('admin_auth', JSON.stringify({ token: res.accessToken, user: res.user }));
        this.loggedIn.set(true); this.refresh();
      },
      error: () => this.loginError.set('Identifiants invalides.'),
    });
  }

  logout() { localStorage.removeItem('admin_auth'); this.loggedIn.set(false); this.user.set(null); this.orders.set([]); }

  loadOrders() { this.http.get<Order[]>(`${API}/orders`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe((d) => this.orders.set(d)); }

  loadSurveys() {
    this.http.get<Survey[]>(`${API}/surveys`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe((d) => {
      this.surveys.set(d);
      if (d[0]) this.http.get<SurveyStats>(`${API}/surveys/${d[0].id}/stats`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe((s) => this.stats.set(s));
    });
  }
}
