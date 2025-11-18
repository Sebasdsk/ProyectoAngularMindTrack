
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
  { path: 'dashboard', component: Dashboard },
  { path: 'emotions', component: Emotions },
  { path: 'tasks', component: Tasks },
  { path: 'focus', component: Focus },
  { path: 'diary', component: Diary},
  { path: '**', redirectTo: '/login' },
];
