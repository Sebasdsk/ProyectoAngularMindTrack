import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Register } from './register/register';
import { Profile } from './profile/profile';
import { ComponentShowcase } from './pages/component-showcase/component-showcase';


export const routes: Routes = [
  {path: 'login', component: Login},
  {path: 'register', component: Register},
  {path: 'profile', component: Profile},
  {path: 'showcase', component: ComponentShowcase},
];
