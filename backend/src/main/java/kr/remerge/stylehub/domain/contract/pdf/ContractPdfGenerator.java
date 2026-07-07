package kr.remerge.stylehub.domain.contract.pdf;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.entity.ContractSignature;
import kr.remerge.stylehub.domain.contract.enumtype.SignerRole;
import kr.remerge.stylehub.global.pdf.PdfDocumentGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ContractPdfGenerator {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy년 MM월 dd일");

    private static final DeviceRgb NAVY =
            new DeviceRgb(15, 23, 42);

    private static final DeviceRgb BLUE =
            new DeviceRgb(37, 99, 235);

    private static final DeviceRgb LIGHT_BLUE =
            new DeviceRgb(239, 246, 255);

    private static final DeviceRgb LIGHT_GRAY =
            new DeviceRgb(248, 250, 252);

    private static final DeviceRgb BORDER_COLOR =
            new DeviceRgb(226, 232, 240);

    private static final DeviceRgb MUTED_TEXT =
            new DeviceRgb(100, 116, 139);

    private final PdfDocumentGenerator pdfDocumentGenerator;

    public byte[] generate(
            Contract contract,
            List<ContractItem> items,
            List<ContractSignature> signatures
    ) {

        return pdfDocumentGenerator.generate(document -> {
            addContractContent(document, contract, items);
            addSignatures(document, signatures);
        });
    }

    public byte[] generatePreview(
            Contract contract,
            List<ContractItem> items,
            String signatureText,
            String signatureImageUrl
    ) {

        return pdfDocumentGenerator.generate(document -> {
            addPreviewNotice(document);
            addContractContent(document, contract, items);
            addPreviewSignatures(
                    document,
                    signatureText,
                    signatureImageUrl
            );
        }
        );
    }

    public byte[] generateBuyerPreview(
            Contract contract,
            List<ContractItem> items,
            ContractSignature sellerSignature,
            String buyerSignatureText,
            String buyerSignatureImageUrl
    ) {
        return pdfDocumentGenerator.generate(document -> {
            addPreviewNotice(document);
            addContractContent(document, contract, items);
            addSectionTitle(document, "4. 전자서명");

            Table table = new Table(
                    UnitValue.createPercentArray(new float[]{1, 1})
            ).useAllAvailableWidth();

            table.addCell(
                    createPreviewSignatureCell(
                            "구매자",
                            buyerSignatureText,
                            buyerSignatureImageUrl
                    )
            );
            table.addCell(
                    createSignatureCell("판매자", sellerSignature)
            );

            document.add(table);
        });
    }

    private void addPreviewSignatures(
            Document document,
            String signatureText,
            String signatureImageUrl
    ) {
        addSectionTitle(document, "4. 전자서명");

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{1, 1}
                )
        ).useAllAvailableWidth();

        table.addCell(
                createPendingSignatureCell("구매자", "서명 대기")
        );

        if (signatureText != null && signatureImageUrl != null) {
            table.addCell(
                    createPreviewSignatureCell(
                            "판매자",
                            signatureText,
                            signatureImageUrl
                    )
            );
        } else {
            table.addCell(
                    createPendingSignatureCell("판매자", "서명 전")
            );
        }

        document.add(table);
    }

    private Cell createPendingSignatureCell(
            String role,
            String status
    ) {
        return new Cell()
                .setMinHeight(112)
                .setPadding(14)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.8f))
                .add(
                        new Paragraph(role)
                                .simulateBold()
                                .setFontColor(NAVY)
                )
                .add(
                        new Paragraph(status)
                                .setFontSize(9)
                                .setFontColor(MUTED_TEXT)
                                .setMarginTop(22)
                                .setTextAlignment(TextAlignment.CENTER)
                );
    }

    private Cell createPreviewSignatureCell(
            String role,
            String signatureText,
            String signatureImageUrl
    ) {
        Cell cell = new Cell()
                .setMinHeight(112)
                .setPadding(14)
                .setBorder(new SolidBorder(BLUE, 1f))
                .setBackgroundColor(LIGHT_BLUE);

        cell.add(
                new Paragraph(role + " · 서명 미리보기")
                        .simulateBold()
                        .setFontColor(BLUE)
                        .setMarginBottom(4)
        );

        cell.add(
                new Paragraph("서명자: " + signatureText)
                        .setFontSize(9)
                        .setFontColor(MUTED_TEXT)
        );

        addSignatureImage(cell, signatureImageUrl, role);
        return cell;
    }

    private void addPreviewNotice(Document document) {
        Table notice = new Table(1).useAllAvailableWidth();

        notice.addCell(
                new Cell()
                        .setBorder(Border.NO_BORDER)
                        .setBackgroundColor(LIGHT_BLUE)
                        .setPadding(9)
                        .add(
                                new Paragraph(
                                        "미리보기 문서 · 판매자 발송 전에는 효력이 없습니다."
                                )
                                        .setFontSize(9)
                                        .simulateBold()
                                        .setFontColor(BLUE)
                                        .setTextAlignment(TextAlignment.CENTER)
                        )
        );

        document.add(notice.setMarginBottom(14));
    }

    private void addContractContent(Document document, Contract contract, List<ContractItem> items) {
        addTitle(document, contract);
        addParties(document, contract);
        addItems(document, contract, items);
        addTerms(document, contract);
    }

    private void addTitle(
            Document document,
            Contract contract
    ) {
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
                                new Paragraph("상품 공급계약서")
                                        .setFontSize(23)
                                        .simulateBold()
                                        .setFontColor(ColorConstants.WHITE)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginBottom(6)
                        )
                        .add(
                                new Paragraph(
                                        "계약번호 " + contract.getContractNo()
                                )
                                        .setFontSize(9)
                                        .setFontColor(
                                                new DeviceRgb(203, 213, 225)
                                        )
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
                        "계약명 "
                                + valueOrDash(contract.getContractName())
                                + "  ·  연동 견적 "
                                + contract.getQuote().getQuoteNo()
                )
                        .setFontSize(9)
                        .setFontColor(MUTED_TEXT)
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setMarginBottom(8)
        );
    }

    private void addParties(
            Document document,
            Contract contract
    ) {
        addSectionTitle(document, "1. 계약 당사자");

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{1, 2, 1, 2}
                )
        ).useAllAvailableWidth();

        addInfoPair(table, "구매자", contract.getBuyerCompanyName());
        addInfoPair(table, "판매자", contract.getSellerCompanyName());

        document.add(table);
    }

    private void addItems(
            Document document,
            Contract contract,
            List<ContractItem> items
    ) {
        addSectionTitle(document, "2. 계약 품목");

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{3, 3, 1, 2, 2}
                )
        ).useAllAvailableWidth();

        addHeaderCell(table, "상품명");
        addHeaderCell(table, "옵션");
        addHeaderCell(table, "수량");
        addHeaderCell(table, "단가");
        addHeaderCell(table, "금액");

        for (int i = 0; i < items.size(); i++) {
            ContractItem item = items.get(i);
            DeviceRgb rowBackground = (i % 2 == 0)
                    ? new DeviceRgb(255, 255, 255)
                    : LIGHT_GRAY;
            addBodyCell(table, item.getProductName(), rowBackground);
            addBodyCell(table, valueOrDash(item.getOptionSummary()), rowBackground);
            addBodyCell(table, item.getQuantity() + "개", rowBackground);
            addBodyCell(table, formatPrice(item.getUnitPrice()), rowBackground);
            addBodyCell(table, formatPrice(item.getTotalPrice()), rowBackground);
        }

        document.add(table);

        Table amountTable = new Table(
                UnitValue.createPercentArray(
                        new float[]{3, 1.4f}
                )
        ).setWidth(UnitValue.createPercentValue(45))
                .setHorizontalAlignment(
                        com.itextpdf.layout.properties.HorizontalAlignment.RIGHT
                )
                .setMarginTop(10);

        addAmountRow(
                amountTable,
                "상품 금액",
                contract.getContractAmount() - contract.getShippingFee(),
                false
        );
        addAmountRow(
                amountTable,
                "배송비",
                contract.getShippingFee(),
                false
        );
        addAmountRow(
                amountTable,
                "총 계약 금액",
                contract.getContractAmount(),
                true
        );

        document.add(amountTable);
    }

    private void addTerms(
            Document document,
            Contract contract
    ) {
        addSectionTitle(document, "3. 계약 조건");

        addTerm(
                document,
                "제1조 (납품 조건)",
                "판매자는 "
                        + contract.getDeliveryDate()
                        .format(DATE_FORMATTER)
                        + "까지 계약 상품을 납품합니다."
        );

        addTerm(
                document,
                "제2조 (대금 지급 조건)",
                contract.getPaymentTerms()
        );

        addTerm(
                document,
                "제3조 (반품 및 교환 조건)",
                contract.getReturnPolicy()
        );

        if (contract.getSpecialTerms() != null
                && !contract.getSpecialTerms().isBlank()) {

            addTerm(
                    document,
                    "제4조 (특약 사항)",
                    contract.getSpecialTerms()
            );
        }

        addTerm(
                document,
                "배송비",
                formatPrice(contract.getShippingFee())
        );
    }

    private void addSignatures(
            Document document,
            List<ContractSignature> signatures
    ) {
        addSectionTitle(document, "4. 전자서명");

        ContractSignature buyerSignature =
                findSignature(signatures, SignerRole.BUYER);

        ContractSignature sellerSignature =
                findSignature(signatures, SignerRole.SELLER);

        Table table = new Table(
                UnitValue.createPercentArray(
                        new float[]{1, 1}
                )
        ).useAllAvailableWidth();

        table.addCell(
                createSignatureCell("구매자", buyerSignature)
        );

        table.addCell(
                createSignatureCell("판매자", sellerSignature)
        );

        document.add(table);
    }

    private Cell createSignatureCell(
            String role,
            ContractSignature signature
    ) {
        Cell cell = new Cell()
                .setMinHeight(112)
                .setPadding(14)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.8f));

        cell.add(
                new Paragraph(role)
                        .simulateBold()
                        .setMarginBottom(6)
        );

        cell.add(
                new Paragraph(
                        "서명자: " + signature.getSignatureText()
                ).setFontSize(9)
        );

        cell.add(
                new Paragraph(
                        "서명일시: "
                                + signature.getSignedAt()
                                .format(
                                        DateTimeFormatter.ofPattern(
                                                "yyyy-MM-dd HH:mm"
                                        )
                                )
                ).setFontSize(9)
        );

        addSignatureImage(
                cell,
                signature.getSignatureImageUrl(),
                role
        );

        return cell;
    }

    private void addSignatureImage(
            Cell cell,
            String signatureImageUrl,
            String role
    ) {
        try {
            Image signatureImage = new Image(
                    ImageDataFactory.create(signatureImageUrl)
            );

            signatureImage.setMaxWidth(140);
            signatureImage.setMaxHeight(54);
            signatureImage.setMarginTop(5);
            cell.add(signatureImage);
        } catch (Exception exception) {
            throw new IllegalStateException(
                    role + " 서명 이미지를 불러오지 못했습니다.",
                    exception
            );
        }
    }

    private ContractSignature findSignature(
            List<ContractSignature> signatures,
            SignerRole signerRole
    ) {
        return signatures.stream()
                .filter(signature ->
                        signature.getSignerRole() == signerRole
                )
                .findFirst()
                .orElseThrow(() ->
                        new IllegalStateException(
                                signerRole
                                        + " 서명 정보가 없습니다."
                        )
                );
    }

    private void addSectionTitle(
            Document document,
            String title
    ) {
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

    private void addTerm(
            Document document,
            String title,
            String content
    ) {
        Table termBox = new Table(1).useAllAvailableWidth();

        termBox.addCell(
                new Cell()
                        .setBackgroundColor(LIGHT_GRAY)
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setPadding(10)
                        .add(
                                new Paragraph(title)
                                        .simulateBold()
                                        .setFontSize(10)
                                        .setFontColor(NAVY)
                                        .setMarginBottom(3)
                        )
                        .add(
                                new Paragraph(valueOrDash(content))
                                        .setFontSize(9)
                                        .setFontColor(MUTED_TEXT)
                                        .setMultipliedLeading(1.45f)
                        )
        );

        document.add(termBox.setMarginBottom(7));
    }

    private void addInfoPair(
            Table table,
            String label,
            String value
    ) {
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

    private void addHeaderCell(
            Table table,
            String value
    ) {
        table.addHeaderCell(
                new Cell()
                        .add(
                                new Paragraph(value)
                                        .simulateBold()
                                        .setFontSize(9)
                        )
                        .setBackgroundColor(NAVY)
                        .setFontColor(ColorConstants.WHITE)
                        .setBorder(new SolidBorder(NAVY, 0.7f))
                        .setTextAlignment(TextAlignment.CENTER)
                        .setPadding(8)
        );
    }

    private void addBodyCell(
            Table table,
            String value
    ) {
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
                        .setFontSize(8.5f)
                        .setBackgroundColor(background)
                        .setBorder(new SolidBorder(BORDER_COLOR, 0.7f))
                        .setPadding(8)
        );
    }

    private void addAmountRow(
            Table table,
            String label,
            Long amount,
            boolean emphasized
    ) {
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

    private String formatPrice(Long value) {
        return String.format("%,d원", value);
    }

    private String valueOrDash(String value) {
        return value == null || value.isBlank()
                ? "-"
                : value;
    }
}
   