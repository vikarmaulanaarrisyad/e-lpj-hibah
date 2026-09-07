import { prisma } from "@/lib/prisma";
import type { ActivityDocumentationRecord, DokumentasiFormData } from "@/types";

export class DokumentasiRepository {
  private get model() {
    return (prisma as any).activityDocumentation;
  }

  /**
   * Menyimpan atau memperbarui dokumen dokumentasi kegiatan
   */
  async createOrUpdate(
    userId: string,
    formData: DokumentasiFormData
  ): Promise<ActivityDocumentationRecord> {
    let parsedDate = new Date(formData.tanggalKegiatan);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date();
    }

    const photosJsonString = JSON.stringify(formData.photos || []);

    const dataFields = {
      judulDokumentasi: formData.judulDokumentasi,
      subJudul: formData.subJudul,
      namaKegiatan: formData.namaKegiatan,
      nomorReferensi: formData.nomorReferensi ?? null,
      tanggalKegiatan: parsedDate,
      lokasiKegiatan: formData.lokasiKegiatan,
      layout: formData.layout,
      photosJson: photosJsonString,
      sertakanTandaTangan: formData.sertakanTandaTangan,
      penandatangan1Jabatan: formData.penandatangan1Jabatan ?? null,
      penandatangan1Nama: formData.penandatangan1Nama ?? null,
      penandatangan2Jabatan: formData.penandatangan2Jabatan ?? null,
      penandatangan2Nama: formData.penandatangan2Nama ?? null,
    };

    if (formData.id) {
      const existing = await this.model.findUnique({
        where: { id: formData.id },
      });
      if (existing && existing.userId === userId) {
        return await this.model.update({
          where: { id: formData.id },
          data: dataFields,
        });
      }
    }

    return await this.model.create({
      data: {
        ...dataFields,
        userId,
      },
    });
  }

  /**
   * Mengambil semua dokumentasi kegiatan milik user
   */
  async findManyByUserId(userId: string): Promise<ActivityDocumentationRecord[]> {
    return await this.model.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Mengambil satu dokumentasi kegiatan berdasarkan ID
   */
  async findById(id: string, userId: string): Promise<ActivityDocumentationRecord | null> {
    return await this.model.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Menghapus dokumentasi kegiatan
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.model.findFirst({
      where: { id, userId },
    });
    if (!existing) return false;

    await this.model.delete({
      where: { id },
    });
    return true;
  }
}

export const dokumentasiRepository = new DokumentasiRepository();
