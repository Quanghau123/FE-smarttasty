export interface Promotion {
  id: number;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string; // ISO date
  endDate: string; // ISO date
  isActive: boolean;
}
