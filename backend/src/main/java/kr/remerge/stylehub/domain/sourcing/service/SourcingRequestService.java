package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestDto;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SupplierSourcingType;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestFileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.common.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SourcingRequestService {

    private final SourcingRequestRepository sourcingRequestRepository;
    private final SourcingRequestItemRepository sourcingRequestItemRepository;
    private final SourcingRequestFileRepository sourcingRequestFileRepository;
    private final UserRepository userRepository;
    private final SourcingAutoAssignService sourcingAutoAssignService;
    private final ImageUploadService imageUploadService;

    // ── 상세 조회 ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public SourcingRequestDto.DetailResponse getDetail(Integer sourcingRequestId) {
        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소싱 요청: " + sourcingRequestId));

        List<SourcingRequestDto.ItemResponse> items =
                sourcingRequestItemRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId)
                        .stream()
                        .map(SourcingRequestDto.ItemResponse::from)
                        .toList();

        List<SourcingRequestDto.FileResponse> files =
                sourcingRequestFileRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId)
                        .stream()
                        .map(SourcingRequestDto.FileResponse::from)
                        .toList();

        return SourcingRequestDto.DetailResponse.of(request, items, files);
    }

    // ── 1단계: JSON 데이터 저장 ─────────────────────────────────────
    @Transactional
    public SourcingRequestDto.CreateResponse createRequests(SourcingRequestDto.CreateRequest dto) {
        // TODO: 인증 붙으면 dto.getBuyerId() 대신 SecurityContext에서 추출
        User buyer = userRepository.findById(dto.getBuyerId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 바이어: " + dto.getBuyerId()));

        List<Integer> savedIds = new ArrayList<>();

        for (SourcingRequestDto.ItemRequest itemDto : dto.getItems()) {
            // sourcing_no 생성: SR + yyyyMMddHHmmss + UUID 앞 6자리
            String sourcingNo = "SR"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

            SourcingRequest request = SourcingRequest.builder()
                    .sourcingNo(sourcingNo)
                    .buyer(buyer)
                    .type(itemDto.getType())
                    .status(SourcingStatus.PENDING)
                    .productName(itemDto.getProductName())
                    .brandName(itemDto.getBrandName())
                    .subCategoryId(itemDto.getSubCategoryId())
                    .needSample(itemDto.getNeedSample())
                    .mainMaterial(itemDto.getMainMaterial())
                    .unitPrice(itemDto.getUnitPrice())
                    .refUrl(itemDto.getRefUrl())
                    .totalBudget(itemDto.getTotalBudget())
                    .detail(itemDto.getDetail())
                    .deliveryDate(itemDto.getDeliveryDate())
                    .expiryDate(itemDto.getExpiryDate())
                    .build();

            SourcingRequest saved = sourcingRequestRepository.save(request);
            sourcingAutoAssignService.assign(saved);
            // 옵션 items 저장
            if (itemDto.getOptions() != null) {
                for (SourcingRequestDto.OptionRequest opt : itemDto.getOptions()) {
                    SourcingRequestItem item = SourcingRequestItem.builder()
                            .sourcingRequest(saved)
                            .optionSummary(opt.getOptionSummary())
                            .quantity(opt.getQuantity())
                            .sampleQuantity(opt.getSampleQuantity())
                            .build();
                    sourcingRequestItemRepository.save(item);
                }
            }

            savedIds.add(saved.getSourcingRequestId());
        }

        return new SourcingRequestDto.CreateResponse(savedIds);
    }

    // ── 2단계: 파일 저장 (외부 스토리지 연동 전 로컬 임시 저장) ────
    @Transactional
    public void uploadFiles(Integer sourcingRequestId, String fileType, List<MultipartFile> files) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소싱 요청: " + sourcingRequestId));

        boolean isCustom = sourcingRequest.getType().equals("CUSTOM");

        for (MultipartFile file : files) {
            String savedUrl = isCustom
                    ? imageUploadService.uploadPdf(file, "sourcing/" + sourcingRequestId)
                    : imageUploadService.upload(file, "sourcing/" + sourcingRequestId);

            SourcingRequestFile fileEntity = SourcingRequestFile.builder()
                    .sourcingRequest(sourcingRequest)
                    .fileType(fileType)
                    .fileName(file.getOriginalFilename())
                    .fileUrl(savedUrl)
                    .build();

            sourcingRequestFileRepository.save(fileEntity);
        }
    }

}
