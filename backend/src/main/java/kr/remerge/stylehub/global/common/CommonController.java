package kr.remerge.stylehub.global.common; // 프로젝트 패키지 구조에 맞게 수정

import kr.remerge.stylehub.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload") // 💡 프론트엔드의 /api/common 주소와 매핑
@RequiredArgsConstructor
public class CommonController {

    private final ImageUploadService imageUploadService;

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {


        if (file.isEmpty()) {
            // 파일이 비어있으면 에러 응답
            return ResponseEntity.badRequest().body(ApiResponse.success("파일이 비어있습니다."));
        }


        // 1. 서버 컴퓨터에 파일이 저장될 임시 폴더 설정 (C:/stylehub/uploads/ 또는 상대경로)
        // 2. 파일명 중복을 막기 위해 UUID 생성 (ex: a1b2c3d4-증명서.jpg)
        // 3. 지정된 폴더에 파일 물리적 저장
        // 4. 프론트엔드에게는 "나중에 다운로드하거나 보여줄 수 있는 가상 경로(URL)" 리턴
        // 원래는 S3 주소(https://s3...)가 나가는 자리지만, Supabase URL을 리턴합니다.
        String url = imageUploadService.upload(file, "products");

        // 프론트엔드에게 업로드된 이미지의 공개 URL 리턴
        return ResponseEntity.ok(ApiResponse.success(url));

    }

    @PostMapping("/pdf")
    public ResponseEntity<?> uploadPdf(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.success("파일이 비어있습니다."));
        }
        String url = imageUploadService.uploadPdf(file, "certifications");
        return ResponseEntity.ok(ApiResponse.success(url));
    }

}