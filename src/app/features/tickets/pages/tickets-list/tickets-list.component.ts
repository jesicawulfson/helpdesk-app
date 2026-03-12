import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../../../shared/models/ticket.model';
import { debounceTime, switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DatePipe],
  templateUrl: './tickets-list.component.html'
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

      this.tickets = res.body.data;

      const total = res.headers.get('X-Total-Count');
      this.total = total ? +total : 0;

      this.loading = false;
    });
  }

  changePage(page: number) {

    this.page = page;
    this.updateQueryParams();

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
        sort: this.sort
      }
    });

  }

}