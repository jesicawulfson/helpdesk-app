import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './ticket-detail.component.html'
})
export class TicketDetailComponent implements OnInit {

  ticket?: Ticket;

  statusForm!: FormGroup;

  commentForm!: FormGroup;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private ticketsService: TicketsService,
    private fb: FormBuilder,
  ) {

  }

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      status: [''],
      priority: ['']
    });

    this.commentForm = this.fb.group({
      author: ['', Validators.required],
      text: ['', [Validators.required, Validators.minLength(5)]]
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
    
  }

  
  loadTicket(id: number) {
    this.ticketsService.getTicket(id).subscribe(ticket => {
      this.ticket = ticket;
      this.statusForm.patchValue({
        status: ticket.status,
        priority: ticket.priority
      });
    });
  }

  saveStatusAndPriority() {
    if (!this.ticket) return;
    const { status, priority } = this.statusForm.value;
    this.ticketsService.updateTicket(this.ticket.id, {
      ...this.ticket,
      status,
      priority
    }).subscribe(updated => {
      this.ticket = updated;
    });
  }

  addComment() {
    if (!this.ticket || this.commentForm.invalid) return;
    const { author, text } = this.commentForm.value;
    this.ticketsService.addComment(this.ticket.id, { author, text }).subscribe(updated => {
      this.ticket = updated;
      this.commentForm.reset();
    });
  }

  goBackToList() {
    const params = this.route.snapshot.queryParams;
    this.router.navigate(['/tickets'], { queryParams: params });
  }

  trackByComment(index: number, comment: any): any {
    return comment.date + comment.author;
  }
}