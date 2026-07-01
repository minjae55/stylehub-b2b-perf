package kr.remerge.stylehub.domain.contract.service;

import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.contract.dto.SellerContractCreateRequest;
import kr.remerge.stylehub.domain.contract.entity.Contract;
import kr.remerge.stylehub.domain.contract.entity.ContractItem;
import kr.remerge.stylehub.domain.contract.repository.ContractItemRepository;
import kr.remerge.stylehub.domain.contract.repository.ContractRepository;
import kr.remerge.stylehub.domain.quote.entity.Quote;
import kr.remerge.stylehub.domain.quote.entity.QuoteItem;
import kr.remerge.stylehub.domain.quote.repository.QuoteItemRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractService {

    private final ContractItemRepository contractItemRepository;
    private final ContractRepository contractRepository;
    private final QuoteItemRepository quoteItemRepository;

    @Transactional
    public Contract createDraft(Quote quote, SellerContractCreateRequest request) {

        validateContractNotExists(quote.getQuoteId());

        Company buyerCompany = quote.getBuyer().getCompany();
        Company sellerCompany = quote.getCompany();

        if (buyerCompany == null || sellerCompany == null) {
            throw new BusinessException(ErrorCode.COMPANY_NOT_FOUND);
        }

        Contract contract =
                Contract.createDraftFromQuote(quote,
                        createContractNo(),
                        request.deliveryDate(),
                        request.paymentTerms(),
                        request.returnPolicy(),
                        request.specialTerms()
                );

        Contract savedContract = contractRepository.save(contract);

        saveContractItems(savedContract, quote);

        return savedContract;
    }

    private void saveContractItems(Contract contract, Quote quote) {

        List<QuoteItem> quoteItems =
                quoteItemRepository.findByQuote_QuoteId(quote.getQuoteId());

        //민재 여기서 왜 이렇게 하지
        List<ContractItem> contractItems = quoteItems.stream()
                .map(quoteItem -> new ContractItem(
                        contract,
                        null,
                        null,
                        quote.getProductName(),
                        quoteItem.getOptionSummary(),
                        quote.getMaterial(),
                        quoteItem.getQuantity(),
                        quoteItem.getUnitPrice()
                ))
                .toList();

        contractItemRepository.saveAll(contractItems);
    }

    private String createContractNo() {
        String date = LocalDate.now()
                .format(DateTimeFormatter.BASIC_ISO_DATE);

        String randomValue = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 8)
                .toUpperCase();

        return "CTR-" + date + "-" + randomValue;

    }

    private void validateContractNotExists(Integer quoteId) {

        if(contractRepository.existsByQuote_QuoteId(quoteId)) {
            throw new BusinessException(ErrorCode.CONTRACT_ALREADY_EXISTS);
        }
    }

}
