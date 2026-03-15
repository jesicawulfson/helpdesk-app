import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../../../shared/models/ticket.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./ticket-detail.component.css'],
  templateUrl: './ticket-detail.component.html',
  imports: [
    CommonModule, RouterModule, DatePipe,
    MatCardModule, MatListModule, MatButtonModule, MatIconModule,
    ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule
  ],
})
export class TicketDetailComponent implements OnInit, OnDestroy {

  ticket?: Ticket;
  loading = false;
  saving = false;

  statusForm!: FormGroup;
  commentForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ticketsService: TicketsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      status:   [''],
      priority: ['']
    });

    this.commentForm = this.fb.group({
      author: ['', Validators.required],
      text:   ['', [Validators.required, Validators.minLength(5)]]
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTicket(id: number): void {
    this.loading = true;

    this.ticketsService.getTicket(id).pipe(
      catchError(err => {
        console.error('Error cargando ticket', err);
        return of(undefined);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe(ticket => {
      if (!ticket) return;
      this.ticket = ticket;
      this.statusForm.patchValue({
        status:   ticket.status,
        priority: ticket.priority
      });
      this.cdr.markForCheck();
    });
  }

  saveStatusAndPriority(): void {
    if (!this.ticket || this.statusForm.invalid) return;
    const { status, priority } = this.statusForm.value;
    this.saving = true;

    this.ticketsService.updateTicket(this.ticket.id, { ...this.ticket, status, priority }).pipe(
      catchError(err => {
        console.error('Error actualizando ticket', err);
        return of(undefined);
      }),
      finalize(() => {
        this.saving = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      if (updated) {
        this.ticket = updated;
        this.cdr.markForCheck();
      }
    });
  }

  addComment(): void {
    if (!this.ticket || this.commentForm.invalid) return;
    const { author, text } = this.commentForm.value;

    this.ticketsService.addComment(this.ticket.id, { author, text }).pipe(
      catchError(err => {
        console.error('Error agregando comentario', err);
        return of(undefined);
      }),
      finalize(() => this.cdr.markForCheck()),
      takeUntil(this.destroy$)
    ).subscribe(updated => {
      if (updated) {
        this.ticket = updated;
        this.commentForm.reset();
        this.cdr.markForCheck();
      }
    });
  }

  goBackToList(): void {
    const params = this.route.snapshot.queryParams;
    this.router.navigate(['/tickets'], { queryParams: params });
  }

  trackByComment(index: number, comment: any): any {
    return comment.id ?? (comment.date + comment.author);
  }

  getCategoryLabel(category: string): string {
    const map: Record<string, string> = { TECH: 'Técnica', BILLING: 'Facturación', OTHER: 'Otra' };
    return map[category] || category;
  }
}