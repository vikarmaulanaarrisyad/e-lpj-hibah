# Project Context & Guidelines: E-LPJ Hibah Internal

## 1. Project Overview
"E-LPJ Hibah Internal" is a secure internal web application built with **Next.js (App Router)** and **TypeScript** to automate grant reporting (LPJ Hibah), receipt uploads, budget tracking, and multi-tier internal verification for government or organizational internal use.

## 2. Tech Stack & Styling
- **Framework:** Next.js (App Router) with TypeScript (Strict Mode, NO `any` types).
- **Styling:** Tailwind CSS with a strict custom color palette:
  - Primary: `#065F46` (Dark Green - Main actions, headers, active states)
  - Secondary: `#047857` (Medium Green - Secondary actions)
  - Tertiary: `#D97706` (Amber/Orange - Warnings, revisions, soft actions)
  - Neutral: `#0F172A` (Dark Slate - Headings, dark mode elements)
- **UI Components:** shadcn/ui & Lucide React icons.
- **Database & ORM:** PostgreSQL with Prisma ORM.
- **Validation:** React Hook Form + Zod (Strict financial validation: positive numbers, valid receipt dates, anti-double-claim).

## 3. Strict Architectural Layers (Separation of Concerns)
You must strictly follow a 3-tier architecture for all data mutations and queries:
1. **Repository Layer (`src/repositories/`):** 
   - Contains ONLY raw database queries using Prisma Client. 
   - No business rules or validation logic here.
2. **Service Layer (`src/services/`):** 
   - Contains core business logic, constraints, and calculations (e.g., preventing expenses from exceeding the grant/NPHD budget).
3. **Action Layer (`src/app/actions/` or Server Actions):** 
   - Handles Next.js form submissions, calls the service layer, and returns a consistent response type: `{ success: boolean; message: string; data?: any }`.

## 4. UI Layout & Route Structure
- Use Next.js Route Groups to enforce strict role separation:
  - `src/app/(dashboard)/admin/...` (For Super Admin / Verifikator)
  - `src/app/(dashboard)/user/...` (For Grant Recipients / Penerima Hibah)

## 5. Coding Rules for AI Assistants
- Always write fully typed TypeScript code. Do not use shortcuts like `any`.
- Wrap all database mutations in proper `try-catch` blocks.
- Adhere strictly to the defined custom color palette via Tailwind classes (`brand-primary`, `brand-secondary`, etc.).
- When creating new features, always implement them following the Repository -> Service -> Action flow.

## 6. UI/UX Guidelines
- **Theme:** Dark Mode Default.
- **Color Palette:**Strictly adhere to the custom palette (`#065F46`, `#047857`, `#D97706`, `#0F172A`).
- **Responsiveness:** All pages must be fully responsive and usable on mobile devices.
- **Modals:** For detailed data display (like `DetailPengajuanModal`) or status popups, use centered full-screen modals (`ModalWrapper` style).

## 7. Validation & Financial Logic Rules
- **Receipt Dates:** Must be between `nphd.tanggal_mulai` and `nphd.tanggal_selesai` (inclusive).
- **Anti-Double Claim:** When creating an expense, the `checkAntiDoubleClaim` function must be used to prevent claiming the same receipt number for the same NPHD more than once.
- **Receipt Status:** Receipts can be marked as " digunakan" (used) if they are attached to an approved expense.
- **Role-Based Actions:**
  - `Admin` (Super Admin) can approve, reject, or request revisions for any submission.
  - `User` (Recipient) can only submit and upload receipts/documents.

## 8. Image Handling & Processing
- **Receipts:** Max file size 5MB. Upscaled to 3000px width if smaller.
- **File Naming:** Backend automatically renames files to `[date]_[uniqueid].jpg` (e.g., `2026-08-14_5a84f1.jpg`) to prevent server storage issues.     

## 9. File Upload & Image Optimization Rules
- **Receipt Image Handling:**
  - **Upscaling:** If the uploaded receipt image width is less than 3000px, automatically upscale it to exactly 3000px width using Sharp (maintain aspect ratio).
  - **File Naming:** Automatically rename uploaded files to `[date]_[uniqueid].jpg` (e.g., `2026-08-14_5a84f1.jpg`) to prevent server storage issues and filename conflicts.
  - **Image Optimization:** Use Sharp to compress images to ~85% quality and optimize file size while maintaining high visual quality.
  - **Storage:** Upload to the `receipts` folder in the uploads directory.
- **Document File Handling:**
  - **Supported Formats:** JPG, PNG, PDF (max 5MB each).
  - **No Processing:** Do not modify or process document files (keep original format and quality).
  - **File Naming:** Automatically rename to `[type]_[uniqueid].[ext]` (e.g., `proposal_e4a8c1.pdf`, `sp2d_9f2b7d.jpg`).
  - **Storage:** Upload to the `documents/[type]` subfolders (e.g., `documents/proposal`, `documents/sp2d`).

## 10. Output Format Rules
- **Images:** Always convert image data to **Base64** format when returning from backend operations or server actions. Do NOT return raw binary data or Blob objects.
- **PDFs:** Return raw `Uint8Array` or `ArrayBuffer` for PDFs.
- **Consistency:** Maintain consistent data structures across all API responses and server actions
