/**
 * Notification types for in-app notifications
 */

export interface Notification {
  id: string;
  type: 'competitor_listing' | 'match_found' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: {
    listingUrl?: string;
    portal?: string;
    price?: number;
    location?: string;
    propertyId?: string;
    customerId?: string;
    photoUrl?: string;
    criteriaSource?: 'manual' | 'customer';
  };
}

/**
 * Monitoring criteria for competitor tracking
 */
export interface MonitoringCriteria {
  id: string;
  region: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  portals: ('sahibinden' | 'hepsiemlak' | 'emlakjet')[];
  enabled: boolean;
}
