package kr.remerge.stylehub.domain.quote.pdf;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import kr.remerge.stylehub.domain.quote.dto.QuoteDetailResponse;
import kr.remerge.stylehub.domain.quote.dto.QuoteItemResponse;
import kr.remerge.stylehub.global.pdf.PdfDocumentGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class QuotePdfGenerator {

    private static final DeviceRgb NAVY = new DeviceRgb(15, 23, 42);
    private static final DeviceRgb BLUE = new DeviceRgb(37, 99, 235);
    private static final DeviceRgb LIGHT_GRAY = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb BORDER = new DeviceRgb(226, 232, 240);
    private static final DeviceRgb MUTED = new DeviceRgb(100, 116, 139);
    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final PdfDocumentGenerator pdfDocumentGenerator;

    public byte[] generate(QuoteDetailResponse quote) {
        return pdfDocumentGenerator.generate(document -> {
            addTitle(document, quote);
            addSummary(document, quote);
            addItems(document, quote);
            addConditions(document, quote);
            addAmounts(document, quote);
        });
    }

    private void addTitle(
            com.itextpdf.layout.Document document,
            QuoteDetailResponse quote
    ) {
        Table title = new Table(1).useAllAvailableWidth();
        title.addCell(
                new Cell()
                        .setBorder(Border.NO_BORDER)
                        .setBackgroundColor(NAVY)
                        .setPadding(20)
                        .add(
                                new Paragraph("상품 공급 견적서")
                                        .setFontSize(22)
                                        .simulateBold()
                                        .setFontColor(ColorConstants.WHITE)
                                        .setTextAlignment(TextAlignment.CENTER)
                        )
                        .add(
                                new Paragraph(
                                        quote.quoteNo()
                                                + "  |  제출일 "
                                                + quote.submittedAt().format(DATE)
                                )
                                        .setFontSize(9)
                                        .setFontColor(
                                                new DeviceRgb(203, 213, 225)
                                        )
                                        .setTextAlignment(TextAlignment.CENTER)
                        )
        );
        document.add(title);
    }

    private void addSummary(
            com.itextpdf.layout.Document document,
            QuoteDetailResponse quote
    ) {
        addSectionTitle(document, "1. 견적 개요");
        Table table = new Table(
                UnitValue.createPercentArray(new float[]{1, 2, 1, 2})
        ).useAllAvailableWidth();

        addInfo(table, "상품명", quote.productName());
        addInfo(table, "브랜드", quote.brandName());
        addInfo(table, "소재", quote.material());
        addInfo(table, "예상 출고", quote.leadTimeDays() + "일");
        addInfo(table, "견적 유효일", quote.validUntil().format(DATE));
        addInfo(table, "견적 상태", quote.status());
        document.add(table);
    }

    private void addItems(
            com.itextpdf.layout.Document document,
            QuoteDetailResponse quote
    ) {
        addSectionTitle(document, "2. 품목별 견적");
        Table table = new Table(
                UnitValue.createPercentArray(new float[]{4, 1, 1.5f, 1.5f})
        ).useAllAvailableWidth();

        addHeader(table, "옵션");
        addHeader(table, "수량");
        addHeader(table, "단가");
        addHeader(table, "금액");

        for (QuoteItemResponse item : quote.items()) {
            String option = Boolean.TRUE.equals(item.isSample())
                    ? "[샘플] " + valueOrDash(item.optionSummary())
                    : valueOrDash(item.optionSummary());

            addBody(table, option, TextAlignment.LEFT);
            addBody(table, item.quantity().toString(), TextAlignment.RIGHT);
            addBody(table, formatPrice(item.unitPrice()), TextAlignment.RIGHT);
            addBody(table, formatPrice(item.totalPrice()), TextAlignment.RIGHT);
        }

        document.add(table);
    }

    private void addConditions(
            com.itextpdf.layout.Document document,
            QuoteDetailResponse quote
    ) {
        addSectionTitle(document, "3. 공급 조건");
        Table table = new Table(
                UnitValue.createPercentArray(new float[]{1, 2, 1, 2})
        ).useAllAvailableWidth();

        addInfo(table, "배송사", quote.deliveryCompany());
        addInfo(table, "배송비", formatPrice(quote.shippingFee()));
        addInfo(
                table,
                "샘플 제공",
                Boolean.TRUE.equals(quote.sampleAvailable()) ? "가능" : "불가"
        );
        addInfo(table, "소싱 요청", "#" + quote.sourcingRequestId());
        document.add(table);

        if (quote.sellerMemo() != null && !quote.sellerMemo().isBlank()) {
            document.add(
                    new Paragraph("셀러 메모")
                            .setFontSize(10)
                            .simulateBold()
                            .setMarginTop(12)
            );
            document.add(
                    new Paragraph(quote.sellerMemo())
                            .setFontSize(9)
                            .setFontColor(MUTED)
                            .setBackgroundColor(LIGHT_GRAY)
                            .setPadding(10)
            );
        }
    }

    private void addAmounts(
            com.itextpdf.layout.Document document,
            QuoteDetailResponse quote
    ) {
        addSectionTitle(document, "4. 견적 금액");
        Table table = new Table(
                UnitValue.createPercentArray(new float[]{2, 1})
        ).setWidth(UnitValue.createPercentValue(45))
                .setHorizontalAlignment(
                        com.itextpdf.layout.properties.HorizontalAlignment.RIGHT
                );

        addAmount(table, "상품 금액", quote.subtotalAmount(), false);
        addAmount(table, "배송비", quote.shippingFee(), false);
        addAmount(table, "최종 견적 금액", quote.totalAmount(), true);
        document.add(table);
    }

    private void addSectionTitle(
            com.itextpdf.layout.Document document,
            String title
    ) {
        document.add(
                new Paragraph(title)
                        .setFontSize(13)
                        .simulateBold()
                        .setFontColor(NAVY)
                        .setMarginTop(18)
                        .setMarginBottom(7)
        );
    }

    private void addInfo(Table table, String label, String value) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(label).simulateBold())
                        .setBackgroundColor(LIGHT_GRAY)
                        .setFontSize(8)
                        .setFontColor(MUTED)
                        .setBorder(new SolidBorder(BORDER, 0.7f))
                        .setPadding(7)
        );
        table.addCell(
                new Cell()
                        .add(new Paragraph(valueOrDash(value)))
                        .setFontSize(9)
                        .setBorder(new SolidBorder(BORDER, 0.7f))
                        .setPadding(7)
        );
    }

    private void addHeader(Table table, String value) {
        table.addHeaderCell(
                new Cell()
                        .add(new Paragraph(value).simulateBold())
                        .setBackgroundColor(NAVY)
                        .setFontColor(ColorConstants.WHITE)
                        .setFontSize(8)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBorder(new SolidBorder(NAVY, 0.7f))
                        .setPadding(7)
        );
    }

    private void addBody(
            Table table,
            String value,
            TextAlignment alignment
    ) {
        table.addCell(
                new Cell()
                        .add(new Paragraph(value))
                        .setFontSize(8)
                        .setTextAlignment(alignment)
                        .setBorder(new SolidBorder(BORDER, 0.7f))
                        .setPadding(7)
        );
    }

    private void addAmount(
            Table table,
            String label,
            Long amount,
            boolean emphasized
    ) {
        DeviceRgb background = emphasized ? NAVY : LIGHT_GRAY;
        DeviceRgb color = emphasized
                ? new DeviceRgb(255, 255, 255)
                : NAVY;

        table.addCell(
                new Cell()
                        .add(new Paragraph(label).simulateBold())
                        .setBackgroundColor(background)
                        .setFontColor(color)
                        .setBorder(new SolidBorder(BORDER, 0.7f))
                        .setPadding(8)
        );
        table.addCell(
                new Cell()
                        .add(new Paragraph(formatPrice(amount)).simulateBold())
                        .setBackgroundColor(background)
                        .setFontColor(emphasized ? ColorConstants.WHITE : BLUE)
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setBorder(new SolidBorder(BORDER, 0.7f))
                        .setPadding(8)
        );
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank() ? "-" : value;
    }

    private String formatPrice(Long value) {
        return String.format("%,d원", value == null ? 0L : value);
    }
}
