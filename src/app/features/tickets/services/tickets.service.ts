import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ticket } from '../../../shared/models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

  private apiUrl = 'http://localhost:3000/tickets';

  constructor(private http: HttpClient) {}

  getTickets(
    search: string = '',
    status: string = '',
    priority: string = '',
    category: string = '',
    assignee: string = '',
    page: number = 1,
    limit: number = 10,
    sort: string = 'updatedAt',
    order: string = 'desc'
  ) {
  
    let params: any = {
      _page: page,
      _per_page: limit,
      _sort: sort,
    };
  
    if (search) params.q = search;
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (category) params.category = category;
    if (assignee) params.assignee = assignee;
  
    return this.http.get<Ticket[]>(this.apiUrl, {
      params,
      observe: 'response'
    });
  }

  getTicket(id: number): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`);
  }

  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<Ticket>(this.apiUrl, ticket);
  }

  updateTicket(id: number, ticket: Partial<Ticket>): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${id}`, ticket);
  }
}