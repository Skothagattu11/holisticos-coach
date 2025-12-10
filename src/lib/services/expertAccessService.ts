import { supabase, isSupabaseConfigured } from '../supabase';

export type ExpertAccessStatus = 'pending' | 'approved' | 'rejected';

export interface ExpertAccessRequest {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  status: ExpertAccessStatus;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

// Mock data for development without Supabase
const mockRequests: ExpertAccessRequest[] = [
  {
    id: '1',
    user_id: 'user-1',
    user_email: 'john.doe@example.com',
    user_name: 'John Doe',
    status: 'pending',
    requested_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    user_id: 'user-2',
    user_email: 'jane.smith@example.com',
    user_name: 'Jane Smith',
    status: 'pending',
    requested_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    user_id: 'user-3',
    user_email: 'bob.wilson@example.com',
    user_name: 'Bob Wilson',
    status: 'approved',
    requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: 'admin',
    review_notes: 'Approved - Premium member',
  },
  {
    id: '4',
    user_id: 'user-4',
    user_email: 'alice.johnson@example.com',
    user_name: 'Alice Johnson',
    status: 'rejected',
    requested_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    reviewed_by: 'admin',
    review_notes: 'Not eligible at this time',
  },
];

class ExpertAccessService {
  /**
   * Fetch all expert access requests
   */
  async getAllRequests(filterStatus?: ExpertAccessStatus): Promise<ExpertAccessRequest[]> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, using mock data');
      if (filterStatus) {
        return mockRequests.filter(r => r.status === filterStatus);
      }
      return mockRequests;
    }

    try {
      let query = supabase!
        .from('expert_access_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expert access requests:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllRequests:', error);
      throw error;
    }
  }

  /**
   * Get counts by status
   */
  async getStatusCounts(): Promise<Record<ExpertAccessStatus | 'total', number>> {
    if (!isSupabaseConfigured()) {
      return {
        total: mockRequests.length,
        pending: mockRequests.filter(r => r.status === 'pending').length,
        approved: mockRequests.filter(r => r.status === 'approved').length,
        rejected: mockRequests.filter(r => r.status === 'rejected').length,
      };
    }

    try {
      const { data, error } = await supabase!
        .from('expert_access_requests')
        .select('status');

      if (error) {
        console.error('Error fetching status counts:', error);
        throw error;
      }

      const counts: Record<ExpertAccessStatus | 'total', number> = {
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      data?.forEach(item => {
        if (item.status in counts) {
          counts[item.status as ExpertAccessStatus]++;
        }
      });

      return counts;
    } catch (error) {
      console.error('Error in getStatusCounts:', error);
      throw error;
    }
  }

  /**
   * Approve an access request
   */
  async approveRequest(requestId: string, reviewerId: string, notes?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, mock approve');
      const request = mockRequests.find(r => r.id === requestId);
      if (request) {
        request.status = 'approved';
        request.reviewed_at = new Date().toISOString();
        request.reviewed_by = reviewerId;
        request.review_notes = notes;
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('expert_access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: notes,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error approving request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in approveRequest:', error);
      throw error;
    }
  }

  /**
   * Reject an access request
   */
  async rejectRequest(requestId: string, reviewerId: string, notes?: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, mock reject');
      const request = mockRequests.find(r => r.id === requestId);
      if (request) {
        request.status = 'rejected';
        request.reviewed_at = new Date().toISOString();
        request.reviewed_by = reviewerId;
        request.review_notes = notes;
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('expert_access_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
          review_notes: notes,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in rejectRequest:', error);
      throw error;
    }
  }

  /**
   * Delete an access request
   */
  async deleteRequest(requestId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, mock delete');
      const index = mockRequests.findIndex(r => r.id === requestId);
      if (index !== -1) {
        mockRequests.splice(index, 1);
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('expert_access_requests')
        .delete()
        .eq('id', requestId);

      if (error) {
        console.error('Error deleting request:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteRequest:', error);
      throw error;
    }
  }
}

export const expertAccessService = new ExpertAccessService();
