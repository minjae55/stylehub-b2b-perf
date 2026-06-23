import {createBrowserRouter} from "react-router";
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import {Root} from "./Root";
import {ProtectedLayout} from "./ProtectedLayout";
import {Home} from "@/pages/Home";

import {Admin, AdminLayout} from "@/pages/admin/Admin";
import {AdminDashboard} from "@/pages/admin/AdminDashboard";
import {AdminSourcingRequests} from "@/pages/admin/AdminSourcingRequests";
import {AdminShippingQuotes} from "@/pages/admin/AdminShippingQuotes";
import {AdminAnalytics} from "@/pages/admin/AdminAnalytics";
import {AdminUsers} from "@/pages/admin/AdminUsers";
import {SearchPage} from "@/pages/admin/SearchPage";

import {RegisterBuyer} from "@/pages/auth/BuyerRegister";
import {RegisterSeller} from "@/pages/auth/SellerRegister";
import {AuthLayout} from "@/pages/auth/layout";
import {Login} from "@/pages/auth/Login";
import {Register} from "@/pages/auth/Register";
import {RegisterEmployee} from "@/pages/auth/EmployeeRegister";
import {RegisterSuccess} from "@/pages/auth/Success";
import {FindId} from "@/pages/auth/FindId";
import {FindPw} from "@/pages/auth/FindPw";

import {BuyerOrderDetail} from "@/pages/buyer/BuyerOrderDetail";
import {BuyerSourcingList} from "@/pages/sourcing/BuyerSourcingList";
import {BuyerDashboard} from "@/pages/buyer/BuyerDashboard";
import {BuyerShippingQuotes} from "@/pages/buyer/BuyerShippingQuotes";

import {CompanySettings} from "@/pages/company/CompanySettings";

import {SellerContractSign} from "@/pages/contract/SellerContractSign";
import {BuyerContractSign} from "@/pages/contract/BuyerContractSign";

import {Inquiry} from "@/pages/inquiry/Inquiry";
import {Support} from "@/pages/inquiry/Support";

import {Cart} from "@/pages/order/Cart";
import {Orders} from "@/pages/order/Orders";
import {Checkout} from "@/pages/order/Checkout";
import {OrderDetail} from "@/pages/order/OrderDetail";

import {ProductDetail} from "@/pages/product/ProductDetail";
import {AllProducts} from "@/pages/product/AllProducts";
import {Wishlist} from "@/pages/product/Wishlist";
import {SellerProductRegister} from "@/pages/product/SellerProductRegister";

import {QuoteDetail} from "@/pages/quote/QuoteDetail";
import {SellerQuoteWrite} from "@/pages/quote/SellerQuoteWrite";
import BuyerQuoteList from "@/pages/quote/BuyerQuoteList";

import {SellerDashboard} from "@/pages/seller/SellerDashboard";
import {SellerProductManage} from "@/pages/seller/SellerProductManage";
import {SellerOrderDetail} from "@/pages/seller/SellerOrderDetail";

import {Negotiations} from "@/pages/trade/Negotiations";
import {Disputes} from "@/pages/trade/Disputes";

import {MyPage} from "@/pages/user/MyPage";

import {PartnerPlan} from "@/pages/policy/PartnerPlan";
import {RestrictedBusinessTypes} from "@/pages/policy/RestrictedBusinessTypes";

import {SourcingRequest} from "@/pages/sourcing/SourcingRequest";
import {SellerRequestList} from "@/pages/sourcing/SellerRequestList";
import {BuyerSourcingDetail} from "@/pages/sourcing/BuyerSourcingDetail";

import Settlements from "@/pages/admin/Settlements";
import AdminSupport from "@/pages/admin/AdminSupport";

import {SupplierRegister} from "@/pages/company/SupplierRegister";

//토스페이먼츠
import PaymentSuccessPage from "@/pages/tosspayment/PaymentSuccessPage";

export const router = createBrowserRouter([
    // ─────────────────────────────────────────
    // auth 그룹 - 인증 불필요
    // ─────────────────────────────────────────
    {
        path: "auth",
        Component: AuthLayout,
        children: [
            {index: true, Component: Login},
            {path: "login", Component: Login},
            {path: "register", Component: Register},
            {path: "register/buyer", Component: RegisterBuyer},
            {path: "register/seller", Component: RegisterSeller},
            {path: "register/employee", Component: RegisterEmployee},
            {path: "register/success", Component: RegisterSuccess},
            {path: "find-id", Component: FindId},
            {path: "find-pw", Component: FindPw},
        ],
    },

    // ─────────────────────────────────────────
    // auth를 제외한 모든 페이지 - ProtectedLayout으로 한 번에 감쌈
    // 로그인 안 했으면 자동으로 /auth/login으로 리다이렉트
    // ─────────────────────────────────────────
    {
        Component: ProtectedLayout,
        children: [
            {
                path: "/",
                Component: Root,
                children: [
                    {index: true, Component: Home},
                    {path: "support", Component: Support},
                    {path: "restricted-businesses", Component: RestrictedBusinessTypes},
                    {path: "supplier-register", Component: SupplierRegister},
                    {path: "inquiry", Component: Inquiry},
                    {path: "mypage", Component: MyPage},
                    {path: "settings", Component: CompanySettings},
                    {path: "partner", Component: PartnerPlan},
                    {path: "quotes/:quoteId", Component: QuoteDetail},

                    // Order Flow
                    {path: "cart", Component: Cart},
                    {path: "orders", Component: Orders},
                    {path: "orders/:id", Component: OrderDetail},
                    {path: "checkout", Component: Checkout},

                    // ✨ Toss Payments
                    {path: "payment/success", Component: PaymentSuccessPage},

                    // Trade Flow
                    {path: "orders/:orderId/negotiations", Component: Negotiations},
                    {path: "orders/:orderId/disputes", Component: Disputes},
                ],
            },
            {
                path: "admin",
                Component: AdminLayout,
                children: [
                    {index: true, Component: Admin},
                    {path: "dashboard", Component: AdminDashboard},
                    {path: "sourcing-requests", Component: AdminSourcingRequests},
                    {path: "users", Component: AdminUsers},
                    {path: "analytics", Component: AdminAnalytics},
                    {path: "shipping-quotes", Component: AdminShippingQuotes},
                    {path: "search", Component: SearchPage},
                    {path: "settlements", Component: Settlements},
                    {path: "adminsupport", Component: AdminSupport},
                ],
            },
            {
                path: "buyer",
                Component: Root,
                handle: {role: "BUYER"},
                children: [
                    {index: true, Component: BuyerDashboard},
                    {path: "quotes", Component: BuyerQuoteList},
                    {path: "sourcing-request", Component: SourcingRequest},
                    {path: "orders/:orderId/contract-sign", Component: BuyerContractSign},
                    {path: "shipping-quotes", Component: BuyerShippingQuotes},
                    {path: "my-sourcing", Component: BuyerSourcingList},
                    {path: "sourcing-detail", Component: BuyerSourcingDetail},
                    {path: "orders/:id", Component: BuyerOrderDetail},
                ],
            },
            {
                path: "seller",
                Component: Root,
                handle: {role: "SELLER"},
                children: [
                    {index: true, Component: SellerDashboard},
                    {path: "products/new", Component: SellerProductRegister},
                    {path: "products", Component: SellerProductManage},
                    {path: "sourcing-requests", Component: SellerRequestList},
                    {path: "orders/:id", Component: SellerOrderDetail},
                    {path: "sourcing/:requestId/quote", Component: SellerQuoteWrite},
                    {path: "orders/:orderId/contract-sign", Component: SellerContractSign},
                ],
            },
            {
                path: "products",
                Component: Root,
                children: [
                    {index: true, Component: AllProducts},
                    {path: "wishlist", Component: Wishlist},
                    {path: ":id", Component: ProductDetail},
                ],
            },
        ],
    },
]);