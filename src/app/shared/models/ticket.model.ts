export type TicketStatus = 'ABIERTO' | 'EN_PROGRESO' | 'COMPLETADO';

export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA';

export type TicketCategory = 'BILLING' | 'TECH' | 'OTHER';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  comments: TicketComment[];
}

export interface TicketComment {
  author: string;
  date: string;
  text: string;
}