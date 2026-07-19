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
import kr.remerge.stylehub.domain.order.entity.Order;
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
import java.util.HashSet;
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

    public List<NegotiationListResponse> getNegotiationList(Integer userId, int page, int size) {

        int fetchLimit = page * size + size;

        List<Negotiation> negotiations =
                negotiationRepository
                        .findByBuyerOrSellerPaged(userId, fetchLimit, size, page * size);

        if (negotiations.isEmpty()) {
            return List.of();
        }

        List<Integer> negotiationIds = negotiations.stream()
                .map(Negotiation::getNegotiationId)
                .toList();

        List<NegotiationRequest> allRequests =
                negotiationRequestRepository
                        .findByNegotiation_NegotiationIdInOrderByCreatedAtDesc(
                                negotiationIds
                        );

        Map<Integer, NegotiationRequest> latestRequestByNegotiationId =
                new HashMap<>();

        allRequests.forEach(request ->
                latestRequestByNegotiationId.putIfAbsent(
                        request.getNegotiation()
                                .getNegotiationId(),
                        request
                )
        );

        Map<Integer, Integer> linkedNegotiationIdByNegotiationId =
                buildLinkedNegotiationIdMap(negotiations);

        Map<Integer, Order> sampleOrderByNegotiationId =
                buildSampleOrderByNegotiationIdMap(negotiations, allRequests);

        return negotiations.stream()
                .map(negotiation ->
                        NegotiationListResponse.from(
                                negotiation,
                                latestRequestByNegotiationId.get(
                                        negotiation.getNegotiationId()
                                ),
                                linkedNegotiationIdByNegotiationId.get(
                                        negotiation.getNegotiationId()
                                ),
                                sampleOrderByNegotiationId.get(
                                        negotiation.getNegotiationId()
                                )
                        )
                )
                .toList();

    }

    private Map<Integer, Order> buildSampleOrderByNegotiationIdMap(
            List<Negotiation> negotiations,
            List<NegotiationRequest> allRequests
    ) {

        Map<Integer, Set<Integer>> quoteIdsByNegotiationId = new HashMap<>();

        for (Negotiation negotiation : negotiations) {
            if (negotiation.getQuote() != null) {
                quoteIdsByNegotiationId
                        .computeIfAbsent(negotiation.getNegotiationId(), key -> new HashSet<>())
                        .add(negotiation.getQuote().getQuoteId());
            }
        }

        for (NegotiationRequest request : allRequests) {
            Integer negotiationId = request.getNegotiation().getNegotiationId();
            Set<Integer> quoteIds = quoteIdsByNegotiationId
                    .computeIfAbsent(negotiationId, key -> new HashSet<>());

            if (request.getRequestedQuote() != null) {
                quoteIds.add(request.getRequestedQuote().getQuoteId());
            }
            if (request.getRevisedQuote() != null) {
                quoteIds.add(request.getRevisedQuote().getQuoteId());
            }
        }

        List<Integer> allQuoteIds = quoteIdsByNegotiationId.values().stream()
                .flatMap(Set::stream)
                .distinct()
                .toList();

        if (allQuoteIds.isEmpty()) {
            return Map.of();
        }

        Map<Integer, Order> latestOrderByQuoteId = new HashMap<>();

        orderRepository
                .findByQuote_QuoteIdInAndIsSampleTrueOrderByCreatedAtDesc(allQuoteIds)
                .forEach(order ->
                        latestOrderByQuoteId.putIfAbsent(
                                order.getQuote().getQuoteId(),
                                order
                        )
                );

        Map<Integer, Order> sampleOrderByNegotiationId = new HashMap<>();

        quoteIdsByNegotiationId.forEach((negotiationId, quoteIds) -> {
            Order latest = null;

            for (Integer quoteId : quoteIds) {
                Order candidate = latestOrderByQuoteId.get(quoteId);

                if (candidate == null) {
                    continue;
                }

                if (latest == null || candidate.getCreatedAt().isAfter(latest.getCreatedAt())) {
                    latest = candidate;
                }
            }

            if (latest != null) {
                sampleOrderByNegotiationId.put(negotiationId, latest);
            }
        });

        return sampleOrderByNegotiationId;
    }

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

        Quote rootQuote = resolveRootQuote(quote);

        User buyer = userReader.getUser(userId);
        User seller = userReader.getUser(quote.getSeller().getUserId());

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

        Quote currentQuote = negotiationRequestRepository
                .findFirstByNegotiation_NegotiationIdOrderByCreatedAtDesc(negotiation.getNegotiationId())
                .map(lastRequest -> lastRequest.getRevisedQuote() != null
                        ? lastRequest.getRevisedQuote()
                        : quote)
                .orElse(quote);

        if (!NEGOTIABLE_QUOTE_STATUSES.contains(currentQuote.getStatus())) {
            throw new BusinessException(ErrorCode.QUOTE_NOT_NEGOTIABLE);
        }

        negotiationRequestRepository.save(
                new NegotiationRequest(
                        negotiation,
                        currentQuote,
                        null,
                        request.content().trim(),
                        request.desiredUnitPrice(),
                        request.desiredLeadTimeDays()
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

    private Quote resolveRootQuote(Quote quote) {
        return quoteRepository.findRootQuote(quote.getQuoteId())
                .orElse(quote);
    }

    private Contract resolveRootContract(Contract contract) {

        return contractRepository.findRootContract(contract.getContractId())
                .orElse(contract);
    }

    private void createContractNegotiation(Integer userId, NegotiationCreateRequest request) {

        if (request.contractId() == null) {
            throw new BusinessException(ErrorCode.CONTRACT_NOT_FOUND);
        }

        Contract contract = contractRepository
                .findByContractIdAndQuote_Buyer_UserId(request.contractId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));

        Contract rootContract = resolveRootContract(contract);

        Quote quote = resolveRootQuote(rootContract.getQuote());
        User buyer = userReader.getUser(userId);
        User seller = userReader.getUser(quote.getSeller().getUserId());

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
                        request.content().trim(),
                        null,
                        null
                )
        );

        negotiation.markRequested();
    }

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