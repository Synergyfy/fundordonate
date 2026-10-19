import api from "../api";

export interface CreateSupportTicketInput {
  name: string;
  email: string;
  topic: string;
  subject?: string;
  message: string;
  source?: string;
}

export const supportService = {
  async createTicket(input: CreateSupportTicketInput): Promise<{ id: string; status: string; createdAt: string }> {
    return api.post("/support/tickets", input);
  },

  async listTickets(params: { page?: number; limit?: number; status?: string } = {}): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return api.get("/admin/support/tickets", { params });
  },

  async updateTicketStatus(id: string, status: string): Promise<{ id: string; status: string; updatedAt: string }> {
    return api.put(`/admin/support/tickets/${id}`, { status });
  },
};

export const supportApi = supportService;
export default supportService;
