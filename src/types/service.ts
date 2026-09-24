export type ServiceCategory = 'MINIBAR' | 'SERVICE';

export type Service = {
  serviceId: string;
  name: string;
  description?: string | null;
  category: ServiceCategory;
  price: number;
  unit: string;
  isActive?: boolean;
};
