package kr.remerge.stylehub.domain.negotiation;

import jakarta.validation.Valid;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationCreateRequest;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationFileResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationListResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRequestDetailResponse;
import kr.remerge.stylehub.domain.negotiation.dto.NegotiationRespondRequest;
import kr.remerge.stylehub.domain.negotiation.service.NegotiationService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/negotiations")
public class NegotiationController {

    private final NegotiationService negotiationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NegotiationListResponse>>> getNegotiationList(
            @LoginUser AuthUser authUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        List<NegotiationListResponse> responses =
                negotiationService.getNegotiationList(authUser.userId(), page, size);

        return ResponseEntity.ok(ApiResponse.success(responses));

    }

    @PostMapping()
    public ResponseEntity<ApiResponse<Void>> createNegotiation(
            @LoginUser AuthUser authUser,
            @Valid @RequestBody NegotiationCreateRequest request
    ) {

        negotiationService.createNegotiation(authUser.userId(), request);

        return ResponseEntity.ok(ApiResponse.success(null));

    }

    @GetMapping("/{negotiationId}/requests")
    public ResponseEntity<ApiResponse<List<NegotiationRequestDetailResponse>>> getNegotiationRequests(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationId
    ) {

        List<NegotiationRequestDetailResponse> responses =
                negotiationService.getNegotiationRequests(authUser.userId(), negotiationId);

        return ResponseEntity.ok(ApiResponse.success(responses));

    }

    @PostMapping("/requests/{negotiationRequestId}/respond")
    public ResponseEntity<ApiResponse<Void>> respondToNegotiation(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationRequestId,
            @Valid @RequestBody NegotiationRespondRequest request
    ) {

        negotiationService.respondToNegotiation(
                authUser.userId(),
                negotiationRequestId,
                request
        );

        return ResponseEntity.ok(ApiResponse.success(null));

    }

    @PostMapping("/requests/{negotiationRequestId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptNegotiationRequest(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationRequestId
    ) {

        negotiationService.acceptNegotiationRequest(authUser.userId(), negotiationRequestId);

        return ResponseEntity.ok(ApiResponse.success(null));

    }

    @PostMapping("/requests/{negotiationRequestId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectNegotiationRequest(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationRequestId
    ) {

        negotiationService.rejectNegotiationRequest(authUser.userId(), negotiationRequestId);

        return ResponseEntity.ok(ApiResponse.success(null));

    }

    @PostMapping("/requests/{negotiationRequestId}/files")
    public ResponseEntity<ApiResponse<NegotiationFileResponse>> uploadFile(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationRequestId,
            @RequestParam("file") MultipartFile file
    ) {

        NegotiationFileResponse response = negotiationService.uploadFile(
                authUser.userId(),
                negotiationRequestId,
                file
        );

        return ResponseEntity.ok(ApiResponse.success(response));

    }

    @GetMapping("/requests/{negotiationRequestId}/files")
    public ResponseEntity<ApiResponse<List<NegotiationFileResponse>>> getFiles(
            @LoginUser AuthUser authUser,
            @PathVariable Integer negotiationRequestId
    ) {

        List<NegotiationFileResponse> responses =
                negotiationService.getFiles(authUser.userId(), negotiationRequestId);

        return ResponseEntity.ok(ApiResponse.success(responses));

    }

}
