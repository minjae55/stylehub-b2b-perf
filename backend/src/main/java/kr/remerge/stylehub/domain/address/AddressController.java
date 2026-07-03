package kr.remerge.stylehub.domain.address;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.address.dto.request.AddressSaveRequest;
import kr.remerge.stylehub.domain.address.dto.request.UpdateDefaultAddressRequest;
import kr.remerge.stylehub.domain.address.dto.response.AddressDefaultsResponse;
import kr.remerge.stylehub.domain.address.dto.response.AddressResponse;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    /**
     * 1. 전체 주소록 목록 조회
     * GET /api/addresses
     */
    @GetMapping
    public ApiResponse<List<AddressResponse>> getCompanyAddresses(@LoginUser AuthUser user) {
        List<AddressResponse> response = addressService.getCompanyAddresses(user.companyId());
        return ApiResponse.success(response);
    }

    /**
     * 2. 회사/유저 기본 설정 조회
     * GET /api/addresses/defaults
     */
    @GetMapping("/defaults")
    public ApiResponse<AddressDefaultsResponse> getAddressDefaults(@LoginUser AuthUser user) {
        AddressDefaultsResponse response = addressService.getAddressDefaults(user.userId(), user.companyId());
        return ApiResponse.success(response);
    }

    /**
     * 3. 새 주소 등록
     * POST /api/addresses
     */
    @PostMapping
    public ApiResponse<AddressResponse> createAddress(@Valid @RequestBody AddressSaveRequest request, @LoginUser AuthUser user) {
        AddressResponse response = addressService.createAddress(user.companyId(), request);
        return ApiResponse.success(response);
    }

    /**
     * 4. 주소 수정
     * PUT /api/addresses/{addressId}
     */
    @PutMapping("/{addressId}")
    public ApiResponse<AddressResponse> updateAddress(
            @PathVariable Integer addressId,
            @Valid @RequestBody AddressSaveRequest request,
            @LoginUser AuthUser user) {
        AddressResponse response = addressService.updateAddress(user.companyId(), addressId, request);
        return ApiResponse.success(response);
    }

    /**
     * 5. 주소 삭제
     * DELETE /api/addresses/{addressId}
     */
    @DeleteMapping("/{addressId}")
    public ApiResponse<Void> deleteAddress(@PathVariable Integer addressId, @LoginUser AuthUser user) {
        addressService.deleteAddress(user.companyId(), addressId);
        return ApiResponse.success(null);
    }

    /**
     * 6. 기본 주소지 변경 (출고지/배송지/수령지 세팅)
     * PATCH /api/addresses/defaults
     */
    @PatchMapping("/defaults")
    public ApiResponse<Void> updateDefaultAddress(
            @Valid @RequestBody UpdateDefaultAddressRequest request, @LoginUser AuthUser user) {
        addressService.updateDefaultAddress(user.userId(), user.companyId(), request);
        return ApiResponse.success(null);
    }
}
