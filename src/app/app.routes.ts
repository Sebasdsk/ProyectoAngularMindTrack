import { authGuard } from './auth-guard';
import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Profile } from './profile/profile';
import { Dashboard } from './dashboard/dashboard';
import { Emotions } from './emotions/emotions';
import { Tasks } from './tasks/tasks';
import { Focus } from './focus/focus';
import { Diary } from './diary/diary';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'profile', component: Profile },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'emotions', component: Emotions, canActivate: [authGuard] },
  { path: 'tasks', component: Tasks, canActivate: [authGuard]},
  { path: 'focus', component: Focus, canActivate: [authGuard]},
  { path: 'diary', component: Diary, canActivate: [authGuard]},
  { path: '**', redirectTo: '/login' },
];
