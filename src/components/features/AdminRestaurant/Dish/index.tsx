// "use client";

// import { useEffect, useState } from "react";
// import { Card, Typography, Modal, Divider, Spin } from "antd";
// import axios from "axios";
// import styles from "./styles.module.scss";

// const { Title, Paragraph, Text } = Typography;

// // Kiểu dữ liệu cho Dish
// type Dish = {
//   id: number;
//   name: string;
//   category: number; // enum từ BE: 0-Buffet, 1-Thức ăn, 2-Nước uống, 3-Thức ăn thêm
//   description: string;
//   price: number;
//   imageUrl: string;
//   isActive: boolean;
//   restaurantId: number;
// };

// // Map category enum sang tiếng Việt
// const categoryMap: Record<number, string> = {
//   0: "Buffet",
//   1: "Thức ăn",
//   2: "Nước uống",
//   3: "Thức ăn thêm",
// };

// // Tính giá cuối (tạm chưa có discount từ BE)
// const getFinalPrice = (price: number) => price;

// export default function DishPage() {
//   const [dishes, setDishes] = useState<Dish[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [activeCategory, setActiveCategory] = useState("Tất cả");

//   const categories = [
//     "Tất cả",
//     "Buffet",
//     "Thức ăn",
//     "Nước uống",
//     "Thức ăn thêm",
//   ];

//   // Gọi API lấy danh sách dish
//   useEffect(() => {
//     const fetchDishes = async () => {
//       try {
//         const response = await axios.get("/api/dish"); // hoặc http://localhost:5000/api/dish
//         setDishes(response.data);
//       } catch (error) {
//         console.error("Lỗi khi lấy dữ liệu:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchDishes();
//   }, []);

//   const handleClickDish = (dish: Dish) => {
//     setSelectedDish(dish);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedDish(null);
//   };

//   const filteredDishes = dishes.filter((dish) => {
//     if (activeCategory === "Tất cả") return true;
//     return categoryMap[dish.category] === activeCategory;
//   });

//   return (
//     <div className={styles.container}>
//       <Title level={2}>Danh sách món ăn</Title>

//       {/* Bộ lọc danh mục */}
//       <div className={styles.navBar}>
//         {categories.map((cat) => (
//           <button
//             key={cat}
//             className={`${styles.navButton} ${
//               activeCategory === cat ? styles.active : ""
//             }`}
//             onClick={() => setActiveCategory(cat)}
//           >
//             {cat}
//           </button>
//         ))}
//       </div>

//       {/* Hiển thị danh sách món ăn */}
//       {loading ? (
//         <div style={{ textAlign: "center", marginTop: 50 }}>
//           <Spin size="large" />
//         </div>
//       ) : (
//         <div className={styles.dishGrid}>
//           {filteredDishes.map((dish) => (
//             <Card
//               key={dish.id}
//               hoverable
//               className={styles.dishCard}
//               cover={<img alt={dish.name} src={dish.imageUrl} />}
//               onClick={() => handleClickDish(dish)}
//             >
//               <Card.Meta title={dish.name} description={dish.description} />
//               <Paragraph className={styles.priceText}>
//                 Giá:{" "}
//                 <Text strong>
//                   {getFinalPrice(dish.price).toLocaleString()} VNĐ
//                 </Text>
//               </Paragraph>
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Modal chi tiết món ăn */}
//       <Modal
//         title="Chi tiết món ăn"
//         open={isModalOpen}
//         onCancel={handleCloseModal}
//         footer={null}
//       >
//         {selectedDish && (
//           <div style={{ textAlign: "center" }}>
//             <img
//               src={selectedDish.imageUrl}
//               alt={selectedDish.name}
//               style={{
//                 maxWidth: "100%",
//                 borderRadius: 8,
//                 marginBottom: 16,
//               }}
//             />
//             <Title level={4}>{selectedDish.name}</Title>
//             <Paragraph>
//               <strong>Loại:</strong> {categoryMap[selectedDish.category]}
//             </Paragraph>
//             <Paragraph>
//               <strong>Mô tả:</strong> {selectedDish.description}
//             </Paragraph>
//             <Divider />
//             <Paragraph>
//               <strong>Giá:</strong>{" "}
//               <Text strong>{selectedDish.price.toLocaleString()} VNĐ</Text>
//             </Paragraph>
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }
