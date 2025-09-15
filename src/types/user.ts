export interface User {
  userId: number;
  userName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  restaurants?: string;
  createdAt: string;
  updatedAt: string;
}
// DTO cho API tạo user
export interface CreateUserDto {
  role: string;
  userName: string;
  userPassword: string;
  email: string;
  phone: string;
  address: string;
}


export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  image?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userId: number; // Người sở hữu nhà hàng 
}
