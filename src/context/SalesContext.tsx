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
  status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  paymentMethod: 'cash' | 'card';
  invoiceType: 'boleta' | 'factura';
  notes?: string;
  shippingStatus?: {
    received?: string;
    processing?: string;
    dispatched?: string;
    transit?: string;
    delivery?: string;
    delivered?: string;
  };
}

interface SalesContextType {
  sales: Sale[];
  createSale: (sale: Omit<Sale, 'id'>) => string;
  updateSale: (id: string, sale: Partial<Sale>) => void;
  cancelSale: (id: string) => void;
  getSale: (id: string) => Sale | undefined;
  updateShippingStatus: (id: string, status: keyof Sale['shippingStatus'], date: string) => void;
}

const SalesContext = createContext<SalesContextType>({
  sales: [],
  createSale: () => '',
  updateSale: () => {},
  cancelSale: () => {},
  getSale: () => undefined,
  updateShippingStatus: () => {}
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
    invoiceType: 'boleta',
    shippingStatus: {
      received: '2023-07-15T10:30:00',
      processing: '2023-07-15T11:00:00',
      dispatched: '2023-07-15T14:00:00',
      transit: '2023-07-15T15:00:00',
      delivery: '2023-07-15T16:00:00',
      delivered: '2023-07-15T17:00:00'
    }
  },
  // ... other initial sales
];

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const { updateProduct } = useInventory();

  const createSale = (sale: Omit<Sale, 'id'>) => {
    const newId = (Number(sales[0]?.id || '1000') + 1).toString();
    const newSale = { 
      ...sale, 
      id: newId,
      shippingStatus: {
        received: new Date().toISOString()
      }
    };
    
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

  const updateShippingStatus = (id: string, status: keyof Sale['shippingStatus'], date: string) => {
    setSales(
      sales.map(sale => {
        if (sale.id === id) {
          return {
            ...sale,
            shippingStatus: {
              ...sale.shippingStatus,
              [status]: date
            }
          };
        }
        return sale;
      })
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
        getSale,
        updateShippingStatus
      }}
    >
      {children}
    </SalesContext.Provider>
  );
};