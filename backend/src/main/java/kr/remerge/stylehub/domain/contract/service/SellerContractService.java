package kr.remerge.stylehub.domain.contract.service;

import kr.remerge.stylehub.domain.contract.dto.*;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.entity.ContractSignature;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.contract.enumtype.SignerRole;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractSignatureRepository;
import kr.remerge.stylehub.domain.quote.constant.QuoteStatusCode;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.repository.QuoteRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SellerContractService {

    private final ContractRepository contractRepository;
    private final ContractItemRepository contractItemRepository;
    private final ContractSignatureRepository contractSignatureRepository;
    private final UserReader userReader;
    private final QuoteRepository quoteRepository;
    private final ContractService contractService;

    public SellerContractDetailResponse getContractByQuote(
            Integer userId,
            Integer quoteId
    ) {
        User seller = userReader.getCompanyUser(userId);
        Contract contract = findContractByQuote(quoteId);
        validateSellerCompany(seller, contract);

        List<ContractItem> items =
                contractItemRepository
                        .findByContract_ContractIdOrderByContractItemIdAsc(
                                contract.getContractId()
                        );

        return SellerContractDetailResponse.from(contract, items);
    }

    @Transactional
    public void signAndSend(
            Integer userId,
            Integer contractId,
            SellerContractSignRequest request,
            String signedIp,
            String userAgent
    ) {
        User seller = userReader.getCompanyUser(userId);

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CONTRACT_NOT_FOUND)
                );

        validateSellerCompany(seller, contract);
        validateDraftStatus(contract);

        boolean alreadySigned =
                contractSignatureRepository
                        .existsByContract_ContractIdAndSignerRole(
                                contractId,
                                SignerRole.SELLER
                        );

        if (alreadySigned) {
            throw new BusinessException(
                    ErrorCode.CONTRACT_ALREADY_SIGNED
            );
        }

        ContractSignature signature = new ContractSignature(
                contract,
                seller,
                SignerRole.SELLER,
                request.signatureText(),
                null,
                null,
                signedIp,
                userAgent
        );

        contractSignatureRepository.save(signature);
        contract.sellerSign();
    }

    @Transactional
    public void updateDraft(
            Integer userId,
            Integer contractId,
            SellerContractUpdateRequest request
    ) {
        User seller = userReader.getCompanyUser(userId);

//        contractRepository.fi
    }

    private Contract findContractByQuote(Integer quoteId) {
        return contractRepository.findByQuote_QuoteId(quoteId)
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CONTRACT_NOT_FOUND)
                );
    }

    private void validateSellerCompany(
            User seller,
            Contract contract
    ) {
        boolean sameCompany =
                seller.getCompany() != null
                        && Objects.equals(
                        seller.getCompany().getCompanyId(),
                        contract.getCompany().getCompanyId()
                );

        if (!sameCompany) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateDraftStatus(Contract contract) {
        if (contract.getStatus() != ContractStatus.DRAFT) {
            throw new BusinessException(
                    ErrorCode.INVALID_CONTRACT_STATUS
            );
        }
    }

    @Transactional
    public SellerContractCreateResponse createContract(Integer userId, SellerContractCreateRequest request) {

        User seller = userReader.getCompanyUser(userId);

        Quote quote = quoteRepository.findById(request.quoteId())
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));

        validateApprovedQuote(quote);
        validateSellerCompany(seller, quote);

        Contract contract = contractService.createDraft(quote, request);

        return SellerContractCreateResponse.from(contract);

    }

    private void validateSellerCompany(User seller, Quote quote) {
        boolean sameCompany =
                seller.getCompany() != null
                        && Objects.equals(
                        seller.getCompany().getCompanyId(),
                        quote.getCompany().getCompanyId()
                );

        if (!sameCompany) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateApprovedQuote(Quote quote) {

        if (!QuoteStatusCode.APPROVED.equals(quote.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_QUOTE_STATUS);
        }
    }
}
