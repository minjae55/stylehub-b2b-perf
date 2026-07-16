package kr.remerge.stylehub.domain.order.pdf;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderDetailItemResponse;
import kr.remerge.stylehub.domain.order.dto.buyer.BuyerOrderDetailResponse;
import kr.remerge.stylehub.domain.order.enumtype.PaymentMethod;
import kr.remerge.stylehub.global.pdf.PdfDocumentGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

// 바이어가 다운로드하는 "간단한 주문 내역서" PDF. 계약서(ContractPdfGenerator)와 달리
// 법적 효력이 있는 문서가 아니라 구매 확인용 요약본이라 서명/해시 검증 없이 그때그때
// 생성해서 바로 내려준다 (별도 저장/서명 절차 없음).
@Component
@RequiredArgsConstructor
public class OrderPdfGenerator {

    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private static final DeviceRgb NAVY =
            new DeviceRgb(15, 23, 42);

    private static final DeviceRgb BLUE =
            new DeviceRgb(37, 99, 235);

    private static final DeviceRgb LIGHT_GRAY =
            new DeviceRgb(248, 250, 252);

    private static final DeviceRgb BORDER_COLOR =
            new DeviceRgb(226, 232, 240);

    private static final DeviceRgb MUTED_TEXT =
            new DeviceRgb(100, 116, 139);

    private final PdfDocumentGenerator pdfDocumentGenerator;

    public byte[] generate(BuyerOrderDetailResponse order) {
        return pdfDocumentGenerator.generate(document -> {
            addTitle(document, order);
            addOrderInfo(document, order);
            addItems(document, order);
            addAmounts(document, order);
        });
    }

    private void addTitle(Document document, BuyerOrderDetailResponse order) {
        Table titleBox = new Table(1).useAllAvailableWidth();

        titleBox.addCell(
                new Cell()
                        .setBorder(Border.NO_BORDER)
                        .setBackgroundColor(NAVY)
                        .setPaddingTop(24)
                        .setPaddingBottom(20)
                        .setPaddingLeft(20)
                        .setPaddingRight(20)
                        .add(
                                new Paragraph("StyleHub B2B")
                                        .setFontSize(9)
                                        .simulateBold()
                                        .setFontColor(BLUE)
                                        .setCharacterSpacing(1.2f)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginBottom(8)
                        )
                        .add(
                                new Paragraph("주문 내역서")
                                        .setFontSize(23)
                                        .simulateBold()
                                        .setFontColor(ColorConstants.WHITE)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginBottom(6)
                        )
                        .add(
                                new Paragraph("주문번호 " + order.orderNo())
                                        .setFontSize(9)
                                        .setFontColor(new DeviceRgb(203, 213, 225))
                                        .setTextAlignment(TextAlignment.CENTER)
                        )
        );

        document.add(titleBox);

        Table accentBar = new Table(1).useAllAvailableWidth();
        accentBar.addCell(
                new Cell()
                        .setBorder(Border.NO_BORDER)
                        .setBackgroundColor(BLUE)
                        .setHeight(4)
                        .setPadding(0)
        );
        document.add(accentBar.setMarginBottom(10));

        document.add(
                new Paragraph(
                        "본 문서는 구매 확인용 요약본이며, 세금계산서 등 법적 증빙 문서가 아닙니다."
                )
                        .setFontSize(8)
                        .setFontColor(MUTED_TEXT)
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setMarginBottom(10)
        );
    }

    private void addOrderInfo(Document document, BuyerOrderDetailResponse order) {
        addSectionTitle(document, "1. 주문 정보");

        Table table = new Table(
                UnitValue.createPercentArray(new float[]{1, 2, 1, 2})
        ).useAllAvailableWidth();

        addInfoPair(table, "주문일시", order.createdAt().format(DATE_TIME_FORMATTER));
        addInfoPair(table, "구매자", order.buyerName());
        addInfoPair(table, "결제 방식", formatPaymentMethod(order.paymentMethod()));
        addInfoPair(
                table,
                "배송지",
                order.receiverName() + " / " + order.receiverAddress()
                        + " " + valueOrDash(order.receiverAddressDetail())
        );

        document.add(table);
    }

    private void addItems(Document document, BuyerOrderDetailResponse order) {
        addSectionTitle(document, "2. 주문 상품");

        Table table = new Table(
                UnitValue.createPercentArray(new float[]{3, 3, 1, 2, 2})
        ).useAllAvailableWidth();

        addHeaderCell(table, "상품명");
        addHeaderCell(table, "옵션");
        addHeaderCell(table, "수량");
        addHeaderCell(table, "단가");
        addHeaderCell(table, "금액");

        List<BuyerOrderDetailItemResponse> items = order.items();
        for (int i = 0; i < items.size(); i++) {
            BuyerOrderDetailItemResponse item = items.get(i);
            DeviceRgb rowBackground = (i % 2 == 0)
                    ? new DeviceRgb(255, 255, 255)
                    : LIGHT_GRAY;
            addBodyCell(table, item.productName(), rowBackground);
            addBodyCell(table, valueOrDash(item.optionSummary()), rowBackground);
            addBodyCell(table, item.quantity() + "개", rowBackground);
            addBodyCell(table, formatPrice(item.unitPrice()), rowBackground);
            addBodyCell(table, formatPrice(item.totalPrice()), rowBackground);
        }

        document.add(table);
    }

    private void addAmounts(Document document, BuyerOrderDetailResponse order) {
        addSectionTitle(document, "3. 결제 금액");

        Table amountTable = new Table(
                UnitValue.createPercentArray(new float[]{3, 1.4f})
        ).setWidth(UnitValue.createPercentValue(45))
                .setHorizontalAlignment(HorizontalAlignment.RIGHT)
                .setMarginTop(4);

        addAmountRow(amountTable, "상품 금액", order.subtotalAmount(), false);
        addAmountRow(amountTable, "배송비", order.shippingFee(), false);
        addAmountRow(amountTable, "총 결제 금액", order.totalAmount(), true);

        document.add(amountTable);
    }

    private void addSectionTitle(Document document, String title) {
        document.add(
                new Paragraph(title)
                        .setFontSize(13)
                        .simulateBold()
                        .setFontColor(NAVY)
                        .setMarginTop(20)
                        .setMarginBottom(6)
        );

        SolidLine accentLine = new SolidLine(1.4f);
        accentLine.setColor(BLUE);

        document.add(
                new LineSeparator(accentLine).setMarginBottom(10)
        );
    }

    private void addInfoPair(Table table, String label, String value) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(label).simulateBold())
                        .setBackgroundColor(LIGHT_GRAY)
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setFontColor(MUTED_TEXT)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .setPadding(8)
        );

        table.addCell(
                new Cell()
                        .add(new Paragraph(valueOrDash(value)))
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setFontColor(NAVY)
                        .setVerticalAlignment(VerticalAlignment.MIDDLE)
                        .setPadding(8)
        );
    }

    private void addHeaderCell(Table table, String value) {
        table.addHeaderCell(
                new Cell()
                        .add(new Paragraph(value).simulateBold().setFontSize(9))
                        .setBackgroundColor(NAVY)
                        .setFontColor(ColorConstants.WHITE)
                        .setBorder(new SolidBorder(NAVY, 0.7f))
                        .setTextAlignment(TextAlignment.CENTER)
                        .setPadding(8)
        );
    }

    private void addBodyCell(Table table, String value) {
        addBodyCell(table, value, ColorConstants.WHITE);
    }

    private void addBodyCell(
            Table table,
            String value,
            com.itextpdf.kernel.colors.Color background
    ) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(valueOrDash(value)).setFontSize(8.5f))
                        .setBackgroundColor(background)
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setPadding(8)
        );
    }

    private void addAmountRow(Table table, String label, Long amount, boolean emphasized) {
        DeviceRgb background = emphasized ? NAVY : LIGHT_GRAY;
        DeviceRgb textColor = emphasized
                ? new DeviceRgb(255, 255, 255)
                : NAVY;

        table.addCell(
                new Cell()
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setBackgroundColor(background)
                        .setPadding(8)
                        .add(
                                new Paragraph(label)
                                        .setFontSize(9)
                                        .simulateBold()
                                        .setFontColor(textColor)
                        )
        );

        table.addCell(
                new Cell()
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setBackgroundColor(background)
                        .setPadding(8)
                        .setTextAlignment(TextAlignment.RIGHT)
                        .add(
                                new Paragraph(formatPrice(amount))
                                        .setFontSize(9)
                                        .simulateBold()
                                        .setFontColor(textColor)
                        )
        );
    }

    private String formatPaymentMethod(PaymentMethod paymentMethod) {
        if (paymentMethod == null) {
            return "-";
        }

        return switch (paymentMethod) {
            case CORP_CARD -> "법인카드";
            case TRANSFER -> "무통장 입금";
        };
    }

    private String formatPrice(Long value) {
        return value == null ? "-" : String.format("%,d원", value);
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }
}
