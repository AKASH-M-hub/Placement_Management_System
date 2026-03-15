package com.example.PMS.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private final Path basePath;

    public DocumentStorageService(@Value("${pms.storage.base-path:uploads}") String baseStoragePath) throws IOException {
        this.basePath = Paths.get(baseStoragePath).toAbsolutePath().normalize();
        Files.createDirectories(this.basePath);
    }

    public String storeFile(MultipartFile file, String folder, String prefix) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        try {
            Path targetDir = basePath.resolve(folder).normalize();
            Files.createDirectories(targetDir);

            String fileName = prefix + "-" + UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path targetFile = targetDir.resolve(fileName).normalize();
            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            return targetFile.toString();
        } catch (IOException exception) {
            throw new RuntimeException("Unable to store file", exception);
        }
    }

    public Resource loadAsResource(String absolutePath) {
        try {
            Path filePath = Paths.get(absolutePath).normalize();
            byte[] bytes = Files.readAllBytes(filePath);
            return new ByteArrayResource(bytes);
        } catch (IOException exception) {
            throw new RuntimeException("Unable to read file", exception);
        }
    }
}
