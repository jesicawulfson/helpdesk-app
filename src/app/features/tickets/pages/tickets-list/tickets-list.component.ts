import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../../../shared/models/ticket.model';
import { debounceTime, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSortModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatCard
  ],
  templateUrl: './tickets-list.component.html',
  styleUrls: ['./tickets-list.component.scss']
})
export class TicketsListComponent implements OnInit {

  tickets: Ticket[] = [];
  filterForm!: FormGroup;

  loading = false;

  page = 1;
  limit = 10;
  total = 0;

  sort = 'updatedAt';
  order = 'desc';

  error = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private ticketsService: TicketsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      category: [''],
      assignee: ['']
    });

    // Leer query params iniciales
    this.route.queryParams.subscribe(params => {

      this.page = params['page'] ? +params['page'] : 1;
      this.sort = params['sort'] || 'updatedAt';

      this.filterForm.patchValue({
        search: params['search'] || '',
        status: params['status'] || '',
        priority: params['priority'] || '',
        category: params['category'] || '',
        assignee: params['assignee'] || ''
      }, { emitEvent: false });

      this.loadTickets();
    });

    // Escuchar cambios de filtros con debounce + switchMap
    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      switchMap(() => {
        this.page = 1;           // al cambiar filtros, volvemos a la página 1
        this.loading = true;
        this.error = false;
        this.errorMessage = '';

        this.updateQueryParams();

        return this.fetchTickets();   // devuelve el observable del HTTP
      })
    ).subscribe({
      next: (res: any) => {
        const body = res.body;

        this.tickets = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];

        const headerTotal = res.headers.get('X-Total-Count');

        this.total = headerTotal
          ? +headerTotal
          : this.tickets.length;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando tickets', err);
        this.loading = false;
        this.tickets = [];
        this.total = 0;
        this.error = true;
        this.errorMessage = 'Ocurrió un error al cargar los tickets. Intente nuevamente.';
      }
    });
  }
  get startItem(): number {
    return (this.page - 1) * this.limit + 1;
  }
  
  get endItem(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  loadTickets() {

    const f = this.filterForm.value;

    this.loading = true;

    this.ticketsService.getTickets(
      f.search,
      f.status,
      f.priority,
      f.category,
      f.assignee,
      this.page,
      this.limit,
      this.sort,
      this.order
    ).subscribe({
      next: (res: any) => {
        const body = res.body;
        this.tickets = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : [];
        const headerTotal = res.headers.get('X-Total-Count');
        this.total = headerTotal ? +headerTotal : this.tickets.length;
        this.error = false;
        this.errorMessage = '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando tickets', err);
        this.loading = false;
        this.tickets = [];
        this.total = 0;
        this.error = true;
        this.errorMessage = 'Ocurrió un error al cargar los tickets. Intente nuevamente.';
      }
    });  
  }


  changeSort(sort: string) {

    this.sort = sort;
    this.updateQueryParams();

  }

  updateQueryParams() {

    const f = this.filterForm.value;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...f,
        page: this.page,
        sort: this.sort,
        limit: this.limit
      }
    });

  }

  onPageChange(event: PageEvent) {
    this.page = event.pageIndex + 1;   
    this.limit = event.pageSize;      
    this.updateQueryParams();
    this.loadTickets();
  }

  private fetchTickets() {
    const f = this.filterForm.value;
    return this.ticketsService.getTickets(
      f.search,
      f.status,
      f.priority,
      f.category,
      f.assignee,
      this.page,
      this.limit,
      this.sort,
      this.order
    );
  }

  get currentQueryParams() {
    const f = this.filterForm.value;
    return {
      ...f,
      page: this.page,
      sort: this.sort,
      limit: this.limit,
      order: this.order
    };
  }
}