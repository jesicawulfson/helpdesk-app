import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../../../shared/models/ticket.model';
import { Subject } from 'rxjs';
import {
  debounceTime, distinctUntilChanged,
  switchMap, catchError, finalize, takeUntil
} from 'rxjs/operators';
import { of } from 'rxjs';
import { CommonModule, DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, 
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./tickets-list.component.css'],
  templateUrl: './tickets-list.component.html',
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, DatePipe,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatSortModule, MatTooltipModule,
    MatProgressSpinnerModule, MatCard
  ],
})
export class TicketsListComponent implements OnInit, OnDestroy {

  tickets: Ticket[] = [];
  filterForm!: FormGroup;

  loading = false;
  error = false;
  errorMessage = '';

  page = 1;
  limit = 10;
  total = 0;
  sort = 'updatedAt';
  order = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      search:   [''],
      status:   [''],
      priority: [''],
      category: [''],
      assignee: ['']
    });

    // Leer query params iniciales
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.page = params['page'] ? +params['page'] : 1;
        this.sort = params['sort'] || 'updatedAt';
        this.filterForm.patchValue({
          search:   params['search']   || '',
          status:   params['status']   || '',
          priority: params['priority'] || '',
          category: params['category'] || '',
          assignee: params['assignee'] || ''
        }, { emitEvent: false });

        this.loadTickets();
      });

    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      switchMap(() => {
        this.page = 1;
        this.loading = true;
        this.error = false;
        this.errorMessage = '';
        this.updateQueryParams();
        return this.fetchTickets().pipe(
          catchError(err => {
            console.error('Error cargando tickets', err);
            this.error = true;
            this.errorMessage = 'Ocurrió un error al cargar los tickets. Intente nuevamente.';
            this.tickets = [];
            this.total = 0;
            return of(null);
          }),
          finalize(() => {
            this.loading = false;
            this.cdr.markForCheck();
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if (!res) return;
      const body = (res as any).body;
      this.tickets = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      const headerTotal = (res as any).headers?.get('X-Total-Count');
      this.total = headerTotal ? +headerTotal : this.tickets.length;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    const f = this.filterForm.value;
    this.loading = true;
    this.error = false;
    this.errorMessage = '';

    this.ticketsService.getTickets(
      f.search, f.status, f.priority, f.category,
      f.assignee, this.page, this.limit, this.sort, this.order
    ).pipe(
      catchError(err => {
        console.error('Error cargando tickets', err);
        this.error = true;
        this.errorMessage = 'Ocurrió un error al cargar los tickets. Intente nuevamente.';
        this.tickets = [];
        this.total = 0;
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }),
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if (!res) return;
      const body = (res as any).body;
      this.tickets = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : [];
      const headerTotal = (res as any).headers?.get('X-Total-Count');
      this.total = headerTotal ? +headerTotal : this.tickets.length;
      this.cdr.markForCheck();
    });
  }

  changeSort(sort: string): void {
    this.sort = sort;
    this.updateQueryParams();
    this.loadTickets();
  }

  updateQueryParams(): void {
    const f = this.filterForm.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...f, page: this.page, sort: this.sort, limit: this.limit }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.updateQueryParams();
    this.loadTickets();
  }

  trackByTicket(index: number, ticket: Ticket): any {
    return ticket.id;
  }

  get currentQueryParams() {
    const f = this.filterForm.value;
    return { ...f, page: this.page, sort: this.sort, limit: this.limit, order: this.order };
  }

  get startItem(): number { return (this.page - 1) * this.limit + 1; }
  get endItem(): number   { return Math.min(this.page * this.limit, this.total); }

  private fetchTickets() {
    const f = this.filterForm.value;
    return this.ticketsService.getTickets(
      f.search, f.status, f.priority, f.category,
      f.assignee, this.page, this.limit, this.sort, this.order
    );
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { ABIERTO: 'Abierto', EN_PROGRESO: 'En Progreso', COMPLETADO: 'Completado' };
    return map[status] || status;
  }
  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
    return map[priority] || priority;
  }
  getCategoryLabel(category: string): string {
    const map: Record<string, string> = { TECH: 'Técnica', BILLING: 'Facturación', OTHER: 'Otra' };
    return map[category] || category;
  }
}
