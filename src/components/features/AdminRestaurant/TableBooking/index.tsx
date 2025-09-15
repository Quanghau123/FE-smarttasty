"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
} from "@mui/material";
import styles from "./styles.module.scss";

type Table = {
  id: number;
  status: "available" | "booked";
  name: string;
};

const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: "available",
  name: `Bàn ${i + 1}`,
}));

const TableBooking = () => {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", gio: "" });
  const [success, setSuccess] = useState(false);

  const handleTableClick = (table: Table) => {
    if (table.status === "available") {
      setSelectedTable(table);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone || !form.gio || !selectedTable) return;

    setTables((prev) =>
      prev.map((t) =>
        t.id === selectedTable.id ? { ...t, status: "booked" } : t
      )
    );
    setSuccess(true);
    setSelectedTable(null);
    setForm({ name: "", phone: "", gio: "" });

    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <Box className={styles.container}>
      <Typography variant="h5" gutterBottom>
        Chọn bàn bạn muốn đặt
      </Typography>

      <Grid container spacing={2} className={styles.grid}>
        {tables.map((table) => (
          <Grid item xs={4} sm={3} key={table.id} component={"div" as React.ElementType}>
            <Box
              className={`${styles.tableItem} ${
                table.status === "booked" ? styles.booked : ""
              }`}
              onClick={() => handleTableClick(table)}
            >
              {table.name}
            </Box>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!selectedTable} onClose={() => setSelectedTable(null)}>
        <DialogTitle>Đặt {selectedTable?.name}</DialogTitle>
        <DialogContent className={styles.dialogContent}>
          <TextField
            label="Tên của bạn"
            name="name"
            fullWidth
            value={form.name}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            label="Số điện thoại"
            name="phone"
            fullWidth
            value={form.phone}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
          label="giờ"
          name="gio"
          fullWidth
          value={form.gio}
          onChange={handleFormChange}
          margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTable(null)}>Huỷ</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {success && (
        <Alert severity="success" className={styles.alert}>
          Đặt bàn thành công!
        </Alert>
      )}
    </Box>
  );
};

export default TableBooking;
