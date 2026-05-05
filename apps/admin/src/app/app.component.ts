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
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="brand">
            <div class="brand__icon">C</div>
            <div>
              <div class="brand__name">Concierge</div>
              <div class="brand__sub">Admin</div>
            </div>
          </div>
          <nav class="nav">
            <button class="nav-item" [class.active]="tab() === 'dashboard'" (click)="tab.set('dashboard'); refresh()">
              <span class="nav-item__icon">📊</span>
              <span>Dashboard</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'orders'" (click)="tab.set('orders'); loadOrders()">
              <span class="nav-item__icon">🛎️</span>
              <span>Commandes</span>
              <span class="nav-item__badge" *ngIf="ordersInProgress() > 0">{{ ordersInProgress() }}</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'surveys'" (click)="tab.set('surveys'); loadSurveys()">
              <span class="nav-item__icon">📋</span>
              <span>Enquêtes</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'pois'" (click)="tab.set('pois')">
              <span class="nav-item__icon">📍</span>
              <span>Points d'intérêt</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'menu'" (click)="tab.set('menu')">
              <span class="nav-item__icon">🍽️</span>
              <span>Menu</span>
            </button>
          </nav>

          <div class="sidebar__user">
            <div class="user-avatar">{{ user()?.firstName?.charAt(0) || 'A' }}</div>
            <div class="user-info">
              <div class="user-name">{{ user()?.firstName }} {{ user()?.lastName }}</div>
              <div class="user-role">{{ user()?.role }}</div>
            </div>
            <button class="logout-btn" (click)="logout()" aria-label="Déconnexion">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </button>
          </div>
        </aside>

        <!-- Main content -->
        <main class="main">
          <header class="topbar">
            <div>
              <h1 class="topbar__title">{{ pageTitle() }}</h1>
              <p class="topbar__sub">{{ pageSubtitle() }}</p>
            </div>
            <button class="refresh-btn" (click)="refresh()" aria-label="Rafraîchir">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
              Rafraîchir
            </button>
          </header>

          <!-- Dashboard -->
          <section *ngIf="tab() === 'dashboard'" class="content">
            <div class="kpis">
              <div class="kpi kpi--accent">
                <div class="kpi__head">
                  <span class="kpi__icon">🛎️</span>
                  <span class="kpi__trend kpi__trend--up">+12%</span>
                </div>
                <div class="kpi__num">{{ ordersToday() }}</div>
                <div class="kpi__label">Commandes (24h)</div>
                <div class="kpi__delta">CA estimé : <strong>{{ revenueToday().toFixed(2) }} €</strong></div>
              </div>
              <div class="kpi">
                <div class="kpi__head">
                  <span class="kpi__icon">😍</span>
                  <span class="kpi__trend kpi__trend--up">+0.3</span>
                </div>
                <div class="kpi__num">{{ stats()?.averageScore?.toFixed(1) || '—' }}<span style="font-size: 18px; opacity: 0.5;">/4</span></div>
                <div class="kpi__label">Note de satisfaction</div>
                <div class="kpi__delta">{{ stats()?.total || 0 }} réponses</div>
              </div>
              <div class="kpi">
                <div class="kpi__head">
                  <span class="kpi__icon">⏳</span>
                  <span class="kpi__trend">Live</span>
                </div>
                <div class="kpi__num">{{ ordersInProgress() }}</div>
                <div class="kpi__label">En cours</div>
                <div class="kpi__delta">à traiter</div>
              </div>
              <div class="kpi">
                <div class="kpi__head">
                  <span class="kpi__icon">🏨</span>
                </div>
                <div class="kpi__num">2</div>
                <div class="kpi__label">Hôtels</div>
                <div class="kpi__delta">multi-tenant actif</div>
              </div>
            </div>

            <!-- Charts row -->
            <div class="charts">
              <div class="card">
                <div class="card__head">
                  <h3>Distribution satisfaction</h3>
                  <span class="card__hint">{{ stats()?.total || 0 }} réponses</span>
                </div>
                <div class="bars" *ngIf="stats()?.bySmiley?.length">
                  <div *ngFor="let s of stats()?.bySmiley" class="bar-row">
                    <span class="bar-row__icon">{{ smileyIcon(s.value) }}</span>
                    <div class="bar-track">
                      <div class="bar-fill" [style.width.%]="s.percentage" [attr.data-score]="s.value"></div>
                    </div>
                    <span class="bar-row__value">{{ s.percentage }}%</span>
                    <span class="bar-row__count">({{ s.count }})</span>
                  </div>
                </div>
                <div class="empty" *ngIf="!stats()?.bySmiley?.length">Aucune donnée</div>
              </div>

              <div class="card">
                <div class="card__head">
                  <h3>Activité 7 derniers jours</h3>
                  <span class="card__hint">commandes / jour</span>
                </div>
                <svg class="sparkline" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#1a4d8c" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#1a4d8c" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="sparklinePath()" fill="url(#sparkGrad)" stroke="none"/>
                  <path [attr.d]="sparklineLine()" fill="none" stroke="#1a4d8c" stroke-width="2"/>
                  <g *ngFor="let p of sparklinePoints(); let i = index">
                    <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#1a4d8c"/>
                  </g>
                </svg>
                <div class="sparkline-axis">
                  <span *ngFor="let d of sparklineDays()">{{ d }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head">
                <h3>Dernières commandes</h3>
                <button class="link-btn" (click)="tab.set('orders'); loadOrders()">Voir toutes →</button>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Chambre</th><th>Items</th><th>Total</th><th>Statut</th><th>Heure</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let o of recentOrders()">
                      <td><strong>{{ o.id.slice(-4).toUpperCase() }}</strong></td>
                      <td><span class="room-badge">{{ o.room }}</span></td>
                      <td>{{ o.items.length }} items</td>
                      <td><strong>{{ o.total.toFixed(2) }} €</strong></td>
                      <td><span class="status status--{{ o.status }}">{{ statusLabel(o.status) }}</span></td>
                      <td class="text-muted">{{ formatTime(o.createdAt) }}</td>
                    </tr>
                    <tr *ngIf="!recentOrders().length"><td colspan="6" class="empty">Aucune commande</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Orders -->
          <section *ngIf="tab() === 'orders'" class="content">
            <div class="card">
              <div class="card__head">
                <h3>Toutes les commandes</h3>
                <span class="card__hint">{{ orders().length }} au total</span>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Chambre</th><th>Items</th><th>Total</th><th>Statut</th><th>Source</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let o of orders()">
                      <td><strong>{{ o.id.slice(-4).toUpperCase() }}</strong></td>
                      <td><span class="room-badge">{{ o.room }}</span></td>
                      <td>
                        <div *ngFor="let it of o.items.slice(0, 2)" class="text-muted small">{{ it.quantity }}× {{ it.name }}</div>
                        <div *ngIf="o.items.length > 2" class="text-muted small">+{{ o.items.length - 2 }} autres</div>
                      </td>
                      <td><strong>{{ o.total.toFixed(2) }} €</strong></td>
                      <td><span class="status status--{{ o.status }}">{{ statusLabel(o.status) }}</span></td>
                      <td class="text-muted">{{ o.source }}</td>
                      <td class="text-muted small">{{ formatDate(o.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- Surveys -->
          <section *ngIf="tab() === 'surveys'" class="content">
            <div class="card">
              <div class="card__head"><h3>Enquêtes de satisfaction</h3></div>
              <div class="surveys-grid">
                <div *ngFor="let s of surveys()" class="survey-card">
                  <div class="survey-card__head">
                    <span class="survey-card__icon">📋</span>
                    <span class="survey-card__chip" *ngIf="s.publishedAt">Active</span>
                  </div>
                  <h4>{{ getTitle(s) }}</h4>
                  <p>{{ s.questions.length }} questions · {{ s.locales.length }} langues</p>
                  <div class="survey-card__locales">
                    <span *ngFor="let l of s.locales" class="locale-pill">{{ l.toUpperCase() }}</span>
                  </div>
                </div>
                <div *ngIf="!surveys().length" class="empty">Aucune enquête</div>
              </div>
            </div>
          </section>

          <!-- POIs / Menu placeholder -->
          <section *ngIf="tab() === 'pois' || tab() === 'menu'" class="content">
            <div class="card empty-card">
              <span style="font-size: 64px;">🚧</span>
              <h3>Bientôt disponible</h3>
              <p>L'éditeur visuel pour {{ tab() === 'pois' ? 'les points d\\'intérêt' : 'le menu' }} arrive en V2.</p>
              <p class="text-muted small">L'API expose déjà les CRUD complets — accessible via Swagger.</p>
            </div>
          </section>
        </main>
      </div>
    </ng-container>

    <ng-template #loginTpl>
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand">
            <div class="brand__icon brand__icon--big">C</div>
            <h1 class="font-display">Concierge</h1>
            <p>Backoffice administrateur</p>
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
            <button type="submit" class="login-submit">Se connecter →</button>
            <p class="login-error" *ngIf="loginError()">{{ loginError() }}</p>
          </form>
          <div class="login-hint">
            <strong>Compte de démo</strong>
            <code>admin&#64;royal-lyon.fr</code>
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
      --c-bg: #f5f6fa;
      --c-bg-card: #ffffff;
      --c-text: #1a1d24;
      --c-text-muted: #5e6470;
      --c-border: rgba(26, 29, 36, 0.08);
      --c-success: #2d7a4b;
      --c-warning: #c4861d;
      --c-danger: #c44b3f;
      --r-sm: 8px; --r-md: 12px; --r-lg: 20px;
      --sh-sm: 0 2px 8px rgba(20,30,50,0.06);
      --sh-md: 0 8px 24px rgba(20,30,50,0.08);
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
    }
    .font-display { font-family: 'Playfair Display', serif; }

    .app { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; background: var(--c-bg); }

    /* Sidebar */
    .sidebar { background: var(--c-bg-card); border-right: 1px solid var(--c-border); display: flex; flex-direction: column; padding: 24px 16px; }
    .brand { display: flex; align-items: center; gap: 12px; padding: 0 8px 24px; border-bottom: 1px solid var(--c-border); }
    .brand__icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
      color: white; border-radius: 12px;
      display: grid; place-items: center;
      font-family: 'Playfair Display'; font-size: 24px; font-weight: 700;
      box-shadow: 0 4px 12px rgba(26,77,140,0.25);
    }
    .brand__icon--big { width: 64px; height: 64px; font-size: 32px; }
    .brand__name { font-family: 'Playfair Display'; font-size: 20px; font-weight: 700; color: var(--c-text); }
    .brand__sub { font-size: 12px; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

    .nav { flex: 1; display: flex; flex-direction: column; gap: 4px; padding-top: 24px; }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px;
      background: transparent; border: none;
      border-radius: 10px;
      font-size: 15px; font-weight: 500; color: var(--c-text-muted);
      transition: all 0.15s ease;
      text-align: left; cursor: pointer; width: 100%;
    }
    .nav-item:hover { background: rgba(26,77,140,0.04); color: var(--c-text); }
    .nav-item.active { background: var(--c-primary); color: white; box-shadow: 0 4px 12px rgba(26,77,140,0.25); }
    .nav-item__icon { font-size: 20px; }
    .nav-item__badge {
      margin-left: auto;
      background: var(--c-accent); color: white;
      padding: 2px 8px; border-radius: 999px;
      font-size: 12px; font-weight: 700;
    }
    .nav-item.active .nav-item__badge { background: rgba(255,255,255,0.25); }

    .sidebar__user { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--c-bg); border-radius: 12px; margin-top: 24px; }
    .user-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark));
      color: white; border-radius: 50%;
      display: grid; place-items: center;
      font-weight: 700;
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { font-size: 14px; font-weight: 600; color: var(--c-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 12px; color: var(--c-text-muted); text-transform: capitalize; }
    .logout-btn { width: 36px; height: 36px; background: transparent; border: 1px solid var(--c-border); border-radius: 8px; color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; }
    .logout-btn:hover { background: var(--c-danger); color: white; border-color: var(--c-danger); }

    /* Main */
    .main { padding: 32px 40px; overflow-y: auto; }

    .topbar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
    .topbar__title { font-family: 'Playfair Display'; font-size: 32px; margin: 0; color: var(--c-text); }
    .topbar__sub { color: var(--c-text-muted); margin: 4px 0 0; font-size: 15px; }

    .refresh-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 10px; font-size: 14px; font-weight: 600; color: var(--c-text-muted); cursor: pointer; }
    .refresh-btn:hover { background: var(--c-primary); color: white; border-color: var(--c-primary); }

    /* KPIs */
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 20px; box-shadow: var(--sh-sm); transition: transform 0.15s; }
    .kpi:hover { transform: translateY(-2px); }
    .kpi--accent { background: linear-gradient(135deg, var(--c-primary), var(--c-primary-dark)); color: white; border: none; }
    .kpi--accent .kpi__label, .kpi--accent .kpi__delta { color: rgba(255,255,255,0.8); }

    .kpi__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .kpi__icon { font-size: 28px; }
    .kpi__trend { font-size: 12px; font-weight: 700; padding: 2px 8px; background: rgba(45,122,75,0.12); color: var(--c-success); border-radius: 999px; }
    .kpi--accent .kpi__trend { background: rgba(255,255,255,0.18); color: white; }
    .kpi__trend--up { background: rgba(45,122,75,0.12); color: var(--c-success); }

    .kpi__num { font-family: 'Playfair Display'; font-size: 44px; font-weight: 700; line-height: 1; margin: 0; color: var(--c-primary); }
    .kpi--accent .kpi__num { color: white; }

    .kpi__label { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-muted); margin: 8px 0 4px; }
    .kpi__delta { font-size: 13px; color: var(--c-text-muted); }

    /* Charts */
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }

    /* Card */
    .card { background: var(--c-bg-card); border: 1px solid var(--c-border); border-radius: 16px; padding: 20px 24px; box-shadow: var(--sh-sm); margin-bottom: 16px; }
    .card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--c-border); }
    .card__head h3 { font-family: 'Playfair Display'; font-size: 18px; margin: 0; color: var(--c-text); }
    .card__hint { font-size: 12px; color: var(--c-text-muted); }

    .link-btn { background: transparent; border: none; color: var(--c-primary); font-weight: 600; font-size: 14px; cursor: pointer; }

    /* Bars */
    .bars { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: grid; grid-template-columns: 32px 1fr 60px 50px; gap: 12px; align-items: center; }
    .bar-row__icon { font-size: 22px; text-align: center; }
    .bar-track { height: 14px; background: rgba(0,0,0,0.06); border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: inherit; transition: width 0.6s ease; }
    .bar-fill[data-score="1"] { background: linear-gradient(90deg, #c44b3f, #e76f51); }
    .bar-fill[data-score="2"] { background: linear-gradient(90deg, #c4861d, #e9a82c); }
    .bar-fill[data-score="3"] { background: linear-gradient(90deg, #5b8fc7, #7faedf); }
    .bar-fill[data-score="4"] { background: linear-gradient(90deg, #2d7a4b, #4caf6a); }
    .bar-row__value { font-weight: 700; font-size: 15px; text-align: right; font-feature-settings: 'tnum'; }
    .bar-row__count { font-size: 13px; color: var(--c-text-muted); text-align: right; }

    /* Sparkline */
    .sparkline { width: 100%; height: 100px; }
    .sparkline-axis { display: flex; justify-content: space-between; padding: 8px 0 0; font-size: 11px; color: var(--c-text-muted); }

    /* Tables */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--c-text-muted); border-bottom: 1px solid var(--c-border); }
    td { padding: 12px; border-bottom: 1px solid var(--c-border); font-size: 14px; }
    td.text-muted { color: var(--c-text-muted); }
    td.small { font-size: 12px; }
    .small { font-size: 12px; }

    .room-badge { background: var(--c-bg); color: var(--c-text); padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px; font-feature-settings: 'tnum'; }
    .status { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
    .status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status--pending { background: rgba(196,134,29,0.12); color: var(--c-warning); }
    .status--accepted { background: rgba(91,143,199,0.15); color: #1e40af; }
    .status--preparing { background: rgba(117,114,255,0.15); color: #4338ca; }
    .status--delivered { background: rgba(45,122,75,0.12); color: var(--c-success); }
    .status--cancelled { background: rgba(196,75,63,0.12); color: var(--c-danger); }

    /* Surveys */
    .surveys-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .survey-card { background: var(--c-bg); border-radius: 12px; padding: 20px; border: 1px solid var(--c-border); }
    .survey-card__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .survey-card__icon { font-size: 32px; }
    .survey-card__chip { background: var(--c-success); color: white; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .survey-card h4 { font-family: 'Playfair Display'; font-size: 18px; margin: 0 0 6px; }
    .survey-card p { color: var(--c-text-muted); font-size: 13px; margin: 0 0 12px; }
    .survey-card__locales { display: flex; gap: 4px; flex-wrap: wrap; }
    .locale-pill { background: var(--c-bg-card); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; color: var(--c-text-muted); border: 1px solid var(--c-border); }

    .empty { text-align: center; color: var(--c-text-muted); padding: 32px; }
    .empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 64px 24px; text-align: center; }
    .empty-card h3 { font-family: 'Playfair Display'; font-size: 24px; margin: 16px 0 4px; }
    .empty-card p { margin: 0; color: var(--c-text-muted); }

    /* Login */
    .login-page { min-height: 100vh; display: grid; grid-template-columns: 480px 1fr; background: var(--c-bg); }
    .login-card { padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; }
    .login-brand { text-align: center; margin-bottom: 40px; }
    .login-brand h1 { font-size: 32px; margin: 16px 0 4px; color: var(--c-text); }
    .login-brand p { color: var(--c-text-muted); margin: 0; }
    .login-form { display: flex; flex-direction: column; gap: 16px; }
    .login-form label { display: flex; flex-direction: column; gap: 6px; }
    .login-form label span { font-size: 13px; font-weight: 600; color: var(--c-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .login-form input { padding: 14px 16px; font-size: 16px; border: 2px solid var(--c-border); border-radius: 10px; background: var(--c-bg-card); transition: border-color 0.15s; }
    .login-form input:focus { outline: none; border-color: var(--c-primary); }
    .login-submit { padding: 16px; background: var(--c-primary); color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; margin-top: 8px; cursor: pointer; transition: all 0.15s; }
    .login-submit:hover { background: var(--c-primary-dark); transform: translateY(-1px); }
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

    @media (max-width: 1000px) {
      .app { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .charts { grid-template-columns: 1fr; }
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
  private token = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const stored = localStorage.getItem('admin_auth');
    if (stored) {
      const data = JSON.parse(stored);
      this.token = data.token;
      this.user.set(data.user);
      this.loggedIn.set(true);
      this.refresh();
    }
  }

  pageTitle = computed(() => {
    const map: Record<string, string> = {
      dashboard: 'Bonjour ' + (this.user()?.firstName || ''),
      orders: 'Commandes',
      surveys: 'Enquêtes de satisfaction',
      pois: 'Points d\'intérêt',
      menu: 'Menu',
    };
    return map[this.tab()] || '';
  });
  pageSubtitle = computed(() => {
    const map: Record<string, string> = {
      dashboard: 'Voici un aperçu de votre activité aujourd\'hui',
      orders: 'Suivi en temps réel des commandes clients',
      surveys: 'Mesurez la satisfaction de vos clients',
      pois: 'Carte locale et points d\'intérêt',
      menu: 'Plats et services proposés',
    };
    return map[this.tab()] || '';
  });

  ordersToday = computed(() => this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length);
  revenueToday = computed(() =>
    this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000 && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  );
  ordersInProgress = computed(() => this.orders().filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length);
  recentOrders = computed(() => [...this.orders()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6));

  // Sparkline data — last 7 days
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
    return buckets.map((v, i) => ({
      x: 20 + (i * 260 / 6),
      y: 90 - (v / max) * 70,
      v,
    }));
  });

  sparklineLine = computed(() => {
    const pts = this.sparklinePoints();
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  sparklinePath = computed(() => {
    const pts = this.sparklinePoints();
    return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L 280 100 L 20 100 Z`;
  });

  smileyIcon(v: number) {
    return ['😡', '😐', '🙂', '😍'][v - 1] ?? '·';
  }
  statusLabel(s: string) {
    const m: Record<string, string> = { pending: 'Reçue', accepted: 'Acceptée', preparing: 'En cours', delivered: 'Livrée', cancelled: 'Annulée' };
    return m[s] || s;
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
      error: () => this.loginError.set('Identifiants invalides. Vérifiez l\'email et le mot de passe.'),
    });
  }

  logout() {
    localStorage.removeItem('admin_auth');
    this.loggedIn.set(false); this.user.set(null); this.orders.set([]);
  }

  loadOrders() {
    this.http.get<Order[]>(`${API}/orders`, { headers: { Authorization: `Bearer ${this.token}` } })
      .subscribe((d) => this.orders.set(d));
  }

  loadSurveys() {
    this.http.get<Survey[]>(`${API}/surveys`, { headers: { Authorization: `Bearer ${this.token}` } })
      .subscribe((d) => {
        this.surveys.set(d);
        if (d[0]) {
          this.http.get<SurveyStats>(`${API}/surveys/${d[0].id}/stats`, { headers: { Authorization: `Bearer ${this.token}` } })
            .subscribe((s) => this.stats.set(s));
        }
      });
  }
}
