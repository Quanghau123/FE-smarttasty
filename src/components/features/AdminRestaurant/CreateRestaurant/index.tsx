"use client";

import {
  Box,
  Button,
  Card,
  MenuItem,
  Select,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import AddressAutocomplete from "./AddressAutocomplete";
import dayjs, { Dayjs } from "dayjs";
import { useAppDispatch, useAppSelector } from "@/redux/hook";
import { createRestaurant } from "@/redux/slices/restaurantSlice";
import { getAccessToken } from "@/lib/utils/tokenHelper";

const MapView = dynamic(() => import("@/components/layouts/MapView"), {
  ssr: false,
});

const RestaurantCreatePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mounted, setMounted] = useState(false);
  const { loading } = useAppSelector((state) => state.restaurant);

  const [form, setForm] = useState({
    name: "",
    category: "",
    address: "",
    description: "",
    openTime: dayjs(),
    closeTime: dayjs(),
  });

  const [latitude, setLatitude] = useState(10.762622);
  const [longitude, setLongitude] = useState(106.660172);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setForm((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleTimeChange = (
    name: "openTime" | "closeTime",
    value: Dayjs | null
  ) => {
    if (value) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddressChange = (value: string) => {
    setForm((prev) => ({ ...prev, address: value }));
  };

  const handleAddressSelect = (address: string, lat: number, lon: number) => {
    // When a suggestion is selected, keep only the string up to and including the first
    // occurrence of Ho Chi Minh (various spellings). This ensures the stored address
    // ends at the city level as requested.
    const variants = [
      "Hồ Chí Minh",
      "Ho Chi Minh",
      "TP. Hồ Chí Minh",
      "TP HCM",
      "HCMC",
    ];
    let newAddress = address;
    const lowered = address;
    let foundEnd = -1;
    for (const v of variants) {
      const idx = lowered.indexOf(v);
      if (idx !== -1) {
        foundEnd = idx + v.length;
        break;
      }
    }
    if (foundEnd !== -1) {
      newAddress = address.substring(0, foundEnd);
    }

    setForm((prev) => {
      // If the user already typed a house number at the start of the address input
      // (e.g. "123 Nguyen Hue"), preserve it by prepending to the selected label
      // unless the selected label already begins with that number.
      const m = prev.address.match(/^\s*([0-9]+[A-Za-z0-9\-\/]*)\s*(.*)$/);
      let preserved = "";
      if (m) preserved = m[1];

      let finalAddress = newAddress;
      if (preserved) {
        // if finalAddress doesn't already start with preserved number, prepend it
        const re = new RegExp(`^\\s*${preserved}\\b`);
        if (!re.test(finalAddress)) {
          finalAddress = `${preserved} ${finalAddress}`;
        }
      }

      return { ...prev, address: finalAddress };
    });
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Vui lòng chọn ảnh trước khi tạo.");

    const restaurantData = {
      ...form,
      latitude,
      longitude,
      openTime: form.openTime.format("HH:mm"),
      closeTime: form.closeTime.format("HH:mm"),
      file,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = getAccessToken() || "";

    const resultAction = await dispatch(
      createRestaurant({ token, data: restaurantData })
    );
    if (createRestaurant.fulfilled.match(resultAction)) {
      toast.success("Tạo nhà hàng thành công!");
      router.push("/restaurant");
    } else {
      toast.error("Tạo thất bại, vui lòng kiểm tra lại!");
    }
  };

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Thông tin cơ bản",
    "Vị trí",
    "Ảnh đại diện",
    "Lịch & Mô tả",
    "Xác nhận",
  ];

  const handleNextStep = () =>
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBackStep = () => setActiveStep((s) => Math.max(s - 1, 0));

  return (
    <Box display="flex" justifyContent="center" p={{ xs: 2, md: 3 }}>
      <Box sx={{ width: "100%", maxWidth: 980 }}>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h5" align="center" gutterBottom>
            Tạo nhà hàng mới
          </Typography>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box>
            {activeStep === 0 && (
              <Box>
                <TextField
                  fullWidth
                  label="Tên nhà hàng"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />

                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={form.category}
                    onChange={handleSelectChange}
                    label="Danh mục"
                  >
                    <MenuItem value="Buffet">Buffet</MenuItem>
                    <MenuItem value="NhaHang">Nhà hàng</MenuItem>
                    <MenuItem value="AnVatViaHe">Ăn vặt/vỉa hè</MenuItem>
                    <MenuItem value="AnChay">Ăn chay</MenuItem>
                    <MenuItem value="CafeNuocuong">Cafe/Nuocuong</MenuItem>
                    <MenuItem value="QuanAn">Quán ăn</MenuItem>
                    <MenuItem value="Bar">Bar</MenuItem>
                    <MenuItem value="QuanNhau">Quán nhậu</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Nhập địa chỉ hoặc chọn trên bản đồ
                </Typography>
                <AddressAutocomplete
                  value={form.address}
                  onChange={handleAddressChange}
                  onSelect={handleAddressSelect}
                  placeholder="Địa chỉ"
                />

                {mounted && (
                  <Box
                    mt={2}
                    sx={{
                      width: "100%",
                      height: 300,
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <MapView lat={latitude} lng={longitude} />
                  </Box>
                )}
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Tải lên ảnh đại diện
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Button variant="outlined" component="label">
                    Chọn ảnh
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setFile(e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                  {file && <Typography>{file.name}</Typography>}
                </Box>

                <Box
                  mt={2}
                  sx={{
                    width: "100%",
                    height: 220,
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "grey.100",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {file ? (
                    <Box
                      component="img"
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Typography color="text.secondary">
                      Chưa chọn ảnh
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {activeStep === 3 && (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Mô tả"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  margin="normal"
                  required
                />

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box
                    display="flex"
                    gap={2}
                    mt={2}
                    flexDirection={{ xs: "column", sm: "row" }}
                  >
                    <TimePicker
                      label="Giờ mở cửa"
                      value={form.openTime}
                      onChange={(val) => handleTimeChange("openTime", val)}
                    />
                    <TimePicker
                      label="Giờ đóng cửa"
                      value={form.closeTime}
                      onChange={(val) => handleTimeChange("closeTime", val)}
                    />
                  </Box>
                </LocalizationProvider>
              </Box>
            )}

            {activeStep === 4 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Xác nhận thông tin
                </Typography>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2">Tên:</Typography>
                  <Typography>{form.name || "-"}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Danh mục:
                  </Typography>
                  <Typography>{form.category || "-"}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 1 }}>
                    Địa chỉ:
                  </Typography>
                  <Typography>{form.address || "-"}</Typography>
                </Paper>

                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle2">Ảnh:</Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: 180,
                      mt: 1,
                      overflow: "hidden",
                      borderRadius: 1,
                    }}
                  >
                    {file ? (
                      <Box
                        component="img"
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography color="text.secondary">
                        Chưa chọn ảnh
                      </Typography>
                    )}
                  </Box>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2">Lịch hoạt động:</Typography>
                  <Typography>
                    {form.openTime.format("HH:mm")} -{" "}
                    {form.closeTime.format("HH:mm")}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>

          <Box display="flex" justifyContent="space-between" mt={3}>
            <Button disabled={activeStep === 0} onClick={handleBackStep}>
              Quay lại
            </Button>
            <Box>
              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNextStep}>
                  Tiếp theo
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Đang tạo..." : "Tạo nhà hàng"}
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default RestaurantCreatePage;
