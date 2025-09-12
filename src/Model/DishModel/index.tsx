// import { DataTypes } from "sequelize";
// import axiosInstance from "@/lib/axios/axiosInstance";

// const Dish = sequelize.define(
//   "Dish",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     category: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//     },
//     price: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       validate: {
//         min: 0,
//       },
//     },
//     imageUrl: {
//       type: DataTypes.STRING,
//       field: "image_url",
//     },
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//       field: "is_active",
//     },
//     restaurantId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       field: "restaurant_id",
//     },
//   },
//   {
//     tableName: "dishes",
//     timestamps: true,
//     underscored: true, // Sử dụng snake_case cho các trường
//   }
// );

// export default Dish;
