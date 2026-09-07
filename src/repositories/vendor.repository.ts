import { prisma } from "@/lib/prisma";
import type { Vendor, CreateVendorInput, UpdateVendorInput } from "@/types";

export class VendorRepository {
  /**
   * Mengambil semua daftar toko/rekanan milik user
   */
  async findManyByUserId(userId: string): Promise<Vendor[]> {
    try {
      return await prisma.vendor.findMany({
        where: { userId },
        orderBy: [{ namaToko: "asc" }, { createdAt: "desc" }],
      });
    } catch (error) {
      console.error("[VendorRepository.findManyByUserId] Error:", error);
      throw error;
    }
  }

  /**
   * Mengambil satu toko spesifik berdasarkan ID
   */
  async findById(id: string, userId: string): Promise<Vendor | null> {
    try {
      return await prisma.vendor.findFirst({
        where: { id, userId },
      });
    } catch (error) {
      console.error("[VendorRepository.findById] Error:", error);
      throw error;
    }
  }

  /**
   * Mencari toko berdasarkan nama (case-insensitive) untuk user tertentu
   */
  async findByName(namaToko: string, userId: string): Promise<Vendor | null> {
    try {
      const clean = namaToko.trim();
      return await prisma.vendor.findFirst({
        where: {
          userId,
          namaToko: {
            equals: clean,
            mode: "insensitive",
          },
        },
      });
    } catch (error) {
      console.error("[VendorRepository.findByName] Error:", error);
      throw error;
    }
  }

  /**
   * Membuat toko / rekanan baru
   */
  async create(userId: string, input: CreateVendorInput): Promise<Vendor> {
    try {
      return await prisma.vendor.create({
        data: {
          namaToko: input.namaToko.trim(),
          namaPemilik: input.namaPemilik?.trim() || null,
          alamat: input.alamat?.trim() || null,
          noHp: input.noHp?.trim() || null,
          kategori: input.kategori?.trim() || null,
          userId,
        },
      });
    } catch (error) {
      console.error("[VendorRepository.create] Error:", error);
      throw error;
    }
  }

  /**
   * Memperbarui data toko / rekanan
   */
  async update(id: string, userId: string, input: Partial<CreateVendorInput>): Promise<Vendor> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error("Toko / Rekanan tidak ditemukan atau bukan milik Anda.");
      }

      return await prisma.vendor.update({
        where: { id },
        data: {
          ...(input.namaToko !== undefined && { namaToko: input.namaToko.trim() }),
          ...(input.namaPemilik !== undefined && { namaPemilik: input.namaPemilik?.trim() || null }),
          ...(input.alamat !== undefined && { alamat: input.alamat?.trim() || null }),
          ...(input.noHp !== undefined && { noHp: input.noHp?.trim() || null }),
          ...(input.kategori !== undefined && { kategori: input.kategori?.trim() || null }),
        },
      });
    } catch (error) {
      console.error("[VendorRepository.update] Error:", error);
      throw error;
    }
  }

  /**
   * Menghapus toko / rekanan
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const existing = await this.findById(id, userId);
      if (!existing) {
        throw new Error("Toko / Rekanan tidak ditemukan.");
      }

      await prisma.vendor.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("[VendorRepository.delete] Error:", error);
      throw error;
    }
  }

  /**
   * Simpan cepat / Upsert: jika toko sudah ada berdasarkan nama, perbarui data alamat/pemilik bila kosong; jika belum ada buat baru
   */
  async upsertQuick(userId: string, input: CreateVendorInput): Promise<Vendor> {
    try {
      const cleanName = input.namaToko.trim();
      const existing = await this.findByName(cleanName, userId);

      if (existing) {
        return await prisma.vendor.update({
          where: { id: existing.id },
          data: {
            namaPemilik: input.namaPemilik?.trim() || existing.namaPemilik,
            alamat: input.alamat?.trim() || existing.alamat,
            noHp: input.noHp?.trim() || existing.noHp,
            kategori: input.kategori?.trim() || existing.kategori,
          },
        });
      }

      return await this.create(userId, input);
    } catch (error) {
      console.error("[VendorRepository.upsertQuick] Error:", error);
      throw error;
    }
  }
}

export const vendorRepository = new VendorRepository();
