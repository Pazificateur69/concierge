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
      <header class="topbar">
        <div class="topbar__left">
          <div class="brand">
            <div class="brand__mark">C</div>
            <div class="brand__text">
              <span class="eyebrow">Réception</span>
              <span class="brand__name serif">{{ tenantName() || 'Royal Lyon' }}</span>
            </div>
          </div>
          <div class="status" [class.live]="connected()">
            <span class="status__dot"></span>
            <span class="status__text">{{ connected() ? 'Temps réel' : 'Reconnexion…' }}</span>
            <span class="status__time">{{ liveTime() }}</span>
          </div>
        </div>

        <div class="kpis">
          <div class="kpi" *ngFor="let c of counters()">
            <span class="eyebrow">{{ c.label }}</span>
            <span class="kpi__num serif">{{ c.count }}</span>
          </div>
          <div class="kpi kpi--accent">
            <span class="eyebrow">CA jour</span>
            <span class="kpi__num serif">{{ todayRevenue().toFixed(0) }}<span class="kpi__currency">€</span></span>
          </div>
        </div>

        <div class="topbar__right">
          <input type="search" [(ngModel)]="searchQuery" placeholder="Rechercher…" class="search" (input)="searchSig.set(searchQuery)" />
          <button class="topbar-btn" (click)="soundEnabled.set(!soundEnabled())" [class.active]="soundEnabled()" aria-label="Son">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <div class="user-chip">
            <div class="avatar">{{ userInitial() }}</div>
            <span>{{ user()?.firstName }}</span>
          </div>
          <button class="topbar-btn" (click)="logout()" aria-label="Déconnexion">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5z"/>
              <path d="M4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="kanban">
        <section
          class="col"
          *ngFor="let col of columns"
          [attr.data-status]="col.status"
          (dragover)="onDragOver($event)"
          (drop)="onDrop($event, col.status)"
        >
          <header class="col__head">
            <div class="col__title">
              <span class="eyebrow">{{ col.label }}</span>
              <span class="col__count serif">{{ filteredOrders(col.status).length }}</span>
            </div>
          </header>

          <div class="col__cards">
            <article
              *ngFor="let order of filteredOrders(col.status); trackBy: trackOrder"
              class="card"
              [class.card--new]="newOrderIds().has(order.id)"
              [class.card--urgent]="isUrgent(order)"
              draggable="true"
              (dragstart)="onDragStart($event, order)"
              (dragend)="onDragEnd($event)"
              (click)="openDetail(order)"
            >
              <header class="card__head">
                <span class="card__id mono">{{ order.id.slice(-6).toUpperCase() }}</span>
                <span class="card__time" [class.late]="isUrgent(order)">{{ minutesAgo(order.createdAt) }} min</span>
              </header>

              <div class="card__room">
                <span class="card__room-label eyebrow">Chambre</span>
                <span class="card__room-num serif">{{ order.room }}</span>
                <span *ngIf="order.guestName" class="card__guest">{{ order.guestName }}</span>
              </div>

              <ul class="card__items">
                <li *ngFor="let it of order.items.slice(0, 3)">
                  <span class="card__item-qty">{{ it.quantity }}</span>
                  <span class="card__item-name">{{ it.name }}</span>
                </li>
                <li *ngIf="order.items.length > 3" class="card__more">+ {{ order.items.length - 3 }} autres</li>
              </ul>

              <footer class="card__foot">
                <span class="card__total serif">{{ order.total.toFixed(2) }} €</span>
                <span class="card__source eyebrow">{{ sourceLabel(order.source) }}</span>
              </footer>

              <div class="card__actions" *ngIf="col.next" (click)="$event.stopPropagation()">
                <button class="action action--primary" (click)="updateStatus(order, col.next)">{{ col.actionLabel }}</button>
                <button class="action action--ghost" (click)="updateStatus(order, 'cancelled')" *ngIf="col.status !== 'delivered'" aria-label="Annuler">×</button>
              </div>
            </article>

            <div *ngIf="filteredOrders(col.status).length === 0" class="col__empty">
              <span class="eyebrow">{{ col.empty }}</span>
            </div>
          </div>
        </section>
      </main>

      <!-- Order detail panel -->
      <aside class="detail" [class.open]="!!detailOrder()" *ngIf="detailOrder() as o">
        <header class="detail__head">
          <div>
            <span class="eyebrow">Commande</span>
            <h2 class="serif">#{{ o.id.slice(-6).toUpperCase() }}</h2>
          </div>
          <button class="detail__close" (click)="detailOrder.set(null)" aria-label="Fermer">×</button>
        </header>

        <div class="detail__body">
          <div class="detail__row">
            <span class="eyebrow">Statut</span>
            <span class="tag tag--{{ o.status }}">{{ statusLabel(o.status) }}</span>
          </div>
          <div class="detail__row">
            <span class="eyebrow">Chambre</span>
            <span class="serif detail__room">{{ o.room }}</span>
          </div>
          <div class="detail__row" *ngIf="o.guestName">
            <span class="eyebrow">Client</span>
            <span>{{ o.guestName }}</span>
          </div>
          <div class="detail__row">
            <span class="eyebrow">Source</span>
            <span>{{ sourceLabel(o.source) }}</span>
          </div>
          <div class="detail__row">
            <span class="eyebrow">Reçue il y a</span>
            <span class="mono">{{ minutesAgo(o.createdAt) }} minutes</span>
          </div>

          <hr class="rule" />

          <span class="eyebrow">Articles ({{ o.items.length }})</span>
          <ul class="detail__items">
            <li *ngFor="let it of o.items">
              <span class="detail__item-qty serif">{{ it.quantity }}×</span>
              <div class="detail__item-body">
                <span>{{ it.name }}</span>
                <span class="detail__item-options" *ngIf="it.options?.length">{{ it.options?.join(' · ') }}</span>
                <span class="detail__item-notes" *ngIf="it.notes">« {{ it.notes }} »</span>
              </div>
              <span class="detail__item-price serif">{{ (it.unitPrice * it.quantity).toFixed(2) }} €</span>
            </li>
          </ul>

          <hr class="rule" />

          <div class="detail__total">
            <span class="eyebrow">Total</span>
            <span class="serif detail__total-amount">{{ o.total.toFixed(2) }} €</span>
          </div>

          <hr class="rule" />

          <span class="eyebrow">Historique</span>
          <ol class="timeline">
            <li *ngFor="let s of o.statusHistory">
              <span class="timeline__dot"></span>
              <div>
                <span class="timeline__status">{{ statusLabel(s.status) }}</span>
                <span class="timeline__time mono">{{ formatDateTime(s.at) }}</span>
              </div>
            </li>
          </ol>
        </div>

        <footer class="detail__foot" *ngIf="nextStatus(o.status) as next">
          <button class="action action--primary action--big" (click)="updateStatus(o, next); detailOrder.set(null)">
            Faire passer en {{ statusLabel(next) }} →
          </button>
        </footer>
      </aside>
      <div class="detail-overlay" *ngIf="!!detailOrder()" (click)="detailOrder.set(null)"></div>
    </div>

    <ng-template #loginTpl>
      <div class="login-page">
        <div class="login-card">
          <div class="login-brand">
            <div class="brand__mark brand__mark--big">C</div>
            <span class="eyebrow">Réception</span>
            <h1 class="serif">Concierge</h1>
            <p>Tableau de bord temps réel</p>
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
            <button type="submit">Connexion</button>
            <p class="login-error" *ngIf="loginError()">{{ loginError() }}</p>
          </form>
          <hr class="rule" />
          <div class="login-hint">
            <span class="eyebrow">Compte de démonstration</span>
            <code>staff&#64;royal-lyon.fr</code>
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
      --c-success: #36644a;
      --c-warning: #95701a;
      --c-danger: #913528;
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      font-feature-settings: 'ss01';
      color: var(--c-text);
    }
    .serif { font-family: 'Cormorant Garamond', serif; font-weight: 500; }
    .mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.06em; }
    .eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--c-accent-deep); }
    .rule { border: 0; height: 1px; background: var(--c-border); margin: 16px 0; }

    .reception { display: flex; flex-direction: column; height: 100vh; background: var(--c-bg); overflow: hidden; }

    /* TOPBAR */
    .topbar { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 32px; padding: 16px 24px; background: var(--c-bg-card); border-bottom: 1px solid var(--c-border); }
    .topbar__left { display: flex; align-items: center; gap: 24px; }

    .brand { display: flex; align-items: center; gap: 12px; }
    .brand__mark { width: 44px; height: 44px; background: var(--c-ink); color: var(--c-paper); display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; }
    .brand__mark--big { width: 64px; height: 64px; font-size: 32px; }
    .brand__text { display: flex; flex-direction: column; line-height: 1.1; }
    .brand__name { font-size: 19px; color: var(--c-ink); margin-top: 2px; }

    .status { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border: 1px solid var(--c-border-strong); }
    .status__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-warning); }
    .status.live .status__dot { background: var(--c-success); animation: dot-pulse 2s ease-in-out infinite; }
    .status__text { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-text-muted); }
    .status__time { font-family: 'Cormorant Garamond', serif; font-size: 14px; color: var(--c-ink); border-left: 1px solid var(--c-border); padding-left: 8px; font-feature-settings: 'tnum'; }
    @keyframes dot-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--c-success); } 50% { box-shadow: 0 0 0 4px transparent; } }

    .kpis { display: flex; gap: 0; justify-content: center; border: 1px solid var(--c-border); }
    .kpi { padding: 6px 16px; border-right: 1px solid var(--c-border); display: flex; flex-direction: column; gap: 2px; min-width: 90px; align-items: center; }
    .kpi:last-child { border-right: none; }
    .kpi--accent { background: var(--c-ink); color: var(--c-paper); }
    .kpi--accent .eyebrow { color: #d6bd87; }
    .kpi__num { font-size: 22px; line-height: 1; font-weight: 500; color: var(--c-ink); font-feature-settings: 'tnum'; letter-spacing: -0.02em; }
    .kpi--accent .kpi__num { color: white; }
    .kpi__currency { font-family: 'Cormorant Garamond', serif; font-size: 14px; opacity: 0.6; margin-left: 2px; }

    .topbar__right { display: flex; align-items: center; gap: 8px; }
    .search { padding: 6px 12px; min-width: 200px; background: var(--c-paper); border: 1px solid var(--c-border-strong); font-size: 13px; color: var(--c-ink); font-family: inherit; transition: all 0.2s; }
    .search:focus { outline: none; border-color: var(--c-ink); background: var(--c-bg-card); min-width: 280px; }
    .search::placeholder { color: var(--c-text-soft); }

    .topbar-btn { width: 36px; height: 36px; background: var(--c-bg-card); border: 1px solid var(--c-border-strong); color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; transition: all 0.2s; }
    .topbar-btn:hover { background: var(--c-paper); }
    .topbar-btn.active { background: var(--c-accent); border-color: var(--c-accent); color: white; }

    .user-chip { display: flex; align-items: center; gap: 8px; padding: 4px 12px 4px 4px; background: var(--c-paper); font-size: 13px; font-weight: 500; }
    .avatar { width: 28px; height: 28px; background: var(--c-ink); color: white; display: grid; place-items: center; font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600; }

    /* KANBAN */
    .kanban { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--c-border); padding: 1px; overflow: hidden; }
    .col { background: var(--c-bg); display: flex; flex-direction: column; min-height: 0; }
    .col[data-status="pending"] .col__head { background: rgba(149,112,26,0.05); }
    .col__head { padding: 16px 20px; border-bottom: 1px solid var(--c-border); }
    .col__title { display: flex; justify-content: space-between; align-items: baseline; }
    .col__count { font-size: 26px; font-weight: 500; line-height: 1; color: var(--c-ink); font-feature-settings: 'tnum'; }
    .col__cards { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding: 12px; }
    .col__empty { display: grid; place-items: center; padding: 48px 16px; opacity: 0.5; }

    /* CARD */
    .card { background: var(--c-bg-card); border: 1px solid var(--c-border); padding: 14px 16px; transition: all 0.25s cubic-bezier(0.4,0,0.2,1); cursor: grab; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 10px; }
    .card:active { cursor: grabbing; }
    .card:hover { border-color: var(--c-ink); box-shadow: 0 4px 12px rgba(20,32,46,0.06); transform: translateY(-1px); }
    .card--new { animation: cardEnter 0.5s cubic-bezier(0.32,0.72,0,1), cardGlow 2.5s ease-out; }
    .card--urgent { border-left: 3px solid var(--c-danger); padding-left: 13px; }
    @keyframes cardEnter { from { opacity: 0; transform: translateY(-12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes cardGlow { 0% { box-shadow: 0 0 0 0 rgba(184,152,90,0.5); } 100% { box-shadow: 0 0 0 6px rgba(184,152,90,0); } }

    .card__head { display: flex; justify-content: space-between; align-items: center; }
    .card__id { color: var(--c-text-soft); font-weight: 500; }
    .card__time { font-size: 11px; color: var(--c-text-muted); padding: 2px 8px; background: var(--c-paper); font-feature-settings: 'tnum'; letter-spacing: 0.04em; transition: all 0.3s; }
    .card__time.late { background: rgba(145,53,40,0.10); color: var(--c-danger); font-weight: 600; }

    .card__room { display: flex; flex-direction: column; gap: 0; padding: 4px 0; border-bottom: 1px solid var(--c-border); }
    .card__room-label { font-size: 9px; }
    .card__room-num { font-size: 24px; font-weight: 500; color: var(--c-ink); line-height: 1.1; letter-spacing: -0.01em; font-feature-settings: 'tnum'; }
    .card__guest { font-size: 11px; color: var(--c-text-muted); }

    .card__items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
    .card__items li { display: grid; grid-template-columns: 24px 1fr; gap: 8px; font-size: 13px; line-height: 1.35; }
    .card__item-qty { color: var(--c-accent-deep); font-weight: 700; font-feature-settings: 'tnum'; text-align: right; }
    .card__item-name { color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card__more { font-size: 11px; color: var(--c-text-soft); font-style: italic; padding-left: 32px; }

    .card__foot { display: flex; justify-content: space-between; align-items: baseline; padding-top: 8px; border-top: 1px solid var(--c-border); }
    .card__total { font-size: 18px; color: var(--c-ink); letter-spacing: -0.01em; font-feature-settings: 'tnum'; }
    .card__source { color: var(--c-text-soft); font-size: 9px; }

    .card__actions { display: flex; gap: 4px; padding-top: 4px; }
    .action { padding: 8px 12px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; color: var(--c-ink); }
    .action--primary { flex: 1; background: var(--c-ink); color: white; border-color: var(--c-ink); }
    .action--primary:hover { background: var(--c-accent); border-color: var(--c-accent); }
    .action--ghost { width: 32px; padding: 8px 0; }
    .action--ghost:hover { background: var(--c-danger); color: white; border-color: var(--c-danger); }
    .action--big { width: 100%; padding: 16px; font-size: 12px; letter-spacing: 0.16em; }

    /* DETAIL PANEL */
    .detail-overlay { position: fixed; inset: 0; background: rgba(20,32,46,0.4); backdrop-filter: blur(4px); z-index: 50; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .detail {
      position: fixed; right: 0; top: 0; bottom: 0;
      width: 480px; max-width: 90vw;
      background: var(--c-bg-card); border-left: 1px solid var(--c-border);
      display: flex; flex-direction: column;
      z-index: 51;
      transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.32,0.72,0,1);
      box-shadow: -32px 0 64px rgba(20,32,46,0.18);
    }
    .detail.open { transform: translateX(0); }

    .detail__head { padding: 24px; border-bottom: 1px solid var(--c-border); display: flex; justify-content: space-between; align-items: flex-start; }
    .detail__head h2 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; margin: 4px 0 0; color: var(--c-ink); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }
    .detail__close { width: 36px; height: 36px; background: var(--c-paper); border: none; font-size: 24px; color: var(--c-text-muted); cursor: pointer; display: grid; place-items: center; line-height: 1; }
    .detail__close:hover { background: var(--c-ink); color: white; }

    .detail__body { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 8px; }
    .detail__row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--c-border); }
    .detail__row:last-child { border-bottom: none; }
    .detail__row > span:last-child { font-size: 14px; color: var(--c-ink); }
    .detail__room { font-size: 22px; font-weight: 500; }

    .detail__items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
    .detail__items li { display: grid; grid-template-columns: 32px 1fr auto; gap: 12px; padding: 8px 0; }
    .detail__item-qty { color: var(--c-accent-deep); font-weight: 600; font-feature-settings: 'tnum'; }
    .detail__item-body { display: flex; flex-direction: column; gap: 4px; }
    .detail__item-body > span:first-child { font-size: 14px; color: var(--c-ink); font-weight: 500; }
    .detail__item-options { font-size: 11px; color: var(--c-text-muted); letter-spacing: 0.04em; }
    .detail__item-notes { font-size: 12px; color: var(--c-text-muted); font-style: italic; }
    .detail__item-price { font-size: 15px; color: var(--c-ink); font-feature-settings: 'tnum'; }

    .detail__total { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0; }
    .detail__total-amount { font-size: 32px; color: var(--c-ink); letter-spacing: -0.02em; font-feature-settings: 'tnum'; }

    .timeline { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; position: relative; }
    .timeline::before { content: ''; position: absolute; left: 5px; top: 8px; bottom: 8px; width: 1px; background: var(--c-border-strong); }
    .timeline li { display: grid; grid-template-columns: 16px 1fr; gap: 12px; align-items: center; }
    .timeline__dot { width: 11px; height: 11px; background: var(--c-accent); border: 2px solid var(--c-bg-card); border-radius: 50%; z-index: 1; box-shadow: 0 0 0 1px var(--c-border-strong); }
    .timeline li > div { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 6px 0; }
    .timeline__status { font-size: 13px; color: var(--c-ink); font-weight: 500; }
    .timeline__time { color: var(--c-text-muted); }

    .detail__foot { padding: 16px 24px; border-top: 1px solid var(--c-border); }

    .tag { display: inline-block; padding: 2px 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; border: 1px solid currentColor; }
    .tag--pending { color: var(--c-warning); }
    .tag--accepted { color: #1e40af; }
    .tag--preparing { color: #4338ca; }
    .tag--delivered { color: var(--c-success); }
    .tag--cancelled { color: var(--c-danger); }

    /* LOGIN */
    .login-page { min-height: 100vh; display: grid; grid-template-columns: 480px 1fr; }
    .login-card { padding: 64px 56px; display: flex; flex-direction: column; justify-content: center; background: var(--c-bg-card); }
    .login-brand { text-align: center; margin-bottom: 48px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .login-brand h1 { font-size: 40px; margin: 4px 0 6px; color: var(--c-ink); font-weight: 500; line-height: 1; }
    .login-brand p { color: var(--c-text-muted); margin: 0; font-size: 14px; }
    .login-form { display: flex; flex-direction: column; gap: 20px; }
    .login-form label { display: flex; flex-direction: column; gap: 6px; }
    .login-form input { padding: 14px 16px; font-size: 15px; border: 1px solid var(--c-border-strong); background: var(--c-bg-card); transition: border-color 0.2s; font-family: inherit; }
    .login-form input:focus { outline: none; border-color: var(--c-ink); }
    .login-form button { padding: 16px; background: var(--c-ink); color: white; border: none; font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; margin-top: 8px; cursor: pointer; transition: background 0.2s; }
    .login-form button:hover { background: var(--c-accent); }
    .login-error { color: var(--c-danger); font-size: 13px; margin: 0; padding: 8px 12px; background: rgba(145,53,40,0.08); }
    .login-hint { padding: 16px; background: var(--c-paper); display: flex; flex-direction: column; gap: 8px; align-items: center; font-size: 12px; }
    .login-hint code { font-family: 'JetBrains Mono', monospace; background: var(--c-bg-card); padding: 4px 10px; font-size: 12px; color: var(--c-ink); }

    .login-bg { background-image: url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&q=85'); background-size: cover; background-position: center; position: relative; }
    .login-bg::after { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(20,32,46,0.4) 0%, rgba(20,32,46,0.85) 100%); }

    @media (max-width: 1300px) { .kanban { grid-template-columns: repeat(2, 1fr); } .kpis { display: none; } .search { display: none; } }
    @media (max-width: 800px) { .login-page { grid-template-columns: 1fr; } .login-bg { display: none; } .detail { width: 100%; } }
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
  liveTime = signal('');
  tickSig = signal(Date.now()); // updated every second to refresh "X min ago"
  searchQuery = '';
  searchSig = signal('');
  detailOrder = signal<Order | null>(null);

  private socket: Socket | null = null;
  private token = '';
  private clockInterval: any;
  private tickInterval: any;
  private draggedOrder: Order | null = null;

  columns: { label: string; status: OrderStatus; next?: OrderStatus; actionLabel?: string; empty: string }[] = [
    { label: 'Reçues', status: 'pending', next: 'accepted', actionLabel: 'Accepter', empty: 'Pas de demande' },
    { label: 'Acceptées', status: 'accepted', next: 'preparing', actionLabel: 'Préparer', empty: 'Aucune en attente' },
    { label: 'En préparation', status: 'preparing', next: 'delivered', actionLabel: 'Livrer', empty: 'Cuisine au calme' },
    { label: 'Livrées', status: 'delivered', empty: 'Pas de livraison' },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    try {
      const stored = localStorage.getItem('reception_auth');
      if (stored) {
        const data = JSON.parse(stored);
        if (data?.token && data?.user) {
          this.token = data.token;
          this.user.set(data.user);
          this.tenantName.set(data.tenantName ?? '');
          this.loggedIn.set(true);
          this.connectSocket();
          this.loadOrders();
        } else {
          localStorage.removeItem('reception_auth');
        }
      }
    } catch {
      localStorage.removeItem('reception_auth');
    }
    this.tickClock();
    this.clockInterval = setInterval(() => this.tickClock(), 30000);
    this.tickInterval = setInterval(() => this.tickSig.set(Date.now()), 1000);
  }

  ngOnDestroy() {
    this.socket?.disconnect();
    clearInterval(this.clockInterval);
    clearInterval(this.tickInterval);
  }

  tickClock() {
    this.liveTime.set(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  }

  counters = computed(() => this.columns.map((c) => ({ label: c.label, count: this.orders().filter((o) => o.status === c.status).length })));
  todayRevenue = computed(() =>
    this.orders().filter((o) => Date.now() - new Date(o.createdAt).getTime() < 86400000 && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
  );
  userInitial = computed(() => (this.user()?.firstName?.charAt(0) || 'U').toUpperCase());

  filteredOrders(status: OrderStatus): Order[] {
    const q = this.searchSig().trim().toLowerCase();
    return this.orders()
      .filter((o) => o.status === status)
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
  }

  trackOrder = (_: number, o: Order) => o.id;

  isUrgent(o: Order): boolean {
    return this.minutesAgo(o.createdAt) > 15 && o.status !== 'delivered' && o.status !== 'cancelled';
  }
  minutesAgo(iso: string): number {
    this.tickSig(); // subscribe so it re-evaluates each tick
    return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  }
  sourceLabel(s: string): string {
    return ({ kiosk: 'Borne', tablet: 'Tablette', reception: 'Réception' } as Record<string, string>)[s] || s;
  }
  statusLabel(s: string): string {
    return ({ pending: 'Reçue', accepted: 'Acceptée', preparing: 'En préparation', delivered: 'Livrée', cancelled: 'Annulée' } as Record<string, string>)[s] || s;
  }
  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  }

  nextStatus(s: OrderStatus): OrderStatus | null {
    const order: Record<OrderStatus, OrderStatus | null> = { pending: 'accepted', accepted: 'preparing', preparing: 'delivered', delivered: null, cancelled: null };
    return order[s];
  }

  openDetail(order: Order) {
    this.detailOrder.set(order);
  }

  // Drag and drop
  onDragStart(e: DragEvent, order: Order) {
    this.draggedOrder = order;
    e.dataTransfer?.setData('text/plain', order.id);
    if (e.target instanceof HTMLElement) e.target.style.opacity = '0.4';
  }
  onDragEnd(e: DragEvent) {
    if (e.target instanceof HTMLElement) e.target.style.opacity = '';
  }
  onDragOver(e: DragEvent) { e.preventDefault(); }
  onDrop(e: DragEvent, status: OrderStatus) {
    e.preventDefault();
    if (!this.draggedOrder) return;
    const valid: Record<OrderStatus, OrderStatus[]> = {
      pending: ['accepted', 'cancelled'], accepted: ['preparing', 'cancelled'],
      preparing: ['delivered', 'cancelled'], delivered: [], cancelled: [],
    };
    if (valid[this.draggedOrder.status]?.includes(status)) {
      this.updateStatus(this.draggedOrder, status);
    }
    this.draggedOrder = null;
  }

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
      error: () => this.loginError.set('Identifiants invalides.'),
    });
  }

  logout() {
    localStorage.removeItem('reception_auth');
    this.socket?.disconnect();
    this.loggedIn.set(false); this.user.set(null); this.orders.set([]);
  }

  private loadOrders() {
    this.http.get<Order[]>(`${API}/orders`, { headers: { Authorization: `Bearer ${this.token}` } }).subscribe((data) => this.orders.set(data));
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
    this.socket.on('order:updated', (o: Order) => {
      this.orders.update((list) => list.map((x) => (x.id === o.id ? o : x)));
      // Update detail panel if showing this order
      if (this.detailOrder()?.id === o.id) this.detailOrder.set(o);
    });
  }

  private markNew(id: string) {
    this.newOrderIds.update((set) => new Set([...set, id]));
    setTimeout(() => this.newOrderIds.update((set) => { const ns = new Set(set); ns.delete(id); return ns; }), 2500);
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
      o.frequency.setValueAtTime(660, ctx.currentTime);
      o.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}
