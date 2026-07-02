package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.SupplierProfileResponse;
import kr.remerge.stylehub.domain.sourcing.dto.SupplierProfileUpdateRequest;
import kr.remerge.stylehub.domain.sourcing.service.SupplierProfileService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sourcing/seller/profile")
public class SupplierProfileController {

    private final SupplierProfileService supplierProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<SupplierProfileResponse>> getProfile(
            @LoginUser AuthUser authUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProfileService.getProfile(authUser.companyId())));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<SupplierProfileResponse>> updateProfile(
            @LoginUser AuthUser authUser,
            @RequestBody SupplierProfileUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                supplierProfileService.updateProfile(authUser.companyId(), request)));
    }
}
