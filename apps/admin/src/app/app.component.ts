import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import type { LoginResponse, Order, Survey, SurveyStats } from '@concierge/types';

function resolveApi(): string {
  const params = new URLSearchParams(window.location.search);
  const queryApi = params.get('api');
  if (queryApi) sessionStorage.setItem('concierge_api', queryApi);
  return (
    queryApi ||
    sessionStorage.getItem('concierge_api') ||
    (window as any).__API__ ||
    'http://localhost:4000'
  );
}
const API = resolveApi();

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <ng-container *ngIf="loggedIn(); else loginTpl">
      <header class="topbar">
        <h1>Concierge · Admin</h1>
        <nav>
          <button [class.active]="tab() === 'dashboard'" (click)="tab.set('dashboard'); refresh()">Dashboard</button>
          <button [class.active]="tab() === 'orders'" (click)="tab.set('orders'); loadOrders()">Commandes</button>
          <button [class.active]="tab() === 'surveys'" (click)="tab.set('surveys'); loadSurveys()">Surveys</button>
        </nav>
        <span class="user">{{ user()?.firstName }} ({{ user()?.role }}) <button (click)="logout()">Déco</button></span>
      </header>

      <main class="main">
        <section *ngIf="tab() === 'dashboard'" class="dash">
          <div class="kpi">
            <p class="kpi__label">Commandes (24h)</p>
            <p class="kpi__num">{{ ordersToday() }}</p>
            <p class="kpi__delta">CA estimé : {{ revenueToday().toFixed(2) }} €</p>
          </div>
          <div class="kpi">
            <p class="kpi__label">NPS / Smiley</p>
            <p class="kpi__num">{{ averageScore() ?? '—' }}</p>
            <p class="kpi__delta">{{ stats()?.total ?? 0 }} réponses</p>
          </div>
          <div class="kpi">
            <p class="kpi__label">En cours</p>
            <p class="kpi__num">{{ ordersInProgress() }}</p>
            <p class="kpi__delta">à traiter</p>
          </div>

          <div class="distribution" *ngIf="stats()?.bySmiley?.length">
            <h3>Distribution satisfaction</h3>
            <div *ngFor="let s of stats()?.bySmiley" class="bar">
              <span class="bar__icon">{{ smileyIcon(s.value) }}</span>
              <div class="bar__track">
                <div class="bar__fill" [style.width.%]="s.percentage"></div>
              </div>
              <span class="bar__value">{{ s.percentage }}% ({{ s.count }})</span>
            </div>
          </div>
        </section>

        <section *ngIf="tab() === 'orders'" class="list">
          <h2>Toutes les commandes</h2>
          <table>
            <thead><tr><th>#</th><th>Chambre</th><th>Items</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>
              <tr *ngFor="let o of orders()">
                <td>#{{ o.id.slice(-4) }}</td>
                <td>{{ o.room }}</td>
                <td>{{ o.items.length }} items</td>
                <td>{{ o.total.toFixed(2) }} €</td>
                <td><span class="status status--{{ o.status }}">{{ o.status }}</span></td>
                <td>{{ formatDate(o.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section *ngIf="tab() === 'surveys'" class="list">
          <h2>Surveys</h2>
          <ul class="surveys">
            <li *ngFor="let s of surveys()">
              <div>
                <strong>{{ s.slug }}</strong>
                <p>{{ getTitle(s) }}</p>
              </div>
              <span>{{ s.questions.length }} questions</span>
            </li>
          </ul>
        </section>
      </main>
    </ng-container>

    <ng-template #loginTpl>
      <div class="login">
        <form (submit)="login(); $event.preventDefault()">
          <h2>Concierge · Admin</h2>
          <input type="email" [(ngModel)]="email" name="email" placeholder="admin@royal-lyon.fr" />
          <input type="password" [(ngModel)]="password" name="pwd" placeholder="Mot de passe" />
          <button type="submit">Se connecter</button>
          <p class="login__error" *ngIf="loginError()">{{ loginError() }}</p>
          <p class="login__hint">Démo : admin&#64;royal-lyon.fr / Demo2026!</p>
        </form>
      </div>
    </ng-template>
  `,
  styles: [`
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 12px 24px; background: var(--c-primary); color: white; }
    .topbar h1 { font-family: 'Playfair Display'; margin: 0; font-size: 22px; }
    .topbar nav { display: flex; gap: 8px; }
    .topbar nav button { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 16px; border-radius: 8px; }
    .topbar nav button.active { background: var(--c-accent); border-color: var(--c-accent); color: var(--c-primary); font-weight: 700; }
    .topbar .user { font-size: 14px; display: flex; align-items: center; gap: 12px; }
    .topbar .user button { background: rgba(0,0,0,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; }

    .main { padding: 24px; max-width: 1200px; margin: 0 auto; }

    .dash { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .kpi { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .kpi__label { color: #888; margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi__num { font-family: 'Playfair Display'; font-size: 56px; margin: 8px 0; color: var(--c-primary); font-weight: 700; }
    .kpi__delta { color: #888; margin: 0; font-size: 13px; }
    .distribution { grid-column: 1 / -1; background: white; padding: 24px; border-radius: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .distribution h3 { margin: 0 0 16px; font-family: 'Playfair Display'; }
    .bar { display: flex; align-items: center; gap: 16px; margin: 12px 0; }
    .bar__icon { font-size: 28px; }
    .bar__track { flex: 1; height: 24px; background: rgba(0,0,0,0.06); border-radius: 12px; overflow: hidden; }
    .bar__fill { height: 100%; background: linear-gradient(90deg, var(--c-primary), var(--c-accent)); }
    .bar__value { font-weight: 700; min-width: 100px; text-align: right; }

    .list { background: white; border-radius: 16px; padding: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px; border-bottom: 2px solid rgba(0,0,0,0.06); font-size: 13px; text-transform: uppercase; color: #888; }
    td { padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 14px; }
    .status { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
    .status--pending { background: #fef3c7; color: #92400e; }
    .status--accepted { background: #dbeafe; color: #1e40af; }
    .status--preparing { background: #e0e7ff; color: #4338ca; }
    .status--delivered { background: #d1fae5; color: #065f46; }
    .status--cancelled { background: #fee2e2; color: #991b1b; }

    .surveys { list-style: none; padding: 0; margin: 0; }
    .surveys li { display: flex; justify-content: space-between; padding: 16px; border-bottom: 1px solid rgba(0,0,0,0.06); }

    .login { display: flex; align-items: center; justify-content: center; height: 100vh; }
    .login form { background: white; padding: 32px; border-radius: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 320px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .login h2 { font-family: 'Playfair Display'; margin: 0 0 12px; }
    .login input { padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); }
    .login button { padding: 14px; background: var(--c-primary); color: white; border: none; border-radius: 8px; font-weight: 700; }
    .login__error { color: #c44b3f; margin: 0; font-size: 13px; }
    .login__hint { color: #888; font-size: 12px; margin: 0; }
  `],
})
export class AppComponent implements OnInit {
  email = 'admin@royal-lyon.fr';
  password = 'Demo2026!';
  loggedIn = signal(false);
  loginError = signal<string | null>(null);
  user = signal<any>(null);
  tab = signal<'dashboard' | 'orders' | 'surveys'>('dashboard');
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

  ordersToday = computed(() =>
    this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000).length,
  );
  revenueToday = computed(() =>
    this.orders()
      .filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000 && o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0),
  );
  ordersInProgress = computed(() =>
    this.orders().filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length,
  );
  averageScore = computed(() => this.stats()?.averageScore?.toFixed(1) ?? null);

  smileyIcon(v: number) {
    return ['😡', '😐', '🙂', '😍'][v - 1] ?? '·';
  }

  formatDate(iso: string) {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
  getTitle(s: Survey) {
    return (s.title as any).fr || Object.values(s.title)[0];
  }

  refresh() {
    this.loadOrders();
    this.loadSurveys();
  }

  login() {
    this.loginError.set(null);
    this.http.post<LoginResponse>(`${API}/auth/login`, {
      email: this.email,
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.token = res.accessToken;
        this.user.set(res.user);
        localStorage.setItem('admin_auth', JSON.stringify({ token: res.accessToken, user: res.user }));
        this.loggedIn.set(true);
        this.refresh();
      },
      error: () => this.loginError.set('Identifiants invalides'),
    });
  }

  logout() {
    localStorage.removeItem('admin_auth');
    this.loggedIn.set(false);
    this.user.set(null);
    this.orders.set([]);
  }

  loadOrders() {
    this.http
      .get<Order[]>(`${API}/orders`, { headers: { Authorization: `Bearer ${this.token}` } })
      .subscribe((d) => this.orders.set(d));
  }

  loadSurveys() {
    this.http
      .get<Survey[]>(`${API}/surveys`, { headers: { Authorization: `Bearer ${this.token}` } })
      .subscribe((d) => {
        this.surveys.set(d);
        if (d[0]) {
          this.http
            .get<SurveyStats>(`${API}/surveys/${d[0].id}/stats`, { headers: { Authorization: `Bearer ${this.token}` } })
            .subscribe((s) => this.stats.set(s));
        }
      });
  }
}
