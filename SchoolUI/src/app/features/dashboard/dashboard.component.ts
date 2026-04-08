import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective],
  template: `
    <div class="mx-auto max-w-[1600px] space-y-6">
      <section scrollAnimate animateVariant="fade-up" animateDelay="0ms" class="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <article class="relative overflow-hidden rounded-[30px] border border-primary/20 bg-gradient-to-br from-primary via-secondary to-accent text-primary-content shadow-2xl">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)]"></div>
          <div class="relative card-body gap-6 p-6 lg:p-8">
            <div class="flex flex-wrap items-center gap-2">
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content">Today</span>
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content/90">{{ auth.session()?.fullName || 'School user' }}</span>
              <span class="badge border-primary-content/20 bg-primary-content/10 text-primary-content/80">{{ auth.session()?.email || 'guest' }}</span>
            </div>

            <div class="max-w-3xl space-y-3">
              <p class="text-xs uppercase tracking-[0.45em] text-primary-content/75">Command center</p>
              <h2 class="text-4xl font-black tracking-tight sm:text-5xl">A cleaner, faster overview of school operations.</h2>
              <p class="max-w-2xl text-sm text-primary-content/80 sm:text-base">
                Track enrollment, inventory, reports, and live activity from one polished dashboard surface.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a routerLink="/reports" class="btn border-0 bg-white text-base-content shadow-lg hover:bg-white/95">Open reports</a>
              <a routerLink="/students" class="btn btn-ghost border border-primary-content/20 text-primary-content hover:bg-primary-content/10">View students</a>
            </div>
          </div>
        </article>

        <article class="app-shell-panel overflow-hidden">
          <div class="card-body gap-5 p-6 lg:p-8">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="card-title text-2xl">Live summary</h3>
                <p class="text-sm text-base-content/60">Quick signals for today’s session.</p>
              </div>
              <div class="badge badge-primary badge-outline">Synced</div>
            </div>

            <div class="space-y-3">
              <div class="rounded-3xl bg-base-200/80 p-4">
                <div class="text-xs uppercase tracking-[0.35em] text-base-content/50">Current user</div>
                <div class="mt-2 text-2xl font-extrabold text-base-content">{{ auth.session()?.fullName || 'Guest user' }}</div>
                <div class="mt-1 text-sm text-base-content/60">{{ auth.session()?.email || 'No session available' }}</div>
              </div>

              <div class="grid gap-3 sm:grid-cols-3">
                <div class="rounded-3xl bg-base-200/70 p-4">
                  <div class="text-xs uppercase tracking-[0.3em] text-base-content/50">Theme</div>
                  <div class="mt-2 text-lg font-bold">Night-ready</div>
                  <div class="text-xs text-base-content/60">Adaptive visuals</div>
                </div>
                <div class="rounded-3xl bg-base-200/70 p-4">
                  <div class="text-xs uppercase tracking-[0.3em] text-base-content/50">Reports</div>
                  <div class="mt-2 text-lg font-bold">18</div>
                  <div class="text-xs text-base-content/60">Ready to export</div>
                </div>
                <div class="rounded-3xl bg-base-200/70 p-4">
                  <div class="text-xs uppercase tracking-[0.3em] text-base-content/50">Status</div>
                  <div class="mt-2 text-lg font-bold text-success">Healthy</div>
                  <div class="text-xs text-base-content/60">All services stable</div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="80ms" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (item of metricCards; track $index) {
          <article class="app-shell-panel overflow-hidden">
            <div class="card-body gap-3 p-5">
              <div class="text-[11px] font-semibold uppercase tracking-[0.45em] text-base-content/45">{{ item.label }}</div>
              <div class="flex items-end justify-between gap-3">
                <div>
                  <div class="text-4xl font-black tracking-tight text-base-content">{{ item.value }}</div>
                  <div class="mt-1 text-sm text-success">{{ item.delta }}</div>
                </div>
                <div class="rounded-3xl bg-gradient-to-br from-primary/15 to-secondary/15 p-3 text-primary shadow-inner">
                  <span class="pi {{ item.icon }} text-xl"></span>
                </div>
              </div>
            </div>
          </article>
        }
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="140ms" class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-5 p-6">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h2 class="card-title text-2xl">Transactions</h2>
                <p class="text-sm text-base-content/60">Recent school and inventory activity.</p>
              </div>
              <div class="badge badge-primary badge-outline">Live</div>
            </div>

            <div class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of transactions; track $index) {
                    <tr>
                      <td>
                        <div class="font-medium text-base-content">{{ row.name }}</div>
                        <div class="text-xs text-base-content/60">{{ row.note }}</div>
                      </td>
                      <td>{{ row.date }}</td>
                      <td>
                        <span class="badge" [class.badge-success]="row.status === 'Completed'" [class.badge-warning]="row.status === 'Pending'" [class.badge-error]="row.status === 'Failed'">
                          {{ row.status }}
                        </span>
                      </td>
                      <td class="text-right font-semibold text-base-content">{{ row.amount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article class="card overflow-hidden border border-primary/20 bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl">
          <div class="card-body gap-5 p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="card-title text-2xl text-primary-content">21,500 USD</h2>
                <p class="text-primary-content/80">Revenue report</p>
              </div>
              <div class="badge border-primary-content/20 bg-primary-content/10 text-primary-content">This week</div>
            </div>

            <div class="flex h-64 items-end gap-2 pt-4">
              @for (bar of revenueBars; track $index) {
                <div class="flex-1 rounded-t-lg bg-primary-content/90 opacity-90" [style.height.%]="bar"></div>
              }
            </div>
          </div>
        </article>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="200ms" class="grid gap-6 md:grid-cols-3">
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Sources</h3>
              <p class="text-sm text-base-content/60">Traffic breakdown</p>
            </div>
            <div class="mx-auto flex h-40 w-40 items-center justify-center rounded-full"
                 [style.background]="sourcesGradient">
              <div class="flex h-24 w-24 items-center justify-center rounded-full bg-base-100 text-center text-sm font-semibold text-base-content shadow-md">
                100%
              </div>
            </div>
            <div class="grid gap-2 text-sm">
              @for (source of sources; track source.label) {
                <div class="flex items-center gap-3">
                  <span class="h-3 w-3 rounded-full" [style.background]="source.color"></span>
                  <span class="flex-1 text-base-content/70">{{ source.label }}</span>
                  <span class="font-semibold">{{ source.value }}%</span>
                </div>
              }
            </div>
          </div>
        </article>

        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Downloads</h3>
              <p class="text-sm text-base-content/60">Monthly file activity</p>
            </div>
            <div class="flex h-40 items-end gap-1 rounded-2xl bg-base-200 p-4">
              @for (point of downloads; track $index) {
                <div class="flex-1 rounded-t-lg bg-primary/70" [style.height.%]="point"></div>
              }
            </div>
            <div class="text-2xl font-bold">19,000</div>
            <div class="text-sm text-base-content/60">Downloads this month</div>
          </div>
        </article>

        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Unique visitors</h3>
              <p class="text-sm text-base-content/60">Platform visits</p>
            </div>
            <div class="flex h-40 items-end gap-1 rounded-2xl bg-base-200 p-4">
              @for (point of visitors; track $index) {
                <div class="flex-1 rounded-t-lg bg-secondary/70" [style.height.%]="point"></div>
              }
            </div>
            <div class="text-2xl font-bold">32,800</div>
            <div class="text-sm text-base-content/60">Unique visitors</div>
          </div>
        </article>
      </section>

      <section scrollAnimate animateVariant="fade-up" animateDelay="260ms" class="grid gap-6 xl:grid-cols-2">
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Map</h3>
              <p class="text-sm text-base-content/60">Geographic overview</p>
            </div>

            <div class="grid h-full min-h-[18rem] place-items-center rounded-3xl bg-base-200 p-6">
              <div class="text-center">
                <span class="pi pi-globe text-6xl text-base-content/30"></span>
                <div class="mt-4 text-sm text-base-content/60">Regional distribution placeholder</div>
              </div>
            </div>
          </div>
        </article>

        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Recent events</h3>
              <p class="text-sm text-base-content/60">Latest activity feed</p>
            </div>

            <ul class="space-y-3">
              @for (event of recentEvents; track event.title) {
                <li class="flex items-start gap-3 rounded-2xl bg-base-200 px-4 py-3">
                  <div class="avatar placeholder">
                    <div class="w-8 rounded-full bg-primary text-primary-content text-xs">{{ event.initial }}</div>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-semibold text-base-content">{{ event.title }}</div>
                    <div class="text-xs text-base-content/60">{{ event.subtitle }}</div>
                  </div>
                  <div class="text-[11px] text-base-content/50">{{ event.time }}</div>
                </li>
              }
            </ul>
          </div>
        </article>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Current user</h3>
              <p class="text-sm text-base-content/60">Session snapshot</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-2xl bg-base-200 p-4">
                <div class="text-xs uppercase tracking-[0.3em] text-base-content/60">Email</div>
                <div class="mt-2 font-medium">{{ auth.session()?.email || 'Not signed in' }}</div>
              </div>
              <div class="rounded-2xl bg-base-200 p-4">
                <div class="text-xs uppercase tracking-[0.3em] text-base-content/60">Name</div>
                <div class="mt-2 font-medium">{{ auth.session()?.fullName || '-' }}</div>
              </div>
              <div class="rounded-2xl bg-base-200 p-4">
                <div class="text-xs uppercase tracking-[0.3em] text-base-content/60">Expiry</div>
                <div class="mt-2 font-medium">{{ auth.session()?.expiresAt || '-' }}</div>
              </div>
            </div>
          </div>
        </article>

        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="card-title text-xl">Monthly reports</h3>
                <p class="text-sm text-base-content/60">PDF / Excel / queue</p>
              </div>
              <div class="badge badge-primary badge-outline">API</div>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <a class="btn btn-primary btn-sm" routerLink="/reports">PDF</a>
              <a class="btn btn-outline btn-sm" routerLink="/reports">Excel</a>
              <a class="btn btn-ghost btn-sm" routerLink="/reports">Queue job</a>
            </div>
          </div>
        </article>
      </section>
    </div>
  `
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);

  protected readonly metricCards = [
    { label: 'Active students', value: '1,284', delta: '+8.4% from last week', icon: 'pi-users' },
    { label: 'Open classes', value: '42', delta: '6 awaiting updates', icon: 'pi-id-card' },
    { label: 'Inventory items', value: '3,920', delta: '+124 items added', icon: 'pi-box' },
    { label: 'Reports ready', value: '18', delta: '3 exported today', icon: 'pi-chart-bar' }
  ];

  protected readonly transactions = [
    { name: 'Cy Ganderton', note: 'Feb 2nd', date: 'Feb 2nd', status: 'Completed', amount: '180 USD' },
    { name: 'Hart Hagerty', note: 'Sep 2nd', date: 'Sep 2nd', status: 'Pending', amount: '250 USD' },
    { name: 'Jim Hagerty', note: 'Sep 2nd', date: 'Sep 2nd', status: 'Pending', amount: '250 USD' },
    { name: 'Hart Hagerty', note: 'Sep 2nd', date: 'Sep 2nd', status: 'Failed', amount: '250 USD' },
    { name: 'Bryce Swag', note: 'Jul 2nd', date: 'Jul 2nd', status: 'Completed', amount: '300 USD' }
  ];

  protected readonly revenueBars = [
    18, 34, 29, 42, 58, 44, 33, 38, 61, 74, 66, 81, 55, 49, 72, 63, 48, 57, 69, 77
  ];

  protected readonly sources = [
    { label: 'Direct', value: 45, color: '#4f46e5' },
    { label: 'Social', value: 25, color: '#8b5cf6' },
    { label: 'Search', value: 18, color: '#22c55e' },
    { label: 'Email', value: 12, color: '#f59e0b' }
  ];

  protected readonly downloads = [14, 32, 28, 54, 48, 61, 36, 58, 67, 55, 71, 64, 80, 59, 72, 68, 77, 85];
  protected readonly visitors = [22, 30, 27, 36, 42, 33, 48, 40, 54, 45, 61, 57, 64, 52, 70, 58, 66, 74];

  protected readonly recentEvents = [
    { initial: 'N', title: 'New user added', subtitle: 'You added a new school admin', time: '2m ago' },
    { initial: 'T', title: 'Teacher updated', subtitle: 'Profile information edited', time: '15m ago' },
    { initial: 'P', title: 'Product added', subtitle: 'Inventory updated successfully', time: '1h ago' },
    { initial: 'R', title: 'Report queued', subtitle: 'Monthly exports started', time: '3h ago' }
  ];

  protected get sourcesGradient(): string {
    const total = this.sources.reduce((sum, item) => sum + item.value, 0);
    let cursor = 0;
    const stops = this.sources.map((item) => {
      const start = cursor;
      cursor += (item.value / total) * 100;
      return `${item.color} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  }
}
