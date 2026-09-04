import { Router } from "express";
import * as receiptService from "../services/receipt.service";
import { authenticate, type AuthRequest } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const receiptRouter = Router();

// =============================================================================
// Receipt Download (authenticated + ownership verified)
// =============================================================================

receiptRouter.get("/receipts/:uid", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { uid } = req.params as { uid: string };
    const type = (req.query.type as string) || "donation";
    const format = (req.query.format as string) || "html";

    // Verify ownership
    if (type === "pledge") {
      const pledge = await prisma.pledge.findUnique({ where: { uid }, select: { userId: true } });
      if (!pledge || (pledge.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
      const data = await receiptService.getPledgeReceipt(uid);
      if (!data) {
        throw new AppError(404, "Receipt not found");
      }

      if (format === "html") {
        const html = receiptService.generateReceiptHTML(data);
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Disposition", `attachment; filename="receipt-${uid}.html"`);
        res.send(html);
        return;
      }

      res.json({ status: "success", data });
    } else {
      const donation = await prisma.donation.findUnique({ where: { uid }, select: { userId: true } });
      if (!donation || (donation.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
      const data = await receiptService.getDonationReceipt(uid);
      if (!data) {
        throw new AppError(404, "Receipt not found");
      }

      if (format === "html") {
        const html = receiptService.generateReceiptHTML(data);
        res.setHeader("Content-Type", "text/html");
        res.setHeader("Content-Disposition", `attachment; filename="receipt-${uid}.html"`);
        res.send(html);
        return;
      }

      res.json({ status: "success", data });
    }
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Receipt PDF Download (authenticated + ownership verified)
// =============================================================================

receiptRouter.get("/receipts/:uid/pdf", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { uid } = req.params as { uid: string };
    const type = (req.query.type as string) || "donation";

    // Verify ownership
    if (type === "pledge") {
      const pledge = await prisma.pledge.findUnique({ where: { uid }, select: { userId: true } });
      if (!pledge || (pledge.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
    } else {
      const donation = await prisma.donation.findUnique({ where: { uid }, select: { userId: true } });
      if (!donation || (donation.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
    }

    const pdfBuffer = await receiptService.generateReceiptPDF(
      uid,
      type as "donation" | "pledge"
    );

    if (!pdfBuffer) {
      throw new AppError(404, "Receipt not found");
    }

    // For now, return HTML (in production, return PDF)
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${uid}.html"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// E-Card Generation
// =============================================================================

receiptRouter.get(
  "/ecards/:uid",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { uid } = req.params as { uid: string };
      const message = req.query.message as string | undefined;

      const html = await receiptService.generateECard(uid, message);
      if (!html) {
        res.status(404).json({ status: "error", message: "E-card not found" });
        return;
      }

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
);

receiptRouter.get(
  "/ecards/:uid/download",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      const { uid } = req.params as { uid: string };
      const message = req.query.message as string | undefined;

      const html = await receiptService.generateECard(uid, message);
      if (!html) {
        res.status(404).json({ status: "error", message: "E-card not found" });
        return;
      }

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="ecard-${uid}.html"`);
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// Receipt Data (JSON, authenticated + ownership verified)
// =============================================================================

receiptRouter.get("/receipts/:uid/data", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { uid } = req.params as { uid: string };
    const type = (req.query.type as string) || "donation";

    // Verify ownership
    if (type === "pledge") {
      const pledge = await prisma.pledge.findUnique({ where: { uid }, select: { userId: true } });
      if (!pledge || (pledge.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
      const data = await receiptService.getPledgeReceipt(uid);
      if (!data) {
        throw new AppError(404, "Receipt not found");
      }
      res.json({ status: "success", data });
    } else {
      const donation = await prisma.donation.findUnique({ where: { uid }, select: { userId: true } });
      if (!donation || (donation.userId !== req.userId && req.userRole !== "admin")) {
        throw new AppError(404, "Receipt not found");
      }
      const data = await receiptService.getDonationReceipt(uid);
      if (!data) {
        throw new AppError(404, "Receipt not found");
      }
      res.json({ status: "success", data });
    }
  } catch (error) {
    next(error);
  }
});

export { receiptRouter };
