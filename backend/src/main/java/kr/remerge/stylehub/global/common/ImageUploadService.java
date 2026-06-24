package kr.remerge.stylehub.global.common;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ImageUploadService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.key}")
    private String supabaseKey;

    @Value("${supabase.bucket}")
    private String bucket;

    private final RestTemplate restTemplate;

    public String upload(MultipartFile file, String folder) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String fileName = folder + "/" + UUID.randomUUID() + "." + ext;

            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucket + "/" + fileName;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.parseMediaType(file.getContentType()));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

            return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("파일 업로드 실패", e);
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        String ext = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        if (!List.of("jpg", "jpeg", "png", "webp", "gif", "pdf").contains(ext)) return "jpg";  // pdf 추가
        return ext;
    }
    @Value("${supabase.pdf-bucket}")
    private String pdfBucket;

    public String uploadPdf(MultipartFile file, String folder) {
        try {
            String ext = getExtension(file.getOriginalFilename());
            String fileName = folder + "/" + UUID.randomUUID() + "." + ext;

            String uploadUrl = supabaseUrl + "/storage/v1/object/" + pdfBucket + "/" + fileName;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + supabaseKey);
            headers.setContentType(MediaType.parseMediaType(file.getContentType()));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

            return supabaseUrl + "/storage/v1/object/public/" + pdfBucket + "/" + fileName;

        } catch (IOException e) {
            throw new RuntimeException("PDF 업로드 실패", e);
        }
    }
}
