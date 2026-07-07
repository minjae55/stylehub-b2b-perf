import {createBrowserRouter} from "react-router";

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

import {AuthLayout} from "@/pages/auth/layout";
import {Login} from "@/pages/auth/Login";
import {Register} from "@/pages/auth/register/Register";
import {RegisterTypeSelect} from "@/pages/auth/register/RegisterTypeSelect";
import {RegisterSuccess} from "@/pages/auth/register/Success";
import {FindId} from "@/pages/auth/FindId";
import {FindPw} from "@/pages/auth/FindPw";

import {BuyerSourcingList} from "@/pages/sourcing/BuyerSourcingList";
import {BuyerDashboard} from "@/pages/buyer/BuyerDashboard";
import {BuyerShippingQuotes} from "@/pages/buyer/BuyerShippingQuotes";

import {CompanySettings} from "@/pages/company/CompanySettings";

import {SellerContractSign} from "@/pages/contract/SellerContractSign";
import {SellerContractCreate} from "@/pages/contract/SellerContractCreate";
import {BuyerContractSign} from "@/pages/contract/BuyerContractSign";
import {BuyerContractList} from "@/pages/contract/BuyerContractList";

import {Inquiry} from "@/pages/support/Inquiry";
import {Support} from "@/pages/support/Support";

import {Cart} from "@/pages/order/Cart";
import {Orders} from "@/pages/order/Orders";
import {Checkout} from "@/pages/order/Checkout";
import {OrderDetail} from "@/pages/order/OrderDetail";

import {ProductDetail} from "@/pages/product/ProductDetail";
import {AllProducts} from "@/pages/product/AllProducts";
import {Wishlist} from "@/pages/product/Wishlist";
import {SellerProductRegister} from "@/pages/product/SellerProductRegister";

import {SellerQuoteWrite} from "@/pages/quote/SellerQuoteWrite";
import {SellerQuoteList} from "@/pages/quote/SellerQuoteList";
import BuyerQuoteList from "@/pages/quote/BuyerQuoteList";
import { QuoteDetail } from "@/pages/quote/QuoteDetail";
import {QuoteDetailBuyer, QuoteDetailSeller} from "@/pages/quote/QuoteDetailWrappers";

import {SellerDashboard} from "@/pages/seller/SellerDashboard";
import {SellerProductManage} from "@/pages/seller/SellerProductManage";
import {SellerOrders} from "@/pages/seller/SellerOrders";
import {SellerOrderDetail} from "@/pages/seller/SellerOrderDetail";

import {Negotiations} from "@/pages/trade/Negotiations";
import {Disputes} from "@/pages/trade/Disputes";

import {MyPage} from "@/pages/user/MyPage";

import {PartnerPlan} from "@/pages/policy/PartnerPlan";
import {RestrictedBusinessTypes} from "@/pages/policy/RestrictedBusinessTypes";

import {SourcingRequest} from "@/pages/sourcing/SourcingRequest";
import {SellerRequestList} from "@/pages/sourcing/SellerRequestList";
import {SellerSourcingDetail} from "@/pages/sourcing/SellerSourcingDetail";
import {BuyerSourcingDetail} from "@/pages/sourcing/BuyerSourcingDetail";

import Settlements from "@/pages/admin/Settlements";
import AdminSupport from "@/pages/admin/AdminSupport";

import {SupplierRegister} from "@/pages/company/SupplierRegister";

import PaymentSuccessPage from "@/pages/tosspayment/PaymentSuccessPage";
import OrderCompletePage from "@/pages/tosspayment/OrderCompletePage";

export const router = createBrowserRouter([
    {
        path: "auth",
        Component: AuthLayout,
        children: [
            {index: true, Component: Login},
            {path: "register", Component: RegisterTypeSelect},
            {path: "register/:role/:memberType", Component: Register},
            {path: "register/success", Component: RegisterSuccess},
            {path: "find-id", Component: FindId},
            {path: "find-pw", Component: FindPw},
        ],
    },
    {
        Component: ProtectedLayout,
        children: [
            {
                path: "/",
                Component: Root,
                children: [
                    {index: true, Component: Home},

                    {path: "support", Component: Support},
                    {path: "support/inquiry", Component: Inquiry},

                    {path: "restricted-businesses", Component: RestrictedBusinessTypes},
                    {path: "supplier-register", Component: SupplierRegister},
                    {path: "mypage", Component: MyPage},
                    {path: "settings", Component: CompanySettings},
                    {path: "partner", Component: PartnerPlan},

                    // Order Flow
                    {path: "cart", Component: Cart},
                    {path: "checkout", Component: Checkout},

                    // Trade Flow
                    {path: "negotiations", Component: Negotiations},
                    {path: "orders/:orderId/disputes", Component: Disputes},

                    // Toss Payments
                    {path: "payment/success", Component: PaymentSuccessPage},
                    {path: "payment/ordersuccess", Component: OrderCompletePage},
                ],
            },
            {
                path: "admin",
                Component: AdminLayout,
                handle: {role: "ADMIN"},
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
                handle: {roles: ["BUYER", "BOTH"]},
                children: [
                    {index: true, Component: BuyerDashboard},
                    {path: "orders", Component: Orders},
                    {path: "orders/disputes", Component: Disputes},
                    {path: "orders/disputes/:disputeId", Component: Disputes},
                    {path: "orders/:id", Component: OrderDetail},
                    {path: "quotes", Component: BuyerQuoteList},
                    {path: "quotes/:quoteId", Component: QuoteDetailBuyer},
                    {path: "sourcing-request", Component: SourcingRequest},
                    {path: "contracts/:contractId/sign", Component: BuyerContractSign},
                    {path: "contracts", Component: BuyerContractList},
                    {path: "shipping-quotes", Component: BuyerShippingQuotes},
                    {path: "my-sourcing", Component: BuyerSourcingList},
                    {path: "sourcing-detail/:requestId", Component: BuyerSourcingDetail},
//                     {path: "disputes", Component: Disputes},
//                     {path: "disputes/:disputeId", Component: Disputes},

                ],
            },
            {
                path: "seller",
                Component: Root,
                handle: {roles: ["SELLER", "BOTH"]},
                children: [
                    {index: true, Component: SellerDashboard},
                    {path: "products/new", Component: SellerProductRegister},
                    {path: "products/edit/:id", Component: SellerProductRegister}, //수정페이지
                    {path: "products", Component: SellerProductManage},
                    {path: "sourcing-requests", Component: SellerRequestList},
                    {path: "orders", Component: SellerOrders},
                    {path: "orders/:id", Component: SellerOrderDetail},
                    {path: "sourcing/:requestId/quote", Component: SellerQuoteWrite},
                    {path: "contracts/new/:quoteId", Component: SellerContractCreate},
                    {path: "contracts/quotes/:quoteId", Component: SellerContractSign},
                    {path: "quotes", Component: SellerQuoteList},
                    {path: "quotes/:quoteId", Component: QuoteDetailSeller},
                    {path: "sourcing-detail/:requestId", Component: SellerSourcingDetail},
                    {path: "disputes", Component: Disputes},
                    {path: "disputes/:disputeId", Component: Disputes},
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
