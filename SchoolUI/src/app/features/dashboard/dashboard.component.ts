import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ClassApiService } from '../../core/services/class-api.service';
import { StudentApiService } from '../../core/services/student-api.service';
import { ProductApiService } from '../../core/services/product-api.service';
import { ScrollAnimateDirective } from '../../shared/directives/scroll-animate.directive';
import { forkJoin, of, timeout } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import * as L from 'leaflet';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface DashboardData {
  totalClasses: number;
  totalStudents: number;
  totalProducts: number;
  recentClasses: any[];
  recentStudents: any[];
  recentProducts: any[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollAnimateDirective],
  template: `
    <div class="mx-auto max-w-[1600px] space-y-6">
      <!-- Stats Cards -->
      <section scrollAnimate animateVariant="fade-up" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @for (stat of stats; track stat.label) {
          <article class="app-shell-panel p-5">
            <div class="text-[11px] font-semibold uppercase tracking-[0.45em] text-base-content/45">{{ stat.label }}</div>
            <div class="mt-2 flex items-end justify-between">
              @if (loading) {
                <span class="loading loading-dots loading-sm text-primary"></span>
              } @else {
                <div class="min-w-0 flex-1">
                  <div class="font-black tracking-tight text-base-content truncate" [class.text-4xl]="!stat.isUser" [class.text-2xl]="stat.isUser" [title]="stat.value">{{ stat.value }}</div>
                  <div class="mt-1 text-sm text-base-content/60 truncate" [title]="stat.description">{{ stat.description }}</div>
                </div>
              }
              <div class="rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 p-3 text-primary shrink-0">
                <span class="pi {{ stat.icon }} text-xl"></span>
              </div>
            </div>
          </article>
        }
      </section>

      <!-- Map and Pie Chart Section -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="150ms" class="grid gap-6 xl:grid-cols-2">
        <!-- Map Card -->
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5 h-full flex flex-col">
            <div>
              <h3 class="card-title text-xl">🗺️ Geographic Overview</h3>
              <p class="text-sm text-base-content/60">Your current location</p>
            </div>

            <div class="flex-1 min-h-[20rem] rounded-2xl overflow-hidden relative w-full bg-base-200">
              <div id="dashboard-map" class="w-full h-full absolute inset-0"></div>

              @if (mapLoading) {
                <div class="absolute inset-0 flex items-center justify-center bg-base-200 rounded-2xl">
                  <div class="text-center">
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                    <div class="mt-3 text-sm text-base-content/60">Loading map...</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </article>

        <!-- Pie Chart Card -->
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">📊 Data Distribution</h3>
              <p class="text-sm text-base-content/60">Classes, Students & Products</p>
            </div>

            <div class="flex-1 min-h-[20rem] flex items-center justify-center">
              <div class="w-full max-w-md">
                <canvas id="dashboard-pie-chart"></canvas>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Recent Data from API -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="100ms" class="grid gap-6 xl:grid-cols-3">
        <!-- Recent Classes -->
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="card-title text-xl">Recent Classes</h3>
                <p class="text-sm text-base-content/60">Latest from API</p>
              </div>
              <div class="badge badge-primary badge-outline">{{ dashboardData.recentClasses.length }}</div>
            </div>

            @if (loading) {
              <div class="flex h-32 items-center justify-center">
                <span class="loading loading-spinner loading-md text-primary"></span>
              </div>
            } @else {
              <div class="space-y-2">
                @for (cls of dashboardData.recentClasses; track cls.id) {
                  <div class="rounded-2xl bg-base-200 p-3">
                    <div class="font-medium text-base-content">{{ cls.className }}</div>
                    <div class="text-xs text-base-content/60">{{ cls.students?.length || 0 }} students</div>
                  </div>
                } @empty {
                  <div class="py-4 text-center text-sm text-base-content/50">No classes found</div>
                }
              </div>
            }

            <a routerLink="/classes" class="btn btn-ghost btn-sm justify-start">
              <span>View all classes</span>
              <span class="pi pi-arrow-right text-xs"></span>
            </a>
          </div>
        </article>

        <!-- Recent Students -->
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="card-title text-xl">Recent Students</h3>
                <p class="text-sm text-base-content/60">Latest from API</p>
              </div>
              <div class="badge badge-secondary badge-outline">{{ dashboardData.recentStudents.length }}</div>
            </div>

            @if (loading) {
              <div class="flex h-32 items-center justify-center">
                <span class="loading loading-spinner loading-md text-secondary"></span>
              </div>
            } @else {
              <div class="space-y-2">
                @for (student of dashboardData.recentStudents; track student.id) {
                  <div class="rounded-2xl bg-base-200 p-3">
                    <div class="font-medium text-base-content">{{ student.engFirstName }} {{ student.engLastName }}</div>
                    <div class="text-xs text-base-content/60">{{ student.gender }} • {{ student.khFirstName }} {{ student.khLastName }}</div>
                  </div>
                } @empty {
                  <div class="py-4 text-center text-sm text-base-content/50">No students found</div>
                }
              </div>
            }

            <a routerLink="/students" class="btn btn-ghost btn-sm justify-start">
              <span>View all students</span>
              <span class="pi pi-arrow-right text-xs"></span>
            </a>
          </div>
        </article>

        <!-- Recent Products -->
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="card-title text-xl">Recent Products</h3>
                <p class="text-sm text-base-content/60">Latest from API</p>
              </div>
              <div class="badge badge-accent badge-outline">{{ dashboardData.recentProducts.length }}</div>
            </div>

            @if (loading) {
              <div class="flex h-32 items-center justify-center">
                <span class="loading loading-spinner loading-md text-accent"></span>
              </div>
            } @else {
              <div class="space-y-2">
                @for (product of dashboardData.recentProducts; track product.id) {
                  <div class="rounded-2xl bg-base-200 p-3">
                    <div class="font-medium text-base-content">{{ product.name }}</div>
                    <div class="text-xs text-base-content/60">{{ product.categoryName || 'No category' }} • {{ product.price ? (product.price | number:'1.0-2') + ' USD' : 'No price' }}</div>
                  </div>
                } @empty {
                  <div class="py-4 text-center text-sm text-base-content/50">No products found</div>
                }
              </div>
            }

            <a routerLink="/products" class="btn btn-ghost btn-sm justify-start">
              <span>View all products</span>
              <span class="pi pi-arrow-right text-xs"></span>
            </a>
          </div>
        </article>
      </section>

      <!-- Quick Actions -->
      <section scrollAnimate animateVariant="fade-up" animateDelay="200ms">
        <article class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body gap-4 p-5">
            <div>
              <h3 class="card-title text-xl">Quick Actions</h3>
              <p class="text-sm text-base-content/60">Navigate to key features</p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <a routerLink="/classes" class="btn btn-ghost justify-start rounded-xl">
                <span class="pi pi-id-card text-primary text-lg"></span>
                <span class="flex-1 text-left">
                  <span class="block font-medium">Manage Classes</span>
                  <span class="block text-xs text-base-content/60">View and edit class records</span>
                </span>
              </a>
              <a routerLink="/students" class="btn btn-ghost justify-start rounded-xl">
                <span class="pi pi-user text-secondary text-lg"></span>
                <span class="flex-1 text-left">
                  <span class="block font-medium">Manage Students</span>
                  <span class="block text-xs text-base-content/60">Student enrollment and records</span>
                </span>
              </a>
              <a routerLink="/products" class="btn btn-ghost justify-start rounded-xl">
                <span class="pi pi-box text-accent text-lg"></span>
                <span class="flex-1 text-left">
                  <span class="block font-medium">Manage Products</span>
                  <span class="block text-xs text-base-content/60">Inventory and stock tracking</span>
                </span>
              </a>
              <a routerLink="/api-console" class="btn btn-ghost justify-start rounded-xl">
                <span class="pi pi-sliders-h text-warning text-lg"></span>
                <span class="flex-1 text-left">
                  <span class="block font-medium">API Console</span>
                  <span class="block text-xs text-base-content/60">Direct API interaction</span>
                </span>
              </a>
            </div>
          </div>
        </article>
      </section>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly classApi = inject(ClassApiService);
  private readonly studentApi = inject(StudentApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected loading = true;
  protected mapLoading = true;
  private map: L.Map | null = null;
  private pieChart: Chart | null = null;

  protected dashboardData: DashboardData = {
    totalClasses: 0,
    totalStudents: 0,
    totalProducts: 0,
    recentClasses: [],
    recentStudents: [],
    recentProducts: []
  };

  ngOnInit(): void {
    // Load data immediately
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.initPieChart();
  }

  ngOnDestroy(): void {
    if (this.map) {
      const observer = (this.map as any)._resizeObserver;
      if (observer) {
        observer.disconnect();
      }
      this.map.remove();
    }
    if (this.pieChart) {
      this.pieChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    console.log('Starting to load dashboard data...');

    // Fetch all data in parallel with error handling and timeout
    forkJoin({
      classes: this.classApi.list({ pageSize: 5, sortBy: 'ClassName', isAscending: true }).pipe(
        timeout(10000),
        catchError(err => {
          console.error('Failed to load classes:', err);
          return of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 5, totalPages: 0 });
        })
      ),
      students: this.studentApi.list({ pageSize: 5, sortBy: 'EngFirstName', isAscending: true }).pipe(
        timeout(10000),
        catchError(err => {
          console.error('Failed to load students:', err);
          return of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 5, totalPages: 0 });
        })
      ),
      products: this.productApi.list({ pageSize: 5, sortBy: 'Name', isAscending: true }).pipe(
        timeout(10000),
        catchError(err => {
          console.error('Failed to load products:', err);
          return of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 5, totalPages: 0 });
        })
      )
    }).pipe(
      // Force completion after 15 seconds max
      timeout(15000),
      finalize(() => {
        // Ensure loading is stopped after all operations complete
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (result) => {
        console.log('Dashboard data loaded successfully:', result);
        this.dashboardData = {
          totalClasses: result.classes.totalCount || 0,
          totalStudents: result.students.totalCount || 0,
          totalProducts: result.products.totalCount || 0,
          recentClasses: result.classes.items || [],
          recentStudents: result.students.items || [],
          recentProducts: result.products.items || []
        };
        console.log('Dashboard data:', this.dashboardData);

        // Update pie chart with real data
        this.updatePieChart();
      },
      error: (error) => {
        console.error('Failed to load dashboard data (error handler):', error);
        // Force stop loading even on error
        this.loading = false;
        this.dashboardData = {
          totalClasses: 0,
          totalStudents: 0,
          totalProducts: 0,
          recentClasses: [],
          recentStudents: [],
          recentProducts: []
        };
        console.log('Loading forced to false due to error');
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('Dashboard data loading completed');
        this.cdr.detectChanges();
      }
    });

    // Safety timeout: force loading to false after 20 seconds
    setTimeout(() => {
      if (this.loading) {
        console.warn('Force stopping loading after timeout');
        this.loading = false;
        this.cdr.detectChanges();
      }
    }, 20000);
  }

  protected get stats() {
    const fullName = this.auth.session()?.fullName || 'Guest';
    const displayName = fullName.length > 15 ? fullName.substring(0, 15) + '…' : fullName;
    
    return [
      { label: 'Total Classes', value: this.dashboardData.totalClasses.toString(), description: 'From API', icon: 'pi-id-card' },
      { label: 'Total Students', value: this.dashboardData.totalStudents.toString(), description: 'From API', icon: 'pi-users' },
      { label: 'Total Products', value: this.dashboardData.totalProducts.toString(), description: 'From API', icon: 'pi-box' },
      { label: 'Active User', value: displayName, description: 'Current session', icon: 'pi-user', isUser: true }
    ];
  }

  private initMap(): void {
    const mapElement = document.getElementById('dashboard-map');
    if (!mapElement) return;

    this.map = L.map('dashboard-map', {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    }).setView([11.5564, 104.9282], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      crossOrigin: true
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    });

    resizeObserver.observe(mapElement);
    (this.map as any)._resizeObserver = resizeObserver;

    // Hide loading after map loads
    setTimeout(() => {
      this.mapLoading = false;
    }, 1500);
  }

  private initPieChart(): void {
    const canvas = document.getElementById('dashboard-pie-chart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Classes', 'Students', 'Products'],
        datasets: [{
          data: [
            this.dashboardData.totalClasses || 10,
            this.dashboardData.totalStudents || 50,
            this.dashboardData.totalProducts || 30
          ],
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)'
          ],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 13,
                weight: 'bold' as const
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}`;
              }
            }
          }
        }
      }
    });
  }

  // Update pie chart when data loads
  private updatePieChart(): void {
    if (this.pieChart) {
      this.pieChart.data.datasets[0].data = [
        this.dashboardData.totalClasses,
        this.dashboardData.totalStudents,
        this.dashboardData.totalProducts
      ];
      this.pieChart.update();
    }
  }
}
