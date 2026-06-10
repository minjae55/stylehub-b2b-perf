import { createElement } from "react";
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
import { SourcingRequest } from "../pages/SourcingRequest";
import { SellerRequestList } from "../pages/seller/SellerRequestList";
import { SellerShippingQuote } from "../pages/SellerShippingQuote";
import { BuyerShippingQuotes } from "../pages/BuyerShippingQuotes";
import { AllProducts } from "../pages/AllProducts";
import { RestrictedBusinessTypes } from "../pages/RestrictedBusinessTypes";

import { AuthLayout } from "../pages/auth/layout";
import { Login } from "../pages/auth/Login";
import { Register } from "../pages/auth/Register";
import { RegisterBuyer } from "../pages/auth/Buyer";
import { RegisterSeller } from "../pages/auth/Seller";
import { RegisterSuccess } from "../pages/auth/Success";
import { FindId } from "../pages/auth/FindId";
import { FindPw } from "../pages/auth/FindPw";

import { AdminUsers } from "../pages/AdminUsers";
import { BuyerOrderDetail } from "../pages/buyer/BuyerOrderDetail";
import { BuyerSourcingList } from "../pages/buyer/BuyerSourcingList";
import { BuyerSourcingDetail } from "../pages/buyer/BuyerSourcingDetail";
import { SellerOrderDetail } from "../pages/seller/SellerOrderDetail";
import { SellerQuoteWrite } from "../pages/seller/SellerQuoteWrite";
import { PartnerPlan } from "../pages/PartnerPlan";
import { SearchPage } from "@/pages/admin/SearchPage";
import {Wishlist} from "../pages/Wishlist"; //좋아요 페이지 추가

import {SellerProductManage} from "../pages/seller/SellerProductManage"; // 판매자 상품 관리 페이지 추가
import { SellerContractSign } from "../pages/seller/SellerContractSign";
import { BuyerContractSign } from "../pages/buyer/BuyerContractSign";
import { Negotiations } from "../pages/Negotiations";
import { Disputes } from "../pages/Disputes";

import Settlements from "@/pages/admin/Settlements";
import AdminSupport from "@/pages/admin/AdminSupport";

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
        { path: "sourcing-request", Component: SourcingRequest },
        { path: "seller/sourcing-requests", Component: SellerRequestList },
        { path: "customs", Component: CustomsClearance },
        { path: "support", Component: Support },
        { path: "cart", Component: Cart },
        { path: "checkout", Component: Checkout },

        { path: "orders", Component: Orders },
        { path: "orders/:id", Component: OrderDetail },

        { path: "buyer/orders", element: createElement(Orders, { role: "BUYER" }) },
        { path: "seller/orders", element: createElement(Orders, { role: "SELLER" }) },

        { path: "product/:id", Component: ProductDetail },
        { path: "supplier-register", Component: SupplierRegister },
        { path: "restricted-businesses", Component: RestrictedBusinessTypes },
        { path: "quote-request", Component: QuoteRequest },
        { path: "mypage", Component: MyPage },

        { path: "buyer/shipping-quotes", Component: BuyerShippingQuotes },
        { path: "buyer/my-sourcing", Component: BuyerSourcingList },
		{ path: "buyer/sourcing-detail", Component: BuyerSourcingDetail},
        { path: "buyer/orders/:id", Component: BuyerOrderDetail },
        { path: "buyer/orders/:orderId/contract-sign", Component: BuyerContractSign },
        { path: "buyer", Component: BuyerDashboard },

        { path: "seller/products/new", Component: SellerProductRegister },
        { path: "seller/shipping-quote", Component: SellerShippingQuote },
        { path: "seller/sourcing/:requestId/quote", Component: SellerQuoteWrite },
        { path: "seller/orders/:id", Component: SellerOrderDetail },
        { path: "seller/orders/:orderId/contract-sign", Component: SellerContractSign },
        { path: "seller", Component: SellerDashboard },
		{ path: "wishlist", Component: Wishlist }, //좋아요 페이지 추가
		{ path: "seller/products", Component: SellerProductManage }, // 판매자 상품 관리 페이지 추

        { path: "inspection", Component: BuyerInspection },
        { path: "admin/inspection", Component: AdminInspection },
        
        { path: "negotiations", Component: Negotiations },
        { path: "disputes", Component: Disputes },
        { path: "partner", Component: PartnerPlan },
    ],
},
    {
    path: "auth",
    Component: AuthLayout,
    children: [
        { path: "login", Component: Login },
        { path: "register", Component: Register },
        { path: "register/buyer", Component: RegisterBuyer },
        { path: "register/seller", Component: RegisterSeller },
        { path: "register/success", Component: RegisterSuccess },
        { path: "find-id", Component: FindId },
        { path: "find-pw", Component: FindPw },
    ],
    },
    {
    path: "admin",
    Component: AdminLayout,
    children: [
        { index: true, Component: Admin },
        { path: "dashboard", Component: AdminDashboard },
        { path: "sourcing-requests", Component: AdminSourcingRequests },
        { path: "users", Component: AdminUsers },
        { path: "analytics", Component: AdminAnalytics },
        { path: "shipping-quotes", Component: AdminShippingQuotes },
        { path: "search", Component: SearchPage },
        { path: "settlements", Component: Settlements },
        { path: "adminsupport", Component: AdminSupport },
    ],
    },
]);