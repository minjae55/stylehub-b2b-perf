package kr.remerge.stylehub.global.common.service;

import kr.remerge.stylehub.global.exception.BusinessException;
import kr.remerge.stylehub.global.exception.ErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

@Service
public class FileService {

    public String uploadFile(MultipartFile file) {
        // 1. 파일 빈 값 검증
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.EMPTY_FILE);
        }

        try {
            // 2. 서버 컴퓨터에 파일이 저장될 임시 폴더 설정
            String uploadDir = System.getProperty("user.dir") + File.separator + "uploads" + File.separator;
            File folder = new File(uploadDir);
            if (!folder.exists()) {
                folder.mkdirs();
            }

            // 3. 파일명 중복을 막기 위해 UUID 생성
            String originalFilename = file.getOriginalFilename();
            String savedFilename = UUID.randomUUID() + "_" + originalFilename;

            // 4. 지정된 폴더에 파일 물리적 저장
            File destination = new File(uploadDir + savedFilename);
            file.transferTo(destination);

            // 5. 가상 경로(URL) 리턴 (나중에 S3로 바꿀 때 여기만 수정하면 됨!)
            return "/uploads/" + savedFilename;

        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_UPLOAD_ERROR);
        }
    }
}