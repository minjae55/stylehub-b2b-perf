package kr.remerge.stylehub.domain.negotiation.service;

import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.contract.service.ContractService;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationCreateRequest;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationFileResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationListResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRequestDetailResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRespondRequest;
import kr.remerge.stylehub.domain.negotiation.entity.Negotiation;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationFile;
import kr.remerge.stylehub.domain.negotiation.entity.NegotiationRequest;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationFileRepository;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRepository;
import kr.remerge.stylehub.domain.negotiation.repository.NegotiationRequestRepository;
import kr.remerge.stylehub.domain.order.entity.OrderLog;
import kr.remerge.stylehub.domain.order.enumtype.OrderProcessStep;
import kr.remerge.stylehub.domain.order.repository.OrderLogRepository;
import kr.remerge.stylehub.domain.order.repository.OrderRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.dto.QuoteReviseItem;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.quote.service.QuoteService;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.common.ImageUploadService;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NegotiationService {

    // 재협의를 요청할 수 있는 견적 상태. 이 외의 상태(APPROVED/REJECTED/EXPIRED/NOT_SELECTED/SUPERSEDED)는
    // 이미 결론이 난 견적이라 재협의를 받으면 안 된다.
    private static final Set<String> NEGOTIABLE_QUOTE_STATUSES = Set.of(
            QuoteStatusCode.SUBMITTED,
            QuoteStatusCode.NEGOTIATING,
            QuoteStatusCode.SAMPLE_REQUESTED
    );

    private final NegotiationRepository negotiationRepository;
    private final NegotiationRequestRepository negotiationRequestRepository;
    private final NegotiationFileRepository negotiationFileRepository;
    private final QuoteRepository quoteRepository;
    private final QuoteItemRepository quoteItemRepository;
    private final ContractRepository contractRepository;
    private final QuoteService quoteService;
    private final ContractService contractService;
    private final UserReader userReader;
    private final OrderRepository orderRepository;
    private final OrderLogRepository orderLogRepository;
    private final ImageUploadService imageUploadService;

    public List<NegotiationListResponse> getNegotiationList(Integer userId) {

        List<Negotiation> negotiations =
                negotiationRepository
                        .findByBuyer_UserIdOrSeller_UserIdOrderByUpdatedAtDesc(
                                userId,
                                userId
                        );

        if (negotiations.isEmpty()) {
            return List.of();
        }

        List<Integer> negotiationIds = negotiations.stream()
                .map(Negotiation::getNegotiationId)
                .toList();

        Map<Integer, NegotiationRequest> latestRequestByNegotiationId =
                new HashMap<>();

        negotiationRequestRepository
                .findByNegotiation_NegotiationIdInOrderByCreatedAtDesc(
                        negotiationIds
                )
                .forEach(request ->
                        latestRequestByNegotiationId.putIfAbsent(
                                request.getNegotiation()
                                        .getNegotiationId(),
                                request
                        )
                );

        Map<Integer, Integer> linkedNegotiationIdByNegotiationId =
                buildLinkedNegotiationIdMap(negotiations);

        return negotiations.stream()
                .map(negotiation ->
                        NegotiationListResponse.from(
                                negotiation,
                                latestRequestByNegotiationId.get(
                                        negotiation.getNegotiationId()
                                ),
                                linkedNegotiationIdByNegotiationId.get(
                                        negotiation.getNegotiationId()
                                )
                        )
                )
                .toList();

    }

    // 같은 딜(같은 견적, 같은 바이어·셀러)의 견적 협의(QUOTE)와 계약 협의(CONTRACT)를
    // 서로의 negotiationId로 연결해준다. DB 행 자체는 그대로 2개로 유지하되, 화면에서
    // 하나의 연속된 대화로 묶어 보여주기 위한 용도다.
    private Map<Integer, Integer> buildLinkedNegotiationIdMap(
            List<Negotiation> negotiations
    ) {

        Map<String, List<Negotiation>> groupsByDeal = negotiations.stream()
                .filter(negotiation -> negotiation.getQuote() != null)
                .collect(Collectors.groupingBy(negotiation ->
                        negotiation.getQuote().getQuoteId()
                                + ":" + negotiation.getBuyer().getUserId()
                                + ":" + negotiation.getSeller().getUserId()
                ));

        Map<Integer, Integer> linkedIdByNegotiationId = new HashMap<>();

        for (List<Negotiation> group : groupsByDeal.values()) {
            if (group.size() < 2) {
                continue;
            }

            for (Negotiation a : group) {
                for (Negotiation b : group) {
                    if (!Objects.equals(a.getNegotiationId(), b.getNegotiationId())
                            && !Objects.equals(a.getNegotiationType(), b.getNegotiationType())) {
                        linkedIdByNegotiationId.put(
                                a.getNegotiationId(),
                                b.getNegotiationId()
                        );
                    }
                }
            }
        }

        return linkedIdByNegotiationId;
    }

    @Transactional
    public void createNegotiation(Integer userId, NegotiationCreateRequest request) {

        if ("CONTRACT".equals(request.negotiationType())) {
            createContractNegotiation(userId, request);
        } else {
            createQuoteNegotiation(userId, request);
        }
    }

    private void createQuoteNegotiation(Integer userId, NegotiationCreateRequest request) {

        if (request.quoteId() == null) {
            throw new BusinessException(ErrorCode.QUOTE_NOT_FOUND);
        }

        Quote quote =
                quoteRepository
                        .findByQuoteIdAndBuyer_UserId(request.quoteId(), userId)
                        .orElseThrow(
                                () -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND)
                        );

        // 바이어가 목록/상세 어느 화면에서 "협의 요청"을 눌렀는지에 따라 넘어오는 quoteId가
        // v1일 수도, 이미 재견적된 v2/v3일 수도 있다. 버전과 무관하게 항상 같은 대화(Negotiation)로
        // 묶이도록 체인의 최상위(root, v1) 견적을 기준으로 기존 협의를 찾는다. 이걸 안 하면 재견적
        // 이후 다시 협의를 요청할 때마다 같은 셀러와의 대화가 매번 새 행으로 갈라진다.
        Quote rootQuote = resolveRootQuote(quote);

        User buyer = userReader.getUser(userId);
        User seller = userReader.getUser(quote.getSeller().getUserId());

        // 상태(OPEN/AGREED/CLOSED)와 무관하게 같은 견적·같은 바이어면 항상 같은 행을 재사용한다.
        // 한 번 합의(AGREED)되거나 거절로 종료(CLOSED)된 뒤에도 같은 셀러와 다시 협의할 수 있는데,
        // 이때도 셀러 협의관리 화면에서 별개의 행이 아니라 하나의 행에서 대화가 이어지도록 하기 위함.
        Negotiation negotiation = negotiationRepository
                .findFirstByQuote_QuoteIdAndBuyer_UserIdOrderByOpenedAtDesc(
                        rootQuote.getQuoteId(),
                        userId
                )
                .orElseGet(() ->
                        negotiationRepository.save(
                                new Negotiation(
                                        "QUOTE",
                                        rootQuote,
                                        null,
                                        buyer,
                                        seller,
                                        rootQuote.getProductName()
                                                + " 견적 조건 협의"
                                )
                        )
                );

        if (!"OPEN".equals(negotiation.getStatus())) {
            negotiation.reopen();
        }

        // 이전 라운드에서 셀러가 이미 새 버전 견적으로 응답했다면, 이번 라운드는 그 최신 버전을
        // 기준으로 잡아야 parentQuote/version 체인이 v1→v2→v3로 이어진다. 그렇지 않으면 매 라운드가
        // 항상 원본(v1)에서 다시 갈라져서 서로 다른 행이 같은 version 번호를 갖게 되는 충돌이 생긴다.
        Quote currentQuote = negotiationRequestRepository
                .findFirstByNegotiation_NegotiationIdOrderByCreatedAtDesc(negotiation.getNegotiationId())
                .map(lastRequest -> lastRequest.getRevisedQuote() != null
                        ? lastRequest.getRevisedQuote()
                        : quote)
                .orElse(quote);

        // 이미 채택(APPROVED)된 견적은 재협의를 받을 수 없다. 재협의가 진행되어 셀러가
        // 새 버전으로 응답하면 QuoteService가 원본을 SUPERSEDED로 바꿔버리는데, 그러면
        // 계약서 작성 조건(quote.status == APPROVED)이 깨져서 계약서를 영영 못 만들게 된다.
        // REJECTED/EXPIRED/NOT_SELECTED/SUPERSEDED 등 이미 종료된 상태도 마찬가지로 막는다.
        if (!NEGOTIABLE_QUOTE_STATUSES.contains(currentQuote.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTE_NOT_NEGOTIABLE);
        }

        negotiationRequestRepository.save(
                new NegotiationRequest(
                        negotiation,
                        currentQuote,
                        null,
                        request.content().trim()
                )
        );

        negotiation.markRequested();

        if (QuoteStatusCode.SUBMITTED.equals(currentQuote.getStatus())) {
            currentQuote.changeStatus(QuoteStatusCode.NEGOTIATING);
        }

        orderRepository.
                findByQuote_QuoteIdInAndBuyer_UserIdAndIsSampleTrueOrderByCreatedAtDesc(
                List.of(quote.getQuoteId()),
                userId
        ).stream().findFirst().ifPresent(sampleOrder ->
                orderLogRepository.save(
                        OrderLog.createProcessLog(
                                sampleOrder,
                                OrderProcessStep.SAMPLE_NEGOTIATING,
                                buyer,
                                "샘플 확인 후 재협의가 요청되었습니다."
                        )
                )
        );
    }

    // parentQuote를 타고 올라가 이 견적 체인의 최초(v1) 견적을 찾는다.
    private Quote resolveRootQuote(Quote quote) {
        Quote current = quote;

        while (current.getParentQuote() != null) {
            current = current.getParentQuote();
        }

        return current;
    }

    // parentContract를 타고 올라가 이 계약 체인의 최초(v1) 계약을 찾는다.
    private Contract resolveRootContract(Contract contract) {
        Contract current = contract;

        while (current.getParentContract() != null) {
            current = current.getParentContract();
        }

        return current;
    }

    // 계약서(셀러 서명 후 바이어 검토 단계)에 대해 조건 변경을 요청하는 협의.
    // 바이어가 서명하기 전, SELLER_SIGNED 상태의 계약서에 대해서만 요청할 수 있다.
    private void createContractNegotiation(Integer userId, NegotiationCreateRequest request) {

        if (request.contractId() == null) {
            throw new BusinessException(ErrorCode.CONTRACT_NOT_FOUND);
        }

        Contract contract = contractRepository
                .findByContractIdAndQuote_Buyer_UserId(request.contractId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        // Quote와 동일한 이유로, 넘어온 계약이 이미 재계약된 버전일 수 있으므로 항상 체인의
        // 최상위(root, v1) 계약을 기준으로 기존 협의를 찾아야 같은 대화로 묶인다.
        Contract rootContract = resolveRootContract(contract);

        // 계약이 실제로 만들어진 견적 버전(v2 등)이 아니라 항상 견적 체인의 최상위(v1)를
        // 참조해야 한다. QUOTE 타입 협의도 항상 root 견적을 기준으로 저장되므로, 이렇게
        // 맞춰둬야 같은 딜의 견적 협의/계약 협의가 같은 quote_id로 묶여서 셀러 협의관리
        // 화면에서 하나의 연속된 대화로 이어 보여줄 수 있다.
        Quote quote = resolveRootQuote(rootContract.getQuote());
        User buyer = userReader.getUser(userId);
        User seller = userReader.getUser(quote.getSeller().getUserId());

        // Quote와 동일하게, 상태와 무관하게 같은 계약·같은 바이어면 항상 같은 행을 재사용한다.
        Negotiation negotiation = negotiationRepository
                .findFirstByContract_ContractIdAndBuyer_UserIdOrderByOpenedAtDesc(
                        rootContract.getContractId(),
                        userId
                )
                .orElseGet(() ->
                        negotiationRepository.save(
                                new Negotiation(
                                        "CONTRACT",
                                        quote,
                                        rootContract,
                                        buyer,
                                        seller,
                                        (rootContract.getContractName() != null
                                                ? rootContract.getContractName()
                                                : quote.getProductName())
                                                + " 계약 조건 협의"
                                )
                        )
                );

        if (!"OPEN".equals(negotiation.getStatus())) {
            negotiation.reopen();
        }

        // Quote와 동일한 이유: 이전 라운드에서 이미 재계약(revisedContract)이 나왔다면
        // 그 최신 버전을 기준으로 검증/연결해야 한다. (원본 계약은 createRevisedDraft에서 이미 CANCELED 처리됨)
        Contract currentContract = negotiationRequestRepository
                .findFirstByNegotiation_NegotiationIdOrderByCreatedAtDesc(negotiation.getNegotiationId())
                .map(lastRequest -> lastRequest.getRevisedContract() != null
                        ? lastRequest.getRevisedContract()
                        : contract)
                .orElse(contract);

        if (currentContract.getStatus() != ContractStatus.SELLER_SIGNED) {
            throw new BusinessException(ErrorCode.INVALID_CONTRACT_STATUS);
        }

        negotiationRequestRepository.save(
                new NegotiationRequest(
                        negotiation,
                        null,
                        currentContract,
                        request.content().trim()
                )
        );

        negotiation.markRequested();
    }

    // 셀러가 협의 요청에 재견적/재계약으로 응답한다.
    @Transactional
    public void respondToNegotiation(
            Integer sellerUserId,
            Integer negotiationRequestId,
            NegotiationRespondRequest request
    ) {

        NegotiationRequest negotiationRequest = negotiationRequestRepository
                .findById(negotiationRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEGOTIATION_REQUEST_NOT_FOUND));

        Negotiation negotiation = negotiationRequest.getNegotiation();

        if (!Objects.equals(negotiation.getSeller().getUserId(), sellerUserId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        if (!"REQUESTED".equals(negotiationRequest.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_NEGOTIATION_STATUS);
        }

        if ("CONTRACT".equals(negotiation.getNegotiationType())) {

            if (request.contractName() == null
                    || request.deliveryDate() == null
                    || request.paymentTerms() == null
                    || request.returnPolicy() == null) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            Contract originalContract = negotiationRequest.getRequestedContract();

            Long contractAmount = request.contractAmount() != null
                    ? request.contractAmount()
                    : originalContract.getContractAmount();

            Contract revisedContract = contractService.createRevisedDraft(
                    originalContract,
                    request.contractName(),
                    request.deliveryDate(),
                    request.paymentTerms(),
                    request.returnPolicy(),
                    request.specialTerms(),
                    contractAmount
            );

            negotiationRequest.respondWithContract(revisedContract, request.sellerMemo());

        } else {

            if (request.leadTimeDays() == null
                    || request.shippingFee() == null
                    || request.validUntil() == null
                    || request.items() == null
                    || request.items().isEmpty()) {
                throw new BusinessException(ErrorCode.INVALID_INPUT);
            }

            Quote originalQuote = negotiationRequest.getRequestedQuote();

            List<QuoteReviseItem> items = request.items().stream()
                    .map(item -> new QuoteReviseItem(
                            item.optionSummary(),
                            item.quantity(),
                            item.unitPrice(),
                            item.sample()
                    ))
                    .toList();

            Quote revisedQuote = quoteService.createRevisedQuote(
                    originalQuote,
                    request.leadTimeDays(),
                    request.shippingFee(),
                    request.validUntil(),
                    request.sellerMemo(),
                    items
            );

            negotiationRequest.respondWithQuote(revisedQuote, request.sellerMemo());
        }
    }

    // 바이어가 셀러의 응답(재견적/재계약)을 수락한다.
    @Transactional
    public void acceptNegotiationRequest(Integer buyerUserId, Integer negotiationRequestId) {

        NegotiationRequest negotiationRequest = findRequestForBuyer(buyerUserId, negotiationRequestId);

        if (!"RESPONDED".equals(negotiationRequest.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_NEGOTIATION_STATUS);
        }

        negotiationRequest.accept();
        negotiationRequest.getNegotiation().agree();

        if (negotiationRequest.getRevisedQuote() != null) {
            negotiationRequest.getRevisedQuote().changeStatus(QuoteStatusCode.APPROVED);
        }
    }

    // 바이어가 셀러의 응답(재견적/재계약)을 거절한다.
    @Transactional
    public void rejectNegotiationRequest(Integer buyerUserId, Integer negotiationRequestId) {

        NegotiationRequest negotiationRequest = findRequestForBuyer(buyerUserId, negotiationRequestId);

        if (!"RESPONDED".equals(negotiationRequest.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_NEGOTIATION_STATUS);
        }

        negotiationRequest.cancel();
        negotiationRequest.getNegotiation().close();
    }

    private NegotiationRequest findRequestForBuyer(Integer buyerUserId, Integer negotiationRequestId) {

        NegotiationRequest negotiationRequest = negotiationRequestRepository
                .findById(negotiationRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEGOTIATION_REQUEST_NOT_FOUND));

        if (!Objects.equals(
                negotiationRequest.getNegotiation().getBuyer().getUserId(),
                buyerUserId
        )) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return negotiationRequest;
    }

    // 협의 스레드의 라운드별 이력(요청 -> 응답)을 시간순으로 조회한다.
    public List<NegotiationRequestDetailResponse> getNegotiationRequests(
            Integer userId,
            Integer negotiationId
    ) {

        Negotiation negotiation = negotiationRepository.findById(negotiationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEGOTIATION_NOT_FOUND));

        boolean isParty = Objects.equals(negotiation.getBuyer().getUserId(), userId)
                || Objects.equals(negotiation.getSeller().getUserId(), userId);

        if (!isParty) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        List<Integer> negotiationIds = new ArrayList<>();
        negotiationIds.add(negotiationId);

        // 견적 협의 -> 계약 협의처럼 같은 딜이 다른 단계의 별개 Negotiation 행으로 이어지는
        // 경우, 이력 조회 시 짝이 되는 협의의 요청 이력도 함께 가져와 시간순으로 합쳐
        // 하나의 연속된 대화처럼 보여준다.
        findLinkedNegotiation(negotiation)
                .ifPresent(linked -> negotiationIds.add(linked.getNegotiationId()));

        List<NegotiationRequest> requests = negotiationRequestRepository
                .findByNegotiation_NegotiationIdInOrderByCreatedAtAsc(negotiationIds);

        return requests.stream()
                .map(request -> NegotiationRequestDetailResponse.from(
                        request,
                        findQuoteItems(request.getRequestedQuote()),
                        findQuoteItems(request.getRevisedQuote())
                ))
                .toList();
    }

    // 같은 딜(같은 견적, 같은 바이어·셀러)의 다른 타입 협의(QUOTE<->CONTRACT)를 찾는다.
    private Optional<Negotiation> findLinkedNegotiation(Negotiation negotiation) {

        if (negotiation.getQuote() == null) {
            return Optional.empty();
        }

        String otherType =
                "QUOTE".equals(negotiation.getNegotiationType()) ? "CONTRACT" : "QUOTE";

        return negotiationRepository
                .findFirstByQuote_QuoteIdAndBuyer_UserIdAndSeller_UserIdAndNegotiationTypeOrderByOpenedAtDesc(
                        negotiation.getQuote().getQuoteId(),
                        negotiation.getBuyer().getUserId(),
                        negotiation.getSeller().getUserId(),
                        otherType
                );
    }

    private List<QuoteItem> findQuoteItems(Quote quote) {
        if (quote == null) {
            return List.of();
        }

        return quoteItemRepository.findByQuote_QuoteId(quote.getQuoteId());
    }

    // 협의 요청에 파일을 첨부한다. 해당 협의의 바이어/셀러만 업로드할 수 있다.
    @Transactional
    public NegotiationFileResponse uploadFile(
            Integer userId,
            Integer negotiationRequestId,
            MultipartFile file
    ) {

        NegotiationRequest negotiationRequest = negotiationRequestRepository
                .findById(negotiationRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEGOTIATION_REQUEST_NOT_FOUND));

        Negotiation negotiation = negotiationRequest.getNegotiation();

        boolean isParty = Objects.equals(negotiation.getBuyer().getUserId(), userId)
                || Objects.equals(negotiation.getSeller().getUserId(), userId);

        if (!isParty) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        User uploader = userReader.getUser(userId);

        String fileUrl = imageUploadService.upload(
                file,
                "negotiations/" + negotiationRequestId
        );

        NegotiationFile negotiationFile = negotiationFileRepository.save(
                new NegotiationFile(
                        negotiationRequest,
                        uploader,
                        file.getOriginalFilename(),
                        fileUrl,
                        file.getContentType(),
                        file.getSize()
                )
        );

        return NegotiationFileResponse.from(negotiationFile);
    }

    public List<NegotiationFileResponse> getFiles(Integer userId, Integer negotiationRequestId) {

        NegotiationRequest negotiationRequest = negotiationRequestRepository
                .findById(negotiationRequestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NEGOTIATION_REQUEST_NOT_FOUND));

        Negotiation negotiation = negotiationRequest.getNegotiation();

        boolean isParty = Objects.equals(negotiation.getBuyer().getUserId(), userId)
                || Objects.equals(negotiation.getSeller().getUserId(), userId);

        if (!isParty) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }

        return negotiationFileRepository
                .findByNegotiationRequest_NegotiationRequestIdOrderByCreatedAtAsc(negotiationRequestId)
                .stream()
                .map(NegotiationFileResponse::from)
                .toList();
    }
}
