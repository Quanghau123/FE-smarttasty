"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Paper,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import {
  createVNPayPayment,
  createCODPayment,
} from "@/redux/slices/paymentSlice";
import { applyPromotion } from "@/redux/slices/orderPromotionsSlice";
import { Payment } from "@/types/payment";
import type { OrderResponse } from "@/types/order";
import { useRouter } from "next/navigation";
import { fetchPromotions } from "@/redux/slices/promotionSlice";

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                             */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  Using shared order types from src/types/order.ts                                */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */
const PaymentPage = () => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState<string>("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [originalTotal, setOriginalTotal] = useState<number | null>(null);
  const dispatch = useAppDispatch();

  /* --------------------------- LOAD ORDER FROM LS -------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem("checkoutOrder");
    if (stored) {
      try {
        const parsed: OrderResponse = JSON.parse(stored);
        setOrder(parsed);
      } catch (error) {
        console.error("Invalid checkoutOrder format:", error);
        router.push("/cart");
      }
    } else {
      router.push("/cart");
    }
  }, [router]);

  // fetch promotions for this restaurant (when order is loaded)
  const promotions = useAppSelector((s) => s.promotion?.promotions ?? []);
  useEffect(() => {
    if (order?.restaurantId) {
      dispatch(fetchPromotions(order.restaurantId));
    }
  }, [order?.restaurantId, dispatch]);

  // collect vouchers from promotions that target order
  const now = new Date();
  // Build a combined list of selectable order promotions:
  // - vouchers (code present)
  // - promotion-only entries (no voucher) so user can choose to apply order-level promotions
  const orderOptions = promotions
    .filter((p) => p.targetType === "order")
    .filter((p) => {
      try {
        const start = p.startDate ? new Date(p.startDate) : null;
        const end = p.endDate ? new Date(p.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
      } catch {
        // if parse fails, include by default
      }
      return true;
    })
    .flatMap((p) => {
      const list: Array<{
        kind: "voucher" | "promotion";
        value: string; // voucher code or promotion id string
        label: string;
        discountType?: string;
        discountValue?: number;
      }> = [];

      if (p.vouchers && p.vouchers.length > 0) {
        for (const v of p.vouchers) {
          list.push({
            kind: "voucher",
            value: String(v.code ?? ""),
            label: `${v.code ?? ""} — ${p.title}`,
            discountType: p.discountType,
            discountValue: p.discountValue,
          });
        }
      } else {
        // promotion without voucher: allow user to select it (server will apply order promotions when called without voucherCode)
        list.push({
          kind: "promotion",
          value: String(p.id),
          label: `${p.title}`,
          discountType: p.discountType,
          discountValue: p.discountValue,
        });
      }

      return list;
    });

  type ApplyResponse = {
    OriginalTotal?: number;
    FinalTotal?: number;
    VoucherCode?: string;
    originalTotal?: number;
    finalTotal?: number;
    voucherCode?: string;
  };

  /* ------------------------------ TOTAL PRICE ------------------------------ */
  const total = order?.items?.reduce(
    (sum, item) => sum + (item.totalPrice || 0),
    0
  );

  // finalTotal and originalTotal are updated from server when applyPromotion is called

  /* ---------------------------- HANDLE PAYMENT ----------------------------- */
  const handleConfirmPayment = async () => {
    if (!order) return;

    setLoading(true);
    try {
      const amount =
        typeof finalTotal === "number"
          ? finalTotal
          : order.items?.reduce(
              (sum, item) => sum + (item.totalPrice || 0),
              0
            ) || 0;

      if (paymentMethod === "VNPAY") {
        // create VNPay payment and redirect user to the returned paymentUrl
        const action = await dispatch(
          createVNPayPayment({ orderId: order.id, amount })
        ).unwrap();

        // backend PaymentDto contains paymentUrl
        const paymentAction = action as unknown as Payment;
        const paymentUrl = paymentAction?.paymentUrl;
        if (paymentUrl) {
          // redirect browser to VNPay gateway
          window.location.href = paymentUrl;
          return;
        }

        // fallback: if no URL, treat as success and navigate to orders
        localStorage.removeItem("checkoutOrder");
        router.push("/purchase");
        return;
      }

      if (paymentMethod === "COD") {
        // create COD payment (server will set method/status)
        await dispatch(
          createCODPayment({ orderId: order.id, amount })
        ).unwrap();

        alert("✅ COD payment created. Vui lòng chuẩn bị tiền khi nhận hàng.");
        localStorage.removeItem("checkoutOrder");
        router.push("/purchase");
        return;
      }
    } catch (error: unknown) {
      console.error("❌ Lỗi thanh toán:", error);
      const msg =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "Thanh toán thất bại";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  /* ------------------------------- RENDER UI ------------------------------- */
  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        💳 Thanh toán đơn hàng
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" color="primary">
          🍽️ {order.restaurant?.name || `Nhà hàng #${order.restaurantId}`}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Địa chỉ: {order.restaurant?.address || "Chưa có địa chỉ"}
        </Typography>
        <Divider sx={{ my: 1 }} />

        {order.items?.map((item) => (
          <Box
            key={item.id}
            display="flex"
            justifyContent="space-between"
            mt={1}
          >
            <Typography>
              {item.dishName} × {item.quantity}
            </Typography>
            <Typography>{item.totalPrice.toLocaleString()}đ</Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />
        <Box mb={2}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={1}
          >
            <Typography variant="subtitle1">
              Áp dụng ưu đãi và giảm giá
            </Typography>
            {typeof finalTotal === "number" && (
              <Box
                display="flex"
                alignItems="center"
                sx={{ color: "success.main" }}
              >
                <CheckCircleIcon sx={{ mr: 0.5 }} fontSize="small" />
                <Typography variant="body2" color="success.main">
                  Đã áp dụng
                </Typography>
              </Box>
            )}
          </Box>
          {orderOptions && orderOptions.length > 0 ? (
            <FormControl fullWidth size="small">
              <InputLabel id="voucher-select-label">
                Chọn mã giảm giá
              </InputLabel>
              <Select
                labelId="voucher-select-label"
                value={voucherCode || ""}
                label="Chọn mã giảm giá"
                disabled={applyingVoucher}
                onChange={async (e) => {
                  const val = e.target.value as string;
                  // value encoding: for voucher -> 'voucher:<code>'; for promotion -> 'promotion:<id>'
                  if (!val) {
                    setVoucherCode("");
                    setFinalTotal(null);
                    setOriginalTotal(null);
                    return;
                  }

                  // parse value
                  const [kind, payload] = val.split(":");
                  setVoucherCode(kind === "voucher" ? payload : "");
                  if (!order) return;

                  setApplyingVoucher(true);
                  try {
                    if (kind === "voucher") {
                      const res = await dispatch(
                        applyPromotion({
                          orderId: order.id,
                          voucherCode: payload || undefined,
                        })
                      ).unwrap();
                      const r = res as ApplyResponse;
                      const orig = r?.OriginalTotal ?? r?.originalTotal ?? null;
                      const fin = r?.FinalTotal ?? r?.finalTotal ?? null;
                      if (orig != null) setOriginalTotal(Number(orig));
                      if (fin != null) setFinalTotal(Number(fin));
                    } else {
                      // promotion-only: call apply without voucherCode so server will apply order promotions
                      const res = await dispatch(
                        applyPromotion({ orderId: order.id })
                      ).unwrap();
                      const r = res as ApplyResponse;
                      const orig = r?.OriginalTotal ?? r?.originalTotal ?? null;
                      const fin = r?.FinalTotal ?? r?.finalTotal ?? null;
                      if (orig != null) setOriginalTotal(Number(orig));
                      if (fin != null) setFinalTotal(Number(fin));
                    }
                  } catch (err: unknown) {
                    const msg =
                      err instanceof Error ? err.message : String(err);
                    alert(`Áp mã thất bại: ${msg}`);
                  } finally {
                    setApplyingVoucher(false);
                  }
                }}
              >
                <MenuItem value="">Không dùng</MenuItem>
                {orderOptions.map((opt, i) => (
                  <MenuItem key={i} value={`${opt.kind}:${opt.value}`}>
                    {opt.label}{" "}
                    {opt.discountType
                      ? `— ${
                          opt.discountType === "percent"
                            ? `${opt.discountValue}%`
                            : `${Number(opt.discountValue).toLocaleString()}đ`
                        }`
                      : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có mã giảm giá cho đơn hàng này
            </Typography>
          )}
        </Box>

        <Box>
          <Box display="flex" justifyContent="space-between">
            <Typography color="text.secondary">Giá gốc</Typography>
            <Typography>
              {Number(originalTotal ?? total ?? 0).toLocaleString()}đ
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography color="text.secondary">Số tiền giảm</Typography>
            <Typography color="error">
              {Number(
                (originalTotal ?? total ?? 0) - (finalTotal ?? total ?? 0)
              ).toLocaleString()}
              đ
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight="bold">Thành tiền</Typography>
            <Typography fontWeight="bold">
              {Number(finalTotal ?? total ?? 0).toLocaleString()}đ
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Phương thức thanh toán</Typography>
        <RadioGroup
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as "COD" | "VNPAY")}
        >
          <FormControlLabel
            value="COD"
            control={<Radio />}
            label="Thanh toán khi nhận hàng"
          />
          <FormControlLabel value="VNPAY" control={<Radio />} label="VNPay" />
        </RadioGroup>
      </Paper>

      <Button
        fullWidth
        variant="contained"
        color="success"
        disabled={loading}
        onClick={handleConfirmPayment}
      >
        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
          >
            <CircularProgress size={18} color="inherit" />
            <Typography component="span">Đang xử lý...</Typography>
          </Box>
        ) : (
          "Xác nhận thanh toán"
        )}
      </Button>
    </Box>
  );
};

export default PaymentPage;
