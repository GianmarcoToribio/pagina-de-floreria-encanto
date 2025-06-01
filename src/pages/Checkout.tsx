import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, FileText, Check, ArrowLeft } from 'lucide-react';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReceiptPDF } from '../components/ReceiptPDF';

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { createSale } = useSales();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [invoiceType, setInvoiceType] = useState<'boleta' | 'factura'>('boleta');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  
  const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = invoiceType === 'factura' ? total * 0.18 : 0;
  const finalTotal = total + tax;

  // Create a preview of the sale for the PDF
  const currentSalePreview = {
    id: 'preview',
    items: cartItems.map((item: any) => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    })),
    customer: user ? {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
    } : null,
    total: finalTotal,
    subtotal: total,
    tax,
    date: new Date().toISOString(),
    status: 'pending' as const,
    paymentMethod,
    invoiceType,
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const sale = {
      items: cartItems.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      },
      total: finalTotal,
      subtotal: total,
      tax,
      date: new Date().toISOString(),
      status: 'completed' as const,
      paymentMethod,
      invoiceType,
    };

    const saleId = createSale(sale);
    localStorage.removeItem('cartItems');
    navigate('/orders');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Finalizar Compra</h1>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen del Pedido</h2>
            <div className="divide-y divide-gray-200">
              {cartItems.map((item: any) => (
                <div key={item.id} className="py-4 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Método de Pago</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="card"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="card" className="ml-3 flex items-center text-sm font-medium text-gray-900">
                  <CreditCard className="mr-2 h-5 w-5 text-gray-400" />
                  Tarjeta de Crédito/Débito
                </label>
              </div>
              
              {paymentMethod === 'card' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      id="cardNumber"
                      value={cardDetails.number}
                      onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <label htmlFor="cardName" className="block text-sm font-medium text-gray-700">
                      Nombre en la Tarjeta
                    </label>
                    <input
                      type="text"
                      id="cardName"
                      value={cardDetails.name}
                      onChange={(e) => setCardDetails({...cardDetails, name: e.target.value})}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700">
                        Fecha de Expiración
                      </label>
                      <input
                        type="text"
                        id="cardExpiry"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label htmlFor="cardCvv" className="block text-sm font-medium text-gray-700">
                        CVV
                      </label>
                      <input
                        type="text"
                        id="cardCvv"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="radio"
                  id="cash"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="cash" className="ml-3 flex items-center text-sm font-medium text-gray-900">
                  <DollarSign className="mr-2 h-5 w-5 text-gray-400" />
                  Efectivo
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tipo de Comprobante</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="boleta"
                  name="invoice"
                  value="boleta"
                  checked={invoiceType === 'boleta'}
                  onChange={() => setInvoiceType('boleta')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="boleta" className="ml-3 flex items-center text-sm font-medium text-gray-900">
                  <FileText className="mr-2 h-5 w-5 text-gray-400" />
                  Boleta
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="factura"
                  name="invoice"
                  value="factura"
                  checked={invoiceType === 'factura'}
                  onChange={() => setInvoiceType('factura')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <label htmlFor="factura" className="ml-3 flex items-center text-sm font-medium text-gray-900">
                  <FileText className="mr-2 h-5 w-5 text-gray-400" />
                  Factura
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 h-fit">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Resumen de Pago</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">IGV (18%)</span>
              <span className="text-gray-900">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <span className="text-base font-medium text-gray-900">Total</span>
              <span className="text-base font-medium text-gray-900">${finalTotal.toFixed(2)}</span>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleCheckout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Confirmar Pedido
              </button>
              <PDFDownloadLink
                document={<ReceiptPDF sale={currentSalePreview} />}
                fileName={`comprobante-preview.pdf`}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {({ loading }) => loading ? 'Generando PDF...' : 'Vista Previa PDF'}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};