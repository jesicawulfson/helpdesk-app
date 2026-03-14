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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class TicketFormComponent implements OnInit {

  form!: FormGroup;
  isEdit = false;
  ticketId?: number;

  categories: TicketCategory[] = ['BILLING', 'TECH', 'OTHER'];
  priorities: TicketPriority[] = ['BAJA', 'MEDIA', 'ALTA'];
  statuses: TicketStatus[] = ['ABIERTO', 'EN_PROGRESO', 'COMPLETADO'];

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
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
      status: [{ value: 'ABIERTO', disabled: !this.isEdit }],
      createdAt: [{value: '', disabled: true}],
      updatedAt: [{value: '', disabled: true}]
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
      ticketData.updatedAt = new Date().toISOString();
      this.ticketsService.updateTicket(this.ticketId, ticketData).subscribe(() => {
        this.snackBar.open('Ticket actualizado correctamente', 'Cerrar', {
          duration: 3000
        });
        this.form.markAsPristine();
        this.router.navigate(['/tickets']);
      });
    } else {
      this.ticketsService.getNextId().subscribe(nextId => {
        const now = new Date().toISOString();
        const ticketData = {
          ...this.form.getRawValue(),
          id: String(nextId),        
          createdAt: now,
          updatedAt: now
        };
        this.ticketsService.createTicket(ticketData).subscribe(() => {
          this.snackBar.open('Ticket creado correctamente', 'Cerrar', {
            duration: 3000
          });
          this.form.markAsPristine();
          this.router.navigate(['/tickets']);
        });
      });
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty || confirm('Tiene cambios sin guardar. ¿Salir?');
  }

  getCategoryLabel(category: string): string {
    const categoryLabels: { [key: string]: string } = {
      'TECH': 'Técnica',
      'BILLING': 'Facturación',
      'OTHER': 'Otra'
    };
    return categoryLabels[category] || category;
  }

  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'ABIERTO': 'Abierto',
      'EN_PROGRESO': 'En Progreso',
      'COMPLETADO': 'Completado'
    };
    return statusLabels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    const priorityLabels: { [key: string]: string } = {
      'BAJA': 'Baja',
      'MEDIA': 'Media',
      'ALTA': 'Alta'
    };
    return priorityLabels[priority] || priority;
  }
}