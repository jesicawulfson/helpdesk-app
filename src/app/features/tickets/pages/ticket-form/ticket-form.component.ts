import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { switchMap, catchError, finalize, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./ticket-form.component.css'],
  templateUrl: './ticket-form.component.html',
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSnackBarModule
  ],
})
export class TicketFormComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isEdit = false;
  ticketId?: number;
  saving = false;

  categories: TicketCategory[] = ['BILLING', 'TECH', 'OTHER'];
  priorities: TicketPriority[] = ['BAJA', 'MEDIA', 'ALTA'];
  statuses: TicketStatus[]     = ['ABIERTO', 'EN_PROGRESO', 'COMPLETADO'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ticketId = Number(this.route.snapshot.paramMap.get('id'));
    this.isEdit   = !!this.ticketId;

    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      category:    ['', Validators.required],
      priority:    ['', Validators.required],
      assignee:    ['', Validators.required],
      status:      [{ value: 'ABIERTO', disabled: !this.isEdit }],
      createdAt:   [{ value: '', disabled: true }],
      updatedAt:   [{ value: '', disabled: true }]
    });

    if (this.isEdit && this.ticketId) {
      this.ticketsService.getTicket(this.ticketId).pipe(
        catchError(err => {
          console.error('Error cargando ticket', err);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      ).subscribe(ticket => {
        if (ticket) {
          this.form.patchValue(ticket);
          this.cdr.markForCheck();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    if (this.isEdit && this.ticketId) {
      const ticketData = { ...this.form.getRawValue(), updatedAt: new Date().toISOString() };

      this.ticketsService.updateTicket(this.ticketId, ticketData).pipe(
        catchError(err => {
          console.error('Error actualizando ticket', err);
          this.snackBar.open('Error al actualizar el ticket', 'Cerrar', { duration: 3000 });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      ).subscribe(res => {
        if (!res) return;
        this.snackBar.open('Ticket actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.form.markAsPristine();
        this.router.navigate(['/tickets']);
      });

    } else {
      const now = new Date().toISOString();

      this.ticketsService.getNextId().pipe(
        switchMap(nextId => {
          const ticketData = {
            ...this.form.getRawValue(),
            id:        String(nextId),
            createdAt: now,
            updatedAt: now
          };
          return this.ticketsService.createTicket(ticketData);
        }),
        catchError(err => {
          console.error('Error creando ticket', err);
          this.snackBar.open('Error al crear el ticket', 'Cerrar', { duration: 3000 });
          return of(null);
        }),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
        takeUntil(this.destroy$)
      ).subscribe(res => {
        if (!res) return;
        this.snackBar.open('Ticket creado correctamente', 'Cerrar', { duration: 3000 });
        this.form.markAsPristine();
        this.router.navigate(['/tickets']);
      });
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty || confirm('Tiene cambios sin guardar. ¿Salir?');
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = { TECH: 'Técnica', BILLING: 'Facturación', OTHER: 'Otra' };
    return map[category] || category;
  }
  getStatusLabel(status: string): string {
    const map: Record<string, string> = { ABIERTO: 'Abierto', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado' };
    return map[status] || status;
  }
  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
    return map[priority] || priority;
  }
}