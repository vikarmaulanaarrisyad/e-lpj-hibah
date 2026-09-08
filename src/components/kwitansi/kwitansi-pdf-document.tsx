import React from "react";
import * as ReactPdfAll from "@react-pdf/renderer";
import type { ReceiptFormData, InstitutionProfile } from "@/types";
import { getSignatoryKetuaTitles } from "@/lib/utils/kwitansi-signatory";
import { formatUraianBelanja } from "@/lib/utils/title-case";

// Handle both ES module default and named exports from @react-pdf/renderer in browser/webpack
const ReactPDF = (ReactPdfAll as any).default || ReactPdfAll;
const Document = ReactPdfAll.Document || ReactPDF.Document;
const Page = ReactPdfAll.Page || ReactPDF.Page;
const View = ReactPdfAll.View || ReactPDF.View;
const Text = ReactPdfAll.Text || ReactPDF.Text;
const Image = ReactPdfAll.Image || ReactPDF.Image;
const StyleSheet = ReactPdfAll.StyleSheet || ReactPDF.StyleSheet;
const Svg = ReactPdfAll.Svg || ReactPDF.Svg;
const Polygon = ReactPdfAll.Polygon || ReactPDF.Polygon;
const Line = ReactPdfAll.Line || ReactPDF.Line;

// Dimensi Lembar F4 / Folio Indonesia dalam satuan Point (pt):
// 1 mm = 72 / 25.4 pt = 2.83464567 pt
// Dalam konvensi kertas @react-pdf, ukuran standar didefinisikan [sisi pendek, sisi panjang]:
// Sisi pendek: 215 mm = 609.45 pt
// Sisi panjang: 330 mm = 935.43 pt
const F4_SHORT_SIDE = 609.45; // 215 mm
const F4_LONG_SIDE = 935.43;  // 330 mm

// Ukuran Final Lembar F4 Landscape (330 mm x 215 mm):
const F4_LANDSCAPE_WIDTH = 935.43;  // Lebar 330 mm (Landscape)
const F4_LANDSCAPE_HEIGHT = 609.45; // Tinggi 215 mm (Landscape)

// Dimensi Fisik Blanko Kwitansi Resmi:
// Lebar: 27.99 cm = 279.9 mm = 793.42 pt
// Tinggi: 9.60 cm = 96.0 mm = 272.13 pt
const KWITANSI_WIDTH = 793.42;
const KWITANSI_HEIGHT = 272.13;

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const cleanDate = dateStr.split("T")[0];
    const [y, m, d] = cleanDate.split("-");
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthIndex = parseInt(m, 10) - 1;
    const monthName = months[monthIndex] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  }
  return dateStr;
}

const styles = StyleSheet.create({
  page: {
    width: F4_LANDSCAPE_WIDTH,
    height: F4_LANDSCAPE_HEIGHT,
    backgroundColor: "#ffffff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  kwitansiContainer: {
    width: KWITANSI_WIDTH,
    height: KWITANSI_HEIGHT,
    position: "relative",
    backgroundColor: "#fafaf5",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: KWITANSI_WIDTH,
    height: KWITANSI_HEIGHT,
  },
  contentWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: KWITANSI_WIDTH,
    height: KWITANSI_HEIGHT,
    flexDirection: "row",
  },
  stubSection: {
    width: "20.8%", // ~165 pt
    height: "100%",
  },
  mainSection: {
    width: "79.2%", // ~628 pt
    height: "100%",
    paddingTop: 33,   // ~4.2cqw
    paddingBottom: 31, // ~4.0cqw - keeps names cleanly above bottom border
    paddingLeft: 40,  // ~5.0cqw
    paddingRight: 38, // ~4.8cqw
    flexDirection: "column",
    justifyContent: "space-between",
  },
  topRowsContainer: {
    flexDirection: "column",
    gap: 2.5,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowLabel: {
    width: 112,
    fontSize: 11,
    color: "#1e293b",
  },
  rowColon: {
    width: 10,
    fontSize: 11,
    fontWeight: "bold",
    color: "#1e293b",
  },
  rowValuePemberi: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    color: "#020617",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  rowValueTerbilang: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    fontStyle: "italic",
    color: "#0f172a",
  },
  rowValueUraian: {
    flex: 1,
    fontSize: 10.5,
    color: "#0f172a",
    lineHeight: 1.25,
  },
  middleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  nominalBadgeWrapper: {
    width: 130,
    height: 24,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  nominalBadgeText: {
    fontSize: 12.5,
    fontWeight: "heavy",
    color: "#020617",
    letterSpacing: 0.5,
  },
  taxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#ecfdf5",
    borderWidth: 0.5,
    borderColor: "#6ee7b7",
    borderRadius: 2,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  taxTextPrimary: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#065f46",
  },
  taxTextSecondary: {
    fontSize: 6.5,
    color: "#475569",
  },
  signatoriesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 98,
    width: "100%",
  },
  signatoryCol: {
    width: "32%",
    height: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
  },
  signatoryTitleContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  signatoryTitleTop: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 1.25,
  },
  signatoryTitleMid: {
    fontSize: 9.8,
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 1.25,
  },
  signatoryTitleSub: {
    fontSize: 9.6,
    color: "#334155",
    textAlign: "center",
    lineHeight: 1.25,
  },
  signatorySpace: {
    flex: 1,
    minHeight: 44,
  },
  signatoryName: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#020617",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    textDecoration: "underline",
    textAlign: "center",
  },
  signatoryDots: {
    fontSize: 9.5,
    color: "#334155",
    textAlign: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#475569",
    borderBottomStyle: "dashed",
    paddingBottom: 2,
    width: "80%",
  },
  materaiBox: {
    position: "absolute",
    top: 24,
    width: 48,
    height: 26,
    borderWidth: 0.8,
    borderColor: "#dc2626",
    borderStyle: "dashed",
    backgroundColor: "#fef2f2",
    borderRadius: 2,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  materaiText1: {
    fontSize: 5.5,
    fontWeight: "heavy",
    color: "#b91c1c",
    letterSpacing: 1,
  },
  materaiText2: {
    fontSize: 4.8,
    fontWeight: "bold",
    color: "#dc2626",
  },
});

export interface KwitansiPdfDocumentProps {
  data: ReceiptFormData;
  profile?: InstitutionProfile | null;
  templateImageUrl?: string;
  showCutGuides?: boolean;
}

export function KwitansiPdfDocument({
  data,
  profile,
  templateImageUrl,
  showCutGuides = false,
}: KwitansiPdfDocumentProps) {
  const blankoSrc = templateImageUrl || "/templates/kwitansi-blank-template.png";
  const ketuaTitles = getSignatoryKetuaTitles(profile, data);

  return (
    <Document title={`Kwitansi_${data.nomorBukti || "BKU"}_F4`} author="E-LPJ Hibah">
      <Page
        size={[F4_SHORT_SIDE, F4_LONG_SIDE]}
        orientation="landscape"
        style={styles.page}
      >
        {/* Kontainer Kanvas Kwitansi Presisi 27.99 cm x 9.6 cm */}
        <View style={styles.kwitansiContainer}>
          {/* Gambar Blanko Orisinal */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={blankoSrc} style={styles.backgroundImage} />

          {/* Garis Potong Vertikal (Jika Diaktifkan) */}
          {Boolean(showCutGuides) ? (
            <Svg
              style={{
                position: "absolute",
                top: 8,
                bottom: 8,
                left: 165,
                width: 2,
                height: KWITANSI_HEIGHT - 16,
              }}
            >
              <Line
                x1={1}
                y1={0}
                x2={1}
                y2={KWITANSI_HEIGHT - 16}
                stroke="#65a30d"
                strokeWidth={1}
                strokeDasharray="4, 3"
              />
            </Svg>
          ) : null}

          {/* Lapisan Teks & Konten Vektor Bersih */}
          <View style={styles.contentWrapper}>
            {/* Sisi Kiri (Stub/Arsip Kas ~20.8%) */}
            <View style={styles.stubSection} />

            {/* Sisi Kanan (Badan Utama Kwitansi ~79.2%) */}
            <View style={styles.mainSection}>
              {/* Top 3 Formal Rows */}
              <View style={styles.topRowsContainer}>
                {/* Row 1: Telah Diterima Dari */}
                <View style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Telah Diterima Dari</Text>
                  <Text style={styles.rowColon}>:</Text>
                  <Text style={styles.rowValuePemberi}>
                    {data.pemberi || "PIMPINAN RANTING FATAYAT NU DAWUHAN SELATAN"}
                  </Text>
                </View>

                {/* Row 2: Uang Sebanyak */}
                <View style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Uang Sebanyak</Text>
                  <Text style={styles.rowColon}>:</Text>
                  <Text style={styles.rowValueTerbilang}>
                    {data.terbilang || "Tiga Juta Rupiah"}
                  </Text>
                </View>

                {/* Row 3: Guna Membayar */}
                <View style={styles.rowItem}>
                  <Text style={styles.rowLabel}>Guna Membayar</Text>
                  <Text style={styles.rowColon}>:</Text>
                  <Text style={styles.rowValueUraian}>
                    {formatUraianBelanja(data.uraian) || "Belanja Sound Aktif sebanyak 1 unit x @ Rp. 3.000.000 = Rp. 3.000.000"}
                  </Text>
                </View>
              </View>

              {/* Middle Section: Cyan Parallelogram Nominal Badge */}
              <View style={styles.middleSection}>
                <View style={styles.nominalBadgeWrapper}>
                  {/* Svg Parallelogram Polygon */}
                  <Svg width="130" height="24" style={{ position: "absolute", top: 0, left: 0 }}>
                    <Polygon
                      points="12,0 130,0 118,24 0,24"
                      fill="#06b6d4"
                      stroke="#ecfeff"
                      strokeWidth={1}
                    />
                  </Svg>
                  <Text style={styles.nominalBadgeText}>
                    Rp. {data.nominal || "3.000.000"},-
                  </Text>
                </View>

                {Boolean(data.totalPajak && data.totalPajak > 0) ? (
                  <View style={styles.taxBadge}>
                    <Text style={styles.taxTextPrimary}>
                      Pot. Pajak: Rp {data.totalPajak.toLocaleString("id-ID")}
                    </Text>
                    <Text style={styles.taxTextSecondary}>
                      Netto: Rp {data.nominalBersih.toLocaleString("id-ID")}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Bottom Section: 3-Column Signatories */}
              <View style={styles.signatoriesGrid}>
                {/* Column 1: Setuju Dibayar (Ketua) */}
                <View style={styles.signatoryCol}>
                  <View style={styles.signatoryTitleContainer}>
                    <Text style={styles.signatoryTitleTop}>Setuju dibayar</Text>
                    <Text style={styles.signatoryTitleSub}>{ketuaTitles.line1}</Text>
                    <Text style={styles.signatoryTitleSub}>{ketuaTitles.line2}</Text>
                  </View>
                  {/* Ruang Lapang untuk Tanda Tangan */}
                  <View style={styles.signatorySpace} />
                  <Text style={styles.signatoryName}>{data.ketua || "HENI FUJIATI"}</Text>
                </View>

                {/* Column 2: Lunas Dibayar (Bendahara) */}
                <View style={styles.signatoryCol}>
                  <View style={styles.signatoryTitleContainer}>
                    <Text style={styles.signatoryTitleMid}>
                      Lunas dibayar Tgl :{" "}
                      <Text style={{ fontWeight: "bold", color: "#0f172a" }}>
                        {formatDisplayDate(data.tanggal)}
                      </Text>
                    </Text>
                    <Text style={styles.signatoryTitleSub}>Bendahara</Text>
                  </View>
                  {/* Ruang Lapang untuk Tanda Tangan */}
                  <View style={styles.signatorySpace} />
                  <Text style={styles.signatoryName}>{data.bendahara || "NUR ALIMAH"}</Text>
                </View>

                {/* Column 3: Yang Menerima */}
                <View style={styles.signatoryCol}>
                  <View style={styles.signatoryTitleContainer}>
                    <Text style={styles.signatoryTitleTop}>Yang Menerima</Text>
                  </View>

                  {/* Materai 10.000 diposisikan di ruang tanda tangan penerima */}
                  {Boolean(data.denganMaterai) ? (
                    <View style={styles.materaiBox}>
                      <Text style={styles.materaiText1}>MATERAI</Text>
                      <Text style={styles.materaiText2}>Rp 10.000</Text>
                    </View>
                  ) : null}

                  {/* Ruang Lapang untuk Tanda Tangan */}
                  <View style={styles.signatorySpace} />

                  {data.penerima ? (
                    <Text style={styles.signatoryName}>{data.penerima}</Text>
                  ) : (
                    <Text style={styles.signatoryDots}>.......................................</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default KwitansiPdfDocument;
