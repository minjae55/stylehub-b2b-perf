import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "../pages/Home";
import { PurchaseAgency } from "../pages/PurchaseAgency";
import { ShippingAgency } from "../pages/ShippingAgency";
import { Suppliers } from "../pages/Suppliers";
import { CustomsClearance } from "../pages/CustomsClearance";
import { Support } from "../pages/Support";
import { Cart } from "../pages/Cart";
import { Orders } from "../pages/Orders";
import { Admin, AdminLayout } from "../pages/Admin";
import { Checkout } from "../pages/Checkout";
import { MyPage } from "../pages/MyPage";
import { ProductDetail } from "../pages/ProductDetail";
import { AdminDashboard } from "../pages/AdminDashboard";
import { AdminSourcingRequests } from "../pages/AdminSourcingRequests";
import { AdminShippingQuotes } from "../pages/AdminShippingQuotes";
import { AdminInspection } from "../pages/AdminInspection";
import { AdminAnalytics } from "../pages/AdminAnalytics";
import { BuyerInspection } from "../pages/BuyerInspection";
import { QuoteRequest } from "../pages/QuoteRequest";
import { BuyerDashboard } from "../pages/BuyerDashboard";
import { SellerDashboard } from "../pages/SellerDashboard";
import { SellerProductRegister } from "../pages/SellerProductRegister";
import { OrderDetail } from "../pages/OrderDetail";
import { SupplierRegister } from "../pages/SupplierRegister";
import { SellerShippingQuote } from "../pages/SellerShippingQuote";
import { BuyerShippingQuotes } from "../pages/BuyerShippingQuotes";
import { AllProducts } from "../pages/AllProducts";
import { RestrictedBusinessTypes } from "../pages/RestrictedBusinessTypes";
import AuthLayout from "../pages/auth/_layout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Buyer from "../pages/auth/Buyer";
import Payment from "../pages/auth/Payment";
import { AdminUsers } from "../pages/AdminUsers";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "purchase-agency", Component: PurchaseAgency },
      { path: "shipping-agency", Component: ShippingAgency },
      { path: "products", Component: AllProducts },
      { path: "suppliers", Component: Suppliers },
      { path: "customs", Component: CustomsClearance },
      { path: "support", Component: Support },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "orders", Component: Orders },
      { path: "orders/:id", Component: OrderDetail },
      { path: "mypage", Component: MyPage },
      { path: "product/:id", Component: ProductDetail },
      { path: "supplier-register", Component: SupplierRegister },
      { path: "restricted-businesses", Component: RestrictedBusinessTypes },
      { path: "quote-request", Component: QuoteRequest },
      { path: "buyer", Component: BuyerDashboard },
      { path: "buyer/shipping-quotes", Component: BuyerShippingQuotes },
      { path: "seller", Component: SellerDashboard },
      { path: "seller/products/new", Component: SellerProductRegister },
      { path: "seller/shipping-quote", Component: SellerShippingQuote },
      { path: "admin/shipping-quotes", Component: AdminShippingQuotes },
      { path: "admin/inspection", Component: AdminInspection },
      { path: "inspection", Component: BuyerInspection },
      // 인증 관련 (Auth)

    ],
  },
  {
    path: "auth",
    Component: AuthLayout,
    children: [
      { path: "login", Component: Login },
      { path: "register", Component: Register},
      { path: "register/buyer", Component: Buyer},
      { path: "payment", Component: Payment }
    ]
  },
  {
    path: "admin",
    Component: AdminLayout,
    children: [
      { index:true, Component: Admin},
      { path: "dashboard", Component: AdminDashboard},
      { path: "sourcing-requests", Component: AdminSourcingRequests},
      { path: "users", Component: AdminUsers},
      { path: "analytics", Component: AdminAnalytics }
    ]
  }
]);
