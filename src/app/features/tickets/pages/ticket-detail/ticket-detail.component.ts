import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TicketsService } from '../../services/tickets.service';
import { Ticket } from '../../../../shared/models/ticket.model';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './ticket-detail.component.html'
})
export class TicketDetailComponent implements OnInit {

  ticket?: Ticket;

  constructor(
    private route: ActivatedRoute,
    private ticketsService: TicketsService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  loadTicket(id: number) {
    this.ticketsService.getTicket(id).subscribe({
      next: (data) => this.ticket = data,
      error: (err) => console.error('Error cargando ticket', err)
    });
  }
}