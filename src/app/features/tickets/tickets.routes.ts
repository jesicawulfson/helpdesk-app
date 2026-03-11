import { Routes } from '@angular/router';
import { TicketsListComponent } from './pages/tickets-list/tickets-list.component';
import { TicketDetailComponent } from './pages/ticket-detail/ticket-detail.component';
import { TicketFormComponent } from './pages/ticket-form/ticket-form.component';
import { pendingChangesGuard } from '../../core/guards/pending-changes.guard';

export const routes: Routes = [
  { path: '', component: TicketsListComponent },
  { path: 'new', component: TicketFormComponent, canDeactivate: [pendingChangesGuard] },
  { path: ':id', component: TicketDetailComponent },
  { path: ':id/edit', component: TicketFormComponent, canDeactivate: [pendingChangesGuard] }
];