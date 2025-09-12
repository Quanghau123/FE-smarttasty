// "use client";

// import { useEffect, useState } from "react";
// import { Card, Checkbox, Typography, Row, Col } from "antd";

// const { Title } = Typography;

// const PermissionPage = () => {
//   const [permissions, setPermissions] = useState({
//     canEditUser: false,
//     canDeleteUser: false,
//     canDeleteBusiness: false,
//     canEditRestaurant: false,
//     canDeleteRestaurant: false,
//   });

//   useEffect(() => {
//     const stored = localStorage.getItem("userPermissions");
//     if (stored) {
//       try {
//         const parsed = JSON.parse(stored);
//         setPermissions({
//           canEditUser: parsed.canEditUser || false,
//           canDeleteUser: parsed.canDeleteUser || false,
//           canDeleteBusiness: parsed.canDeleteBusiness || false,
//           canEditRestaurant: parsed.canEditRestaurant || false,
//           canDeleteRestaurant: parsed.canDeleteRestaurant || false,
//         });
//       } catch (err) {
//         console.error("Lỗi parse quyền:", err);
//       }
//     }
//   }, []);

//   const handleChange =
//     (key: keyof typeof permissions) => (checked: boolean) => {
//       const updated = { ...permissions, [key]: checked };
//       setPermissions(updated);
//       localStorage.setItem("userPermissions", JSON.stringify(updated));
//     };

//   const permissionList = [
//     {
//       key: "canEditUser",
//       label: "Cho phép sửa thông tin user",
//     },
//     {
//       key: "canDeleteUser",
//       label: "Cho phép xoá user",
//     },
//     {
//       key: "canDeleteBusiness",
//       label: "Cho phép xoá business",
//     },
//     {
//       key: "canEditRestaurant",
//       label: "Cho phép cập nhật nhà hàng",
//     },
//     {
//       key: "canDeleteRestaurant",
//       label: "Cho phép xoá nhà hàng",
//     },
//   ];

//   return (
//     <div style={{ padding: 32 }}>
//       <Card title="Quản lý quyền Admin" style={{ maxWidth: 600 }}>
//         <Row style={{ fontWeight: "bold", marginBottom: 12 }}>
//           <Col span={18}>Name</Col>
//           <Col span={6}>Admin</Col>
//         </Row>
//         {permissionList.map((item) => (
//           <Row key={item.key} style={{ marginBottom: 12 }} align="middle">
//             <Col span={18}>{item.label}</Col>
//             <Col span={6}>
//               <Checkbox
//                 checked={permissions[item.key as keyof typeof permissions]}
//                 onChange={(e) =>
//                   handleChange(item.key as keyof typeof permissions)(
//                     e.target.checked
//                   )
//                 }
//               />
//             </Col>
//           </Row>
//         ))}
//       </Card>
//     </div>
//   );
// };

// export default PermissionPage;
