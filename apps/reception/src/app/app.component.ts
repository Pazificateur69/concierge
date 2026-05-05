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
    <div class="reception" *ngIf="loggedIn(); else loginTpl">
      <header class="reception__header">
        <div>
          <h1>Réception · {{ tenantName() }}</h1>
          <p class="status" [class.live]="connected()">
            <span></span> {{ connected() ? 'Connecté · temps réel' : 'Déconnecté' }}
          </p>
        </div>
        <div class="counters">
          <div *ngFor="let c of counters()" class="counter">
            <span class="counter__num">{{ c.count }}</span>
            <span class="counter__label">{{ c.label }}</span>
          </div>
        </div>
        <button class="btn btn--ghost" (click)="logout()">Déconnexion</button>
      </header>

      <div class="kanban">
        <div class="kanban__col" *ngFor="let col of columns">
          <div class="kanban__col-head">
            <h3>{{ col.label }}</h3>
            <span>{{ filteredOrders(col.status).length }}</span>
          </div>
          <div class="kanban__cards">
            <div
              *ngFor="let order of filteredOrders(col.status)"
              class="card"
              [class.urgent]="isUrgent(order)"
            >
              <div class="card__head">
                <strong>#{{ order.id.slice(-4) }}</strong>
                <span class="card__room">Ch. {{ order.room }}</span>
                <span class="card__time">{{ minutesAgo(order.createdAt) }}'</span>
              </div>
              <ul class="card__items">
                <li *ngFor="let it of order.items">
                  {{ it.quantity }}× {{ it.name }}
                </li>
              </ul>
              <div class="card__total">{{ order.total.toFixed(2) }} €</div>
              <div class="card__actions" *ngIf="col.next">
                <button class="btn" (click)="updateStatus(order, col.next)">{{ col.actionLabel }}</button>
                <button class="btn btn--ghost" (click)="updateStatus(order, 'cancelled')" *ngIf="col.status !== 'delivered'">
                  ✕
                </button>
              </div>
            </div>
            <div *ngIf="filteredOrders(col.status).length === 0" class="kanban__empty">
              Aucune commande
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loginTpl>
      <div class="login">
        <form (submit)="login(); $event.preventDefault()">
          <h2>Réception · Connexion</h2>
          <input type="email" [(ngModel)]="email" name="email" placeholder="staff@royal-lyon.fr" />
          <input type="password" [(ngModel)]="password" name="pwd" placeholder="Mot de passe" />
          <button type="submit">Se connecter</button>
          <p class="login__error" *ngIf="loginError()">{{ loginError() }}</p>
          <p class="login__hint">Compte démo : staff&#64;royal-lyon.fr / Demo2026!</p>
        </form>
      </div>
    </ng-template>
  `,
  styles: [`
    .reception { display: flex; flex-direction: column; height: 100vh; }
    .reception__header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: white; border-bottom: 1px solid rgba(0,0,0,0.08); gap: 24px; }
    .reception__header h1 { margin: 0; font-family: 'Playfair Display', serif; font-size: 22px; }
    .status { margin: 4px 0 0; font-size: 13px; color: #888; display: flex; align-items: center; gap: 8px; }
    .status span { width: 10px; height: 10px; border-radius: 50%; background: #ccc; }
    .status.live span { background: #2d7a4b; box-shadow: 0 0 0 4px rgba(45,122,75,0.2); }
    .counters { display: flex; gap: 16px; }
    .counter { background: var(--c-primary); color: white; padding: 8px 16px; border-radius: 12px; text-align: center; min-width: 80px; }
    .counter__num { display: block; font-size: 22px; font-weight: 700; }
    .counter__label { font-size: 11px; opacity: 0.8; }
    .btn { background: var(--c-primary); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; }
    .btn--ghost { background: transparent; color: var(--c-primary); border: 1px solid var(--c-primary); }

    .kanban { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 16px; overflow: auto; }
    .kanban__col { background: rgba(0,0,0,0.03); border-radius: 16px; padding: 12px; display: flex; flex-direction: column; }
    .kanban__col-head { display: flex; justify-content: space-between; padding: 4px 8px 12px; }
    .kanban__col-head h3 { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .kanban__col-head span { background: white; padding: 2px 10px; border-radius: 12px; font-weight: 700; }
    .kanban__cards { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .kanban__empty { color: #aaa; text-align: center; padding: 32px 8px; font-size: 13px; }

    .card { background: white; border-radius: 12px; padding: 12px 14px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .card.urgent { border-left: 4px solid #c44b3f; }
    .card__head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .card__room { font-size: 13px; color: var(--c-primary); font-weight: 700; }
    .card__time { font-size: 12px; color: #888; }
    .card__items { list-style: none; padding: 8px 0 0; margin: 0; font-size: 13px; }
    .card__items li { padding: 2px 0; }
    .card__total { padding-top: 8px; font-weight: 700; color: var(--c-primary); }
    .card__actions { display: flex; gap: 6px; margin-top: 10px; }
    .card__actions .btn { flex: 1; padding: 8px 10px; font-size: 13px; }

    .login { display: flex; align-items: center; justify-content: center; height: 100vh; }
    .login form { background: white; padding: 32px; border-radius: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 320px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .login h2 { margin: 0 0 12px; font-family: 'Playfair Display'; }
    .login input { padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15); font-size: 16px; }
    .login button { padding: 14px; background: var(--c-primary); color: white; border: none; border-radius: 8px; font-weight: 700; font-size: 16px; cursor: pointer; }
    .login__error { color: #c44b3f; margin: 0; font-size: 13px; }
    .login__hint { color: #888; font-size: 12px; margin: 0; }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  email = 'staff@royal-lyon.fr';
  password = 'Demo2026!';

  loggedIn = signal(false);
  loginError = signal<string | null>(null);
  tenantName = signal('');
  connected = signal(false);
  orders = signal<Order[]>([]);
  private socket: Socket | null = null;
  private token = '';

  columns: { label: string; status: OrderStatus; next?: OrderStatus; actionLabel?: string }[] = [
    { label: 'Reçues', status: 'pending', next: 'accepted', actionLabel: 'Accepter' },
    { label: 'Acceptées', status: 'accepted', next: 'preparing', actionLabel: 'Préparer' },
    { label: 'En préparation', status: 'preparing', next: 'delivered', actionLabel: 'Livrée' },
    { label: 'Livrées', status: 'delivered' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const data = JSON.parse(stored);
      this.token = data.token;
      this.tenantName.set(data.tenantName);
      this.loggedIn.set(true);
      this.connectSocket();
      this.loadOrders();
    }
  }

  ngOnDestroy() { this.socket?.disconnect(); }

  counters = computed(() =>
    this.columns.map((c) => ({
      label: c.label,
      count: this.orders().filter((o) => o.status === c.status).length,
    })),
  );

  filteredOrders(status: OrderStatus): Order[] {
    return this.orders()
      .filter((o) => o.status === status)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  isUrgent(o: Order): boolean {
    return this.minutesAgo(o.createdAt) > 15 && o.status !== 'delivered';
  }

  minutesAgo(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  }

  login() {
    this.loginError.set(null);
    this.http.post<LoginResponse>(`${API}/auth/login`, {
      email: this.email,
      password: this.password,
    }).subscribe({
      next: (res) => {
        this.token = res.accessToken;
        this.tenantName.set(res.user.firstName ?? 'Hotel');
        localStorage.setItem('auth', JSON.stringify({ token: res.accessToken, tenantName: res.user.firstName }));
        this.loggedIn.set(true);
        this.connectSocket();
        this.loadOrders();
      },
      error: () => this.loginError.set('Identifiants invalides'),
    });
  }

  logout() {
    localStorage.removeItem('auth');
    this.socket?.disconnect();
    this.loggedIn.set(false);
    this.orders.set([]);
  }

  private loadOrders() {
    this.http.get<Order[]>(`${API}/orders`, {
      headers: { Authorization: `Bearer ${this.token}` },
    }).subscribe((data) => this.orders.set(data));
  }

  private connectSocket() {
    const wsUrl = (window as any).__WS__ || API;
    this.socket = io(`${wsUrl}/concierge`, { auth: { token: this.token }, transports: ['websocket'] });
    this.socket.on('connect', () => this.connected.set(true));
    this.socket.on('disconnect', () => this.connected.set(false));
    this.socket.on('order:new', (o: Order) => {
      this.orders.update((list) => [o, ...list]);
      this.playSound();
    });
    this.socket.on('order:updated', (o: Order) => {
      this.orders.update((list) => list.map((x) => (x.id === o.id ? o : x)));
    });
  }

  updateStatus(order: Order, status: OrderStatus) {
    this.http.patch<Order>(`${API}/orders/${order.id}/status`, { status }, {
      headers: { Authorization: `Bearer ${this.token}` },
    }).subscribe();
  }

  private playSound() {
    try {
      const ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.1;
      o.start(); o.stop(ctx.currentTime + 0.18);
    } catch {}
  }
}
