import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";
import Login from "./pages/Login";
import AuthSuccess from "./pages/AuthSuccess";
import AllOrders from "./pages/AllOrders";
import AllReviews from "./pages/AllReviews";
import AllMessages from "./pages/AllMessages";
import AllCustomers from "./pages/AllCustomers";
import OrderDetails from "./pages/OrderDetails";
import AllStaff from "./pages/AllStaff";
import AllMenu from "./pages/MenuPage";
import Coupon from "./pages/Admincoupon";
import Delivery from "./pages/AdminDelivery";
import Report from "./pages/Report";
import WebContent from "./pages/Websitecontent";
import Notification from "./pages/Notifications";
import Payment from "./pages/Payment";
import ConnectCustomer from "./pages/Customercontacts";

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "siddiquirizwan31646@gmail.com";

function RequireAdmin({ children }) {
  const token = localStorage.getItem("adminToken");
  const user  = JSON.parse(localStorage.getItem("adminUser") || "{}");
  if (!token || user?.email !== ADMIN_EMAIL || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const token = localStorage.getItem("adminToken");
  const user  = JSON.parse(localStorage.getItem("adminUser") || "{}");
  if (token && user?.email === ADMIN_EMAIL && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />

        {/* Google OAuth success handler */}
        <Route path="/auth/success" element={<AuthSuccess />} />

        <Route path="/admin" element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }>
          <Route index                     element={<Dashboard />} />
          <Route path="orders"             element={<AllOrders />} />
          <Route path="customerMessage"    element={<AllMessages />} />
          <Route path="staff"              element={<AllStaff />} />
          <Route path="menuManagement"     element={<AllMenu />} />
          <Route path="categories"         element={<ComingSoon title="Categories" />} />
          <Route path="inventory"          element={<ComingSoon title="Inventory — Coming Soon" />} />
          <Route path="customers"          element={<AllCustomers />} />
          <Route path="delivery"           element={<Delivery />} />
          <Route path="order/:orderId"     element={<OrderDetails />} />
          <Route path="coupon&Discounts"   element={<Coupon />} />
          <Route path="reviews"            element={<AllReviews />} />
          <Route path="Connectedcustomers" element={<ConnectCustomer />} />
          <Route path="payments"           element={<Payment />} />
          <Route path="reports"            element={<Report />} />
          <Route path="Webcontent"         element={<WebContent />} />
          <Route path="notifications"      element={<Notification />} />
          <Route path="logs"               element={<ComingSoon title="Activity Logs" />} />
          <Route path="settings"           element={<ComingSoon title="Settings" />} />
          <Route path="messages"           element={<ComingSoon title="Customer Messages" />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}