package kr.remerge.stylehub.domain.address;

import jakarta.transaction.Transactional;
import kr.remerge.stylehub.domain.address.dto.request.AddressSaveRequest;
import kr.remerge.stylehub.domain.address.dto.request.UpdateDefaultAddressRequest;
import kr.remerge.stylehub.domain.address.dto.response.AddressDefaultsResponse;
import kr.remerge.stylehub.domain.address.dto.response.AddressResponse;
import kr.remerge.stylehub.domain.company.entity.Company;
import kr.remerge.stylehub.domain.company.repository.CompanyRepository;
import kr.remerge.stylehub.domain.user.entity.User;
import kr.remerge.stylehub.domain.user.repository.UserRepository;
import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AddressService {
    private final AddressRepository addressRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    /**
     * 1. 전체 주소록 목록 조회
     */
    public List<AddressResponse> getCompanyAddresses(Integer companyId) {
        return addressRepository.findByCompany_CompanyIdAndDeletedAtIsNull(companyId)
                .stream()
                .map(AddressResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 2. 회사/유저 기본 설정 조회
     */
    public AddressDefaultsResponse getAddressDefaults(Integer userId, Integer companyId) {
        Company company = companyRepository.findByIdWithReturnAddress(companyId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMPANY_NOT_FOUND));
        User user = userRepository.findByIdWithAddresses(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        Integer returnAddressId = company.getDefaultReturnAddress() != null
                ? company.getDefaultReturnAddress().getAddressId() : null;

        Integer shippingAddressId = user.getDefaultShippingAddress() != null
                ? user.getDefaultShippingAddress().getAddressId() : null;
        Integer receivingAddressId = user.getDefaultReceivingAddress() != null
                ? user.getDefaultReceivingAddress().getAddressId() : null;

        return new AddressDefaultsResponse(
                new AddressDefaultsResponse.CompanyDefaultsResponse(returnAddressId),
                new AddressDefaultsResponse.UserDefaultsResponse(shippingAddressId, receivingAddressId)
        );
    }

    /**
     * 3. 새 주소 등록
     */
    @Transactional
    public AddressResponse createAddress(Integer companyId, AddressSaveRequest request) {
        Company companyProxy = companyRepository.getReferenceById(companyId);

        // DTO에게 엔티티 조립 책임 위임!
        Address address = request.toEntity(companyProxy);
        Address savedAddress = addressRepository.save(address);

        return AddressResponse.from(savedAddress);
    }

    /**
     * 4. 주소 수정
     */
    @Transactional
    public AddressResponse updateAddress(Integer companyId, Integer addressId, AddressSaveRequest request) {
        Address address = addressRepository.findByAddressIdAndDeletedAtIsNull(addressId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getCompany().getCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        address.update(
                request.addressName(),
                request.zipcode(),
                request.address(),
                request.addressDetail()
        );

        return AddressResponse.from(address);
    }

    /**
     * 5. 주소 삭제
     */
    @Transactional
    public void deleteAddress(Integer companyId, Integer addressId) {
        Address address = addressRepository.findByAddressIdAndDeletedAtIsNull(addressId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getCompany().getCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        address.delete();
    }

    /**
     * 6. 기본 주소지 변경
     */
    @Transactional
    public void updateDefaultAddress(Integer userId, Integer companyId, UpdateDefaultAddressRequest request) {
        Address address = addressRepository.findByAddressIdAndDeletedAtIsNull(request.addressId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ADDRESS_NOT_FOUND));

        if (!address.getCompany().getCompanyId().equals(companyId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        switch (request.defaultType()) {
            case RETURN:
                Company companyProxy = companyRepository.getReferenceById(companyId);
                companyProxy.updateDefaultReturnAddress(address);
                break;

            case SHIPPING:
                User sellerProxy = userRepository.getReferenceById(userId);
                sellerProxy.updateDefaultShippingAddress(address);
                break;

            case RECEIVING:
                User buyerProxy = userRepository.getReferenceById(userId);
                buyerProxy.updateDefaultReceivingAddress(address);
                break;

            default:
                throw new BusinessException(ErrorCode.INVALID_ADDRESS_TYPE);
        }
    }
}