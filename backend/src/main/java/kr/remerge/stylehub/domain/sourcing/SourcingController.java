package kr.remerge.stylehub.domain.sourcing;

import kr.remerge.stylehub.domain.sourcing.dto.SourcingRequestDto;
import kr.remerge.stylehub.domain.sourcing.service.SourcingRequestService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sourcing")
@RequiredArgsConstructor
public class SourcingController {
    private final SourcingRequestService sourcingRequestService;

    /**
     * 소싱 요청 상세 조회
     * GET /api/sourcing/requests/{sourcingRequestId}
     */
    @GetMapping("/requests/{sourcingRequestId}")
    public ResponseEntity<SourcingRequestDto.DetailResponse> getDetail(
            @PathVariable Integer sourcingRequestId
    ) {
        return ResponseEntity.ok(sourcingRequestService.getDetail(sourcingRequestId));
    }

    /**
     * 1단계: 소싱 요청 생성 (JSON)
     * POST /api/sourcing/requests
     */
    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<SourcingRequestDto.CreateResponse>> createRequests(
            @LoginUser AuthUser authUser,
            @RequestBody SourcingRequestDto.CreateRequest dto
    ) {
        SourcingRequestDto.CreateResponse response = sourcingRequestService.createRequests(authUser, dto);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 2단계: 파일 업로드
     * POST /api/sourcing/requests/{sourcingRequestId}/files
     *
     * @param fileType  "REF_IMAGE" (기성품 참고이미지) | "WORK_FILE" (주문제작 작업지시서)
     * @param files     multipart 파일 목록
     */
    @PostMapping("/requests/{sourcingRequestId}/files")
    public ResponseEntity<Void> uploadFiles(
            @PathVariable Integer sourcingRequestId,
            @RequestParam String fileType,
            @RequestPart List<MultipartFile> files
    ) {
        sourcingRequestService.uploadFiles(sourcingRequestId, fileType, files);
        return ResponseEntity.ok().build();
    }
}
