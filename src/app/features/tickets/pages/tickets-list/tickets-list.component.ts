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

    // Escuchar cambios de filtros
    this.filterForm.valueChanges.pipe(
      debounceTime(400)
    ).subscribe(() => {

      this.page = 1;
      this.updateQueryParams();

    });
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
    ).subscribe((res: any) => {
      const body = res.body;

      this.tickets = Array.isArray(body)
        ? body
        : Array.isArray(body?.data)
          ? body.data
          : [];

      const headerTotal = res.headers.get('X-Total-Count');
      
      if (body?.items?.total != null) {
        this.total = +body.items.total;
      } else if (headerTotal) {
        this.total = +headerTotal;
      } else {
        this.total = this.tickets.length;
      }

      this.loading = false;
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
    this.page = event.pageIndex + 1;   // 0-based → 1-based
    this.limit = event.pageSize;      // <-- acá aplicás el nuevo pageSize
    this.updateQueryParams();
  }
}