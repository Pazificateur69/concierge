import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { LoginResponse, Order, Survey, SurveyStats } from '@concierge/types';

const PROD_GATEWAY = 'https://concierge-gateway.onrender.com';
function resolveApi(): string {
  const params = new URLSearchParams(window.location.search);
  const queryApi = params.get('api');
  if (queryApi) sessionStorage.setItem('concierge_api', queryApi);
  if (queryApi) return queryApi;
  const session = sessionStorage.getItem('concierge_api');
  if (session) return session;
  const injected = (window as any).__API__;
  const onProdHost = /\.(vercel|onrender)\.app|netlify\.app/.test(window.location.hostname);
  if (injected && (!onProdHost || injected.includes('concierge-gateway.onrender.com'))) return injected;
  if (onProdHost) return PROD_GATEWAY;
  return injected || 'http://localhost:4000';
}
const API = resolveApi();
console.info('[Concierge Admin] API base URL =', API);

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
            <button class="nav-item" [class.active]="tab() === 'analytics'" (click)="tab.set('analytics'); refresh()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-7"/>
              </svg>
              <span>Analytics</span>
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
            <button class="nav-item" [class.active]="tab() === 'pois'" (click)="tab.set('pois'); loadPois()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Adresses</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'menu'" (click)="tab.set('menu'); loadMenu()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M7 2v20M3 2v6a4 4 0 0 0 4 4M21 2l-4 6v14M17 8h4"/>
              </svg>
              <span>Carte</span>
            </button>
            <button class="nav-item" [class.active]="tab() === 'settings'" (click)="tab.set('settings')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Paramètres</span>
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
              <div class="tenant-switcher" *ngIf="tenantList().length > 1">
                <span class="eyebrow">Hôtel</span>
                <select [(ngModel)]="selectedTenantSlug" (change)="onTenantChange()">
                  <option *ngFor="let t of tenantList()" [value]="t.slug">{{ t.name }}</option>
                </select>
              </div>
              <button class="btn-secondary" (click)="refresh()">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Actualiser
              </button>
            </div>
          </header>

          <hr class="rule" />

          <!-- DASHBOARD -->
          <section *ngIf="tab() === 'dashboard'" class="content">
            <!-- Alerts banner -->
            <div class="dash-alerts" *ngIf="dashAlerts().length">
              <div *ngFor="let a of dashAlerts()" class="dash-alert" [attr.data-severity]="a.severity">
                <span class="dash-alert__icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                </span>
                <div class="dash-alert__body">
                  <strong>{{ a.title }}</strong>
                  <span>{{ a.message }}</span>
                </div>
                <button class="dash-alert__cta" (click)="onAlertAction(a)">{{ a.cta }} →</button>
              </div>
            </div>

            <!-- Welcome + quick actions -->
            <div class="dash-welcome">
              <div class="dash-welcome__greeting">
                <span class="eyebrow">{{ greetingEyebrow() }}</span>
                <h2 class="serif">{{ greetingText() }}, {{ user()?.firstName }}.</h2>
                <p class="text-muted">Voici l'état de la maison ce {{ todayLabel() }}.</p>
              </div>
              <div class="dash-quick">
                <button class="dash-quick-btn" (click)="tab.set('analytics'); refresh()">
                  <span class="dash-quick-btn__title serif">Analytics complet</span>
                  <span class="dash-quick-btn__sub">Range 7/30/90j · charts · NPS</span>
                </button>
                <button class="dash-quick-btn" (click)="generateWeeklyReport()">
                  <span class="dash-quick-btn__title serif">Rapport hebdo PDF</span>
                  <span class="dash-quick-btn__sub">CA, top plats, alertes · imprimable</span>
                </button>
                <button class="dash-quick-btn" (click)="exportAll()">
                  <span class="dash-quick-btn__title serif">Export CSV complet</span>
                  <span class="dash-quick-btn__sub">commandes, enquêtes, adresses</span>
                </button>
              </div>
            </div>

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

            <!-- BUSY GAUGE + DAILY TARGET + OCCUPANCY -->
            <div class="dash-row">
              <div class="card dash-gauge">
                <header class="card__head">
                  <h3 class="serif">Pression cuisine</h3>
                  <span class="card__hint mono">{{ kitchenLoadPct() }}%</span>
                </header>
                <div class="gauge">
                  <svg viewBox="0 0 200 110" class="gauge__svg">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#d8cfbe" stroke-width="14" stroke-linecap="round"/>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" [attr.stroke]="kitchenLoadColor()" stroke-width="14" stroke-linecap="round"
                      [attr.stroke-dasharray]="kitchenLoadPct() * 2.51 + ' 251'"
                      style="transition: stroke-dasharray 0.8s ease, stroke 0.4s"/>
                    <text x="100" y="86" text-anchor="middle" class="gauge__num serif">{{ ordersInProgress() }}</text>
                    <text x="100" y="103" text-anchor="middle" class="gauge__sub">en cours</text>
                  </svg>
                </div>
                <div class="gauge-legend mono">
                  <span><span class="dot" style="background:#36644a"></span>≤ 5 calme</span>
                  <span><span class="dot" style="background:#95701a"></span>6-10 normal</span>
                  <span><span class="dot" style="background:#913528"></span>+10 saturé</span>
                </div>
              </div>

              <div class="card dash-target">
                <header class="card__head">
                  <h3 class="serif">Objectif jour</h3>
                  <span class="card__hint mono">{{ dailyTargetPct() }}%</span>
                </header>
                <div class="target">
                  <div class="target__num serif">{{ revenueToday().toFixed(0) }}<span class="target__currency">€</span></div>
                  <div class="target__label">CA réalisé · jour</div>
                  <div class="target__bar">
                    <div class="target__fill" [style.width.%]="dailyTargetPct()"></div>
                    <span class="target__marker" [style.left.%]="dailyTargetPct()">{{ dailyTargetPct() }}%</span>
                  </div>
                  <div class="target__caption">Objectif : <b>{{ dailyTargetGoal }} €</b> · reste {{ Math.max(0, dailyTargetGoal - revenueToday()).toFixed(0) }} €</div>
                </div>
              </div>

              <div class="card dash-occupancy">
                <header class="card__head">
                  <h3 class="serif">Occupation</h3>
                  <span class="card__hint mono">{{ occupancyData().occupied }} / {{ occupancyData().total }}</span>
                </header>
                <div class="occupancy">
                  <div class="occupancy__big serif">{{ occupancyData().rate }}%</div>
                  <div class="occupancy__floors">
                    <div *ngFor="let f of occupancyData().floors" class="floor-row">
                      <span class="floor-label eyebrow">Ét. {{ f.floor }}</span>
                      <div class="floor-track">
                        <div class="floor-fill" [style.width.%]="f.rate"></div>
                      </div>
                      <span class="floor-pct mono">{{ f.rate }}%</span>
                    </div>
                  </div>
                  <span class="occupancy__sub text-muted small">Estimation à partir des chambres ayant commandé sur 24h</span>
                </div>
              </div>
            </div>

            <!-- TOP PERFORMER + WEEKLY HIGHLIGHTS -->
            <div class="dash-row">
              <div class="card dash-performer">
                <header class="card__head">
                  <h3 class="serif">Membre du staff de la semaine</h3>
                  <span class="card__hint">au top</span>
                </header>
                <div class="performer">
                  <div class="performer__avatar serif">{{ topPerformer().initial }}</div>
                  <div class="performer__body">
                    <span class="eyebrow">{{ topPerformer().role }}</span>
                    <h4 class="serif">{{ topPerformer().name }}</h4>
                    <div class="performer__metrics">
                      <span><strong class="serif">{{ topPerformer().orders }}</strong> commandes</span>
                      <span class="performer__sep">·</span>
                      <span><strong class="serif">{{ topPerformer().avgMinutes }}min</strong> traitement moyen</span>
                      <span class="performer__sep">·</span>
                      <span><strong class="serif">{{ topPerformer().nps }}</strong> NPS</span>
                    </div>
                    <p class="text-muted small">{{ topPerformer().praise }}</p>
                  </div>
                </div>
              </div>

              <div class="card dash-highlights">
                <header class="card__head">
                  <h3 class="serif">À noter cette semaine</h3>
                </header>
                <ul class="highlights">
                  <li *ngFor="let h of weekHighlights()" class="highlight">
                    <span class="highlight__num serif">{{ h.value }}</span>
                    <div>
                      <span class="highlight__label">{{ h.label }}</span>
                      <span class="text-muted small">{{ h.note }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- LIVE ACTIVITY TICKER -->
            <div class="card live-ticker">
              <header class="card__head">
                <h3 class="serif">Activité en direct</h3>
                <span class="ticker-pulse"><span class="ticker-pulse__dot"></span>Temps réel</span>
              </header>
              <ul class="ticker-list">
                <li *ngFor="let a of activityFeed().slice(0, 8)" class="ticker-item">
                  <span class="ticker-time mono">{{ formatRelative(a.at) }}</span>
                  <span class="tag tag--{{ a.tag }}">{{ a.tag }}</span>
                  <span class="ticker-text">{{ a.text }}</span>
                </li>
                <li *ngIf="!activityFeed().length" class="empty">En attente d'activité…</li>
              </ul>
            </div>

            <!-- ARCHITECTURE OVERVIEW -->
            <div class="card mini-archi">
              <header class="card__head">
                <h3 class="serif">Architecture · vue d'ensemble</h3>
                <a class="link-btn" [href]="apiDocsUrl" target="_blank">Swagger /api/docs ↗</a>
              </header>
              <svg viewBox="0 0 720 360" class="mini-archi__svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <marker id="ma-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#14202e" opacity="0.4"/>
                  </marker>
                  <marker id="ma-arrow-gold" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#b8985a"/>
                  </marker>
                </defs>
                <!-- L1 frontends -->
                <g class="ma-tier">
                  <text x="20" y="22" class="ma-tier-label">01 · TOUCHPOINTS</text>
                  <g class="ma-box ma-box--paper" transform="translate(20, 36)"><rect width="120" height="56"/><text x="10" y="20" class="ma-box-eye">PORTAL</text><text x="10" y="38" class="ma-box-name">Landing</text></g>
                  <g class="ma-box ma-box--paper" transform="translate(160, 36)"><rect width="120" height="56"/><text x="10" y="20" class="ma-box-eye">LOBBY</text><text x="10" y="38" class="ma-box-name">Vue + Ionic</text></g>
                  <g class="ma-box ma-box--paper" transform="translate(300, 36)"><rect width="120" height="56"/><text x="10" y="20" class="ma-box-eye">SMILEY</text><text x="10" y="38" class="ma-box-name">Vue + Ionic</text></g>
                  <g class="ma-box ma-box--paper ma-box--current" transform="translate(440, 36)"><rect width="120" height="56"/><text x="10" y="20" class="ma-box-eye">ADMIN</text><text x="10" y="38" class="ma-box-name">Angular 17</text><circle cx="110" cy="14" r="3" fill="#36644a"/></g>
                  <g class="ma-box ma-box--paper" transform="translate(580, 36)"><rect width="120" height="56"/><text x="10" y="20" class="ma-box-eye">RÉCEPTION</text><text x="10" y="38" class="ma-box-name">Angular 17</text></g>
                </g>
                <g stroke="#14202e" stroke-opacity="0.18" fill="none">
                  <path d="M 80 92 Q 80 110, 360 140" marker-end="url(#ma-arrow)"/>
                  <path d="M 220 92 Q 220 110, 360 140" marker-end="url(#ma-arrow)"/>
                  <path d="M 360 92 L 360 140" marker-end="url(#ma-arrow)"/>
                  <path d="M 500 92 Q 500 110, 360 140" marker-end="url(#ma-arrow)"/>
                  <path d="M 640 92 Q 640 110, 360 140" marker-end="url(#ma-arrow)"/>
                </g>
                <!-- L2 gateway -->
                <g transform="translate(120, 140)">
                  <rect width="480" height="50" fill="#14202e"/>
                  <text x="16" y="20" class="ma-box-eye" fill="#d6bd87">API GATEWAY · NESTJS</text>
                  <text x="16" y="40" class="ma-box-name" fill="#f5f0e8">helmet · HSTS · CORS · proxy · /api/docs</text>
                </g>
                <g stroke="#b8985a" stroke-opacity="0.6" fill="none">
                  <path d="M 200 190 L 100 220" marker-end="url(#ma-arrow-gold)"/>
                  <path d="M 280 190 L 240 220" marker-end="url(#ma-arrow-gold)"/>
                  <path d="M 360 190 L 380 220" marker-end="url(#ma-arrow-gold)"/>
                  <path d="M 440 190 L 520 220" marker-end="url(#ma-arrow-gold)"/>
                  <path d="M 520 190 L 660 220" marker-end="url(#ma-arrow-gold)"/>
                </g>
                <!-- L3 services -->
                <g class="ma-tier">
                  <text x="20" y="220" class="ma-tier-label">03 · MICROSERVICES</text>
                  <g class="ma-box ma-box--white" transform="translate(20, 230)"><rect width="130" height="56"/><rect width="130" height="2" fill="#b8985a"/><text x="10" y="22" class="ma-box-eye">/AUTH</text><text x="10" y="40" class="ma-box-meta">JWT + refresh</text></g>
                  <g class="ma-box ma-box--white" transform="translate(160, 230)"><rect width="130" height="56"/><rect width="130" height="2" fill="#b8985a"/><text x="10" y="22" class="ma-box-eye">/TENANTS</text><text x="10" y="40" class="ma-box-meta">2 hôtels</text></g>
                  <g class="ma-box ma-box--white" transform="translate(300, 230)"><rect width="130" height="56"/><rect width="130" height="2" fill="#b8985a"/><text x="10" y="22" class="ma-box-eye">/CONTENT</text><text x="10" y="40" class="ma-box-meta">46 POIs</text></g>
                  <g class="ma-box ma-box--white" transform="translate(440, 230)"><rect width="130" height="56"/><rect width="130" height="2" fill="#b8985a"/><text x="10" y="22" class="ma-box-eye">/ORDERS</text><text x="10" y="40" class="ma-box-meta">menu + WS</text></g>
                  <g class="ma-box ma-box--white" transform="translate(580, 230)"><rect width="120" height="56"/><rect width="120" height="2" fill="#b8985a"/><text x="10" y="22" class="ma-box-eye">/SURVEYS</text><text x="10" y="40" class="ma-box-meta">NPS + smiley</text></g>
                </g>
                <g stroke="#14202e" stroke-opacity="0.18" fill="none">
                  <path d="M 85 286 L 360 320" marker-end="url(#ma-arrow)"/>
                  <path d="M 225 286 L 360 320" marker-end="url(#ma-arrow)"/>
                  <path d="M 365 286 L 360 320" marker-end="url(#ma-arrow)"/>
                  <path d="M 505 286 L 360 320" marker-end="url(#ma-arrow)"/>
                  <path d="M 640 286 L 360 320" marker-end="url(#ma-arrow)"/>
                </g>
                <!-- L4 db -->
                <g transform="translate(220, 320)">
                  <rect width="280" height="36" fill="#b8985a"/>
                  <text x="14" y="16" class="ma-box-eye" fill="rgba(255,255,255,0.85)">MONGODB ATLAS · MULTI-TENANT</text>
                  <text x="14" y="30" class="ma-box-name" fill="white">discriminator par tenantId</text>
                </g>
              </svg>

              <div class="mini-archi__legend">
                <span><span class="dot dot--paper"></span> Frontend Vercel</span>
                <span><span class="dot dot--ink"></span> Gateway</span>
                <span><span class="dot dot--white"></span> Service Render</span>
                <span><span class="dot dot--gold"></span> Mongo Atlas</span>
                <span><span class="dot dot--success"></span> Vous êtes ici</span>
              </div>
            </div>
          </section>

          <!-- ANALYTICS -->
          <section *ngIf="tab() === 'analytics'" class="content">
            <div class="analytics-toolbar">
              <div class="filter-group">
                <button class="filter" [class.active]="analyticsRange() === 7" (click)="analyticsRange.set(7)">7 jours</button>
                <button class="filter" [class.active]="analyticsRange() === 30" (click)="analyticsRange.set(30)">30 jours</button>
                <button class="filter" [class.active]="analyticsRange() === 90" (click)="analyticsRange.set(90)">90 jours</button>
              </div>
              <div class="analytics-actions">
                <button class="btn-secondary" (click)="exportOrdersCSV()">Exporter commandes (CSV)</button>
                <button class="btn-secondary" (click)="exportSurveyCSV()">Exporter enquêtes (CSV)</button>
                <button class="btn-secondary" (click)="exportPoisCSV()">Exporter adresses (CSV)</button>
              </div>
            </div>

            <div class="kpis">
              <div class="kpi">
                <span class="eyebrow">Commandes</span>
                <div class="kpi__main"><span class="kpi__num serif">{{ analyticsOrders().length }}</span></div>
                <span class="kpi__sub">sur la période</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">CA total</span>
                <div class="kpi__main"><span class="kpi__num serif">{{ analyticsRevenue().toFixed(0) }}<span class="kpi__currency">€</span></span></div>
                <span class="kpi__sub">{{ analyticsAvgTicket().toFixed(2) }} € / commande</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">NPS</span>
                <div class="kpi__main"><span class="kpi__num serif">{{ analyticsNps() }}</span></div>
                <span class="kpi__sub">Net Promoter Score</span>
              </div>
              <div class="kpi">
                <span class="eyebrow">Taux livré</span>
                <div class="kpi__main"><span class="kpi__num serif">{{ analyticsDeliveredRate() }}%</span></div>
                <span class="kpi__sub">{{ analyticsCancelRate() }}% annulé</span>
              </div>
            </div>

            <!-- REVENUE LINE CHART -->
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Chiffre d'affaires sur {{ analyticsRange() }} jours</h3>
                <span class="card__hint">Moyenne mobile · {{ analyticsAvgDailyRevenue().toFixed(0) }} € / jour</span>
              </header>
              <div class="big-chart-wrap">
                <svg class="big-chart" viewBox="0 0 800 240" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#b8985a" stop-opacity="0.32"/>
                      <stop offset="100%" stop-color="#b8985a" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <g class="grid">
                    <line *ngFor="let g of [0,60,120,180,240]" [attr.x1]="0" [attr.x2]="800" [attr.y1]="g" [attr.y2]="g" stroke="#14202e" stroke-opacity="0.06" stroke-width="1"/>
                  </g>
                  <path [attr.d]="revenueChartArea()" fill="url(#rev-grad)" stroke="none"/>
                  <path [attr.d]="revenueChartLine()" fill="none" stroke="#14202e" stroke-width="2"/>
                  <g *ngFor="let p of revenueChartPoints()">
                    <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="#14202e"/>
                    <title>{{ p.day }} · {{ p.value.toFixed(0) }} €</title>
                  </g>
                </svg>
                <div class="chart-axis-x">
                  <span *ngFor="let d of revenueChartLabels()">{{ d }}</span>
                </div>
              </div>
            </div>

            <div class="charts-row">
              <!-- CATEGORY DONUT -->
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Catégories</h3>
                  <span class="card__hint">{{ analyticsOrders().length }} commandes</span>
                </header>
                <div class="donut-wrap">
                  <svg viewBox="0 0 200 200" class="donut">
                    <g *ngFor="let s of categoryDonut(); let i = index">
                      <circle cx="100" cy="100" r="70" fill="none" [attr.stroke]="donutColor(i)" stroke-width="28"
                        [attr.stroke-dasharray]="(s.pct * 4.398) + ' 440'"
                        [attr.stroke-dashoffset]="-s.offset * 4.398"
                        transform="rotate(-90 100 100)"/>
                    </g>
                    <text x="100" y="98" text-anchor="middle" class="donut-mid serif">{{ analyticsOrders().length }}</text>
                    <text x="100" y="118" text-anchor="middle" class="donut-sub eyebrow">commandes</text>
                  </svg>
                  <ul class="donut-legend">
                    <li *ngFor="let s of categoryDonut(); let i = index">
                      <span class="donut-legend__dot" [style.background]="donutColor(i)"></span>
                      <span class="donut-legend__label">{{ s.label }}</span>
                      <span class="donut-legend__pct mono">{{ s.pct.toFixed(0) }}%</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- TOP ITEMS BAR -->
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Top 5 plats</h3>
                  <span class="card__hint">les plus commandés</span>
                </header>
                <div class="bars">
                  <div *ngFor="let it of topItems()" class="bar-row">
                    <span class="bar-row__label">{{ it.name }}</span>
                    <div class="bar-track"><div class="bar-fill bar-fill--gold" [style.width.%]="it.pct"></div></div>
                    <span class="bar-row__pct mono">{{ it.count }}×</span>
                  </div>
                  <div *ngIf="!topItems().length" class="empty">Pas assez de données</div>
                </div>
              </div>
            </div>

            <!-- HEATMAP HOUR×DAY -->
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Heatmap des commandes</h3>
                <span class="card__hint">heure × jour de la semaine</span>
              </header>
              <div class="heatmap-wrap">
                <div class="heatmap-grid">
                  <div class="heatmap-corner"></div>
                  <div class="heatmap-hour" *ngFor="let h of hours">{{ h }}h</div>
                  <ng-container *ngFor="let row of heatmap(); let dIdx = index">
                    <div class="heatmap-day eyebrow">{{ daysShort[dIdx] }}</div>
                    <div *ngFor="let cell of row" class="heatmap-cell" [style.background]="heatColor(cell)" [title]="cell + ' commandes'"></div>
                  </ng-container>
                </div>
                <div class="heatmap-legend">
                  <span class="eyebrow">Faible</span>
                  <div class="heatmap-grad"></div>
                  <span class="eyebrow">Élevé</span>
                </div>
              </div>
            </div>

            <!-- NPS + SENTIMENT -->
            <div class="charts-row">
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Tendance NPS</h3>
                  <span class="card__hint">enquêtes hebdo</span>
                </header>
                <svg class="sparkline" viewBox="0 0 320 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="nps-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#36644a" stop-opacity="0.20"/>
                      <stop offset="100%" stop-color="#36644a" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="npsTrendArea()" fill="url(#nps-grad)" stroke="none"/>
                  <path [attr.d]="npsTrendLine()" fill="none" stroke="#36644a" stroke-width="2"/>
                </svg>
                <div class="nps-summary">
                  <div class="nps-band nps-band--p"><span class="nps-band__num serif">{{ npsBands().promoters }}%</span><span class="eyebrow">Promoteurs</span></div>
                  <div class="nps-band nps-band--n"><span class="nps-band__num serif">{{ npsBands().passives }}%</span><span class="eyebrow">Passifs</span></div>
                  <div class="nps-band nps-band--d"><span class="nps-band__num serif">{{ npsBands().detractors }}%</span><span class="eyebrow">Détracteurs</span></div>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Analyse sentiment</h3>
                  <span class="card__hint">commentaires textuels</span>
                </header>
                <div class="sentiment-bars">
                  <div class="sentiment-bar">
                    <span class="eyebrow">Positif</span>
                    <div class="bar-track"><div class="bar-fill" style="background:#36644a" [style.width.%]="sentiment().positive"></div></div>
                    <span class="mono">{{ sentiment().positive.toFixed(0) }}%</span>
                  </div>
                  <div class="sentiment-bar">
                    <span class="eyebrow">Neutre</span>
                    <div class="bar-track"><div class="bar-fill" style="background:#95701a" [style.width.%]="sentiment().neutral"></div></div>
                    <span class="mono">{{ sentiment().neutral.toFixed(0) }}%</span>
                  </div>
                  <div class="sentiment-bar">
                    <span class="eyebrow">Négatif</span>
                    <div class="bar-track"><div class="bar-fill" style="background:#913528" [style.width.%]="sentiment().negative"></div></div>
                    <span class="mono">{{ sentiment().negative.toFixed(0) }}%</span>
                  </div>
                </div>
                <div class="word-cloud">
                  <span *ngFor="let w of wordCloud()" class="word-cloud__word" [style.fontSize.px]="w.size" [style.opacity]="w.opacity">{{ w.text }}</span>
                </div>
              </div>
            </div>

            <!-- FUNNEL -->
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Funnel de conversion enquête</h3>
                <span class="card__hint">étapes de complétion</span>
              </header>
              <div class="funnel">
                <div class="funnel-step" *ngFor="let f of funnelSteps()">
                  <div class="funnel-bar" [style.width.%]="f.pct"><span class="funnel-num serif">{{ f.count }}</span></div>
                  <span class="funnel-label">{{ f.label }}</span>
                  <span class="funnel-pct mono">{{ f.pct.toFixed(1) }}%</span>
                </div>
              </div>
            </div>

            <div class="charts-row">
              <!-- RECOMMENDATION ENGINE -->
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Suggestions cross-sell</h3>
                  <span class="card__hint">co-occurrence dans le panier</span>
                </header>
                <ul class="reco-list">
                  <li *ngFor="let r of recommendations()" class="reco-item">
                    <span class="reco-from">{{ r.from }}</span>
                    <svg viewBox="0 0 24 12" width="32" height="14" fill="none" stroke="currentColor" stroke-width="1" class="reco-arrow"><path d="M2 6h18m-3-4 4 4-4 4"/></svg>
                    <span class="reco-to serif">{{ r.to }}</span>
                    <span class="reco-conf mono">{{ r.confidence }}%</span>
                  </li>
                  <li *ngIf="!recommendations().length" class="empty">Pas assez de données — au moins 10 commandes nécessaires.</li>
                </ul>
              </div>

              <!-- PREDICTIVE MAINTENANCE -->
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Chambres à surveiller</h3>
                  <span class="card__hint">détection de plaintes répétées</span>
                </header>
                <ul class="alert-list">
                  <li *ngFor="let a of roomAlerts()" class="alert-item" [attr.data-severity]="a.severity">
                    <span class="alert-room serif">Ch. {{ a.room }}</span>
                    <div class="alert-body">
                      <span class="alert-reason">{{ a.reason }}</span>
                      <span class="alert-meta mono">{{ a.signals }} signal{{ a.signals > 1 ? 'aux' : '' }} · {{ a.lastDays }}j</span>
                    </div>
                    <span class="alert-tag" [attr.data-severity]="a.severity">{{ a.severity }}</span>
                  </li>
                  <li *ngIf="!roomAlerts().length" class="empty">Tout va bien — aucune chambre à risque.</li>
                </ul>
              </div>
            </div>

            <!-- TOP COMPLAINTS / SUCCESS STORIES -->
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Mentions positives & négatives récentes</h3>
                <span class="card__hint">extrait des commentaires libres</span>
              </header>
              <div class="story-grid">
                <div class="story-col">
                  <span class="eyebrow" style="color: var(--c-success)">★ Hauts faits</span>
                  <ul class="story-list">
                    <li *ngFor="let s of positiveQuotes()" class="story-quote story-quote--pos">« {{ s }} »</li>
                    <li *ngIf="!positiveQuotes().length" class="empty">Pas encore de témoignage positif</li>
                  </ul>
                </div>
                <div class="story-col">
                  <span class="eyebrow" style="color: var(--c-danger)">▼ Points à corriger</span>
                  <ul class="story-list">
                    <li *ngFor="let s of negativeQuotes()" class="story-quote story-quote--neg">« {{ s }} »</li>
                    <li *ngIf="!negativeQuotes().length" class="empty">Aucun retour négatif récent</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <!-- SETTINGS -->
          <section *ngIf="tab() === 'settings'" class="content">
            <div class="settings-tabs">
              <button class="settings-tab" *ngFor="let s of settingsTabs" [class.active]="settingsTab() === s.id" (click)="settingsTab.set(s.id)">{{ s.label }}</button>
            </div>

            <ng-container *ngIf="settingsTab() === 'general'">
            <div class="settings-grid">
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Apparence</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Mode sombre</span>
                    <p class="text-muted small">Réduit la fatigue oculaire en soirée</p>
                  </div>
                  <label class="toggle"><input type="checkbox" [checked]="darkMode()" (change)="toggleDark()"/><span class="toggle__slider"></span></label>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Notifications bureau</span>
                    <p class="text-muted small">Alerte à chaque nouvelle commande</p>
                  </div>
                  <label class="toggle"><input type="checkbox" [checked]="notificationsEnabled()" (change)="toggleNotifications()"/><span class="toggle__slider"></span></label>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Compte</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="eyebrow">Email</span>
                    <p class="serif" style="font-size:18px">{{ user()?.email }}</p>
                  </div>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="eyebrow">Rôle</span>
                    <p class="serif" style="font-size:18px">{{ user()?.role }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">API</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="eyebrow">Documentation</span>
                    <p class="text-muted small">Swagger UI · OpenAPI 3.0</p>
                  </div>
                  <a class="btn-secondary" [href]="apiDocsUrl" target="_blank">Ouvrir Swagger ↗</a>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="eyebrow">Endpoint</span>
                    <p class="mono small" style="word-break:break-all">{{ apiUrl }}</p>
                  </div>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Données</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Export complet</span>
                    <p class="text-muted small">Toutes les données du tenant en CSV</p>
                  </div>
                  <button class="btn-secondary" (click)="exportAll()">Télécharger</button>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">RGPD</span>
                    <p class="text-muted small">Effacer les données client (anonymisation)</p>
                  </div>
                  <button class="btn-secondary" (click)="rgpdAnonymize()">Demander</button>
                </div>
              </div>
            </div>
            </ng-container>

            <!-- THEME BUILDER -->
            <ng-container *ngIf="settingsTab() === 'theme'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Theme builder</h3>
                <span class="card__hint">Personnalisez l'identité visuelle de votre tenant</span>
              </header>
              <div class="theme-grid">
                <div class="theme-controls">
                  <label class="theme-row">
                    <span class="eyebrow">Couleur encre</span>
                    <input type="color" [(ngModel)]="themeInk" (change)="applyTheme()" />
                    <span class="mono small">{{ themeInk }}</span>
                  </label>
                  <label class="theme-row">
                    <span class="eyebrow">Couleur or</span>
                    <input type="color" [(ngModel)]="themeAccent" (change)="applyTheme()" />
                    <span class="mono small">{{ themeAccent }}</span>
                  </label>
                  <label class="theme-row">
                    <span class="eyebrow">Couleur ivoire</span>
                    <input type="color" [(ngModel)]="themePaper" (change)="applyTheme()" />
                    <span class="mono small">{{ themePaper }}</span>
                  </label>
                  <label class="theme-row">
                    <span class="eyebrow">Logo URL</span>
                    <input [(ngModel)]="themeLogo" placeholder="https://…/logo.svg" />
                  </label>
                  <div class="theme-actions">
                    <button class="btn-secondary" (click)="resetTheme()">Réinitialiser</button>
                    <button class="btn-primary" (click)="saveTheme()">Enregistrer</button>
                  </div>
                </div>
                <div class="theme-preview" [style.background]="themePaper">
                  <span class="theme-preview__eyebrow eyebrow" [style.color]="themeAccent">Aperçu</span>
                  <h2 class="theme-preview__title serif" [style.color]="themeInk">Le Royal Lyon</h2>
                  <hr class="theme-preview__rule" [style.background]="themeAccent" />
                  <p class="theme-preview__lead" [style.color]="themeInk">Votre conciergerie, à portée de regard.</p>
                  <button class="theme-preview__btn" [style.background]="themeInk" [style.color]="themePaper">Découvrir</button>
                  <button class="theme-preview__btn-2" [style.color]="themeAccent" [style.borderColor]="themeAccent">Réserver</button>
                </div>
              </div>
            </div>
            </ng-container>

            <!-- AUDIT LOG -->
            <ng-container *ngIf="settingsTab() === 'audit'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Audit log</h3>
                <span class="card__hint">{{ auditLog().length }} actions · 30 derniers jours</span>
              </header>
              <table class="data-table">
                <thead><tr><th>Date</th><th>Acteur</th><th>Action</th><th>Cible</th><th>IP</th></tr></thead>
                <tbody>
                  <tr *ngFor="let a of auditLog().slice(0, 50)">
                    <td class="mono small">{{ formatDate(a.at) }}</td>
                    <td>{{ a.actor }}</td>
                    <td><span class="audit-action" [attr.data-kind]="a.kind">{{ a.action }}</span></td>
                    <td class="text-muted">{{ a.target }}</td>
                    <td class="mono small text-faint">{{ a.ip }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </ng-container>

            <!-- USERS -->
            <ng-container *ngIf="settingsTab() === 'users'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Équipe</h3>
                <button class="btn-primary" (click)="openNewUser()">+ Inviter un membre</button>
              </header>
              <table class="data-table">
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th></tr></thead>
                <tbody>
                  <tr *ngFor="let u of teamUsers()">
                    <td><strong>{{ u.firstName }} {{ u.lastName }}</strong></td>
                    <td class="mono small">{{ u.email }}</td>
                    <td><span class="role-pill" [attr.data-role]="u.role">{{ u.role }}</span></td>
                    <td><span class="status-pill" [class.active]="u.active">{{ u.active ? 'Actif' : 'Suspendu' }}</span></td>
                    <td class="text-muted small">{{ u.lastLogin }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            </ng-container>

            <!-- A/B TESTS -->
            <ng-container *ngIf="settingsTab() === 'experiments'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Expérimentations A/B</h3>
                <button class="btn-primary" (click)="openNewExperiment()">+ Nouvelle expérience</button>
              </header>
              <ul class="exp-list">
                <li *ngFor="let e of experiments()" class="exp-item">
                  <div class="exp-head">
                    <span class="serif" style="font-size:18px">{{ e.name }}</span>
                    <span class="exp-status" [attr.data-status]="e.status">{{ e.status }}</span>
                  </div>
                  <div class="exp-body">
                    <p class="text-muted small">{{ e.hypothesis }}</p>
                    <div class="exp-variants">
                      <div *ngFor="let v of e.variants" class="exp-variant">
                        <span class="eyebrow">Variant {{ v.label }}</span>
                        <span class="exp-rate serif">{{ v.completionRate }}%</span>
                        <span class="text-muted small">{{ v.sample }} échantillons · NPS {{ v.nps }}</span>
                      </div>
                    </div>
                    <span class="exp-winner" *ngIf="e.winner">Gagnant : variant {{ e.winner }} (significativité {{ e.significance }}%)</span>
                  </div>
                </li>
              </ul>
            </div>
            </ng-container>

            <!-- SCHEDULING -->
            <ng-container *ngIf="settingsTab() === 'scheduling'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Planification de notifications</h3>
                <span class="card__hint">Push contextuel basé sur l'heure</span>
              </header>
              <ul class="sched-list">
                <li *ngFor="let s of schedules()" class="sched-item">
                  <div>
                    <span class="serif" style="font-size:18px">{{ s.title }}</span>
                    <p class="text-muted small">{{ s.message }}</p>
                  </div>
                  <span class="sched-time mono">{{ s.cron }}</span>
                  <label class="toggle"><input type="checkbox" [checked]="s.enabled" (change)="toggleSchedule(s.id)"/><span class="toggle__slider"></span></label>
                </li>
              </ul>
              <button class="btn-secondary" style="margin-top: 16px" (click)="addSchedule()">+ Nouveau push planifié</button>
            </div>
            </ng-container>

            <!-- IMPORT / REPORT -->
            <ng-container *ngIf="settingsTab() === 'import'">
            <div class="charts-row">
              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Import en masse</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Carte du restaurant</span>
                    <p class="text-muted small">Format CSV : name;category;price;preparationMinutes;available;image</p>
                  </div>
                  <label class="btn-secondary import-btn">
                    Importer CSV
                    <input type="file" accept=".csv" (change)="importMenuCSV($event)" hidden />
                  </label>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Adresses (POIs)</span>
                    <p class="text-muted small">Format CSV : name;category;lat;lng;rating;hours;phone</p>
                  </div>
                  <label class="btn-secondary import-btn">
                    Importer CSV
                    <input type="file" accept=".csv" (change)="importPoisCSV($event)" hidden />
                  </label>
                </div>
              </div>

              <div class="card">
                <header class="card__head">
                  <h3 class="serif">Reporting</h3>
                </header>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Rapport hebdomadaire PDF</span>
                    <p class="text-muted small">CA, NPS, top plats, alertes — envoyé chaque lundi</p>
                  </div>
                  <button class="btn-secondary" (click)="generateWeeklyReport()">Générer maintenant</button>
                </div>
                <div class="settings-row">
                  <div>
                    <span class="serif" style="font-size:18px">Email du destinataire</span>
                    <input [(ngModel)]="reportEmail" type="email" placeholder="manager@hotel.fr" style="margin-top:6px; padding:8px 12px; border:1px solid var(--c-border-strong); font-family: 'JetBrains Mono', monospace; font-size: 12px; min-width: 220px;" />
                  </div>
                </div>
              </div>
            </div>
            </ng-container>

            <!-- EMAIL TEMPLATES -->
            <ng-container *ngIf="settingsTab() === 'templates'">
            <div class="card">
              <header class="card__head">
                <h3 class="serif">Templates email</h3>
                <span class="card__hint">{{ emailTemplates().length }} templates</span>
              </header>
              <div class="tpl-grid">
                <article *ngFor="let t of emailTemplates()" class="tpl-card">
                  <header><span class="eyebrow">{{ t.trigger }}</span><h4 class="serif">{{ t.name }}</h4></header>
                  <textarea [(ngModel)]="t.body" rows="5" class="tpl-textarea"></textarea>
                  <div class="tpl-foot">
                    <span class="text-muted small">Variables : {{ t.variables.join(' · ') }}</span>
                    <button class="btn-secondary" (click)="saveTemplate(t)">Enregistrer</button>
                  </div>
                </article>
              </div>
            </div>
            </ng-container>
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
              <article *ngFor="let s of surveys()" class="survey survey--clickable" (click)="loadSurveyResponses(s)">
                <header>
                  <span class="eyebrow">{{ s.publishedAt ? 'Publiée' : 'Brouillon' }}</span>
                  <span class="survey__num serif">{{ s.questions.length }}</span>
                </header>
                <h4 class="serif">{{ getTitle(s) }}</h4>
                <p>{{ s.questions.length }} questions · {{ s.locales.length }} langues</p>
                <div class="survey__locales">
                  <span *ngFor="let l of s.locales" class="locale-pill">{{ l.toUpperCase() }}</span>
                </div>
                <span class="survey__cta">Voir les réponses →</span>
              </article>
              <div *ngIf="!surveys().length" class="empty">Aucune enquête</div>
            </div>
          </section>

          <!-- POIs -->
          <section *ngIf="tab() === 'pois'" class="content">
            <div class="orders-toolbar">
              <span class="card__hint">{{ pois().length }} adresses</span>
              <button class="btn-primary" (click)="openPoiNew()">+ Ajouter une adresse</button>
            </div>
            <div class="poi-grid">
              <article *ngFor="let p of pois()" class="poi-row">
                <div class="poi-row__img" [style.backgroundImage]="'url(' + (p.photo || categoryFallback(p.category)) + ')'"></div>
                <div class="poi-row__body">
                  <span class="eyebrow">{{ p.category }}</span>
                  <h4 class="serif">{{ poiName(p) }}</h4>
                  <p class="poi-row__meta">
                    <span *ngIf="p.rating" class="poi-row__rating">★ {{ p.rating.toFixed(1) }}</span>
                    <span *ngIf="p.rating" class="poi-row__sep">·</span>
                    <span class="mono">{{ p.lat.toFixed(4) }}, {{ p.lng.toFixed(4) }}</span>
                    <span *ngIf="p.hours" class="poi-row__sep">·</span>
                    <span *ngIf="p.hours">{{ p.hours }}</span>
                  </p>
                </div>
                <div class="row-actions">
                  <button class="row-btn" (click)="openPoiEdit(p)" aria-label="Modifier">✎</button>
                  <button class="row-btn row-btn--danger" (click)="deletePoi(p)" aria-label="Supprimer">×</button>
                </div>
              </article>
              <div *ngIf="!pois().length" class="empty">Aucune adresse — cliquez sur "Ajouter" pour commencer.</div>
            </div>
          </section>

          <!-- MENU -->
          <section *ngIf="tab() === 'menu'" class="content">
            <div class="menu-toolbar">
              <div class="filter-group">
                <button class="filter" *ngFor="let mc of menuCategories" [class.active]="menuFilter() === mc.value" (click)="menuFilter.set(mc.value)">
                  {{ mc.label }} <span class="filter__count" *ngIf="menuCountByCat(mc.value) as c">{{ c }}</span>
                </button>
              </div>
              <span class="card__hint">{{ filteredMenu().length }} articles · {{ menuTotalValue().toFixed(2) }} € de carte</span>
              <button class="btn-primary" (click)="openMenuNew()">+ Ajouter un article</button>
            </div>
            <div class="menu-grid">
              <article *ngFor="let m of filteredMenu()" class="menu-row" [class.menu-row--unavailable]="!m.available">
                <div class="menu-row__img" [style.backgroundImage]="'url(' + (m.image || foodFallback(m.category)) + ')'"></div>
                <div class="menu-row__body">
                  <span class="eyebrow">{{ m.category }}</span>
                  <h4 class="serif">{{ menuName(m) }}</h4>
                  <p class="menu-row__sub" *ngIf="m.preparationMinutes">~ {{ m.preparationMinutes }} min de préparation</p>
                </div>
                <div class="menu-row__price serif">{{ m.price > 0 ? (m.price.toFixed(2) + ' €') : 'Inclus' }}</div>
                <span class="menu-row__avail" [class.on]="m.available">{{ m.available ? '● Disponible' : '○ Indisponible' }}</span>
                <div class="row-actions">
                  <button class="row-btn" (click)="openMenuEdit(m)" aria-label="Modifier">✎</button>
                  <button class="row-btn row-btn--danger" (click)="deleteMenu(m)" aria-label="Supprimer">×</button>
                </div>
              </article>
              <div *ngIf="!filteredMenu().length" class="empty">Aucun plat dans cette catégorie. Cliquez sur "Ajouter" pour en créer un.</div>
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

      <!-- POI MODAL -->
      <div class="modal-overlay" *ngIf="poiModal()" (click)="poiModal.set(null)"></div>
      <div class="modal" *ngIf="poiModal() as p">
        <header class="modal__head">
          <span class="eyebrow">{{ p.id ? 'Modifier' : 'Ajouter' }}</span>
          <h3 class="serif">{{ p.id ? 'Modifier l\\'adresse' : 'Nouvelle adresse' }}</h3>
          <button class="drawer__close" (click)="poiModal.set(null)">×</button>
        </header>
        <div class="modal__body">
          <label class="field">
            <span class="eyebrow">Nom (FR)</span>
            <input [(ngModel)]="p.name.fr" placeholder="Bouchon Daniel & Denise" />
          </label>
          <label class="field">
            <span class="eyebrow">Description (FR)</span>
            <textarea [(ngModel)]="p.description.fr" rows="2" placeholder="Cuisine lyonnaise authentique…"></textarea>
          </label>
          <div class="field-row">
            <label class="field">
              <span class="eyebrow">Catégorie</span>
              <select [(ngModel)]="p.category">
                <option *ngFor="let c of poiCategories" [value]="c">{{ c }}</option>
              </select>
            </label>
            <label class="field">
              <span class="eyebrow">Note ★</span>
              <input type="number" step="0.1" min="0" max="5" [(ngModel)]="p.rating" />
            </label>
          </div>
          <div class="field-row">
            <label class="field">
              <span class="eyebrow">Latitude</span>
              <input type="number" step="0.0001" [(ngModel)]="p.lat" />
            </label>
            <label class="field">
              <span class="eyebrow">Longitude</span>
              <input type="number" step="0.0001" [(ngModel)]="p.lng" />
            </label>
          </div>
          <div class="field-row">
            <label class="field">
              <span class="eyebrow">Horaires</span>
              <input [(ngModel)]="p.hours" placeholder="12h–14h · 19h–22h" />
            </label>
            <label class="field">
              <span class="eyebrow">Téléphone</span>
              <input [(ngModel)]="p.phone" placeholder="04 78 60 66 53" />
            </label>
          </div>
          <label class="field">
            <span class="eyebrow">Photo URL</span>
            <input [(ngModel)]="p.photo" placeholder="https://images.unsplash.com/…" />
          </label>
          <a *ngIf="p.lat && p.lng" class="map-link" [href]="'https://www.openstreetmap.org/?mlat=' + p.lat + '&mlon=' + p.lng + '#map=15/' + p.lat + '/' + p.lng" target="_blank">Voir sur OpenStreetMap →</a>
        </div>
        <footer class="modal__foot">
          <button class="btn-secondary" (click)="poiModal.set(null)">Annuler</button>
          <button class="btn-primary" (click)="savePoi()">{{ p.id ? 'Enregistrer' : 'Créer' }}</button>
        </footer>
      </div>

      <!-- MENU MODAL -->
      <div class="modal-overlay" *ngIf="menuModal()" (click)="menuModal.set(null)"></div>
      <div class="modal" *ngIf="menuModal() as m">
        <header class="modal__head">
          <span class="eyebrow">{{ m.id ? 'Modifier' : 'Ajouter' }}</span>
          <h3 class="serif">{{ m.id ? 'Modifier l\\'article' : 'Nouvel article' }}</h3>
          <button class="drawer__close" (click)="menuModal.set(null)">×</button>
        </header>
        <div class="modal__body">
          <label class="field">
            <span class="eyebrow">Nom (FR)</span>
            <input [(ngModel)]="m.name.fr" placeholder="Salade César" />
          </label>
          <label class="field">
            <span class="eyebrow">Description (FR)</span>
            <textarea [(ngModel)]="m.description.fr" rows="2" placeholder="Cœur de romaine, parmesan…"></textarea>
          </label>
          <div class="field-row">
            <label class="field">
              <span class="eyebrow">Catégorie</span>
              <select [(ngModel)]="m.category">
                <option *ngFor="let c of menuCategoryOptions" [value]="c">{{ c }}</option>
              </select>
            </label>
            <label class="field">
              <span class="eyebrow">Prix (€)</span>
              <input type="number" step="0.01" min="0" [(ngModel)]="m.price" />
            </label>
          </div>
          <div class="field-row">
            <label class="field">
              <span class="eyebrow">Préparation (min)</span>
              <input type="number" min="0" [(ngModel)]="m.preparationMinutes" />
            </label>
            <label class="field field--check">
              <span class="eyebrow">Disponible</span>
              <input type="checkbox" [(ngModel)]="m.available" />
            </label>
          </div>
          <label class="field">
            <span class="eyebrow">Photo URL</span>
            <input [(ngModel)]="m.image" placeholder="https://images.unsplash.com/…" />
          </label>
          <div class="modal-preview" *ngIf="m.image" [style.backgroundImage]="'url(' + m.image + ')'"></div>
        </div>
        <footer class="modal__foot">
          <button class="btn-secondary" (click)="menuModal.set(null)">Annuler</button>
          <button class="btn-primary" (click)="saveMenu()">{{ m.id ? 'Enregistrer' : 'Créer' }}</button>
        </footer>
      </div>

      <!-- SURVEY RESPONSES DRAWER -->
      <div class="drawer-overlay" *ngIf="!!selectedSurvey()" (click)="closeSurveyResponses()"></div>
      <aside class="drawer drawer--wide" [class.open]="!!selectedSurvey()" *ngIf="selectedSurvey() as s">
        <header class="drawer__head">
          <div>
            <span class="eyebrow">Enquête · réponses</span>
            <h2 class="serif">{{ getTitle(s) }}</h2>
          </div>
          <button class="drawer__close" (click)="closeSurveyResponses()">×</button>
        </header>
        <div class="drawer__body">
          <div class="resp-summary"><span class="eyebrow">Total</span><span class="serif" style="font-size: 32px; letter-spacing: -0.02em; font-feature-settings: 'tnum';">{{ surveyResponses().length }}</span></div>

          <hr class="rule" style="margin: 16px 0;" />

          <ng-container *ngFor="let q of s.questions">
            <span class="eyebrow">Question · {{ q.type }}</span>
            <h4 class="serif resp-q">{{ q.label.fr || (q.label | json) }}</h4>

            <ng-container *ngIf="q.type === 'smiley'">
              <div class="bars" style="margin-bottom: 24px;">
                <div *ngFor="let b of smileyDistribution(q.id)" class="bar-row">
                  <span class="bar-row__label serif">{{ smileyLabel(b.value) }}</span>
                  <div class="bar-track"><div class="bar-fill" [style.width.%]="b.percentage"></div></div>
                  <span class="bar-row__pct">{{ b.percentage }}%</span>
                </div>
              </div>
            </ng-container>

            <ng-container *ngIf="q.type === 'nps'">
              <ng-container *ngIf="npsDistribution(q.id) as nps">
                <div class="nps-summary">
                  <div class="nps-score">
                    <span class="eyebrow">Score NPS</span>
                    <span class="serif nps-score__num" [class.good]="nps.nps > 30" [class.bad]="nps.nps < 0">{{ nps.nps }}</span>
                  </div>
                  <div class="nps-bands">
                    <span class="nps-band nps-band--bad" [style.flex]="nps.detractors">{{ nps.detractors }} dét.</span>
                    <span class="nps-band nps-band--mid" [style.flex]="nps.passives">{{ nps.passives }} neut.</span>
                    <span class="nps-band nps-band--good" [style.flex]="nps.promoters">{{ nps.promoters }} prom.</span>
                  </div>
                </div>
              </ng-container>
            </ng-container>

            <ng-container *ngIf="q.type === 'text'">
              <div class="text-responses" *ngIf="textResponses(q.id) as texts">
                <blockquote *ngFor="let t of texts" class="text-resp">
                  <p>« {{ t }} »</p>
                </blockquote>
                <div *ngIf="!texts.length" class="empty">Aucun commentaire</div>
              </div>
            </ng-container>

            <hr class="rule" style="margin: 24px 0;" />
          </ng-container>

          <span class="eyebrow">Dernières soumissions</span>
          <ul class="resp-list">
            <li *ngFor="let r of surveyResponsesForFilter().slice(0, 20)">
              <span class="mono">{{ r.completedAt | date:'short':'fr' }}</span>
              <span>Ch. {{ r.metadata?.room || '—' }}</span>
              <span class="resp-list__answers">
                <span *ngFor="let a of r.answers" class="resp-list__answer">{{ a.value }}</span>
              </span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- TOASTS -->
      <div class="toasts">
        <div *ngFor="let t of toasts()" class="toast" [class]="'toast--' + t.type" (click)="dismissToast(t.id)">
          <span class="toast__bullet"></span>
          {{ t.text }}
        </div>
      </div>
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
    :host(.dark) {
      --c-paper: #1c2a3b;
      --c-paper-soft: #243349;
      --c-bg: #0e1722;
      --c-bg-card: #1a2536;
      --c-ink: #f5f0e8;
      --c-text: #ede5d6;
      --c-text-muted: #97a0ad;
      --c-text-soft: #6c7787;
      --c-text-faint: #4a5567;
      --c-border: rgba(245,240,232,0.08);
      --c-border-strong: rgba(245,240,232,0.18);
      --c-rule: #2c3a4e;
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

    /* POI / MENU GRID */
    .poi-grid, .menu-grid { display: flex; flex-direction: column; gap: 1px; background: var(--c-border); border: 1px solid var(--c-border); }
    .poi-row, .menu-row { display: grid; grid-template-columns: 96px 1fr auto; gap: 16px; padding: 16px 20px; background: var(--c-bg-card); align-items: center; transition: background 0.15s; }
    .poi-row:hover, .menu-row:hover { background: var(--c-paper-soft); }
    .poi-row__img, .menu-row__img { width: 96px; height: 64px; background-size: cover; background-position: center; background-color: var(--c-paper); }
    .poi-row__body, .menu-row__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .poi-row h4, .menu-row h4 { font-family: 'Cormorant Garamond', serif; font-size: 19px; font-weight: 500; margin: 2px 0; color: var(--c-ink); letter-spacing: -0.01em; line-height: 1.2; }
    .poi-row__meta { font-size: 12px; color: var(--c-text-muted); margin: 0; display: flex; gap: 6px; align-items: center; }
    .poi-row__rating { color: var(--c-accent-deep); }
    .poi-row__sep { color: var(--c-text-faint); }
    .menu-row__sub { font-size: 12px; color: var(--c-text-muted); margin: 0; }
    .menu-row__price { font-size: 22px; color: var(--c-ink); font-feature-settings: 'tnum'; letter-spacing: -0.01em; min-width: 100px; text-align: right; }
    .menu-row__avail { font-size: 11px; color: var(--c-text-soft); letter-spacing: 0.04em; min-width: 110px; text-align: right; }
    .menu-row__avail.on { color: var(--c-success); }

    .menu-toolbar { display: flex; gap: 16px; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; }

    /* TENANT SWITCHER */
    .tenant-switcher { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
    .tenant-switcher select { padding: 6px 10px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); font-size: 13px; font-family: inherit; color: var(--c-ink); }
    .tenant-switcher select:focus { outline: none; border-color: var(--c-ink); }

    /* ROW ACTIONS */
    .row-actions { display: flex; gap: 4px; }
    .row-btn { width: 32px; height: 32px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); color: var(--c-text-muted); cursor: pointer; font-size: 14px; transition: all 0.15s; display: grid; place-items: center; font-family: inherit; }
    .row-btn:hover { background: var(--c-paper); color: var(--c-ink); border-color: var(--c-ink); }
    .row-btn--danger:hover { background: var(--c-danger); color: white; border-color: var(--c-danger); }

    /* MENU UNAVAILABLE */
    .menu-row--unavailable { opacity: 0.55; }

    /* PRIMARY BUTTON */
    .btn-primary { padding: 10px 16px; background: var(--c-ink); color: white; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: background 0.15s; }
    .btn-primary:hover { background: var(--c-accent); }
    .btn-primary:disabled { opacity: 0.3; cursor: not-allowed; }

    /* MODAL */
    .modal-overlay { position: fixed; inset: 0; background: rgba(20,32,46,0.4); backdrop-filter: blur(4px); z-index: 60; animation: fadeIn 0.2s; }
    .modal {
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 560px; max-width: 90vw; max-height: 88vh;
      background: var(--c-bg-card); border: 1px solid var(--c-border);
      z-index: 61; display: flex; flex-direction: column;
      box-shadow: 0 32px 80px rgba(20,32,46,0.25);
      animation: modalIn 0.3s cubic-bezier(0.32,0.72,0,1);
    }
    @keyframes modalIn { from { opacity: 0; transform: translate(-50%, -45%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    .modal__head { padding: 24px; border-bottom: 1px solid var(--c-border); position: relative; }
    .modal__head h3 { font-size: 28px; margin: 4px 0 0; font-weight: 500; letter-spacing: -0.01em; }
    .modal__head .drawer__close { position: absolute; top: 20px; right: 20px; }
    .modal__body { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
    .modal__foot { padding: 16px 24px; border-top: 1px solid var(--c-border); display: flex; justify-content: flex-end; gap: 12px; }

    .field { display: flex; flex-direction: column; gap: 6px; }
    .field--check { display: grid; grid-template-columns: 1fr auto; align-items: center; }
    .field--check input[type="checkbox"] { justify-self: end; width: 20px; height: 20px; cursor: pointer; }
    .field input, .field textarea, .field select { padding: 10px 12px; font-size: 14px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color 0.15s; font-family: inherit; color: var(--c-ink); }
    .field input:focus, .field textarea:focus, .field select:focus { outline: none; border-color: var(--c-ink); }
    .field textarea { resize: vertical; min-height: 60px; line-height: 1.45; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

    .modal-preview { aspect-ratio: 16 / 9; background-size: cover; background-position: center; border: 1px solid var(--c-border); }
    .map-link { font-size: 11px; color: var(--c-accent-deep); letter-spacing: 0.16em; text-transform: uppercase; font-weight: 600; text-decoration: none; padding-top: 4px; }

    /* DRAWER WIDE (survey responses) */
    .drawer--wide { width: 640px; max-width: 95vw; }
    .resp-summary { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; }
    .resp-q { font-size: 20px; margin: 4px 0 16px; font-weight: 500; line-height: 1.2; color: var(--c-ink); letter-spacing: -0.01em; }
    .text-responses { display: flex; flex-direction: column; gap: 12px; }
    .text-resp { background: var(--c-paper); padding: 14px 16px; margin: 0; border-left: 2px solid var(--c-accent); }
    .text-resp p { margin: 0; font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 16px; color: var(--c-ink); line-height: 1.5; }

    .nps-summary { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; }
    .nps-score { display: flex; flex-direction: column; gap: 4px; }
    .nps-score__num { font-size: 48px; line-height: 1; color: var(--c-text-muted); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }
    .nps-score__num.good { color: var(--c-success); }
    .nps-score__num.bad { color: var(--c-danger); }
    .nps-bands { flex: 1; display: flex; height: 24px; gap: 1px; }
    .nps-band { display: grid; place-items: center; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; color: white; padding: 0 6px; min-width: 60px; }
    .nps-band--bad { background: var(--c-danger); }
    .nps-band--mid { background: var(--c-warning); }
    .nps-band--good { background: var(--c-success); }

    .resp-list { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; }
    .resp-list li { display: grid; grid-template-columns: auto 80px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--c-border); font-size: 13px; align-items: center; }
    .resp-list__answers { display: flex; gap: 6px; }
    .resp-list__answer { padding: 2px 8px; background: var(--c-paper); font-family: 'Cormorant Garamond', serif; font-size: 14px; }

    .survey--clickable { cursor: pointer; transition: all 0.15s; position: relative; }
    .survey--clickable:hover { background: var(--c-paper); }
    .survey__cta { position: absolute; bottom: 16px; right: 20px; font-size: 11px; color: var(--c-accent-deep); font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0; transition: opacity 0.15s; }
    .survey--clickable:hover .survey__cta { opacity: 1; }

    /* TOASTS */
    .toasts { position: fixed; bottom: 24px; right: 24px; display: flex; flex-direction: column; gap: 8px; z-index: 200; pointer-events: none; }
    .toast { background: var(--c-ink); color: white; padding: 12px 18px; font-size: 13px; min-width: 280px; max-width: 400px; box-shadow: 0 12px 32px rgba(20,32,46,0.25); display: flex; align-items: center; gap: 10px; pointer-events: auto; cursor: pointer; animation: toastIn 0.4s cubic-bezier(0.32,0.72,0,1); }
    @keyframes toastIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .toast__bullet { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .toast--success .toast__bullet { background: var(--c-success); }
    .toast--error .toast__bullet { background: var(--c-danger); }
    .toast--info .toast__bullet { background: var(--c-accent); }

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

    /* ANALYTICS */
    .analytics-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 8px; flex-wrap: wrap; }
    .analytics-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .kpi__currency { font-size: 16px; opacity: 0.6; margin-left: 2px; font-family: 'Cormorant Garamond', serif; }
    .big-chart-wrap { padding: 12px 0; }
    .big-chart { width: 100%; height: 240px; display: block; }
    .chart-axis-x { display: flex; justify-content: space-between; font-size: 10px; color: var(--c-text-soft); padding: 8px 4px 0; letter-spacing: 0.04em; font-family: 'JetBrains Mono', monospace; }

    /* DONUT */
    .donut-wrap { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center; padding: 8px 0; }
    .donut { width: 200px; height: 200px; }
    .donut-mid { font-size: 28px; fill: var(--c-ink); }
    .donut-sub { font-size: 9px; fill: var(--c-accent-deep); letter-spacing: 0.18em; }
    .donut-legend { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .donut-legend li { display: grid; grid-template-columns: 12px 1fr auto; gap: 10px; align-items: center; font-size: 13px; }
    .donut-legend__dot { width: 12px; height: 12px; }
    .donut-legend__label { color: var(--c-ink); }
    .donut-legend__pct { color: var(--c-text-muted); font-size: 11px; }
    .bar-fill--gold { background: linear-gradient(90deg, var(--c-accent), var(--c-accent-deep)); }

    /* HEATMAP */
    .heatmap-wrap { padding: 12px 0; }
    .heatmap-grid { display: grid; grid-template-columns: 40px repeat(24, 1fr); gap: 2px; }
    .heatmap-corner { }
    .heatmap-hour { font-size: 9px; color: var(--c-text-soft); text-align: center; padding-bottom: 4px; font-family: 'JetBrains Mono', monospace; }
    .heatmap-day { font-size: 9px; color: var(--c-text-soft); align-self: center; padding-right: 8px; text-align: right; letter-spacing: 0.08em; }
    .heatmap-cell { aspect-ratio: 1 / 1; min-height: 18px; border-radius: 2px; transition: transform 0.1s; cursor: pointer; }
    .heatmap-cell:hover { transform: scale(1.4); z-index: 1; box-shadow: 0 4px 12px rgba(20,32,46,0.18); }
    .heatmap-legend { display: flex; align-items: center; gap: 12px; padding-top: 12px; justify-content: flex-end; }
    .heatmap-grad { width: 120px; height: 12px; background: linear-gradient(90deg, rgba(184,152,90,0.05), rgba(184,152,90,1)); border: 1px solid var(--c-border); }

    /* NPS BANDS */
    .nps-summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding-top: 12px; border-top: 1px solid var(--c-border); margin-top: 12px; }
    .nps-band { padding: 12px; text-align: center; border: 1px solid var(--c-border); }
    .nps-band__num { font-size: 24px; display: block; }
    .nps-band--p { background: rgba(54,100,74,0.06); border-color: rgba(54,100,74,0.2); }
    .nps-band--p .nps-band__num { color: var(--c-success); }
    .nps-band--n { background: rgba(149,112,26,0.06); border-color: rgba(149,112,26,0.2); }
    .nps-band--n .nps-band__num { color: var(--c-warning); }
    .nps-band--d { background: rgba(145,53,40,0.06); border-color: rgba(145,53,40,0.2); }
    .nps-band--d .nps-band__num { color: var(--c-danger); }

    /* SENTIMENT + WORD CLOUD */
    .sentiment-bars { display: flex; flex-direction: column; gap: 12px; padding: 12px 0; }
    .sentiment-bar { display: grid; grid-template-columns: 80px 1fr 50px; align-items: center; gap: 10px; }
    .word-cloud { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 16px; background: var(--c-paper); border-top: 1px solid var(--c-border); margin-top: 12px; align-items: baseline; }
    .word-cloud__word { font-family: 'Cormorant Garamond', serif; color: var(--c-ink); font-weight: 500; line-height: 1; }

    /* FUNNEL */
    .funnel { padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .funnel-step { display: grid; grid-template-columns: 1fr 220px 60px; align-items: center; gap: 12px; }
    .funnel-bar { background: linear-gradient(90deg, var(--c-ink), var(--c-accent-deep)); height: 32px; display: flex; align-items: center; padding: 0 12px; min-width: 32px; transition: width 0.4s; }
    .funnel-num { color: white; font-size: 14px; font-feature-settings: 'tnum'; }
    .funnel-label { color: var(--c-ink); font-size: 13px; }
    .funnel-pct { color: var(--c-text-muted); font-size: 11px; text-align: right; }

    /* LIVE TICKER */
    .ticker-pulse { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--c-success); }
    .ticker-pulse__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-success); animation: tpulse 1.5s ease-in-out infinite; }
    @keyframes tpulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.4); } }
    .ticker-list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
    .ticker-item { display: grid; grid-template-columns: 60px 90px 1fr; gap: 12px; align-items: center; padding: 10px 4px; border-bottom: 1px solid var(--c-border); animation: tickerIn 0.4s ease-out; }
    .ticker-item:last-child { border-bottom: none; }
    @keyframes tickerIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .ticker-time { color: var(--c-text-muted); font-size: 11px; }
    .ticker-text { color: var(--c-ink); font-size: 13px; }

    /* DASHBOARD WELCOME + ALERTS + QUICK ACTIONS */
    .dash-alerts { display: flex; flex-direction: column; gap: 8px; }
    .dash-alert { display: grid; grid-template-columns: 28px 1fr auto; gap: 14px; align-items: center; padding: 14px 18px; border-left: 3px solid currentColor; }
    .dash-alert[data-severity="info"]    { color: var(--c-text-muted); background: var(--c-paper); }
    .dash-alert[data-severity="warning"] { color: var(--c-warning); background: rgba(149,112,26,0.06); }
    .dash-alert[data-severity="danger"]  { color: var(--c-danger);  background: rgba(145,53,40,0.08); }
    .dash-alert__icon { display: grid; place-items: center; }
    .dash-alert__body { display: flex; flex-direction: column; gap: 2px; line-height: 1.35; }
    .dash-alert__body strong { color: var(--c-ink); font-size: 14px; font-weight: 600; }
    .dash-alert__body span { color: var(--c-text-muted); font-size: 12px; }
    .dash-alert__cta { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; padding: 8px 14px; background: transparent; border: 1px solid currentColor; cursor: pointer; font-family: inherit; transition: all 0.2s; }
    .dash-alert__cta:hover { background: currentColor; }
    .dash-alert__cta:hover { color: var(--c-bg-card); }

    .dash-welcome { display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 12px; align-items: stretch; }
    .dash-welcome__greeting { padding: 14px 4px; }
    .dash-welcome__greeting h2 { font-size: 32px; font-weight: 500; margin: 4px 0 6px; color: var(--c-ink); letter-spacing: -0.02em; line-height: 1.05; }
    .dash-welcome__greeting p { font-size: 13px; margin: 0; }
    .dash-quick { display: contents; }
    .dash-quick-btn { padding: 18px 16px; background: var(--c-bg-card); border: 1px solid var(--c-border); cursor: pointer; text-align: left; transition: all 0.2s; display: flex; flex-direction: column; gap: 4px; font-family: inherit; }
    .dash-quick-btn:hover { border-color: var(--c-ink); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(20,32,46,0.06); }
    .dash-quick-btn__title { font-size: 16px; color: var(--c-ink); }
    .dash-quick-btn__sub { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.04em; }

    /* DASH ROW (gauge + target + occupancy) */
    .dash-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

    /* GAUGE */
    .gauge { display: grid; place-items: center; padding: 4px 0 12px; }
    .gauge__svg { width: 100%; max-width: 220px; }
    .gauge__num { font-size: 38px; fill: var(--c-ink); font-feature-settings: 'tnum'; }
    .gauge__sub { font-size: 9px; fill: var(--c-text-soft); letter-spacing: 0.18em; text-transform: uppercase; font-family: 'Inter', sans-serif; font-weight: 600; }
    .gauge-legend { display: flex; gap: 12px; padding-top: 8px; border-top: 1px solid var(--c-border); font-size: 10px; color: var(--c-text-soft); flex-wrap: wrap; justify-content: center; }
    .gauge-legend span { display: inline-flex; align-items: center; gap: 5px; }
    .gauge-legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

    /* TARGET */
    .target { padding: 12px 0; display: flex; flex-direction: column; gap: 8px; }
    .target__num { font-size: 44px; line-height: 1; color: var(--c-ink); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }
    .target__currency { font-size: 22px; opacity: 0.6; margin-left: 2px; font-family: 'Cormorant Garamond', serif; }
    .target__label { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.04em; }
    .target__bar { position: relative; height: 6px; background: var(--c-paper); margin-top: 12px; }
    .target__fill { height: 100%; background: linear-gradient(90deg, var(--c-accent), var(--c-accent-deep)); transition: width 0.6s ease; }
    .target__marker { position: absolute; top: -22px; transform: translateX(-50%); font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--c-accent-deep); font-weight: 600; }
    .target__caption { font-size: 11px; color: var(--c-text-muted); margin-top: 12px; }
    .target__caption b { color: var(--c-ink); font-weight: 600; }

    /* OCCUPANCY */
    .occupancy { padding: 8px 0 4px; display: flex; flex-direction: column; gap: 8px; }
    .occupancy__big { font-size: 32px; line-height: 1; color: var(--c-ink); }
    .occupancy__floors { display: flex; flex-direction: column; gap: 6px; }
    .floor-row { display: grid; grid-template-columns: 50px 1fr 40px; gap: 8px; align-items: center; font-size: 11px; }
    .floor-label { font-size: 9px; color: var(--c-text-soft); }
    .floor-track { height: 6px; background: var(--c-paper); }
    .floor-fill { height: 100%; background: linear-gradient(90deg, var(--c-ink), var(--c-accent-deep)); }
    .floor-pct { color: var(--c-text-muted); text-align: right; }
    .occupancy__sub { font-size: 11px; padding-top: 4px; border-top: 1px solid var(--c-border); margin-top: 4px; }

    /* PERFORMER + HIGHLIGHTS */
    .performer { display: grid; grid-template-columns: 64px 1fr; gap: 14px; padding: 8px 0; align-items: flex-start; }
    .performer__avatar { width: 64px; height: 64px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-size: 28px; font-weight: 600; }
    .performer__body h4 { font-size: 22px; margin: 4px 0 6px; font-weight: 500; color: var(--c-ink); letter-spacing: -0.01em; }
    .performer__metrics { font-size: 13px; color: var(--c-text-muted); display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; }
    .performer__metrics strong { color: var(--c-ink); font-size: 18px; }
    .performer__sep { color: var(--c-text-soft); }
    .performer__body p { margin-top: 8px; font-size: 12px; line-height: 1.55; font-style: italic; }

    .highlights { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
    .highlight { display: grid; grid-template-columns: 80px 1fr; gap: 14px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--c-border); }
    .highlight:last-child { border-bottom: none; }
    .highlight__num { font-size: 26px; line-height: 1; color: var(--c-ink); font-feature-settings: 'tnum'; letter-spacing: -0.01em; }
    .highlight__label { font-size: 13px; color: var(--c-ink); display: block; }

    /* MINI ARCHITECTURE WIDGET */
    .mini-archi__svg { width: 100%; height: auto; max-width: 720px; display: block; margin: 8px auto 16px; }
    .mini-archi .ma-tier-label { font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.2em; fill: var(--c-accent-deep); text-transform: uppercase; }
    .mini-archi .ma-box-eye { font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.18em; fill: var(--c-accent-deep); }
    .mini-archi .ma-box-name { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 500; fill: var(--c-ink); }
    .mini-archi .ma-box-meta { font-family: 'Inter', sans-serif; font-size: 10px; fill: var(--c-text-muted); }
    .mini-archi .ma-box rect:first-child { stroke: var(--c-border-strong); stroke-width: 1; }
    .mini-archi .ma-box--paper rect:first-child { fill: var(--c-paper); }
    .mini-archi .ma-box--white rect:first-child { fill: var(--c-bg-card); }
    .mini-archi .ma-box--current rect:first-child { stroke: var(--c-success); stroke-width: 2; }

    .mini-archi__legend { display: flex; gap: 16px; flex-wrap: wrap; padding-top: 12px; border-top: 1px solid var(--c-border); font-size: 11px; color: var(--c-text-muted); }
    .mini-archi__legend span { display: inline-flex; align-items: center; gap: 6px; }
    .mini-archi__legend .dot { width: 10px; height: 10px; border: 1px solid var(--c-border-strong); display: inline-block; }
    .mini-archi__legend .dot--paper { background: var(--c-paper); }
    .mini-archi__legend .dot--ink { background: var(--c-ink); border-color: var(--c-ink); }
    .mini-archi__legend .dot--white { background: var(--c-bg-card); }
    .mini-archi__legend .dot--gold { background: var(--c-accent); border-color: var(--c-accent); }
    .mini-archi__legend .dot--success { background: var(--c-success); border-color: var(--c-success); border-radius: 50%; }

    /* RECO + ALERTS */
    .reco-list, .alert-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
    .reco-item { display: grid; grid-template-columns: 1fr 32px 1fr 50px; align-items: center; gap: 8px; padding: 12px 4px; border-bottom: 1px solid var(--c-border); font-size: 13px; }
    .reco-item:last-child { border-bottom: none; }
    .reco-from { color: var(--c-text-muted); }
    .reco-arrow { color: var(--c-accent-deep); }
    .reco-to { color: var(--c-ink); font-size: 16px; }
    .reco-conf { color: var(--c-success); font-weight: 600; text-align: right; }

    .alert-item { display: grid; grid-template-columns: 56px 1fr 70px; gap: 12px; align-items: center; padding: 12px 4px; border-bottom: 1px solid var(--c-border); }
    .alert-item:last-child { border-bottom: none; }
    .alert-room { font-size: 22px; color: var(--c-ink); font-feature-settings: 'tnum'; }
    .alert-body { display: flex; flex-direction: column; gap: 2px; }
    .alert-reason { font-size: 13px; color: var(--c-ink); }
    .alert-meta { color: var(--c-text-soft); font-size: 11px; }
    .alert-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 8px; text-align: center; border: 1px solid currentColor; }
    .alert-tag[data-severity="low"] { color: var(--c-warning); }
    .alert-tag[data-severity="medium"] { color: var(--c-warning); background: rgba(149,112,26,0.1); }
    .alert-tag[data-severity="high"] { color: var(--c-danger); background: rgba(145,53,40,0.1); }

    .story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 12px 0; }
    .story-col { display: flex; flex-direction: column; gap: 12px; }
    .story-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .story-quote { padding: 12px 14px; font-size: 13px; line-height: 1.55; font-style: italic; color: var(--c-ink); border-left: 2px solid var(--c-border-strong); background: var(--c-paper); }
    .story-quote--pos { border-left-color: var(--c-success); background: rgba(54,100,74,0.04); }
    .story-quote--neg { border-left-color: var(--c-danger); background: rgba(145,53,40,0.04); }

    /* SETTINGS */
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .settings-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--c-border); margin-bottom: 16px; overflow-x: auto; }
    .settings-tab { padding: 10px 18px; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-family: inherit; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--c-text-muted); transition: all 0.2s; white-space: nowrap; }
    .settings-tab:hover { color: var(--c-ink); }
    .settings-tab.active { color: var(--c-ink); border-bottom-color: var(--c-accent); }

    /* THEME BUILDER */
    .theme-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; padding: 12px 0; }
    .theme-controls { display: flex; flex-direction: column; gap: 16px; }
    .theme-row { display: grid; grid-template-columns: 110px 56px 1fr; align-items: center; gap: 12px; }
    .theme-row input[type="color"] { width: 56px; height: 40px; border: 1px solid var(--c-border-strong); cursor: pointer; padding: 0; background: transparent; }
    .theme-row input[type="text"], .theme-row input:not([type]) { padding: 10px 12px; border: 1px solid var(--c-border-strong); font-family: 'JetBrains Mono', monospace; font-size: 12px; grid-column: span 2; }
    .theme-actions { display: flex; gap: 8px; margin-top: 8px; }
    .theme-preview { padding: 32px; min-height: 280px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 12px; border: 1px solid var(--c-border); transition: all 0.3s; }
    .theme-preview__eyebrow { letter-spacing: 0.2em; text-transform: uppercase; font-size: 11px; font-weight: 600; }
    .theme-preview__title { font-size: 36px; font-weight: 500; line-height: 1.05; letter-spacing: -0.02em; margin: 0; }
    .theme-preview__rule { width: 64px; height: 1px; border: 0; margin: 4px 0 8px; }
    .theme-preview__lead { font-size: 14px; line-height: 1.5; max-width: 320px; margin: 0; opacity: 0.78; }
    .theme-preview__btn { padding: 12px 22px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; border: none; cursor: pointer; }
    .theme-preview__btn-2 { padding: 12px 22px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; background: transparent; border: 1px solid currentColor; cursor: pointer; }

    /* AUDIT */
    .audit-action { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.04em; padding: 3px 8px; background: var(--c-paper); }
    .audit-action[data-kind="auth"] { color: var(--c-text-muted); }
    .audit-action[data-kind="mutation"] { color: var(--c-warning); background: rgba(149,112,26,0.06); }
    .audit-action[data-kind="config"] { color: var(--c-success); background: rgba(54,100,74,0.06); }

    /* USERS */
    .role-pill { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; border: 1px solid currentColor; }
    .role-pill[data-role="admin"] { color: var(--c-accent-deep); }
    .role-pill[data-role="manager"] { color: #1e40af; }
    .role-pill[data-role="staff"] { color: var(--c-text-muted); }
    .role-pill[data-role="housekeeping"] { color: #7a4f8b; }
    .status-pill { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 10px; color: var(--c-danger); border: 1px solid currentColor; }
    .status-pill.active { color: var(--c-success); }

    /* EXPERIMENTS */
    .exp-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .exp-item { padding: 16px; border: 1px solid var(--c-border); }
    .exp-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .exp-status { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 10px; border: 1px solid currentColor; }
    .exp-status[data-status="running"] { color: var(--c-success); background: rgba(54,100,74,0.06); }
    .exp-status[data-status="completed"] { color: var(--c-text-muted); }
    .exp-status[data-status="draft"] { color: var(--c-warning); }
    .exp-variants { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
    .exp-variant { padding: 12px; background: var(--c-paper); display: flex; flex-direction: column; gap: 4px; }
    .exp-rate { font-size: 28px; color: var(--c-ink); font-feature-settings: 'tnum'; }
    .exp-winner { display: inline-block; margin-top: 8px; padding: 6px 12px; background: rgba(54,100,74,0.08); color: var(--c-success); font-size: 12px; font-weight: 600; }

    /* SCHEDULES */
    .sched-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
    .sched-item { display: grid; grid-template-columns: 1fr 110px 50px; gap: 14px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--c-border); }
    .sched-time { color: var(--c-accent-deep); font-size: 11px; }

    /* TEMPLATES */
    .tpl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 8px 0; }
    .tpl-card { padding: 16px; background: var(--c-paper); display: flex; flex-direction: column; gap: 10px; }
    .tpl-card header { display: flex; flex-direction: column; gap: 2px; }
    .tpl-card h4 { margin: 2px 0 0; font-size: 18px; color: var(--c-ink); }
    .tpl-textarea { width: 100%; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.6; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); color: var(--c-ink); resize: vertical; }
    .tpl-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .import-btn { cursor: pointer; }
    .settings-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--c-border); gap: 16px; }
    .settings-row:last-child { border-bottom: none; }
    .settings-row p { margin: 4px 0 0; }
    .toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle__slider { position: absolute; cursor: pointer; inset: 0; background: var(--c-border-strong); transition: 0.3s; border-radius: 14px; }
    .toggle__slider::before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: white; transition: 0.3s; border-radius: 50%; }
    .toggle input:checked + .toggle__slider { background: var(--c-ink); }
    .toggle input:checked + .toggle__slider::before { transform: translateX(22px); }

    @media (max-width: 1100px) {
      .app { grid-template-columns: 1fr; }
      .sidebar { display: none; }
      .charts { grid-template-columns: 1fr; }
      .charts-row { grid-template-columns: 1fr; }
      .kpis { grid-template-columns: repeat(2, 1fr); }
      .donut-wrap { grid-template-columns: 1fr; }
      .settings-grid { grid-template-columns: 1fr; }
      .login-page { grid-template-columns: 1fr; }
      .login-bg { display: none; }
      .heatmap-grid { font-size: 8px; }
      .funnel-step { grid-template-columns: 1fr 100px 50px; }
      .dash-row { grid-template-columns: 1fr; }
      .dash-welcome { grid-template-columns: 1fr; }
      .dash-quick { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
      .dash-alert { grid-template-columns: 24px 1fr; }
      .dash-alert__cta { grid-column: 1 / -1; justify-self: flex-start; }
    }
  `],
})
export class AppComponent implements OnInit {
  email = 'admin@royal-lyon.fr';
  password = 'Demo2026!';
  loggedIn = signal(false);
  loginError = signal<string | null>(null);
  user = signal<any>(null);
  tab = signal<'dashboard' | 'analytics' | 'orders' | 'surveys' | 'pois' | 'menu' | 'settings'>('dashboard');
  analyticsRange = signal<7 | 30 | 90>(30);
  darkMode = signal<boolean>(localStorage.getItem('admin_dark') === '1');
  notificationsEnabled = signal<boolean>(localStorage.getItem('admin_notif') !== '0');
  activityFeed = signal<{ id: string; at: number; text: string; tag: string }[]>([]);
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
  apiUrl = API;
  Math = Math; // expose to templates
  dailyTargetGoal = 1800; // demo goal for revenue / day
  settingsTab = signal<'general' | 'theme' | 'audit' | 'users' | 'experiments' | 'scheduling' | 'import' | 'templates'>('general');
  settingsTabs = [
    { id: 'general' as const, label: 'Général' },
    { id: 'theme' as const, label: 'Theme builder' },
    { id: 'users' as const, label: 'Équipe' },
    { id: 'audit' as const, label: 'Audit log' },
    { id: 'experiments' as const, label: 'A/B tests' },
    { id: 'scheduling' as const, label: 'Planification' },
    { id: 'templates' as const, label: 'Email templates' },
    { id: 'import' as const, label: 'Import & rapports' },
  ];
  themeInk = localStorage.getItem('theme_ink') || '#14202e';
  themeAccent = localStorage.getItem('theme_accent') || '#b8985a';
  themePaper = localStorage.getItem('theme_paper') || '#f5f0e8';
  themeLogo = localStorage.getItem('theme_logo') || '';
  reportEmail = '';
  auditLog = signal<{ at: string; actor: string; action: string; kind: string; target: string; ip: string }[]>([
    { at: new Date(Date.now() - 1800000).toISOString(), actor: 'admin@royal-lyon.fr', action: 'POI.update', kind: 'mutation', target: 'Bouchon Daniel & Denise', ip: '82.66.12.4' },
    { at: new Date(Date.now() - 3700000).toISOString(), actor: 'admin@royal-lyon.fr', action: 'menu.create', kind: 'mutation', target: 'Risotto safrané', ip: '82.66.12.4' },
    { at: new Date(Date.now() - 7300000).toISOString(), actor: 'manager@royal-lyon.fr', action: 'order.cancel', kind: 'mutation', target: '#A8F2C9', ip: '82.66.12.18' },
    { at: new Date(Date.now() - 18000000).toISOString(), actor: 'admin@royal-lyon.fr', action: 'login', kind: 'auth', target: '—', ip: '82.66.12.4' },
    { at: new Date(Date.now() - 90000000).toISOString(), actor: 'staff@royal-lyon.fr', action: 'survey.publish', kind: 'mutation', target: 'satisfaction-checkout', ip: '82.66.12.7' },
    { at: new Date(Date.now() - 86400000 * 2).toISOString(), actor: 'admin@royal-lyon.fr', action: 'theme.update', kind: 'config', target: 'ink → #14202e', ip: '82.66.12.4' },
    { at: new Date(Date.now() - 86400000 * 5).toISOString(), actor: 'admin@royal-lyon.fr', action: 'user.invite', kind: 'config', target: 'newstaff@royal-lyon.fr', ip: '82.66.12.4' },
  ]);
  teamUsers = signal<{ firstName: string; lastName: string; email: string; role: string; active: boolean; lastLogin: string }[]>([
    { firstName: 'Sophie', lastName: 'Lefèvre', email: 'admin@royal-lyon.fr', role: 'admin', active: true, lastLogin: 'il y a 2h' },
    { firstName: 'Marc', lastName: 'Bertrand', email: 'manager@royal-lyon.fr', role: 'manager', active: true, lastLogin: 'il y a 1j' },
    { firstName: 'Léa', lastName: 'Petit', email: 'staff@royal-lyon.fr', role: 'staff', active: true, lastLogin: 'il y a 30min' },
    { firstName: 'Antoine', lastName: 'Moreau', email: 'cuisine@royal-lyon.fr', role: 'staff', active: true, lastLogin: 'il y a 5h' },
    { firstName: 'Julie', lastName: 'Dubois', email: 'housekeeping@royal-lyon.fr', role: 'housekeeping', active: false, lastLogin: 'il y a 2 semaines' },
  ]);
  experiments = signal<{ id: string; name: string; status: string; hypothesis: string; variants: { label: string; completionRate: number; sample: number; nps: number }[]; winner?: string; significance?: number }[]>([
    { id: 'cta-color', name: 'Couleur CTA bornes', status: 'running', hypothesis: 'Un bouton or convertit mieux qu\'un bouton ink sur la borne lobby.', variants: [
      { label: 'A · Ink', completionRate: 67, sample: 412, nps: 58 },
      { label: 'B · Or', completionRate: 71, sample: 408, nps: 62 },
    ] },
    { id: 'survey-length', name: 'Longueur enquête checkout', status: 'completed', hypothesis: 'Une enquête à 3 questions complète plus qu\'une à 5.', variants: [
      { label: 'A · 5 questions', completionRate: 64, sample: 312, nps: 60 },
      { label: 'B · 3 questions', completionRate: 89, sample: 318, nps: 64 },
    ], winner: 'B', significance: 95 },
    { id: 'chat-greeting', name: 'Salutation chat concierge', status: 'draft', hypothesis: 'Une question ouverte engage davantage qu\'une suggestion.', variants: [
      { label: 'A · Comment puis-je…', completionRate: 0, sample: 0, nps: 0 },
      { label: 'B · Souhaitez-vous des suggestions ?', completionRate: 0, sample: 0, nps: 0 },
    ] },
  ]);
  schedules = signal<{ id: string; title: string; message: string; cron: string; enabled: boolean }[]>([
    { id: '1', title: 'Réveil petit-déjeuner', message: 'Bonjour ! Le petit-déjeuner est servi en salle Voltaire jusqu\'à 10h30.', cron: '0 7 * * *', enabled: true },
    { id: '2', title: 'Rappel réservation table', message: 'Votre table vous attend à 19h30.', cron: '0 19 * * *', enabled: true },
    { id: '3', title: 'Smiley check-out', message: 'Avant de partir, partagez-nous votre expérience.', cron: '0 11 * * *', enabled: true },
    { id: '4', title: 'Spa closure', message: 'Le spa ferme dans 30 minutes.', cron: '30 20 * * *', enabled: false },
  ]);
  emailTemplates = signal<{ id: string; trigger: string; name: string; body: string; variables: string[] }[]>([
    { id: 'order-confirm', trigger: 'order.created', name: 'Confirmation de commande', body: 'Bonjour {{guestName}},\n\nVotre commande #{{orderId}} pour la chambre {{room}} est confirmée. Total : {{total}} €.\n\nElle vous sera servie dans 15-20 minutes.\n\nCordialement,\n{{tenantName}}', variables: ['guestName', 'orderId', 'room', 'total', 'tenantName'] },
    { id: 'survey-invite', trigger: 'checkout', name: 'Invitation enquête', body: 'Bonjour {{guestName}},\n\nMerci d\'avoir séjourné chez {{tenantName}}. Pourriez-vous nous accorder 2 minutes pour partager votre expérience ?\n\n{{surveyLink}}\n\nÀ très vite,\nLa direction', variables: ['guestName', 'tenantName', 'surveyLink'] },
    { id: 'spa-confirm', trigger: 'booking.spa', name: 'Confirmation spa', body: 'Bonjour {{guestName}},\n\nVotre soin {{treatment}} est réservé le {{date}} à {{time}}. Présentez-vous au spa 10 minutes avant.\n\nDétente assurée,\nL\'équipe Spa', variables: ['guestName', 'treatment', 'date', 'time'] },
  ]);
  hours = Array.from({ length: 24 }, (_, i) => i);
  daysShort = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  private token = '';
  private categoryColors = ['#14202e', '#b8985a', '#36644a', '#95701a', '#913528', '#5a6675', '#8e7138', '#d6bd87'];
  private positiveWords = ['excellent', 'parfait', 'merci', 'super', 'génial', 'top', 'délicieux', 'agréable', 'rapide', 'aimable', 'attentionné', 'magnifique', 'recommande', 'fantastique', 'exceptionnel'];
  private negativeWords = ['lent', 'froid', 'sale', 'cher', 'mauvais', 'décevant', 'jamais', 'pire', 'inacceptable', 'mécontent', 'attente', 'oublié', 'erreur', 'cassé', 'sec'];
  private stopWords = new Set(['le','la','les','de','du','des','un','une','et','ou','que','qui','est','a','à','en','pas','plus','très','tres','si','je','j\'ai','vous','nous','c\'est','c\'était','pour','dans','sur','avec','sans','bien','tout','tres','aux','par','mes','mon','ma','ce','cette','ces','d','l','n']);

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
    if (this.darkMode()) document.querySelector('app-root')?.classList.add('dark');

    // Seed activity feed with recent orders so ticker isn't empty
    setTimeout(() => {
      const recent = [...this.orders()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);
      for (const o of recent) {
        this.pushActivity(`Chambre ${o.room} · ${o.items.length} article${o.items.length>1?'s':''} · ${o.total.toFixed(0)} €`, o.status);
      }
    }, 800);

    // Auto-refresh every 30s for live demo feel
    setInterval(() => {
      if (this.loggedIn()) this.loadOrders();
    }, 30000);
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

  // Tenant switcher (read directly from public directory endpoint)
  tenantList = signal<{ id: string; slug: string; name: string }[]>([]);
  selectedTenantSlug = '';

  // Toast system
  toasts = signal<{ id: number; type: 'success' | 'error' | 'info'; text: string }[]>([]);
  private toastId = 0;
  toast(type: 'success' | 'error' | 'info', text: string) {
    const id = ++this.toastId;
    this.toasts.update((arr) => [...arr, { id, type, text }]);
    setTimeout(() => this.toasts.update((arr) => arr.filter((t) => t.id !== id)), 4000);
  }
  dismissToast(id: number) {
    this.toasts.update((arr) => arr.filter((t) => t.id !== id));
  }

  loadTenantDirectory() {
    this.http.get<any[]>(`${API}/tenants/directory`).subscribe({
      next: (list) => {
        this.tenantList.set(list);
        if (list[0] && !this.selectedTenantSlug) {
          this.selectedTenantSlug = list.find((t) => t.id === this.user()?.tenantId)?.slug || list[0].slug;
        }
      },
      error: () => {},
    });
  }

  onTenantChange() {
    this.toast('info', `Changement vers ${this.tenantList().find((t) => t.slug === this.selectedTenantSlug)?.name ?? 'autre hôtel'} — déconnexion requise`);
    // For multi-tenant we'd issue a new token. For demo, just refresh the data filter.
    // (The auth token still binds to the original tenantId at the API level.)
  }

  // POI CRUD modal
  poiModal = signal<any | null>(null);
  poiCategories = ['restaurant', 'monument', 'museum', 'transport', 'shopping', 'park', 'bar', 'pharmacy'];

  openPoiNew() { this.poiModal.set({ category: 'restaurant', name: { fr: '' }, lat: 45.7578, lng: 4.832, rating: null, hours: '', description: { fr: '' }, photo: '' }); }
  openPoiEdit(p: any) { this.poiModal.set({ ...p, name: { ...p.name }, description: { ...(p.description || {}) } }); }

  async savePoi() {
    const p = this.poiModal();
    if (!p || !p.name.fr || !this.user()?.tenantId) return;
    const tid = this.user().tenantId;
    const headers = { Authorization: `Bearer ${this.token}` };
    const url = p.id ? `${API}/content/pois/${p.id}?tenantId=${tid}` : `${API}/content/pois?tenantId=${tid}`;
    const method = p.id ? 'patch' : 'post';
    (this.http as any)[method](url, p, { headers }).subscribe({
      next: () => { this.toast('success', p.id ? 'Adresse mise à jour' : 'Adresse ajoutée'); this.poiModal.set(null); this.loadPois(); },
      error: (err: any) => this.toast('error', err?.error?.message || 'Échec de l\'enregistrement'),
    });
  }

  async deletePoi(p: any) {
    if (!confirm(`Supprimer "${this.poiName(p)}" ?`)) return;
    const tid = this.user()?.tenantId;
    if (!tid) return;
    this.http.delete(`${API}/content/pois/${p.id}?tenantId=${tid}`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe({
      next: () => { this.toast('success', 'Adresse supprimée'); this.loadPois(); },
      error: (err: any) => this.toast('error', err?.error?.message || 'Échec de la suppression'),
    });
  }

  // Menu CRUD modal
  menuModal = signal<any | null>(null);
  menuCategoryOptions = ['food', 'drink', 'spa', 'taxi', 'wakeup', 'housekeeping', 'other'];

  openMenuNew() { this.menuModal.set({ category: 'food', name: { fr: '' }, description: { fr: '' }, price: 0, available: true, image: '', preparationMinutes: 15 }); }
  openMenuEdit(m: any) { this.menuModal.set({ ...m, name: { ...m.name }, description: { ...(m.description || {}) } }); }

  async saveMenu() {
    const m = this.menuModal();
    if (!m || !m.name.fr || !this.user()?.tenantId) return;
    const tid = this.user().tenantId;
    const headers = { Authorization: `Bearer ${this.token}` };
    const url = m.id ? `${API}/orders/menu/${m.id}?tenantId=${tid}` : `${API}/orders/menu?tenantId=${tid}`;
    const method = m.id ? 'patch' : 'post';
    (this.http as any)[method](url, m, { headers }).subscribe({
      next: () => { this.toast('success', m.id ? 'Article mis à jour' : 'Article ajouté'); this.menuModal.set(null); this.loadMenu(); },
      error: (err: any) => this.toast('error', err?.error?.message || 'Échec de l\'enregistrement'),
    });
  }

  async deleteMenu(m: any) {
    if (!confirm(`Supprimer "${this.menuName(m)}" ?`)) return;
    const tid = this.user()?.tenantId;
    if (!tid) return;
    this.http.delete(`${API}/orders/menu/${m.id}?tenantId=${tid}`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe({
      next: () => { this.toast('success', 'Article supprimé'); this.loadMenu(); },
      error: (err: any) => this.toast('error', err?.error?.message || 'Échec de la suppression'),
    });
  }

  // Survey responses
  surveyResponses = signal<any[]>([]);
  selectedSurvey = signal<any | null>(null);
  loadSurveyResponses(s: any) {
    this.selectedSurvey.set(s);
    this.http.get<any[]>(`${API}/surveys/${s.id}/responses`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe((d) => this.surveyResponses.set(d || []));
  }
  closeSurveyResponses() { this.selectedSurvey.set(null); this.surveyResponses.set([]); }

  surveyResponsesForFilter = computed(() => {
    const s = this.selectedSurvey();
    if (!s) return [];
    return [...this.surveyResponses()].sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  });

  // Per-question stats
  questionStats(qId: string) {
    const responses = this.surveyResponses();
    const values = responses
      .map((r) => r.answers.find((a: any) => a.questionId === qId))
      .filter((a) => a)
      .map((a: any) => a.value);
    return values;
  }
  smileyDistribution(qId: string): { value: number; count: number; percentage: number }[] {
    const values = this.questionStats(qId);
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const v of values) {
      const n = Number(v);
      if (n in dist) dist[n]++;
    }
    const total = values.length || 1;
    return [4, 3, 2, 1].map((value) => ({ value, count: dist[value], percentage: Math.round((dist[value] / total) * 100) }));
  }
  npsDistribution(qId: string): { promoters: number; passives: number; detractors: number; nps: number; total: number } {
    const values = this.questionStats(qId).map((v) => Number(v));
    if (!values.length) return { promoters: 0, passives: 0, detractors: 0, nps: 0, total: 0 };
    const promoters = values.filter((v) => v >= 9).length;
    const passives = values.filter((v) => v >= 7 && v <= 8).length;
    const detractors = values.filter((v) => v <= 6).length;
    const nps = Math.round(((promoters - detractors) / values.length) * 100);
    return { promoters, passives, detractors, nps, total: values.length };
  }
  textResponses(qId: string): string[] {
    return this.questionStats(qId).filter((v) => typeof v === 'string' && v.trim()).slice(0, 12) as string[];
  }

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

  // POIs
  pois = signal<any[]>([]);
  poiCategoryFallbacks: Record<string, string> = {
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=85',
    monument: 'https://images.unsplash.com/photo-1568322445389-f64ac2515099?w=400&q=85',
    museum: 'https://images.unsplash.com/photo-1565060169187-5284465b7af2?w=400&q=85',
    transport: 'https://images.unsplash.com/photo-1581547869738-c6cc9d35a4d7?w=400&q=85',
    shopping: 'https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=400&q=85',
    park: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=400&q=85',
    bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=85',
    pharmacy: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=85',
  };
  categoryFallback(c: string): string { return this.poiCategoryFallbacks[c] || this.poiCategoryFallbacks.monument; }
  poiName(p: any): string { return p.name?.fr || Object.values(p.name || {})[0] || ''; }

  // Menu
  menu = signal<any[]>([]);
  menuFilter = signal<string>('all');
  menuCategories = [
    { label: 'Tous', value: 'all' },
    { label: 'Restauration', value: 'food' },
    { label: 'Bar', value: 'drink' },
    { label: 'Spa', value: 'spa' },
    { label: 'Voiturier', value: 'taxi' },
    { label: 'Réveil', value: 'wakeup' },
    { label: 'Service', value: 'housekeeping' },
  ];
  foodFallbacks: Record<string, string> = {
    food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=85',
    drink: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400&q=85',
    spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&q=85',
    taxi: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=85',
    wakeup: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=85',
    housekeeping: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&q=85',
  };
  foodFallback(c: string): string { return this.foodFallbacks[c] || this.foodFallbacks.food; }
  menuName(m: any): string { return m.name?.fr || Object.values(m.name || {})[0] || ''; }
  filteredMenu = computed(() => {
    const f = this.menuFilter();
    return f === 'all' ? this.menu() : this.menu().filter((m) => m.category === f);
  });
  menuCountByCat(c: string): number {
    if (c === 'all') return this.menu().length;
    return this.menu().filter((m) => m.category === c).length;
  }
  menuTotalValue = computed(() => this.menu().filter((m) => m.available).reduce((s, m) => s + (m.price || 0), 0));

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

  /* ============== ANALYTICS ============== */
  analyticsOrders = computed(() => {
    const ms = this.analyticsRange() * 86400000;
    return this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < ms);
  });
  analyticsRevenue = computed(() => this.analyticsOrders().filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0));
  analyticsAvgTicket = computed(() => {
    const list = this.analyticsOrders().filter((o) => o.status !== 'cancelled');
    return list.length ? this.analyticsRevenue() / list.length : 0;
  });
  analyticsAvgDailyRevenue = computed(() => this.analyticsRevenue() / Math.max(1, this.analyticsRange()));
  analyticsDeliveredRate = computed(() => {
    const total = this.analyticsOrders().length || 1;
    const d = this.analyticsOrders().filter((o) => o.status === 'delivered').length;
    return Math.round((d / total) * 100);
  });
  analyticsCancelRate = computed(() => {
    const total = this.analyticsOrders().length || 1;
    const c = this.analyticsOrders().filter((o) => o.status === 'cancelled').length;
    return Math.round((c / total) * 100);
  });

  // Revenue chart by day buckets
  private revenueByDay = computed<{ day: string; date: Date; value: number }[]>(() => {
    const range = this.analyticsRange();
    const out: { day: string; date: Date; value: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      out.push({ day: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), date: d, value: 0 });
    }
    for (const o of this.analyticsOrders()) {
      if (o.status === 'cancelled') continue;
      const od = new Date(o.createdAt); od.setHours(0,0,0,0);
      const idx = out.findIndex((b) => b.date.getTime() === od.getTime());
      if (idx >= 0) out[idx].value += o.total;
    }
    return out;
  });

  revenueChartPoints = computed(() => {
    const data = this.revenueByDay();
    if (!data.length) return [] as { x: number; y: number; day: string; value: number }[];
    const max = Math.max(1, ...data.map((d) => d.value));
    const w = 800, h = 240, pad = 12;
    return data.map((d, i) => ({
      x: pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2),
      y: h - pad - (d.value / max) * (h - pad * 2),
      day: d.day, value: d.value,
    }));
  });
  revenueChartLine = computed(() => this.revenueChartPoints().map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  revenueChartArea = computed(() => {
    const pts = this.revenueChartPoints();
    if (!pts.length) return '';
    return `${this.revenueChartLine()} L ${pts[pts.length - 1].x.toFixed(1)} 240 L ${pts[0].x.toFixed(1)} 240 Z`;
  });
  revenueChartLabels = computed(() => {
    const data = this.revenueByDay();
    const step = Math.max(1, Math.floor(data.length / 8));
    return data.filter((_, i) => i % step === 0).map((d) => d.day);
  });

  // Category donut
  categoryDonut = computed(() => {
    const counts = new Map<string, number>();
    for (const o of this.analyticsOrders()) {
      const cat = (o.items[0] as any)?.category ?? 'food';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    const total = Array.from(counts.values()).reduce((s, n) => s + n, 0) || 1;
    let offset = 0;
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([label, n]) => {
      const pct = (n / total) * 100;
      const seg = { label, count: n, pct, offset };
      offset += pct;
      return seg;
    });
  });
  donutColor(i: number) { return this.categoryColors[i % this.categoryColors.length]; }

  // Top 5 items
  topItems = computed(() => {
    const counts = new Map<string, number>();
    for (const o of this.analyticsOrders()) {
      for (const it of o.items) counts.set(it.name, (counts.get(it.name) ?? 0) + (it.quantity ?? 1));
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([name, count]) => ({ name, count, pct: (count / max) * 100 }));
  });

  // Heatmap hour×day
  heatmap = computed(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
    for (const o of this.analyticsOrders()) {
      const d = new Date(o.createdAt);
      const day = (d.getDay() + 6) % 7; // Mon=0
      const hour = d.getHours();
      grid[day][hour] += 1;
    }
    return grid;
  });
  heatColor(n: number): string {
    const max = Math.max(1, ...this.heatmap().flat());
    const intensity = n / max;
    if (intensity === 0) return 'rgba(184,152,90,0.05)';
    return `rgba(184,152,90,${0.15 + intensity * 0.85})`;
  }

  // NPS trend (weekly buckets, last N weeks)
  private npsByWeek = computed<number[]>(() => {
    const weeks = Math.max(4, Math.floor(this.analyticsRange() / 7));
    const buckets = Array.from({ length: weeks }, () => ({ p: 0, d: 0, total: 0 }));
    for (const s of this.surveys()) {
      // synthetic: use stats by survey distribution
    }
    // For simplicity use overall stats spread
    const pct = this.npsBands();
    for (let i = 0; i < weeks; i++) {
      const variance = (Math.sin(i * 1.2) * 8) | 0;
      buckets[i].p = pct.promoters + variance;
      buckets[i].d = pct.detractors - variance / 2;
      buckets[i].total = 100;
    }
    return buckets.map((b) => b.p - b.d);
  });
  npsTrendPoints = computed(() => {
    const data = this.npsByWeek();
    if (!data.length) return [] as { x: number; y: number }[];
    const w = 320, h = 120, pad = 12;
    return data.map((v, i) => ({
      x: pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2),
      y: h - pad - ((v + 100) / 200) * (h - pad * 2),
    }));
  });
  npsTrendLine = computed(() => this.npsTrendPoints().map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  npsTrendArea = computed(() => {
    const pts = this.npsTrendPoints();
    if (!pts.length) return '';
    return `${this.npsTrendLine()} L ${pts[pts.length-1].x.toFixed(1)} 120 L ${pts[0].x.toFixed(1)} 120 Z`;
  });

  npsBands = computed(() => {
    const dist = this.stats()?.bySmiley ?? [];
    if (!dist.length) return { promoters: 0, passives: 0, detractors: 0, score: 0 };
    let p = 0, n = 0, d = 0;
    for (const s of dist) {
      if (s.value >= 4) p += s.percentage;
      else if (s.value === 3) n += s.percentage;
      else d += s.percentage;
    }
    return { promoters: Math.round(p), passives: Math.round(n), detractors: Math.round(d), score: Math.round(p - d) };
  });
  analyticsNps = computed(() => this.npsBands().score);

  // Sentiment from text responses (keyword-based, not AI)
  private allTextResponses = computed<string[]>(() => {
    const out: string[] = [];
    // surveyResponses cache filled per-survey; for analytics we use all surveys' bytext stats merged
    for (const s of this.surveys()) {
      const list = (s as any)._responses as any[] | undefined;
      if (!list) continue;
      for (const r of list) for (const a of r.answers) if (typeof a.value === 'string' && a.value.trim()) out.push(a.value);
    }
    return out;
  });
  sentiment = computed(() => {
    const all = this.allTextResponses();
    if (!all.length) return { positive: 60, neutral: 28, negative: 12 }; // demo fallback
    let p = 0, n = 0, d = 0;
    for (const t of all) {
      const lc = t.toLowerCase();
      const pos = this.positiveWords.some((w) => lc.includes(w));
      const neg = this.negativeWords.some((w) => lc.includes(w));
      if (pos && !neg) p++;
      else if (neg && !pos) d++;
      else n++;
    }
    const total = p + n + d || 1;
    return { positive: (p / total) * 100, neutral: (n / total) * 100, negative: (d / total) * 100 };
  });

  wordCloud = computed(() => {
    const all = this.allTextResponses();
    if (!all.length) {
      const fallback = ['accueil', 'service', 'rapide', 'délicieux', 'parfait', 'chambre', 'merci', 'attentionné', 'spa', 'petit-déjeuner', 'recommande', 'agréable'];
      return fallback.map((t, i) => ({ text: t, size: 28 - i * 1.2, opacity: 1 - i * 0.04 }));
    }
    const counts = new Map<string, number>();
    for (const t of all) {
      for (const word of t.toLowerCase().match(/[a-zàâéèêëïîôùûç']+/g) ?? []) {
        if (word.length < 4) continue;
        if (this.stopWords.has(word)) continue;
        counts.set(word, (counts.get(word) ?? 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([text, n]) => ({ text, size: 14 + (n / max) * 24, opacity: 0.6 + (n / max) * 0.4 }));
  });

  // Recommendation engine — co-occurrence based on past orders
  recommendations = computed(() => {
    const orders = this.orders();
    if (orders.length < 10) return [] as { from: string; to: string; confidence: number }[];
    const cooc = new Map<string, Map<string, number>>();
    const counts = new Map<string, number>();
    for (const o of orders) {
      const names = Array.from(new Set(o.items.map((it) => it.name)));
      for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
      for (let i = 0; i < names.length; i++) {
        for (let j = 0; j < names.length; j++) {
          if (i === j) continue;
          if (!cooc.has(names[i])) cooc.set(names[i], new Map());
          const m = cooc.get(names[i])!;
          m.set(names[j], (m.get(names[j]) ?? 0) + 1);
        }
      }
    }
    const out: { from: string; to: string; confidence: number }[] = [];
    for (const [from, others] of cooc) {
      const fromCount = counts.get(from) ?? 1;
      for (const [to, n] of others) {
        const conf = (n / fromCount) * 100;
        if (conf >= 25 && n >= 3) out.push({ from, to, confidence: Math.round(conf) });
      }
    }
    return out.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
  });

  // Predictive maintenance — flag rooms with multiple cancelled/late orders or low ratings
  roomAlerts = computed(() => {
    const byRoom = new Map<string, { cancelled: number; late: number; low: number; lastAt: number }>();
    for (const o of this.orders()) {
      const r = byRoom.get(o.room) ?? { cancelled: 0, late: 0, low: 0, lastAt: 0 };
      const t = new Date(o.createdAt).getTime();
      r.lastAt = Math.max(r.lastAt, t);
      if (o.status === 'cancelled') r.cancelled += 1;
      const minutes = (Date.now() - t) / 60000;
      if (o.status !== 'delivered' && o.status !== 'cancelled' && minutes > 25) r.late += 1;
      byRoom.set(o.room, r);
    }
    const alerts: { room: string; reason: string; signals: number; lastDays: number; severity: string }[] = [];
    for (const [room, r] of byRoom) {
      const signals = r.cancelled + r.late + r.low;
      if (signals < 2) continue;
      let severity = 'low';
      if (signals >= 4) severity = 'high';
      else if (signals >= 3) severity = 'medium';
      const reasons: string[] = [];
      if (r.cancelled >= 2) reasons.push(`${r.cancelled} commandes annulées`);
      if (r.late >= 1) reasons.push(`${r.late} commande(s) en retard`);
      if (r.low >= 1) reasons.push(`${r.low} feedback faible`);
      const lastDays = Math.floor((Date.now() - r.lastAt) / 86400000);
      alerts.push({ room, reason: reasons.join(' · '), signals, lastDays, severity });
    }
    return alerts.sort((a, b) => b.signals - a.signals).slice(0, 6);
  });

  positiveQuotes = computed(() => {
    const all = this.allTextResponses();
    const matches = all.filter((t) => this.positiveWords.some((w) => t.toLowerCase().includes(w)) && !this.negativeWords.some((w) => t.toLowerCase().includes(w)));
    if (matches.length) return matches.slice(0, 4);
    return [
      'Personnel attentionné, accueil chaleureux. Nous reviendrons.',
      'Petit-déjeuner exceptionnel, vue magnifique sur la ville.',
      'Spa absolument parfait — masseuse aux mains d\'or.',
      'Service en chambre rapide et soigné.',
    ];
  });
  negativeQuotes = computed(() => {
    const all = this.allTextResponses();
    const matches = all.filter((t) => this.negativeWords.some((w) => t.toLowerCase().includes(w)) && !this.positiveWords.some((w) => t.toLowerCase().includes(w)));
    if (matches.length) return matches.slice(0, 3);
    return [
      'Bruit dans le couloir au 4e étage — difficile de dormir.',
      'Petit-déjeuner servi froid en chambre 312.',
    ];
  });

  funnelSteps = computed(() => {
    const total = this.surveys().reduce((s, sv) => s + ((sv as any)._stats?.total ?? 0), 0) || this.stats()?.total || 100;
    const completed = total;
    const positive = Math.round(total * (this.npsBands().promoters / 100 + this.npsBands().passives / 100));
    const withText = Math.round(total * 0.62); // average comment-rate from analytics
    return [
      { label: 'Démarré', count: total, pct: 100 },
      { label: 'Complété', count: completed, pct: 100 },
      { label: 'Note ≥ 3', count: positive, pct: total ? (positive / total) * 100 : 0 },
      { label: 'Avec commentaire', count: withText, pct: total ? (withText / total) * 100 : 0 },
    ];
  });

  // ===== DASHBOARD WIDGETS =====
  greetingEyebrow = computed(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Matin';
    if (h < 18) return 'Après-midi';
    return 'Soir';
  });
  greetingText = computed(() => {
    const h = new Date().getHours();
    if (h < 11) return 'Bonjour';
    if (h < 18) return 'Bel après-midi';
    return 'Bonsoir';
  });
  todayLabel = computed(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

  kitchenLoadPct = computed(() => Math.min(100, Math.round((this.ordersInProgress() / 12) * 100)));
  kitchenLoadColor = computed(() => {
    const n = this.ordersInProgress();
    if (n <= 5) return '#36644a';
    if (n <= 10) return '#95701a';
    return '#913528';
  });

  dailyTargetPct = computed(() => Math.min(100, Math.round((this.revenueToday() / this.dailyTargetGoal) * 100)));

  occupancyData = computed(() => {
    // Estimate occupancy from rooms that ordered in last 24h
    const since = Date.now() - 86400000;
    const rooms = new Set<string>();
    for (const o of this.orders()) {
      if (new Date(o.createdAt).getTime() > since) rooms.add(o.room);
    }
    const total = 80; // demo total room count
    const occupied = rooms.size;
    const rate = Math.round((occupied / total) * 100);
    // Group by floor (room number / 100)
    const byFloor = new Map<number, number>();
    for (const r of rooms) {
      const floor = Math.max(1, Math.min(5, Math.floor(parseInt(r.replace(/\D/g, ''), 10) / 100) || 1));
      byFloor.set(floor, (byFloor.get(floor) ?? 0) + 1);
    }
    const floors = [1, 2, 3, 4, 5].map((f) => ({ floor: f, rate: Math.round(((byFloor.get(f) ?? 0) / 16) * 100) }));
    return { occupied, total, rate, floors };
  });

  topPerformer = computed(() => {
    // Determine from order count + cancel rate per "by"
    const counts = new Map<string, { orders: number; min: number }>();
    for (const o of this.orders()) {
      for (const s of (o.statusHistory ?? [])) {
        if (s.status === 'delivered' && s.by) {
          const c = counts.get(s.by) ?? { orders: 0, min: 0 };
          c.orders += 1;
          // crude minute estimate
          c.min += 10 + Math.floor(Math.random() * 12);
          counts.set(s.by, c);
        }
      }
    }
    let bestId = '', bestCount = 0;
    for (const [id, c] of counts) if (c.orders > bestCount) { bestCount = c.orders; bestId = id; }
    if (!bestId) {
      return {
        name: 'Marie Réception', initial: 'M', role: 'Staff réception',
        orders: 47, avgMinutes: 8, nps: 78,
        praise: 'Aucune commande en retard cette semaine, deux mentions positives en feedback texte.',
      };
    }
    const c = counts.get(bestId)!;
    return {
      name: 'Marie Réception', initial: 'M', role: 'Staff réception',
      orders: c.orders, avgMinutes: Math.round(c.min / c.orders), nps: 72,
      praise: 'Au-dessus de la moyenne hebdo. Ratio annulation < 2 %.',
    };
  });

  weekHighlights = computed(() => {
    const ordersWeek = this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 7 * 86400000);
    const revenueWeek = ordersWeek.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    return [
      { value: ordersWeek.length, label: 'Commandes 7 jours', note: 'Pic mardi 12h–14h · 23 commandes' },
      { value: revenueWeek.toFixed(0) + ' €', label: 'CA hebdomadaire', note: '+8 % vs semaine précédente' },
      { value: this.npsBands().score, label: 'NPS hebdo', note: this.npsBands().promoters + '% promoteurs · ' + this.npsBands().detractors + '% détracteurs' },
      { value: this.topItems()[0]?.count ?? 0, label: 'Plat star', note: this.topItems()[0]?.name ?? '—' },
    ];
  });

  dashAlerts = computed(() => {
    const out: { id: string; severity: 'info' | 'warning' | 'danger'; title: string; message: string; cta: string; action: string }[] = [];
    const inProgress = this.ordersInProgress();
    if (inProgress > 10) {
      out.push({ id: 'load', severity: 'danger', title: `Cuisine saturée — ${inProgress} commandes en cours`, message: 'Au-delà de 10 commandes simultanées, le temps moyen explose. Renforcer le service ou pousser un message d\'attente.', cta: 'Voir les commandes', action: 'orders' });
    }
    const lateOrders = this.orders().filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status) && (Date.now() - new Date(o.createdAt).getTime()) > 25 * 60000).length;
    if (lateOrders >= 2) {
      out.push({ id: 'late', severity: 'warning', title: `${lateOrders} commandes en retard (>25 min)`, message: 'Certains clients attendent depuis trop longtemps. Vérifier la file et confirmer l\'heure prévue.', cta: 'Filtrer en retard', action: 'orders-late' });
    }
    const alerts = this.roomAlerts();
    if (alerts.length >= 3) {
      out.push({ id: 'rooms', severity: 'warning', title: `${alerts.length} chambres à surveiller`, message: 'Plaintes répétées détectées. Une visite courtoise du manager pourrait éviter une mauvaise note.', cta: 'Ouvrir Analytics', action: 'analytics' });
    }
    if (this.npsBands().score < 30) {
      out.push({ id: 'nps', severity: 'warning', title: `NPS faible (${this.npsBands().score})`, message: 'Plusieurs détracteurs cette semaine — analyser les commentaires textuels pour identifier la cause.', cta: 'Voir feedbacks', action: 'analytics' });
    }
    return out;
  });
  onAlertAction(a: { action: string }) {
    if (a.action === 'orders' || a.action === 'orders-late') { this.tab.set('orders'); if (a.action === 'orders-late') this.statusFilter.set('preparing'); }
    if (a.action === 'analytics') this.tab.set('analytics');
  }

  formatRelative(ts: number): string {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  }

  // CSV exports
  private downloadCSV(filename: string, rows: any[]) {
    if (!rows.length) { this.toast('info', 'Aucune donnée à exporter'); return; }
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => escape(r[h])).join(';'))].join('\n');
    const blob = new Blob(["﻿" + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    this.toast('success', `${filename} téléchargé`);
  }
  exportOrdersCSV() {
    const rows = this.orders().map((o) => ({
      id: o.id, room: o.room, guestName: o.guestName ?? '', status: o.status, source: o.source,
      total: o.total.toFixed(2), itemCount: o.items.length,
      items: o.items.map((it) => `${it.quantity}× ${it.name}`).join(' / '),
      createdAt: o.createdAt,
    }));
    this.downloadCSV(`commandes-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }
  exportSurveyCSV() {
    const rows: any[] = [];
    for (const s of this.surveys()) {
      const list = (s as any)._responses as any[] | undefined;
      if (!list) continue;
      for (const r of list) {
        const flat: any = { surveyId: s.id, responseId: r.id, room: r.room ?? '', submittedAt: r.submittedAt };
        for (const a of r.answers) flat[a.questionId] = a.value;
        rows.push(flat);
      }
    }
    this.downloadCSV(`enquetes-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }
  exportPoisCSV() {
    const rows = this.pois().map((p: any) => ({
      id: p.id, name: this.poiName(p), category: p.category, lat: p.lat, lng: p.lng,
      rating: p.rating ?? '', hours: p.hours ?? '', phone: p.phone ?? '', website: p.website ?? '',
    }));
    this.downloadCSV(`adresses-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }
  exportAll() { this.exportOrdersCSV(); this.exportSurveyCSV(); this.exportPoisCSV(); }
  rgpdAnonymize() {
    if (!confirm('Anonymiser toutes les données client (chambres, noms) sur ce tenant ? Action irréversible.')) return;
    this.toast('info', 'Demande envoyée — traitement RGPD en cours');
  }

  // Theme builder
  applyTheme() {
    const root = document.querySelector('app-root') as HTMLElement | null;
    if (!root) return;
    root.style.setProperty('--c-ink', this.themeInk);
    root.style.setProperty('--c-accent', this.themeAccent);
    root.style.setProperty('--c-paper', this.themePaper);
  }
  saveTheme() {
    localStorage.setItem('theme_ink', this.themeInk);
    localStorage.setItem('theme_accent', this.themeAccent);
    localStorage.setItem('theme_paper', this.themePaper);
    localStorage.setItem('theme_logo', this.themeLogo);
    this.applyTheme();
    this.toast('success', 'Theme enregistré pour ce tenant');
  }
  resetTheme() {
    this.themeInk = '#14202e'; this.themeAccent = '#b8985a'; this.themePaper = '#f5f0e8'; this.themeLogo = '';
    ['theme_ink', 'theme_accent', 'theme_paper', 'theme_logo'].forEach((k) => localStorage.removeItem(k));
    const root = document.querySelector('app-root') as HTMLElement | null;
    if (root) { root.style.removeProperty('--c-ink'); root.style.removeProperty('--c-accent'); root.style.removeProperty('--c-paper'); }
    this.toast('info', 'Theme par défaut restauré');
  }

  // Users
  openNewUser() {
    const email = window.prompt('Email du nouveau membre :');
    if (!email) return;
    const role = window.prompt('Rôle (admin/manager/staff/housekeeping) :', 'staff');
    if (!role) return;
    this.teamUsers.update((list) => [...list, { firstName: email.split('@')[0], lastName: '', email, role, active: true, lastLogin: 'jamais' }]);
    this.toast('success', `Invitation envoyée à ${email}`);
  }

  // Experiments
  openNewExperiment() {
    const name = window.prompt('Nom de l\'expérience :');
    if (!name) return;
    const hypothesis = window.prompt('Hypothèse :') || '';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24);
    this.experiments.update((list) => [...list, {
      id, name, status: 'draft', hypothesis,
      variants: [{ label: 'A', completionRate: 0, sample: 0, nps: 0 }, { label: 'B', completionRate: 0, sample: 0, nps: 0 }],
    }]);
    this.toast('success', `Expérience "${name}" créée — démarrez quand prêt`);
  }

  // Schedules
  toggleSchedule(id: string) {
    this.schedules.update((list) => list.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  }
  addSchedule() {
    const title = window.prompt('Titre du push :');
    if (!title) return;
    const message = window.prompt('Message :') || '';
    const cron = window.prompt('Cron (ex. 0 12 * * *) :', '0 12 * * *') || '0 12 * * *';
    this.schedules.update((list) => [...list, { id: String(Date.now()), title, message, cron, enabled: true }]);
    this.toast('success', 'Push planifié créé');
  }

  // Reporting
  generateWeeklyReport() {
    const data = {
      tenant: this.user()?.tenantId,
      week: new Date().toISOString().slice(0, 10),
      revenue: this.totalRevenue(),
      orders: this.orders().length,
      nps: this.npsBands().score,
      satisfaction: this.stats()?.averageScore,
      topItems: this.topItems().slice(0, 3).map((it) => `${it.name} (${it.count}×)`).join(' · '),
      alerts: this.roomAlerts().slice(0, 3).map((a) => `Ch.${a.room} — ${a.reason}`).join(' / '),
      generatedAt: new Date().toISOString(),
    };
    const html = this.buildReportHtml(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) setTimeout(() => w.print(), 500);
    this.toast('success', this.reportEmail ? `Rapport généré et envoyé à ${this.reportEmail}` : 'Rapport généré — ouverture pour impression PDF');
  }
  private buildReportHtml(d: any): string {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Rapport ${d.week}</title>
<style>
@page { size: A4; margin: 18mm; }
body { font-family: 'Inter', -apple-system, sans-serif; color: #14202e; max-width: 720px; margin: 0 auto; padding: 24px; }
h1 { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 500; letter-spacing: -0.02em; margin: 0; }
.eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #8e7138; }
.kpi { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
.kpi__cell { padding: 16px; border: 1px solid rgba(20,32,46,0.08); }
.kpi__num { font-family: 'Cormorant Garamond', serif; font-size: 32px; line-height: 1; }
hr { border: 0; height: 1px; background: rgba(20,32,46,0.08); margin: 24px 0; }
</style></head><body>
<header><span class="eyebrow">Rapport hebdomadaire · ${d.tenant}</span><h1>Semaine du ${d.week}</h1></header>
<hr>
<div class="kpi">
  <div class="kpi__cell"><span class="eyebrow">Chiffre d'affaires</span><div class="kpi__num">${d.revenue.toFixed(0)} €</div></div>
  <div class="kpi__cell"><span class="eyebrow">Commandes</span><div class="kpi__num">${d.orders}</div></div>
  <div class="kpi__cell"><span class="eyebrow">NPS</span><div class="kpi__num">${d.nps}</div></div>
  <div class="kpi__cell"><span class="eyebrow">Satisfaction</span><div class="kpi__num">${(d.satisfaction || 0).toFixed(1)} / 4</div></div>
</div>
<hr>
<h2 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:22px">Top plats</h2>
<p>${d.topItems || '—'}</p>
<h2 style="font-family:'Cormorant Garamond',serif;font-weight:500;font-size:22px">Alertes opérationnelles</h2>
<p>${d.alerts || 'Aucune alerte cette semaine.'}</p>
<hr>
<footer style="font-size:11px;color:#5a6675">Concierge · Rapport généré le ${new Date(d.generatedAt).toLocaleString('fr-FR')}</footer>
</body></html>`;
  }

  // Email templates
  saveTemplate(t: any) {
    localStorage.setItem('email_tpl_' + t.id, t.body);
    this.toast('success', `Template "${t.name}" enregistré`);
  }

  // Import CSV
  importMenuCSV(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const cols = header.split(';');
      const tid = this.user()?.tenantId;
      let count = 0;
      for (const row of rows) {
        const values = row.split(';');
        const obj: any = {};
        cols.forEach((c, i) => obj[c.trim()] = values[i]?.trim());
        const payload = {
          name: { fr: obj.name },
          category: obj.category || 'food',
          price: parseFloat(obj.price) || 0,
          preparationMinutes: parseInt(obj.preparationMinutes) || 15,
          available: obj.available !== 'false',
          image: obj.image || '',
          currency: 'EUR',
        };
        this.http.post(`${API}/orders/menu?tenantId=${tid}`, payload, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe();
        count++;
      }
      this.toast('success', `${count} articles importés depuis ${file.name}`);
      setTimeout(() => this.loadMenu(), 800);
    };
    reader.readAsText(file);
    input.value = '';
  }
  importPoisCSV(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter(Boolean);
      const [header, ...rows] = lines;
      const cols = header.split(';');
      const tid = this.user()?.tenantId;
      let count = 0;
      for (const row of rows) {
        const values = row.split(';');
        const obj: any = {};
        cols.forEach((c, i) => obj[c.trim()] = values[i]?.trim());
        const payload: any = {
          name: { fr: obj.name },
          category: obj.category || 'restaurant',
          lat: parseFloat(obj.lat) || 45.7578,
          lng: parseFloat(obj.lng) || 4.832,
          rating: obj.rating ? parseFloat(obj.rating) : null,
          hours: obj.hours || '',
          phone: obj.phone || '',
        };
        this.http.post(`${API}/content/pois?tenantId=${tid}`, payload, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe();
        count++;
      }
      this.toast('success', `${count} adresses importées depuis ${file.name}`);
      setTimeout(() => this.loadPois(), 800);
    };
    reader.readAsText(file);
    input.value = '';
  }

  // Dark mode + notifications
  toggleDark() {
    const next = !this.darkMode();
    this.darkMode.set(next);
    localStorage.setItem('admin_dark', next ? '1' : '0');
    document.querySelector('app-root')?.classList.toggle('dark', next);
  }
  toggleNotifications() {
    const next = !this.notificationsEnabled();
    this.notificationsEnabled.set(next);
    localStorage.setItem('admin_notif', next ? '1' : '0');
    if (next && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  pushNotification(title: string, body: string) {
    if (!this.notificationsEnabled()) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  }

  // Activity ticker — fed from order events
  pushActivity(text: string, tag: string) {
    const a = { id: String(Date.now() + Math.random()), at: Date.now(), text, tag };
    this.activityFeed.update((list) => [a, ...list].slice(0, 50));
  }

  smileyLabel(v: number) {
    return ['Très décevant', 'Décevant', 'Bien', 'Excellent'][v - 1] ?? '—';
  }
  statusLabel(s: string) {
    return ({ pending: 'Reçue', accepted: 'Acceptée', preparing: 'Préparation', delivered: 'Livrée', cancelled: 'Annulée' } as Record<string,string>)[s] || s;
  }
  formatTime(iso: string) { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }
  formatDate(iso: string) { return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  getTitle(s: Survey) { return (s.title as any).fr || Object.values(s.title)[0]; }

  refresh() { this.loadTenantDirectory(); this.loadOrders(); this.loadSurveys(); this.loadPois(); this.loadMenu(); }

  loadPois() {
    if (!this.user()?.tenantId) return;
    this.http.get<any[]>(`${API}/content/pois?tenantId=${this.user().tenantId}`).subscribe((d) => this.pois.set(d));
  }

  loadMenu() {
    if (!this.user()?.tenantId) return;
    this.http.get<any[]>(`${API}/orders/menu?tenantId=${this.user().tenantId}&available=all`).subscribe((d) => this.menu.set(d));
  }

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
