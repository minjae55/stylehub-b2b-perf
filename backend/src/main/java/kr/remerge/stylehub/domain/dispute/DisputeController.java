package kr.remerge.stylehub.domain.dispute;

import kr.remerge.stylehub.domain.dispute.service.DisputeService;
import kr.remerge.stylehub.global.auth.dto.login.AuthUser;
import kr.remerge.stylehub.global.auth.security.LoginUser;
import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getDispute(
            @LoginUser AuthUser authUser
    ) {
//        disputeService.

        return null;
    }


}
