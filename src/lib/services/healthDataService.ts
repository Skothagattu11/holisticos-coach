/**
 * Health Data Service
 * Fetches data from Oura and Whoop APIs for the coach dashboard
 */

const OURA_API_URL = 'https://hos-fapi-oura.onrender.com';
const WHOOP_API_URL = 'https://hos-fapi-whoop.onrender.com';

// =============================================================================
// WHOOP TYPES
// =============================================================================

export interface WhoopRecoveryRecord {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number | null;
    skin_temp_celsius: number | null;
  };
}

export interface WhoopSleepRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export interface WhoopCycleRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string | null;
  timezone_offset: string;
  score_state: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

export interface WhoopWorkoutRecord {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number | null;
    altitude_gain_meter: number | null;
    altitude_change_meter: number | null;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

// =============================================================================
// OURA TYPES
// =============================================================================

export interface OuraSleepData {
  id: string;
  day: string;
  score: number | null;
  totalSleepDuration: number | null; // seconds
  deepSleepDuration: number | null;
  remSleepDuration: number | null;
  lightSleepDuration: number | null;
  sleepEfficiency: number | null;
  averageHeartRate: number | null;
  averageHrv: number | null;
}

export interface OuraActivityData {
  id: string;
  day: string;
  score: number | null;
  steps: number | null;
  activeCalories: number | null;
  totalCalories: number | null;
  highActivityTime: number | null;
  mediumActivityTime: number | null;
  lowActivityTime: number | null;
}

export interface OuraReadinessData {
  id: string;
  day: string;
  score: number | null;
  temperatureDeviation: number | null;
}

// =============================================================================
// WHOOP RAW DATA SERVICE (uses user_id path parameter - no JWT needed)
// =============================================================================

export const whoopDataService = {
  /**
   * Fetch latest Whoop recovery data for a user
   * Note: API max limit is 5
   */
  async fetchRecovery(userId: string, limit: number = 5): Promise<WhoopRecoveryRecord[]> {
    try {
      const response = await fetch(
        `${WHOOP_API_URL}/api/v1/raw-data/records/${userId}/recovery?limit=${limit}`
      );

      if (!response.ok) {
        console.error('[whoopDataService] Recovery fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('[whoopDataService] Error fetching recovery:', error);
      return [];
    }
  },

  /**
   * Fetch latest Whoop sleep data for a user
   * Note: API max limit is 5
   */
  async fetchSleep(userId: string, limit: number = 5): Promise<WhoopSleepRecord[]> {
    try {
      const response = await fetch(
        `${WHOOP_API_URL}/api/v1/raw-data/records/${userId}/sleep?limit=${limit}`
      );

      if (!response.ok) {
        console.error('[whoopDataService] Sleep fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('[whoopDataService] Error fetching sleep:', error);
      return [];
    }
  },

  /**
   * Fetch latest Whoop cycle (strain) data for a user
   * Note: API max limit is 5
   */
  async fetchCycle(userId: string, limit: number = 5): Promise<WhoopCycleRecord[]> {
    try {
      const response = await fetch(
        `${WHOOP_API_URL}/api/v1/raw-data/records/${userId}/cycle?limit=${limit}`
      );

      if (!response.ok) {
        console.error('[whoopDataService] Cycle fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('[whoopDataService] Error fetching cycle:', error);
      return [];
    }
  },

  /**
   * Fetch latest Whoop workout data for a user
   * Note: API max limit is 5
   */
  async fetchWorkout(userId: string, limit: number = 5): Promise<WhoopWorkoutRecord[]> {
    try {
      const response = await fetch(
        `${WHOOP_API_URL}/api/v1/raw-data/records/${userId}/workout?limit=${limit}`
      );

      if (!response.ok) {
        console.error('[whoopDataService] Workout fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.records || [];
    } catch (error) {
      console.error('[whoopDataService] Error fetching workout:', error);
      return [];
    }
  },

  /**
   * Fetch all Whoop data for a user
   * Note: API max limit is 5
   */
  async fetchAll(userId: string, limit: number = 5): Promise<{
    recovery: WhoopRecoveryRecord[];
    sleep: WhoopSleepRecord[];
    cycle: WhoopCycleRecord[];
    workout: WhoopWorkoutRecord[];
  }> {
    const [recovery, sleep, cycle, workout] = await Promise.all([
      this.fetchRecovery(userId, limit),
      this.fetchSleep(userId, limit),
      this.fetchCycle(userId, limit),
      this.fetchWorkout(userId, limit),
    ]);

    return { recovery, sleep, cycle, workout };
  },

  /**
   * Get user data summary
   */
  async getSummary(userId: string): Promise<any> {
    try {
      const response = await fetch(
        `${WHOOP_API_URL}/api/v1/raw-data/summary/${userId}`
      );

      if (!response.ok) {
        console.error('[whoopDataService] Summary fetch failed:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[whoopDataService] Error fetching summary:', error);
      return null;
    }
  },
};

// =============================================================================
// OURA DATA SERVICE (queries stored data from Supabase via API)
// =============================================================================

export const ouraDataService = {
  /**
   * Fetch Oura sleep data for a user
   * Note: This requires the user's JWT or a service-level query
   */
  async fetchSleep(userJwtToken: string, days: number = 7): Promise<OuraSleepData[]> {
    try {
      const response = await fetch(
        `${OURA_API_URL}/api/oura/fetch/sleep?days=${days}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userJwtToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[ouraDataService] Sleep fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.data || []).map((r: any) => ({
        id: r.id || '',
        day: r.day,
        score: r.score,
        totalSleepDuration: r.total_sleep_duration,
        deepSleepDuration: r.deep_sleep_duration,
        remSleepDuration: r.rem_sleep_duration,
        lightSleepDuration: r.light_sleep_duration,
        sleepEfficiency: r.sleep_efficiency,
        averageHeartRate: r.average_heart_rate,
        averageHrv: r.average_hrv,
      }));
    } catch (error) {
      console.error('[ouraDataService] Error fetching sleep:', error);
      return [];
    }
  },

  /**
   * Fetch Oura activity data for a user
   */
  async fetchActivity(userJwtToken: string, days: number = 7): Promise<OuraActivityData[]> {
    try {
      const response = await fetch(
        `${OURA_API_URL}/api/oura/fetch/activity?days=${days}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userJwtToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[ouraDataService] Activity fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.data || []).map((r: any) => ({
        id: r.id || '',
        day: r.day,
        score: r.score,
        steps: r.steps,
        activeCalories: r.active_calories,
        totalCalories: r.total_calories,
        highActivityTime: r.high_activity_time,
        mediumActivityTime: r.medium_activity_time,
        lowActivityTime: r.low_activity_time,
      }));
    } catch (error) {
      console.error('[ouraDataService] Error fetching activity:', error);
      return [];
    }
  },

  /**
   * Fetch Oura readiness data for a user
   */
  async fetchReadiness(userJwtToken: string, days: number = 7): Promise<OuraReadinessData[]> {
    try {
      const response = await fetch(
        `${OURA_API_URL}/api/oura/fetch/readiness?days=${days}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userJwtToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[ouraDataService] Readiness fetch failed:', response.status);
        return [];
      }

      const data = await response.json();
      return (data.data || []).map((r: any) => ({
        id: r.id || '',
        day: r.day,
        score: r.score,
        temperatureDeviation: r.temperature_deviation,
      }));
    } catch (error) {
      console.error('[ouraDataService] Error fetching readiness:', error);
      return [];
    }
  },

  /**
   * Check Oura connection status
   */
  async checkConnection(userJwtToken: string): Promise<'connected' | 'disconnected' | 'error'> {
    try {
      const response = await fetch(`${OURA_API_URL}/api/oura/status`, {
        headers: {
          'Authorization': `Bearer ${userJwtToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isActive = data.is_active || (data.is_authenticated && !data.is_token_expired);
        return isActive ? 'connected' : 'disconnected';
      }
      return response.status === 404 ? 'disconnected' : 'error';
    } catch {
      return 'error';
    }
  },
};

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export interface HealthDataSummary {
  source: 'oura' | 'whoop';
  date: string;
  recovery?: {
    score: number;
    hrv?: number;
    rhr?: number;
    temperatureDeviation?: number;
  };
  sleep?: {
    score: number;
    duration?: number; // minutes
    efficiency?: number;
    deepSleep?: number;
    remSleep?: number;
  };
  activity?: {
    score?: number;
    strain?: number;
    steps?: number;
    calories?: number;
  };
  lastSync: string;
}

export const healthDataService = {
  whoopDataService,
  ouraDataService,
};
