// "use client";

// import axiosInstance from "@/lib/axios/axiosInstance";
// import { Button, Form, Input, Modal } from "antd";
// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";

// interface UserUpdateModalProps {
//   open: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
//   currentUser: {
//     userId: number;
//     userName: string;
//     email: string;
//     phone: string;
//   };
// }

// interface UserFormValues {
//   userName: string;
//   email: string;
//   phone: string;
// }

// const UserUpdateModal: React.FC<UserUpdateModalProps> = ({
//   open,
//   onClose,
//   onSuccess,
//   currentUser,
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [form] = Form.useForm<UserFormValues>();

//   useEffect(() => {
//     if (open && currentUser) {
//       form.setFieldsValue({
//         userName: currentUser.userName,
//         email: currentUser.email,
//         phone: currentUser.phone,
//       });
//     }
//   }, [open, currentUser, form]);

//   const handleSubmit = () => {
//     form.submit();
//   };

//   const onFinish = async (values: UserFormValues) => {
//     setLoading(true);
//     try {
//       const response = await axiosInstance.put(
//         `/api/User/${currentUser.userId}`,
//         values
//       );

//       if (response.data?.errCode === 0 || response.status === 200) {
//         toast.success("Cập nhật thông tin thành công!");
//         onClose();
//         onSuccess();
//       } else {
//         toast.error("Cập nhật thất bại!");
//       }
//     } catch (error) {
//       console.error("Lỗi API:", error);
//       toast.error("Cập nhật thất bại!");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Modal
//       open={open}
//       title="Chỉnh sửa thông tin cá nhân"
//       onOk={handleSubmit}
//       onCancel={onClose}
//       confirmLoading={loading}
//       okText="Lưu"
//       cancelText="Hủy"
//     >
//       <Form form={form} layout="vertical" onFinish={onFinish}>
//         <Form.Item
//           label="Tên người dùng"
//           name="userName"
//           rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
//         >
//           <Input placeholder="Nhập tên người dùng" />
//         </Form.Item>

//         <Form.Item
//           label="Email"
//           name="email"
//           rules={[
//             { required: true, message: "Vui lòng nhập email!" },
//             { type: "email", message: "Email không hợp lệ!" },
//           ]}
//         >
//           <Input placeholder="Nhập email" />
//         </Form.Item>

//         <Form.Item
//           label="Số điện thoại"
//           name="phone"
//           rules={[
//             { required: true, message: "Vui lòng nhập số điện thoại!" },
//             {
//               pattern: /^[0-9]{10,11}$/,
//               message: "Số điện thoại không hợp lệ!",
//             },
//           ]}
//         >
//           <Input placeholder="Nhập số điện thoại" />
//         </Form.Item>
//       </Form>
//     </Modal>
//   );
// };

// export default UserUpdateModal;
