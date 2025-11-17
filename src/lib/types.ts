export type Role = 'farmer' | 'buyer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const certifications = [
  "Orgánico",
  "Comercio Justo",
  "Pastoreo Libre",
  "Sin OGM",
  "Sostenible",
  "Cultivado Localmente",
] as const;

export type Certification = (typeof certifications)[number];

export const units = ["kg", "lb", "docena"] as const;
export type Unit = (typeof units)[number];

export type Lot = {
  id: string;
  farmerId: string;
  farmerName: string;
  productType: string;
  quantity: number;
  unit: Unit;
  harvestDate: Date;
  location: string;
  pricePerKg: number;
  certifications: Certification[];
  status: 'available' | 'sold';
  image: {
    url: string;
    hint: string;
  };
};
