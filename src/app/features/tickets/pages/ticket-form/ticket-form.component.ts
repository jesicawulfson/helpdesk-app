import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket, TicketCategory, TicketPriority, TicketStatus } from '../../../../shared/models/ticket.model';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.css']
})
export class TicketFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  ticketId?: number;

  categories: TicketCategory[] = ['BILLING', 'TECH', 'OTHER'];
  priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH'];
  statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE'];

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEdit = !!this.ticketId;

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      category: ['', Validators.required],
      priority: ['', Validators.required],
      assignee: ['', Validators.required],
      status: [{ value: 'OPEN', disabled: !this.isEdit }]
    });

    if (this.isEdit && this.ticketId) {
      this.ticketsService.getTicket(this.ticketId).subscribe(ticket => {
        this.form.patchValue(ticket);
      });
    }
  }

  save() {
    if (this.form.invalid) return;

    const ticketData = this.form.getRawValue();

    if (this.isEdit && this.ticketId) {
      this.ticketsService.updateTicket(this.ticketId, ticketData).subscribe(() => {
        alert('Ticket actualizado!');
        this.router.navigate(['/tickets']);
      });
    } else {
      this.ticketsService.createTicket(ticketData).subscribe(() => {
        alert('Ticket creado!');
        this.router.navigate(['/tickets']);
      });
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty || confirm('Tenés cambios sin guardar. ¿Salir?');
  }
}