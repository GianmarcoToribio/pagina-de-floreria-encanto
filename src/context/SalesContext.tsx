import React, { createContext, useContext, useState } from 'react';
import { useInventory } from './InventoryContext';

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ruc?: string;
}

interface Sale {
  id: string;
  items: SaleItem[];
  customer: Customer;
  total: number;
  subtotal: number;
  tax: number;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card';
  invoiceType: 'boleta' | 'factura';
  notes?: string;
}

interface SalesContextType {
  sales: Sale[];
  createSale: (sale: Omit<Sale, 'id'>) => string;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  cancelSale: (id: string) => void;
  getSale: (id: string) => Sale | undefined;
}

const SalesContext = createContext<SalesContextType>({
  sales: [],
  createSale: () => '',
  updateSale: () => {},
  cancelSale: () => {},
  getSale: () => undefined
});

export const useSales = () => useContext(SalesContext);

// Sample data
const initialSales: Sale[] = [
  {
    id: '1001',
    items: [
      { productId: '1', quantity: 2, price: 45.00, subtotal: 90.00 },
      { productId: '3', quantity: 1, price: 42.00, subtotal: 42.00 }
    ],
    customer: {
      id: 'c1',
      name: 'María González',
      email: 'maria@example.com',
      phone: '555-1234'
    },
    total: 132.00,
    subtotal: 132.00,
    tax: 0,
    date: '2023-07-15T10:30:00',
    status: 'completed',
    paymentMethod: 'cash',
    invoiceType: 'boleta'
  },
  {
    id: '1002',
    items: [
      { productId: '2', quantity: 1, price: 60.00, subtotal: 60.00 },
      { productId: '6', quantity: 1, price: 55.00, subtotal: 55.00 }
    ],
    customer: {
      id: 'c2',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '555-5678',
      ruc: '20123456789'
    },
    total: 135.70,
    subtotal: 115.00,
    tax: 20.70,
    date: '2023-07-14T15:45:00',
    status: 'completed',
    paymentMethod: 'card',
    invoiceType: 'factura'
  },
  {
    id: '1003',
    items: [
      { productId: '4', quantity: 1, price: 65.00, subtotal: 65.00 }
    ],
    customer: {
      id: 'c3',
      name: 'Sofía Ramírez',
      email: 'sofia@example.com',
      phone: '555-9012'
    },
    total: 65.00,
    subtotal: 65.00,
    tax: 0,
    date: '2023-07-14T09:15:00',
    status: 'pending',
    paymentMethod: 'card',
    invoiceType: 'boleta'
  },
  {
    id: '1004',
    items: [
      { productId: '5', quantity: 1, price: 85.00, subtotal: 85.00 }
    ],
    customer: {
      id: 'c4',
      name: 'Carlos Mendoza',
      email: 'carlos@example.com',
      phone: '555-3456'
    },
    total: 85.00,
    subtotal: 85.00,
    tax: 0,
    date: '2023-07-13T14:00:00',
    status: 'completed',
    paymentMethod: 'cash',
    invoiceType: 'boleta'
  }
];

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const { updateProduct } = useInventory();

  const createSale = (sale: Omit<Sale, 'id'>) => {
    const newId = (Number(sales[0]?.id || '1000') + 1).toString();
    const newSale = { ...sale, id: newId };
    
    setSales([newSale, ...sales]);
    
    // Update inventory
    sale.items.forEach(item => {
      updateProduct(item.productId, {
        stock: (prev: number) => prev - item.quantity
      } as any);
    });
    
    return newId;
  };

  const updateSale = (id: string, updatedFields: Partial<Sale>) => {
    setSales(
      sales.map(sale => 
        sale.id === id ? { ...sale, ...updatedFields } : sale
      )
    );
  };

  const cancelSale = (id: string) => {
    const sale = sales.find(s => s.id === id);
    
    if (sale && sale.status !== 'cancelled') {
      // Update sale status
      updateSale(id, { status: 'cancelled' });
      
      // Return items to inventory
      sale.items.forEach(item => {
        updateProduct(item.productId, {
          stock: (prev: number) => prev + item.quantity
        } as any);
      });
    }
  };

  const getSale = (id: string) => {
    return sales.find(sale => sale.id === id);
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        createSale,
        updateSale,
        cancelSale,
        getSale
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};