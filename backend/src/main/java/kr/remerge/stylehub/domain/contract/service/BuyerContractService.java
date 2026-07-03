package kr.remerge.stylehub.domain.contract.service;

import kr.remerge.stylehub.domain.contract.dto.BuyerContractDetailResponse;
import kr.remerge.stylehub.domain.contract.dto.BuyerContractSignRequest;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.entity.ContractSignature;
import kr.remerge.stylehub.domain.contract.enumtype.ContractStatus;
import kr.remerge.stylehub.domain.contract.enumtype.SignerRole;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractSignatureRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.support.UserReader;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuyerContractService {

    private final ContractRepository contractRepository;
    private final ContractItemRepository contractItemRepository;
    private final ContractSignatureRepository contractSignatureRepository;
    private final UserReader userReader;

    public BuyerContractDetailResponse getContract(Integer userId, Integer contractId) {
        Contract contract = findBuyerContract(contractId, userId);

        List<ContractItem> items =
                contractItemRepository
                        .findByContract_ContractIdOrderByContractItemIdAsc(
                                contractId
                        );

        return BuyerContractDetailResponse.from(contract, items);

    }

    @Transactional
    public void signContract(  Integer userId,
                               Integer contractId,
                               BuyerContractSignRequest request,
                               String signedIp,
                               String userAgent) {

        User buyer = userReader.getUser(userId);
        Contract contract =
                findBuyerContract(contractId, buyer.getUserId());

        if (contract.getStatus() != ContractStatus.SELLER_SIGNED) {
            throw new BusinessException(ErrorCode.INVALID_CONTRACT_STATUS);
        }

        boolean alreadySigned =
                contractSignatureRepository
                        .existsByContract_ContractIdAndSignerRole(
                                contractId,
                                SignerRole.BUYER
                        );

        if (alreadySigned) {
            throw new BusinessException(ErrorCode.CONTRACT_ALREADY_SIGNED);
        }

        ContractSignature signature = new ContractSignature(
                contract,
                buyer,
                SignerRole.BUYER,
                request.signatureText(),
                request.signatureImageUrl(),
                null,
                signedIp,
                userAgent
        );

        contractSignatureRepository.save(signature);

        contract.buyerSign();
        contract.complete();
    }

    private Contract findBuyerContract(Integer contractId, Integer buyerId) {
        return contractRepository
                .findByContractIdAndQuote_Buyer_UserId(
                        contractId,
                        buyerId
                )
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.CONTRACT_NOT_FOUND));
    }
}
