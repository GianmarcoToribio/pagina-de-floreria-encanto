import React, { useState, useEffect } from 'react';
import { Calendar, Download, BarChart, LineChart, PieChart, TrendingUp, Users } from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import { usePurchases } from '../context/PurchasesContext';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const Reports: React.FC = () => {
  const { sales } = useSales();
  const { products, categories } = useInventory();
  const { purchases } = usePurchases();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');
  const [salesData, setSalesData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [purchasesData, setPurchasesData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    // Prepare sales data
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const salesByDate = dates.map(date => {
      const daySales = sales.filter(sale => 
        sale.date.split('T')[0] === date
      );
      return {
        date,
        total: daySales.reduce((sum, sale) => sum + sale.total, 0)
      };
    });

    setSalesData({
      labels: salesByDate.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: 'Ventas Diarias',
        data: salesByDate.map(d => d.total),
        fill: false,
        borderColor: 'rgb(34, 197, 94)',
        tension: 0.1
      }]
    });

    // Prepare purchases data
    const purchasesByDate = dates.map(date => {
      const dayPurchases = purchases.filter(purchase => 
        purchase.date.split('T')[0] === date
      );
      return {
        date,
        total: dayPurchases.reduce((sum, purchase) => sum + purchase.total, 0)
      };
    });

    setPurchasesData({
      labels: purchasesByDate.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [{
        label: 'Compras Diarias',
        data: purchasesByDate.map(d => d.total),
        fill: false,
        borderColor: 'rgb(99, 102, 241)',
        tension: 0.1
      }]
    });

    // Prepare performance data
    const sellers = [
      { id: 1, name: 'Ana García' },
      { id: 2, name: 'Carlos López' },
      { id: 3, name: 'María Torres' },
      { id: 4, name: 'Juan Pérez' }
    ];

    const performanceByMonth = sellers.map(seller => ({
      label: seller.name,
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 50000) + 10000),
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.6)`
    }));

    setPerformanceData({
      labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
      datasets: performanceByMonth
    });

    // Prepare category data
    const salesByCategory = categories.map(category => {
      const categoryProducts = products.filter(p => p.category === category.id);
      const categoryTotal = sales.reduce((sum, sale) => {
        const categoryItems = sale.items.filter(item => 
          categoryProducts.some(p => p.id === item.productId)
        );
        return sum + categoryItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
      }, 0);

      return {
        category: category.name,
        total: categoryTotal
      };
    });

    setCategoryData({
      labels: salesByCategory.map(c => c.category),
      datasets: [{
        data: salesByCategory.map(c => c.total),
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(244, 63, 94, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(107, 114, 128, 0.6)'
        ]
      }]
    });

    // Calculate top products
    const productSales = products.map(product => {
      const totalSold = sales.reduce((sum, sale) => {
        const productItems = sale.items.filter(item => item.productId === product.id);
        return sum + productItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      const totalRevenue = sales.reduce((sum, sale) => {
        const productItems = sale.items.filter(item => item.productId === product.id);
        return sum + productItems.reduce((itemSum, item) => itemSum + item.subtotal, 0);
      }, 0);

      return {
        product: product.name,
        units: totalSold,
        revenue: totalRevenue,
        percentage: 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = productSales.reduce((sum, p) => sum + p.revenue, 0);
    setTopProducts(
      productSales.slice(0, 5).map(p => ({
        ...p,
        percentage: ((p.revenue / totalRevenue) * 100).toFixed(1)
      }))
    );
  }, [sales, products, categories, purchases]);

  const reports = [
    { id: 'sales', name: 'Reporte de Ventas', icon: BarChart },
    { id: 'inventory', name: 'Reporte de Inventario', icon: PieChart },
    { id: 'purchases', name: 'Reporte de Compras', icon: LineChart },
    { id: 'performance', name: 'Desempeño de Vendedores', icon: Users },
  ];

  const handleExport = () => {
    const reportData = {
      salesData,
      categoryData,
      purchasesData,
      performanceData,
      topProducts
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${reportType}-${dateRange}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'sales':
        return salesData && categoryData && (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Reporte de Ventas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Ventas por Categoría</h3>
                <div className="h-64">
                  <Pie data={categoryData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tendencia de Ventas</h3>
                <div className="h-64">
                  <Line data={salesData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Productos Más Vendidos</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unidades Vendidas
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ingresos
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          % del Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topProducts.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.product}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.units}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            S/.{item.revenue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );

      case 'purchases':
        return purchasesData && (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Reporte de Compras</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Tendencia de Compras</h3>
                <div className="h-80">
                  <Line data={purchasesData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Estado de Órdenes de Compra</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['pending', 'approved', 'received', 'rejected'].map((status) => {
                    const count = purchases.filter(p => p.status === status).length;
                    return (
                      <div key={status} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-gray-500 capitalize">{status}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'performance':
        return performanceData && (
          <div>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Desempeño de Vendedores</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Ventas por Vendedor</h3>
                <div className="h-80">
                  <Bar data={performanceData} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} />
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Métricas de Rendimiento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {performanceData.datasets.map((dataset: any, index: number) => {
                    const totalSales = dataset.data.reduce((sum: number, value: number) => sum + value, 0);
                    const avgSales = totalSales / dataset.data.length;
                    return (
                      <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="text-sm font-medium">{dataset.label}</div>
                        <div className="text-2xl font-bold mt-1">S/.{avgSales.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Promedio mensual</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
        <div className="mt-4 sm:mt-0 flex space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {reports.map((report) => (
          <button
            key={report.id}
            className={`p-4 rounded-lg shadow-sm border-2 transition-all ${
              reportType === report.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() => setReportType(report.id)}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  reportType === report.id
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <report.icon size={24} />
              </div>
              <span className="mt-2 text-sm font-medium">{report.name}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        {renderReportContent()}
      </div>
    </div>
  );
};