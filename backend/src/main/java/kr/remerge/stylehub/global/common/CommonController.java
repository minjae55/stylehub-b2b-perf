package kr.remerge.stylehub.global.common; // 프로젝트 패키지 구조에 맞게 수정

import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import kr.remerge.stylehub.global.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/common") // 💡 프론트엔드의 /api/common 주소와 매핑
public class CommonController {

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<?>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.EMPTY_FILE);
        }

        try {
            // 1. 서버 컴퓨터에 파일이 저장될 임시 폴더 설정 (C:/stylehub/uploads/ 또는 상대경로)
            String uploadDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs(); // 폴더가 없으면 자동 생성
            }

            // 2. 파일명 중복을 막기 위해 UUID 생성 (ex: a1b2c3d4-증명서.jpg)
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID() + "_" + originalFilename;

            // 3. 지정된 폴더에 파일 물리적 저장
            File destination = new File(uploadDir + savedFilename);
            file.transferTo(destination);

            // 4. 프론트엔드에게는 "나중에 다운로드하거나 보여줄 수 있는 가상 경로(URL)" 리턴
            // 원래는 S3 주소(https://s3...)가 나가는 자리지만, 우선 가짜 주소를 리턴해 둡니다.
            String fakeS3Url = "/uploads/" + savedFilename;

            return ResponseEntity.ok(ApiResponse.success(fakeS3Url));

        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_ERROR);
        }
    }
}