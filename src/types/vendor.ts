import type { Vendor as PrismaVendor } from "@prisma/client";

export type Vendor = PrismaVendor;

export interface CreateVendorInput {
  namaToko: string;
  namaPemilik?: string | null;
  alamat?: string | null;
  noHp?: string | null;
  kategori?: string | null;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {
  id: string;
}
