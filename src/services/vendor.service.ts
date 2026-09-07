import { vendorRepository } from "@/repositories/vendor.repository";
import { prisma } from "@/lib/prisma";
import type { Vendor, CreateVendorInput, UpdateVendorInput, ServiceResponse } from "@/types";

export class VendorService {
  /**
   * Mengambil semua daftar toko/rekanan milik pengguna
   * Jika masih kosong, otomatis melakukan auto-discovery dari dokumen yang sudah ada
   */
  async getVendors(userId: string): Promise<ServiceResponse<Vendor[]>> {
    try {
      let list = await vendorRepository.findManyByUserId(userId);

      // Jika user belum punya vendor sama sekali, lakukan auto-seed dari SP/BAST atau default
      if (list.length === 0) {
        await this.autoDiscoverOrSeedVendors(userId);
        list = await vendorRepository.findManyByUserId(userId);
      }

      return {
        success: true,
        message: `Berhasil memuat ${list.length} toko/rekanan langganan.`,
        data: list,
      };
    } catch (error) {
      console.error("[VendorService.getVendors] Error:", error);
      return {
        success: false,
        message: "Gagal memuat daftar toko langganan.",
        data: [],
      };
    }
  }

  /**
   * Menyimpan toko baru atau memperbarui toko yang sudah ada
   */
  async saveVendor(
    userId: string,
    input: CreateVendorInput & { id?: string }
  ): Promise<ServiceResponse<Vendor>> {
    try {
      if (!input.namaToko || !input.namaToko.trim()) {
        return {
          success: false,
          message: "Nama Toko / Rekanan wajib diisi.",
        };
      }

      let saved: Vendor;
      if (input.id) {
        saved = await vendorRepository.update(input.id, userId, input);
      } else {
        saved = await vendorRepository.create(userId, input);
      }

      return {
        success: true,
        message: `Data toko "${saved.namaToko}" berhasil disimpan ke Master Data!`,
        data: saved,
      };
    } catch (error) {
      console.error("[VendorService.saveVendor] Error:", error);
      const msg = error instanceof Error ? error.message : "Gagal menyimpan data toko.";
      return {
        success: false,
        message: msg,
      };
    }
  }

  /**
   * Simpan cepat dari form (jika belum ada dibuat baru, jika sudah ada diperbarui)
   */
  async quickSaveVendor(
    userId: string,
    input: CreateVendorInput
  ): Promise<ServiceResponse<Vendor>> {
    try {
      if (!input.namaToko || !input.namaToko.trim()) {
        return {
          success: false,
          message: "Nama Toko tidak boleh kosong.",
        };
      }

      const saved = await vendorRepository.upsertQuick(userId, input);
      return {
        success: true,
        message: `Toko "${saved.namaToko}" berhasil tersimpan sebagai Rekanan Langganan!`,
        data: saved,
      };
    } catch (error) {
      console.error("[VendorService.quickSaveVendor] Error:", error);
      return {
        success: false,
        message: "Gagal menyimpan toko ke daftar langganan.",
      };
    }
  }

  /**
   * Menghapus data toko dari master data
   */
  async deleteVendor(id: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const deleted = await vendorRepository.delete(id, userId);
      return {
        success: true,
        message: "Toko berhasil dihapus dari Master Data Rekanan.",
        data: deleted,
      };
    } catch (error) {
      console.error("[VendorService.deleteVendor] Error:", error);
      return {
        success: false,
        message: "Gagal menghapus toko dari database.",
        data: false,
      };
    }
  }

  /**
   * Helper auto-discovery: mengekstrak toko dari SP/BAST yang sudah pernah dibuat
   * atau membuatkan preset toko rekanan umum agar form langsung kaya data
   */
  private async autoDiscoverOrSeedVendors(userId: string): Promise<void> {
    try {
      // 1. Cek dari PurchaseOrder user
      const poList = await prisma.purchaseOrder.findMany({
        where: { userId },
        select: { pihak2Toko: true, pihak2Nama: true, pihak2Alamat: true },
      });

      const knownShops = new Map<string, { namaToko: string; namaPemilik?: string | null; alamat?: string | null }>();

      for (const po of poList) {
        if (po.pihak2Toko && po.pihak2Toko.trim()) {
          const cleanName = po.pihak2Toko.trim();
          if (!knownShops.has(cleanName.toLowerCase())) {
            knownShops.set(cleanName.toLowerCase(), {
              namaToko: cleanName,
              namaPemilik: po.pihak2Nama?.trim() || null,
              alamat: po.pihak2Alamat?.trim() || null,
            });
          }
        }
      }

      // 2. Jika ada dari PO, simpan
      if (knownShops.size > 0) {
        for (const v of Array.from(knownShops.values())) {
          await vendorRepository.create(userId, {
            namaToko: v.namaToko,
            namaPemilik: v.namaPemilik,
            alamat: v.alamat,
            kategori: "Penyedia Pengadaan",
          });
        }
        return;
      }

      // 3. Fallback bawaan organisasi standar jika benar-benar baru
      const defaultPresets: CreateVendorInput[] = [
        {
          namaToko: "SURYA MAS",
          namaPemilik: "ANSHORI",
          alamat: "Jl. Raya Talang No. 16, Kec. Talang – Kabupaten Tegal",
          noHp: "085642719869",
          kategori: "Elektronik & Sound System",
        },
        {
          namaToko: "Percetakan & ATK Grafika Mandiri",
          namaPemilik: "M. Ikhsan",
          alamat: "Jl. Kemuning No. 24 Dawuhan, Talang – Tegal",
          noHp: "081234567890",
          kategori: "Percetakan, Banner & ATK",
        },
        {
          namaToko: "Katering Berkah Barokah",
          namaPemilik: "Hj. Siti Aminah",
          alamat: "Dawuhan Selatan RT.23 RW.06 Talang – Tegal",
          noHp: "085712345678",
          kategori: "Konsumsi & Makanan Rapat",
        },
      ];

      for (const preset of defaultPresets) {
        await vendorRepository.create(userId, preset);
      }
    } catch (err) {
      console.warn("[VendorService.autoDiscoverOrSeedVendors] Ignored seeding err:", err);
    }
  }
}

export const vendorService = new VendorService();
