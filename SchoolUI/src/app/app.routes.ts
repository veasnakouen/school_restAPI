import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/login.component').then((m) => m.LoginComponent)
	},
	{
		path: '',
		canActivate: [authGuard],
		loadComponent: () =>
			import('./layout/app-shell.component').then((m) => m.AppShellComponent),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'dashboard'
			},
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
			},
			{
				path: 'classes',
				loadComponent: () =>
					import('./features/classes/classes.component').then((m) => m.ClassesComponent)
			},
			{
				path: 'students',
				loadComponent: () =>
					import('./features/students/students.component').then((m) => m.StudentsComponent)
			},
			{
				path: 'products',
				loadComponent: () =>
					import('./features/products/products.component').then((m) => m.ProductsComponent)
			},
			{
				path: 'reports',
				loadComponent: () =>
					import('./features/reports/reports.component').then((m) => m.ReportsComponent)
			}
		]
	},
	{ path: '**', redirectTo: '' }
];
