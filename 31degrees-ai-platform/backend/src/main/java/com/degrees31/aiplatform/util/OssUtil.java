package com.degrees31.aiplatform.util;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PreDestroy;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * OSS?
 * 
 * @author Qoder AI Assistant
 * @version 1.0.0
 * @since 2025-08-28
 */
@Slf4j
@Component
public class OssUtil {

    @Value("${aliyun.oss.endpoint}")
    private String endpoint;

    @Value("${aliyun.oss.access-key-id}")
    private String accessKeyId;

    @Value("${aliyun.oss.access-key-secret}")
    private String accessKeySecret;

    @Value("${aliyun.oss.bucket-name}")
    private String bucketName;

    @Value("${aliyun.oss.cdn-domain:}")
    private String cdnDomain;

    private OSS ossClient;

    /**
     * OSS?
     */
    private OSS getOssClient() {
        if (ossClient == null) {
            synchronized (this) {
                if (ossClient == null) {
                    ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
                    log.info("OSSendpoint: {}, bucket: {}", endpoint, bucketName);
                }
            }
        }
        return ossClient;
    }

    /**
     * 
     * 
     * @param file 
     * @param folder ?
     * @return 
     */
    public UploadResult uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return UploadResult.error("");
        }

        try {
            // ?
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String fileName = generateFileName(extension);
            String objectKey = buildObjectKey(folder, fileName);

            // 
            if (!isValidImageFile(extension)) {
                return UploadResult.error(": " + extension);
            }

            // 
            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                return UploadResult.error("10MB");
            }

            // 
            OSS client = getOssClient();
            PutObjectRequest putRequest = new PutObjectRequest(bucketName, objectKey, file.getInputStream());
            
            // ?
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(file.getContentType());
            metadata.setContentDisposition("inline");
            putRequest.setMetadata(metadata);

            PutObjectResult result = client.putObject(putRequest);
            
            if (result != null) {
                String fileUrl = buildFileUrl(objectKey);
                
                log.info("objectKey: {}, url: {}", objectKey, fileUrl);
                
                return UploadResult.success(objectKey, fileUrl, file.getSize());
            } else {
                return UploadResult.error("");
            }

        } catch (IOException e) {
            log.error("", e);
            return UploadResult.error(": " + e.getMessage());
        } catch (Exception e) {
            log.error("OSS", e);
            return UploadResult.error("OSS: " + e.getMessage());
        }
    }

    /**
     * 
     * 
     * @param bytes 
     * @param fileName ?
     * @param folder ?
     * @return 
     */
    public UploadResult uploadBytes(byte[] bytes, String fileName, String folder) {
        if (bytes == null || bytes.length == 0) {
            return UploadResult.error("");
        }

        try {
            String extension = getFileExtension(fileName);
            String newFileName = generateFileName(extension);
            String objectKey = buildObjectKey(folder, newFileName);

            // 
            if (bytes.length > 10 * 1024 * 1024) { // 10MB
                return UploadResult.error("10MB");
            }

            // 
            OSS client = getOssClient();
            InputStream inputStream = new ByteArrayInputStream(bytes);
            
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(bytes.length);
            metadata.setContentType(getContentType(extension));
            metadata.setContentDisposition("inline");

            PutObjectRequest putRequest = new PutObjectRequest(bucketName, objectKey, inputStream, metadata);
            PutObjectResult result = client.putObject(putRequest);

            if (result != null) {
                String fileUrl = buildFileUrl(objectKey);
                
                log.info("objectKey: {}, url: {}", objectKey, fileUrl);
                
                return UploadResult.success(objectKey, fileUrl, (long) bytes.length);
            } else {
                return UploadResult.error("");
            }

        } catch (Exception e) {
            log.error("", e);
            return UploadResult.error(": " + e.getMessage());
        }
    }

    /**
     * Base64
     * 
     * @param base64 Base64?
     * @param folder ?
     * @return 
     */
    public UploadResult uploadBase64Image(String base64, String folder) {
        if (base64 == null || base64.trim().isEmpty()) {
            return UploadResult.error("Base64");
        }

        try {
            // Base64
            byte[] imageBytes = java.util.Base64.getDecoder().decode(base64);
            String fileName = generateFileName("jpg");
            
            return uploadBytes(imageBytes, fileName, folder);

        } catch (Exception e) {
            log.error("Base64", e);
            return UploadResult.error("Base64: " + e.getMessage());
        }
    }

    /**
     * 
     * 
     * @param objectKey ?
     * @return 
     */
    public boolean deleteFile(String objectKey) {
        try {
            OSS client = getOssClient();
            client.deleteObject(bucketName, objectKey);
            
            log.info("objectKey: {}", objectKey);
            return true;

        } catch (Exception e) {
            log.error("objectKey: {}", objectKey, e);
            return false;
        }
    }

    /**
     * 
     * 
     * @param objectKeys ?
     * @return 
     */
    public boolean deleteFiles(List<String> objectKeys) {
        if (objectKeys == null || objectKeys.isEmpty()) {
            return true;
        }

        try {
            OSS client = getOssClient();
            DeleteObjectsRequest deleteRequest = new DeleteObjectsRequest(bucketName);
            deleteRequest.setKeys(objectKeys);
            
            DeleteObjectsResult result = client.deleteObjects(deleteRequest);
            
            log.info("? {}", result.getDeletedObjects().size());
            return true;

        } catch (Exception e) {
            log.error("", e);
            return false;
        }
    }

    /**
     * ?
     * 
     * @param objectKey ?
     * @return 
     */
    public boolean doesObjectExist(String objectKey) {
        try {
            OSS client = getOssClient();
            return client.doesObjectExist(bucketName, objectKey);
        } catch (Exception e) {
            log.error("objectKey: {}", objectKey, e);
            return false;
        }
    }

    /**
     * URL
     * 
     * @param objectKey ?
     * @param expireMinutes 
     * @return URL
     */
    public String generatePresignedUrl(String objectKey, int expireMinutes) {
        try {
            OSS client = getOssClient();
            Date expiration = new Date(System.currentTimeMillis() + expireMinutes * 60 * 1000L);
            
            URL url = client.generatePresignedUrl(bucketName, objectKey, expiration);
            return url.toString();

        } catch (Exception e) {
            log.error("URLobjectKey: {}", objectKey, e);
            return null;
        }
    }

    /**
     * 
     * 
     * @param objectKey ?
     * @return 
     */
    public ObjectMetadata getObjectMetadata(String objectKey) {
        try {
            OSS client = getOssClient();
            return client.getObjectMetadata(bucketName, objectKey);
        } catch (Exception e) {
            log.error("objectKey: {}", objectKey, e);
            return null;
        }
    }

    /**
     * ?
     */
    private String buildObjectKey(String folder, String fileName) {
        if (folder == null || folder.trim().isEmpty()) {
            return fileName;
        }
        
        folder = folder.trim();
        if (folder.endsWith("/")) {
            return folder + fileName;
        } else {
            return folder + "/" + fileName;
        }
    }

    /**
     * URL
     */
    private String buildFileUrl(String objectKey) {
        if (cdnDomain != null && !cdnDomain.trim().isEmpty()) {
            String domain = cdnDomain.trim();
            if (!domain.startsWith("http")) {
                domain = "https://" + domain;
            }
            if (!domain.endsWith("/")) {
                domain += "/";
            }
            return domain + objectKey;
        } else {
            return String.format("https://%s.%s/%s", bucketName, endpoint, objectKey);
        }
    }

    /**
     * ?
     */
    private String generateFileName(String extension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return timestamp + "_" + uuid.substring(0, 8) + "." + extension;
    }

    /**
     * ?
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "jpg";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * 
     */
    private boolean isValidImageFile(String extension) {
        String[] validExtensions = {"jpg", "jpeg", "png", "gif", "bmp", "webp"};
        for (String validExt : validExtensions) {
            if (validExt.equals(extension.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Content-Type
     */
    private String getContentType(String extension) {
        switch (extension.toLowerCase()) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "gif":
                return "image/gif";
            case "bmp":
                return "image/bmp";
            case "webp":
                return "image/webp";
            default:
                return "application/octet-stream";
        }
    }

    /**
     * 
     */
    public boolean isConfigValid() {
        return endpoint != null && !endpoint.isEmpty() &&
               accessKeyId != null && !accessKeyId.isEmpty() &&
               accessKeySecret != null && !accessKeySecret.isEmpty() &&
               bucketName != null && !bucketName.isEmpty();
    }

    /**
     * OSS?
     */
    @PreDestroy
    public void shutdown() {
        if (ossClient != null) {
            ossClient.shutdown();
            log.info("OSS");
        }
    }

    /**
     * 
     */
    @Data
    public static class UploadResult {
        private boolean success;
        private String message;
        private String objectKey;
        private String fileUrl;
        private Long fileSize;

        public static UploadResult success(String objectKey, String fileUrl, Long fileSize) {
            UploadResult result = new UploadResult();
            result.setSuccess(true);
            result.setMessage("");
            result.setObjectKey(objectKey);
            result.setFileUrl(fileUrl);
            result.setFileSize(fileSize);
            return result;
        }

        public static UploadResult error(String message) {
            UploadResult result = new UploadResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
    }
}
