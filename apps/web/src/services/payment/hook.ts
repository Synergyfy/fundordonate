import { useMutation } from "@tanstack/react-query";
import { paymentService } from "./index";
import type { ConfirmMcomChargeInput, CreateMcomChargeInput } from "./type";

export const paymentKeys = {
  all: ["payment"] as const,
};

export function useCreatePaymentCharge() {
  return useMutation({
    mutationFn: (input: CreateMcomChargeInput) => paymentService.createCharge(input),
  });
}

export function useConfirmPaymentCharge() {
  return useMutation({
    mutationFn: ({
      chargeId,
      handle,
    }: {
      chargeId: string;
      handle?: ConfirmMcomChargeInput;
    }) => paymentService.confirmCharge(chargeId, handle),
  });
}
