import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { BarChart, Calendar, TrendingUp, TrendingDown } from "lucide-react";

const SalesReport = () => {
  const [salesData, setSalesData] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [bestSellers, setBestSellers] = useState([]);
  const [leastSellers, setLeastSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bestSellersLoading, setBestSellersLoading] = useState(true);
  const [leastSellersLoading, setLeastSellersLoading] = useState(true);
  const [bestSellersTimeRange, setBestSellersTimeRange] = useState("all");
  const [leastSellersTimeRange, setLeastSellersTimeRange] = useState("all");

  const fetchSummaryData = useCallback(async () => {
    const { data: transactions, error } = await supabase
      .from("trans_table")
      .select("trans_date, total_amntdue")
      .eq("pymnt_status", "Paid");

    if (error) {
      console.error("Error fetching summary data:", error);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let dailySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;
    let yearlySales = 0;

    transactions.forEach((trans) => {
      const transDate = new Date(trans.trans_date);
      if (transDate >= today) dailySales += trans.total_amntdue;
      if (transDate >= startOfWeek) weeklySales += trans.total_amntdue;
      if (transDate >= startOfMonth) monthlySales += trans.total_amntdue;
      if (transDate >= startOfYear) yearlySales += trans.total_amntdue;
    });

    setSalesData({
      daily: dailySales,
      weekly: weeklySales,
      monthly: monthlySales,
      yearly: yearlySales,
    });
  }, []);

  const fetchProductSales = useCallback(async (timeRange) => {
    const now = new Date();
    let startDate = null;

    switch (timeRange) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          .toISOString()
          .slice(0, 10);
        break;
      case "week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().slice(0, 10);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
          .toISOString()
          .slice(0, 10);
        break;
      default:
        startDate = null;
    }

    let transactionIdsQuery = supabase.from("trans_table").select("trans_id").eq("pymnt_status", "Paid");
    if (startDate) {
      transactionIdsQuery = transactionIdsQuery.gte("trans_date", startDate);
    }

    const { data: transIds, error: transIdError } = await transactionIdsQuery;

    if (transIdError) {
      console.error("Error fetching transaction IDs:", transIdError);
      return [];
    }

    if (transIds.length === 0) {
      return [];
    }

    const { data: transItems, error: itemsError } = await supabase
      .from("trans_items_table")
      .select("prdct_name, quantity")
      .in(
        "fk_trans_id",
        transIds.map((t) => t.trans_id)
      );

    if (itemsError) {
      console.error("Error fetching transaction items:", itemsError);
      return [];
    }

    const productSales = transItems.reduce((acc, item) => {
      acc[item.prdct_name] = (acc[item.prdct_name] || 0) + item.quantity;
      return acc;
    }, {});

    return Object.entries(productSales).sort(([, a], [, b]) => b - a);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSummaryData();
    setLoading(false);
  }, [fetchSummaryData]);

  useEffect(() => {
    setBestSellersLoading(true);
    fetchProductSales(bestSellersTimeRange).then((data) => {
      setBestSellers(data.slice(0, 10));
      setBestSellersLoading(false);
    });
  }, [bestSellersTimeRange, fetchProductSales]);

  useEffect(() => {
    setLeastSellersLoading(true);
    fetchProductSales(leastSellersTimeRange).then((data) => {
      setLeastSellers(data.slice(-10).reverse());
      setLeastSellersLoading(false);
    });
  }, [leastSellersTimeRange, fetchProductSales]);

  const StatCard = ({ icon, title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md flex items-center ${color}`}>
      <div className="mr-4">{icon}</div>
      <div>
        <p className="text-sm text-white font-medium">{title}</p>
        <p className="text-2xl text-white font-bold">₱{value.toFixed(2)}</p>
      </div>
    </div>
  );

  const ProductList = ({
    title,
    products,
    icon,
    color,
    timeRange,
    setTimeRange,
    isLoading,
  }) => {
    const timeFilters = ["all", "day", "week", "month", "year"];
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className={`text-lg font-semibold flex items-center ${color}`}>
            {icon}
            <span className="ml-2">{title}</span>
          </h3>
          <div className="flex items-center gap-1">
            {timeFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeRange(filter)}
                className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  timeRange === filter
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="h-80 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading...</p>
            </div>
          ) : products.length > 0 ? (
            <ul className="space-y-2">
              {products.map(([name, quantity]) => (
                <li
                  key={name}
                  className="flex justify-between items-center text-sm p-2 rounded bg-gray-50"
                >
                  <span>{name}</span>
                  <span className="font-bold">{quantity} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">
                No data available for this period.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-6 text-center">Loading sales data...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          icon={<Calendar size={32} color="white" />}
          title="Today's Sales"
          value={salesData.daily}
          color="bg-red-500"
        />
        <StatCard
          icon={<Calendar size={32} color="white" />}
          title="This Week's Sales"
          value={salesData.weekly}
          color="bg-orange-500"
        />
        <StatCard
          icon={<Calendar size={32} color="white" />}
          title="This Month's Sales"
          value={salesData.monthly}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Calendar size={32} color="white" />}
          title="This Year's Sales"
          value={salesData.yearly}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductList
          title="Best Sellers"
          products={bestSellers}
          icon={<TrendingUp size={22} />}
          color="text-green-600"
          timeRange={bestSellersTimeRange}
          setTimeRange={setBestSellersTimeRange}
          isLoading={bestSellersLoading}
        />
        <ProductList
          title="Least Sellers"
          products={leastSellers}
          icon={<TrendingDown size={22} />}
          color="text-red-600"
          timeRange={leastSellersTimeRange}
          setTimeRange={setLeastSellersTimeRange}
          isLoading={leastSellersLoading}
        />
      </div>
    </div>
  );
};

export default SalesReport;
