package kr.remerge.stylehub.domain.sourcing.service;

import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestDto;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequest;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestFile;
import kr.remerge.stylehub.domain.sourcing.entity.SourcingRequestItem;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingStatus;
import kr.remerge.stylehub.domain.sourcing.enumtype.SourcingSupplierStatus;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestFileRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestItemRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingRequestRepository;
import kr.remerge.stylehub.domain.sourcing.repository.SourcingSupplierRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.common.ImageUploadService;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.notification.NotificationMessage;
import kr.remerge.stylehub.global.notification.enumtype.NotificationType;
import kr.remerge.stylehub.global.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

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
    private final SourcingSupplierRepository sourcingSupplierRepository;
    private final UserRepository userRepository;
    private final SourcingAutoAssignService sourcingAutoAssignService;
    private final ImageUploadService imageUploadService;
    private final NotificationService notificationService;

    // ── 상세 조회 ────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public SourcingRequestDto.DetailResponse getDetail(
            Integer sourcingRequestId, Integer companyId, Integer userId, String role
    ) {
        SourcingRequest request = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소싱 요청: " + sourcingRequestId));

        // 요청을 올린 바이어 회사가 아니면 접근 불가
        if (!request.getBuyerCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

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

        // 관리자 승인 전(SUGGESTED) 또는 관리자가 반려(REJECTED)한 공급사는
        // 아직 셀러에게조차 노출되지 않은 상태이므로 바이어 화면에도 보이면 안 됨.
        // RECOMMENDED(승인됨) 이후 상태(QUOTED/DECLINED/EXPIRED)만 바이어에게 노출.
        List<SourcingRequestDto.BidResponse> bids =
                sourcingSupplierRepository.findBySourcingRequest_SourcingRequestId(sourcingRequestId)
                        .stream()
                        .filter(supplier -> supplier.getStatus() != SourcingSupplierStatus.SUGGESTED
                                && supplier.getStatus() != SourcingSupplierStatus.REJECTED)
                        .map(supplier -> SourcingRequestDto.BidResponse.from(supplier, userId, role))
                        .toList();

        return SourcingRequestDto.DetailResponse.of(request, items, files, bids, userId, role);
    }

    // ── 1단계: JSON 데이터 저장 ─────────────────────────────────────
    @Transactional
    public SourcingRequestDto.CreateResponse createRequests(AuthUser authUser, SourcingRequestDto.CreateRequest dto) {
        User buyer = userRepository.findById(authUser.userId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 바이어: " + authUser.userId()));

        List<Integer> savedIds = new ArrayList<>();

        for (SourcingRequestDto.ItemRequest itemDto : dto.getItems()) {
            String sourcingNo = "SR"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                    + UUID.randomUUID().toString().substring(0, 6).toUpperCase();

            SourcingRequest request = SourcingRequest.builder()
                    .sourcingNo(sourcingNo)
                    .buyer(buyer)
                    .buyerCompanyId(buyer.getCompany().getCompanyId())
                    .type(itemDto.getType())
                    .status(SourcingStatus.PENDING)
                    .productName(itemDto.getProductName())
                    .brandName(itemDto.getBrandName())
                    .categoryId(itemDto.getCategoryId())
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

            // 새 소싱 요청 등록 → 관리자 승인 대기 알림
            notificationService.send(NotificationMessage.toAdmin(
                    NotificationType.SOURCING_CREATED,
                    saved.getSourcingRequestId(),
                    "SOURCING"
            ));

            if (itemDto.getOptions() != null) {
                for (SourcingRequestDto.OptionRequest opt : itemDto.getOptions()) {
                    if (opt.getQuantity() == null || opt.getQuantity() <= 0) {
                        throw new BusinessException(ErrorCode.INVALID_OPTION_QUANTITY);
                    }

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

    // ── 2단계: 파일 저장 ────────────────────────────────────────────
    @Transactional
    public void uploadFiles(Integer sourcingRequestId, Integer companyId, String fileType, List<MultipartFile> files) {
        SourcingRequest sourcingRequest = sourcingRequestRepository.findById(sourcingRequestId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 소싱 요청: " + sourcingRequestId));

        // 요청을 올린 바이어 회사가 아니면 파일 첨부 불가
        if (!sourcingRequest.getBuyerCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

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