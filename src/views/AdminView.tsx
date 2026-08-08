import React from 'react';
import { Product, RemoteService, RemoteBooking, Order, BlogPost } from '../types';
import { AdminLayout } from '../components/admin/AdminLayout';

interface AdminViewProps {
  products: Product[];
  services?: RemoteService[];
  blogs?: BlogPost[];
  orders: Order[];
  bookings: RemoteBooking[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct?: (prod: Product) => void;
  onDeleteProduct?: (prodId: string) => void;
  onAddService?: (srv: RemoteService) => void;
  onUpdateService?: (srv: RemoteService) => void;
  onDeleteService?: (srvId: string) => void;
  onAddBlog?: (blog: BlogPost) => void;
  onDeleteBlog?: (blogId: string) => void;
  onUpdateBooking?: (booking: RemoteBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
  onExitAdmin?: () => void;
  onPublishCatalog?: () => Promise<{ success: boolean; message?: string }>;
  onSelectProductPreview?: (prod: Product) => void;
}

export const AdminView: React.FC<AdminViewProps> = (props) => {
  return <AdminLayout {...props} />;
};
